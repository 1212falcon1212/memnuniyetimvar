import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { Review, ReviewStatus, ReviewSource } from './entities/review.entity';
import { ReviewInvitation, InvitationStatus } from '../advertising/entities/review-invitation.entity';
import { ReviewImage } from './entities/review-image.entity';
import { ReviewHelpful } from './entities/review-helpful.entity';
import { CompanyResponse } from './entities/company-response.entity';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Report, ReportReason } from '../reports/entities/report.entity';
import { SearchService, ReviewSearchDocument } from '../search/search.service';
import { CreateReviewDto, UpdateReviewDto, ReviewFilterDto } from './dto';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class ReviewsService {
  private readonly redis: Redis;
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(ReviewImage)
    private readonly reviewImageRepository: Repository<ReviewImage>,
    @InjectRepository(ReviewHelpful)
    private readonly reviewHelpfulRepository: Repository<ReviewHelpful>,
    @InjectRepository(CompanyResponse)
    private readonly companyResponseRepository: Repository<CompanyResponse>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(ReviewInvitation)
    private readonly invitationRepository: Repository<ReviewInvitation>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @InjectQueue('moderation') private readonly moderationQueue: Queue,
    private readonly searchService: SearchService,
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
    });
  }

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    await this.validateReviewSubmission(userId, dto);

    const company = await this.companyRepository.findOne({
      where: { id: dto.companyId },
    });

    if (!company) {
      throw new NotFoundException({
        code: 'COMPANY_NOT_FOUND',
        message: 'Firma bulunamadi',
      });
    }

    // Doğrulanmış müşteri daveti varsa doğrula (şeffaflık için işaretlenir)
    const invitation = dto.invitationToken
      ? await this.validateInvitation(dto.invitationToken, dto.companyId)
      : null;

    const slug = await this.createUniqueReviewSlug(dto.title);

    const review = this.reviewRepository.create({
      userId,
      companyId: dto.companyId,
      title: dto.title,
      content: dto.content,
      rating: dto.rating,
      slug,
      status: ReviewStatus.PENDING,
      verifiedCustomer: Boolean(invitation),
      source: invitation ? ReviewSource.CAMPAIGN_INVITE : ReviewSource.ORGANIC,
      invitationId: invitation?.id ?? null,
    });

    const savedReview = await this.dataSource.transaction(async (manager) => {
      const createdReview = await manager.save(review);

      await manager.increment(User, { id: userId }, 'review_count', 1);

      return createdReview;
    });

    if (invitation) {
      invitation.status = InvitationStatus.USED;
      invitation.usedReviewId = savedReview.id;
      invitation.usedAt = new Date();
      await this.invitationRepository.save(invitation);
    }

    if (dto.tagIds && dto.tagIds.length > 0) {
      const tags = await this.tagRepository.findBy({ id: In(dto.tagIds) });

      if (tags.length > 0) {
        savedReview.tags = tags;
        await this.reviewRepository.save(savedReview);

        await this.tagRepository
          .createQueryBuilder()
          .update(Tag)
          .set({ usageCount: () => 'usage_count + 1' })
          .whereInIds(tags.map((t) => t.id))
          .execute();
      }
    }

    this.moderationQueue.add('check-review', { reviewId: savedReview.id }, { attempts: 3, backoff: 5000 }).catch((err) => {
      this.logger.warn(`Moderasyon kuyruguna eklenemedi: ${err.message}`);
    });

    this.syncReviewToSearch(savedReview.id).catch((err) => {
      this.logger.warn(`Yorum index guncelleme hatasi: ${err.message}`);
    });

    return savedReview;
  }

  async findBySlug(slug: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { slug },
      relations: ['user', 'company', 'images', 'tags', 'companyResponses'],
    });

    if (!review) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Yorum bulunamadi',
      });
    }

    await this.reviewRepository.increment({ id: review.id }, 'viewCount', 1);

    return review;
  }

  async update(
    userId: string,
    reviewId: string,
    dto: UpdateReviewDto,
  ): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Yorum bulunamadi',
      });
    }

    if (review.userId !== userId) {
      throw new ForbiddenException({
        code: 'REVIEW_NOT_OWNED',
        message: 'Bu yorumu duzenleme yetkiniz yok',
      });
    }

    if (review.status !== ReviewStatus.PENDING) {
      throw new ForbiddenException({
        code: 'REVIEW_NOT_EDITABLE',
        message: 'Sadece beklemede olan yorumlar duzenlenebilir',
      });
    }

    Object.assign(review, dto);

    if (dto.title) {
      review.slug = await this.createUniqueReviewSlug(dto.title, review.id);
    }

    return this.reviewRepository.save(review);
  }

  async remove(userId: string, reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Yorum bulunamadi',
      });
    }

    if (review.userId !== userId) {
      throw new ForbiddenException({
        code: 'REVIEW_NOT_OWNED',
        message: 'Bu yorumu silme yetkiniz yok',
      });
    }

    const companyId = review.companyId;
    const wasPublished = review.status === ReviewStatus.PUBLISHED;

    await this.dataSource.transaction(async (manager) => {
      await manager.remove(review);
      await manager.decrement(User, { id: userId }, 'review_count', 1);
    });

    if (wasPublished) {
      await this.recalculateCompanyStats(companyId);
    }

    try {
      await this.searchService.removeReview(reviewId);
    } catch (err) {
      this.logger.warn(`Yorum index silme hatasi: ${err.message}`);
    }
  }

  async addHelpful(userId: string, reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Yorum bulunamadi',
      });
    }

    const existing = await this.reviewHelpfulRepository.findOne({
      where: { reviewId, userId },
    });

    if (existing) {
      throw new ConflictException({
        code: 'ALREADY_VOTED',
        message: 'Bu yoruma zaten faydali oyu verdiniz',
      });
    }

    const helpful = this.reviewHelpfulRepository.create({ reviewId, userId });
    await this.reviewHelpfulRepository.save(helpful);

    await this.reviewRepository.increment({ id: reviewId }, 'helpfulCount', 1);
    await this.userRepository.increment({ id: review.userId }, 'helpful_count', 1);
  }

  async removeHelpful(userId: string, reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Yorum bulunamadi',
      });
    }

    const helpful = await this.reviewHelpfulRepository.findOne({
      where: { reviewId, userId },
    });

    if (!helpful) {
      throw new NotFoundException({
        code: 'HELPFUL_NOT_FOUND',
        message: 'Faydali oyu bulunamadi',
      });
    }

    await this.reviewHelpfulRepository.remove(helpful);
    await this.reviewRepository.decrement({ id: reviewId }, 'helpfulCount', 1);
    await this.userRepository.decrement({ id: review.userId }, 'helpful_count', 1);
  }

  async report(
    userId: string,
    reviewId: string,
    reason: string,
    description: string,
  ): Promise<Report> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Yorum bulunamadi',
      });
    }

    const report = this.reportRepository.create({
      reporter_id: userId,
      review_id: reviewId,
      reason: reason as ReportReason,
      description,
    });

    return this.reportRepository.save(report);
  }

  async findLatest(limit: number): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { status: ReviewStatus.PUBLISHED },
      relations: ['user', 'company'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findFeatured(limit: number): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { status: ReviewStatus.PUBLISHED, isFeatured: true },
      relations: ['user', 'company'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async addImages(
    reviewId: string,
    userId: string,
    imageUrls: string[],
  ): Promise<ReviewImage[]> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
      relations: ['images'],
    });

    if (!review) {
      throw new NotFoundException({
        code: 'REVIEW_NOT_FOUND',
        message: 'Yorum bulunamadi',
      });
    }

    if (review.userId !== userId) {
      throw new ForbiddenException({
        code: 'REVIEW_NOT_OWNED',
        message: 'Bu yoruma resim ekleme yetkiniz yok',
      });
    }

    const currentCount = review.images?.length ?? 0;

    if (currentCount + imageUrls.length > 5) {
      throw new BadRequestException({
        code: 'MAX_IMAGES_EXCEEDED',
        message: `Bir yoruma en fazla 5 resim eklenebilir. Mevcut: ${currentCount}, eklenmek istenen: ${imageUrls.length}`,
      });
    }

    const images = imageUrls.map((url, index) =>
      this.reviewImageRepository.create({
        reviewId,
        imageUrl: url,
        sortOrder: currentCount + index,
      }),
    );

    return this.reviewImageRepository.save(images);
  }

  private async recalculateCompanyStats(companyId: string): Promise<void> {
    const stats = await this.reviewRepository
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'reviewCount')
      .addSelect('COALESCE(AVG(review.rating), 0)', 'avgRating')
      .where('review.company_id = :companyId', { companyId })
      .andWhere('review.status = :status', { status: ReviewStatus.PUBLISHED })
      .getRawOne<{ reviewCount: string; avgRating: string }>();

    const reviewCount = Number(stats?.reviewCount ?? 0);
    const avgRating = Number(Number(stats?.avgRating ?? 0).toFixed(2));
    const responseCount = await this.companyResponseRepository.count({ where: { companyId } });
    const responseRate = reviewCount > 0
      ? Number(((responseCount / reviewCount) * 100).toFixed(2))
      : 0;
    const reviewVolumeScore = Math.min(reviewCount * 2, 100);
    const memnuniyetScore = Number(
      ((avgRating * 20 * 0.6) + (responseRate * 0.3) + (reviewVolumeScore * 0.1)).toFixed(2),
    );

    await this.companyRepository.update(companyId, {
      avgRating,
      reviewCount,
      responseCount,
      responseRate,
      memnuniyetScore,
    });
  }

  private async createUniqueReviewSlug(title: string, excludeId?: string): Promise<string> {
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (await this.reviewSlugExists(slug, excludeId)) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  private async reviewSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await this.reviewRepository.findOne({ where: { slug } });
    return Boolean(existing && existing.id !== excludeId);
  }

  /**
   * Davet token'ını doğrular: var mı, doğru firmaya mı ait, hâlâ kullanılabilir mi.
   * Süresi geçmişse EXPIRED işaretlenir ve hata döner.
   */
  private async validateInvitation(token: string, companyId: string): Promise<ReviewInvitation> {
    const invitation = await this.invitationRepository.findOne({ where: { token } });

    if (!invitation) {
      throw new BadRequestException({ code: 'INVITATION_INVALID', message: 'Davet bağlantısı geçersiz' });
    }

    if (invitation.companyId !== companyId) {
      throw new BadRequestException({
        code: 'INVITATION_COMPANY_MISMATCH',
        message: 'Bu davet farklı bir firma içindir',
      });
    }

    if (invitation.status === InvitationStatus.PENDING && invitation.expiresAt.getTime() < Date.now()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepository.save(invitation);
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException({
        code: 'INVITATION_NOT_USABLE',
        message: 'Davet kullanılamaz durumda (kullanılmış, iptal veya süresi dolmuş)',
      });
    }

    return invitation;
  }

  private async validateReviewSubmission(userId: string, dto: CreateReviewDto): Promise<void> {
    await this.ensureReviewRateLimit(userId);
    this.ensureContentIsNotSpam(dto.title, dto.content);

    const recentDuplicate = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.user_id = :userId', { userId })
      .andWhere('review.company_id = :companyId', { companyId: dto.companyId })
      .andWhere('LOWER(review.content) = LOWER(:content)', { content: dto.content.trim() })
      .andWhere('review.created_at > NOW() - INTERVAL \'24 hours\'')
      .getExists();

    if (recentDuplicate) {
      throw new ConflictException({
        code: 'DUPLICATE_REVIEW',
        message: 'Aynı yorumu kısa süre içinde tekrar gönderemezsiniz',
      });
    }
  }

  private async ensureReviewRateLimit(userId: string): Promise<void> {
    const key = `rate_limit:review_create:${userId}`;
    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, 3600);
    }

    if (current > 5) {
      throw new HttpException({
        code: 'REVIEW_RATE_LIMITED',
        message: 'Bir saat içinde en fazla 5 yorum gönderebilirsiniz',
      }, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private ensureContentIsNotSpam(title: string, content: string): void {
    const text = `${title} ${content}`.toLowerCase();
    const forbiddenWords = ['casino', 'bahis', 'viagra', 'telegram'];
    const linkCount = (text.match(/https?:\/\//g) || []).length;

    if (linkCount > 2 || forbiddenWords.some((word) => text.includes(word))) {
      throw new BadRequestException({
        code: 'REVIEW_SPAM_DETECTED',
        message: 'Yorumunuz spam kontrolüne takıldı. Lütfen bağlantı ve uygunsuz ifadeleri kaldırın.',
      });
    }
  }

  private async syncReviewToSearch(reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) return;

    const company = await this.companyRepository.findOne({ where: { id: review.companyId } });
    const user = await this.userRepository.findOne({ where: { id: review.userId } });

    const doc: ReviewSearchDocument = {
      id: review.id,
      title: review.title,
      content: review.content,
      slug: review.slug,
      companyName: company?.name ?? '',
      companySlug: company?.slug ?? '',
      userName: user?.full_name ?? '',
      rating: review.rating,
      status: review.status,
    };

    await this.searchService.indexReview(doc);
  }
}
