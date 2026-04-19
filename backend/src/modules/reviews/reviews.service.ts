import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Review, ReviewStatus } from './entities/review.entity';
import { ReviewImage } from './entities/review-image.entity';
import { ReviewHelpful } from './entities/review-helpful.entity';
import { CompanyResponse } from './entities/company-response.entity';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Report, ReportReason } from '../reports/entities/report.entity';
import { CreateReviewDto, UpdateReviewDto, ReviewFilterDto } from './dto';
import { generateUniqueSlug } from '../../common/utils/slug.util';

@Injectable()
export class ReviewsService {
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
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    const company = await this.companyRepository.findOne({
      where: { id: dto.companyId },
    });

    if (!company) {
      throw new NotFoundException({
        code: 'COMPANY_NOT_FOUND',
        message: 'Firma bulunamadi',
      });
    }

    const slug = generateUniqueSlug(dto.title);

    const review = this.reviewRepository.create({
      userId,
      companyId: dto.companyId,
      title: dto.title,
      content: dto.content,
      rating: dto.rating,
      slug,
      status: ReviewStatus.PENDING,
    });

    const savedReview = await this.reviewRepository.save(review);

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

    await this.companyRepository.increment({ id: dto.companyId }, 'reviewCount', 1);
    await this.userRepository.increment({ id: userId }, 'review_count', 1);

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
      review.slug = generateUniqueSlug(dto.title);
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

    await this.reviewRepository.remove(review);
    await this.companyRepository.decrement({ id: review.companyId }, 'reviewCount', 1);
    await this.userRepository.decrement({ id: userId }, 'review_count', 1);
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
}
