import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { AdminUser } from '../users/entities/admin-user.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { Review, ReviewStatus } from '../reviews/entities/review.entity';
import { Company, CompanyStatus } from '../companies/entities/company.entity';
import {
  CompanyClaim,
  ClaimStatus,
} from '../companies/entities/company-claim.entity';
import { Report, ReportStatus } from '../reports/entities/report.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { Category } from '../categories/entities/category.entity';
import { CompanyResponse, ResponseStatus } from '../reviews/entities/company-response.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCompanyResponseDto } from '../reviews/dto/create-company-response.dto';
import { MailService } from '../mail/mail.service';
import { SearchService, CompanySearchDocument, ReviewSearchDocument } from '../search/search.service';
import { Page as PageEntity } from './entities/page.entity';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminCreateCategoryDto, AdminUpdateCategoryDto } from './dto/admin-category.dto';
import { AdminCreateCompanyDto, AdminUpdateCompanyDto } from './dto/admin-company.dto';
import { AdminCreatePageDto, AdminUpdatePageDto } from './dto/admin-page.dto';
import { generateSlug } from '../../common/utils/slug.util';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(AdminUser)
    private readonly adminUserRepo: Repository<AdminUser>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(CompanyClaim)
    private readonly claimRepo: Repository<CompanyClaim>,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: Repository<ActivityLog>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(CompanyResponse)
    private readonly companyResponseRepo: Repository<CompanyResponse>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(PageEntity)
    private readonly pageRepo: Repository<PageEntity>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
    private readonly searchService: SearchService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Auth ───────────────────────────────────────────────────────

  async adminLogin(dto: AdminLoginDto) {
    const admin = await this.adminUserRepo.findOne({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      admin.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.jwtService.sign({
      sub: admin.id,
      role: admin.role,
    });

    admin.last_login_at = new Date();
    await this.adminUserRepo.save(admin);

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role,
      },
      accessToken,
    };
  }

  // ── Dashboard ──────────────────────────────────────────────────

  async getDashboardStats() {
    const [
      totalUsers,
      totalCompanies,
      totalReviews,
      pendingReviews,
      totalReports,
      pendingReports,
    ] = await Promise.all([
      this.userRepo.count(),
      this.companyRepo.count(),
      this.reviewRepo.count(),
      this.reviewRepo.count({ where: { status: ReviewStatus.PENDING } }),
      this.reportRepo.count(),
      this.reportRepo.count({ where: { status: ReportStatus.PENDING } }),
    ]);

    return {
      totalUsers,
      totalCompanies,
      totalReviews,
      pendingReviews,
      totalReports,
      pendingReports,
    };
  }

  async getActivityLogs(limit = 20) {
    return this.activityLogRepo.find({
      relations: ['admin'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  // ── Reviews ────────────────────────────────────────────────────

  async getReviews(filter: {
    status?: ReviewStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    const qb = this.reviewRepo
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.company', 'company')
      .orderBy('review.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filter.status) {
      qb.where('review.status = :status', { status: filter.status });
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async approveReview(reviewId: string, adminId: string) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.status = ReviewStatus.PUBLISHED;
    review.publishedAt = new Date();
    review.moderatedBy = adminId;
    review.moderatedAt = new Date();

    await this.reviewRepo.save(review);
    await this.runModerationSideEffects(
      review,
      adminId,
      'approve_review',
      'review_published',
      'Yorumunuz yayinda',
      'Memnuniyet yorumunuz onaylandi.',
    );

    this.syncReviewToSearch(review).catch((err) => {
      this.logger.warn(`Yorum index guncelleme hatasi (approve): ${err.message}`);
    });
    this.syncCompanyToSearch(review.companyId).catch((err) => {
      this.logger.warn(`Firma index guncelleme hatasi (approve): ${err.message}`);
    });

    return review;
  }

  async rejectReview(reviewId: string, adminId: string, reason: string) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.status = ReviewStatus.REJECTED;
    review.rejectionReason = reason;
    review.moderatedBy = adminId;
    review.moderatedAt = new Date();

    await this.reviewRepo.save(review);
    await this.runModerationSideEffects(
      review,
      adminId,
      'reject_review',
      'review_rejected',
      'Yorumunuz reddedildi',
      reason || 'Yorumunuz moderasyon tarafindan reddedildi.',
      { reason },
    );

    this.syncReviewToSearch(review).catch((err) => {
      this.logger.warn(`Yorum index guncelleme hatasi (reject): ${err.message}`);
    });

    return review;
  }

  async featureReview(reviewId: string, adminId: string) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isFeatured = !review.isFeatured;
    await this.reviewRepo.save(review);
    await this.logActivity(
      adminId,
      review.isFeatured ? 'feature_review' : 'unfeature_review',
      'review',
      reviewId,
      { title: review.title, isFeatured: review.isFeatured },
    );

    return review;
  }

  async deleteReview(reviewId: string, adminId: string) {
    const review = await this.reviewRepo.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const userId = review.userId;
    const companyId = review.companyId;
    const title = review.title;

    await this.reviewRepo.remove(review);

    try {
      await this.notificationRepo.save(this.notificationRepo.create({
        user_id: userId,
        type: 'review_deleted',
        title: 'Yorumunuz silindi',
        message: 'Yorumunuz admin tarafindan silindi.',
        data: { reviewId },
      }));
    } catch (error) {
      this.logger.error(`Silme bildirimi olusturulamadi: ${reviewId}`, error instanceof Error ? error.stack : undefined);
    }

    try {
      await this.sendModerationMail(userId, 'Yorumunuz silindi', 'Yorumunuz admin tarafindan silindi.');
    } catch (error) {
      this.logger.error(`Silme emaili gonderilemedi: ${reviewId}`, error instanceof Error ? error.stack : undefined);
    }

    try {
      await this.recalculateCompanyStats(companyId);
    } catch (error) {
      this.logger.error(`Silme sonrasi firma istatistikleri guncellenemedi: ${companyId}`, error instanceof Error ? error.stack : undefined);
    }

    try {
      await this.logActivity(adminId, 'delete_review', 'review', reviewId, { title, companyId });
    } catch (error) {
      this.logger.error(`Silme activity log olusturulamadi: ${reviewId}`, error instanceof Error ? error.stack : undefined);
    }

    try {
      await this.searchService.removeReview(reviewId);
    } catch (error) {
      this.logger.warn(`Yorum index silme hatasi: ${reviewId}`);
    }

    this.syncCompanyToSearch(companyId).catch((err) => {
      this.logger.warn(`Firma index guncelleme hatasi (delete review): ${err.message}`);
    });

    return { deleted: true };
  }

  /**
   * Bir yoruma firma yanıtı ekler ve yorum sahibine bildirim + e-posta gönderir.
   * Firma yanıt oranı (responseRate) yeniden hesaplanır, activity log tutulur.
   */
  async respondToReview(reviewId: string, dto: CreateCompanyResponseDto, adminId: string) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    if (review.status !== ReviewStatus.PUBLISHED) {
      throw new BadRequestException({
        code: 'REVIEW_NOT_PUBLISHED',
        message: 'Sadece yayında olan yorumlara yanıt verilebilir',
      });
    }

    const company = await this.companyRepo.findOne({ where: { id: review.companyId } });

    const response = await this.companyResponseRepo.save(
      this.companyResponseRepo.create({
        reviewId: review.id,
        companyId: review.companyId,
        content: dto.content,
        responderName: dto.responderName ?? company?.name ?? null,
        status: ResponseStatus.PUBLISHED,
      }),
    );

    try {
      await this.recalculateCompanyStats(review.companyId);
    } catch (error) {
      this.logger.error(`Yanıt sonrası firma istatistikleri güncellenemedi: ${review.companyId}`, error instanceof Error ? error.stack : undefined);
    }

    await this.notificationsService.notifyCompanyResponded(review.userId, {
      reviewId: review.id,
      reviewSlug: review.slug,
      companyName: company?.name ?? 'Firma',
    });

    try {
      const user = await this.userRepo.findOne({ where: { id: review.userId } });
      if (user) {
        await this.mailService.sendCompanyResponded(
          user.email,
          user.full_name,
          company?.name ?? 'Firma',
          review.slug,
        );
      }
    } catch (error) {
      this.logger.error(`Firma yanıtı e-postası gönderilemedi: ${reviewId}`, error instanceof Error ? error.stack : undefined);
    }

    try {
      await this.logActivity(adminId, 'company_response', 'review', reviewId, {
        title: review.title,
        companyId: review.companyId,
        responseId: response.id,
      });
    } catch (error) {
      this.logger.error(`Yanıt activity log olusturulamadi: ${reviewId}`, error instanceof Error ? error.stack : undefined);
    }

    return response;
  }

  // ── Companies ──────────────────────────────────────────────────

  async getCompanies(filter: {
    status?: CompanyStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    const qb = this.companyRepo
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.category', 'category')
      .orderBy('company.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filter.status) {
      qb.where('company.status = :status', { status: filter.status });
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async createCompany(dto: AdminCreateCompanyDto) {
    const slug = await this.createUniqueCompanySlug(dto.name);

    const existing = await this.companyRepo.findOne({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const company = this.companyRepo.create({
      ...dto,
      slug: finalSlug,
    });

    const saved = await this.companyRepo.save(company);

    this.syncCompanyToSearch(saved.id).catch((err) => {
      this.logger.warn(`Firma index ekleme hatasi: ${err.message}`);
    });

    return saved;
  }

  async updateCompany(companyId: string, dto: AdminUpdateCompanyDto) {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const nameChanged = Boolean(dto.name && dto.name !== company.name);

    Object.assign(company, dto);

    if (nameChanged && dto.name) {
      company.slug = await this.createUniqueCompanySlug(dto.name, companyId);
    }

    const saved = await this.companyRepo.save(company);

    this.syncCompanyToSearch(saved.id).catch((err) => {
      this.logger.warn(`Firma index guncelleme hatasi: ${err.message}`);
    });

    return saved;
  }

  async deleteCompany(companyId: string, adminId: string) {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.companyRepo.remove(company);
    await this.logActivity(
      adminId,
      'delete_company',
      'company',
      companyId,
      { name: company.name },
    );

    try {
      await this.searchService.removeCompany(companyId);
    } catch (error) {
      this.logger.warn(`Firma index silme hatasi: ${companyId}`);
    }

    return { deleted: true };
  }

  // ── Claims ─────────────────────────────────────────────────────

  async getClaims(filter: {
    status?: ClaimStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    const qb = this.claimRepo
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.company', 'company')
      .orderBy('claim.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filter.status) {
      qb.where('claim.status = :status', { status: filter.status });
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async processClaim(
    claimId: string,
    status: ClaimStatus,
    adminNote: string | null,
    adminId: string,
  ) {
    const claim = await this.claimRepo.findOne({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException('Claim not found');
    }

    claim.status = status;
    claim.adminNote = adminNote;
    claim.reviewedAt = new Date();

    await this.claimRepo.save(claim);

    if (status === ClaimStatus.APPROVED) {
      await this.companyRepo.update(claim.companyId, { isClaimed: true });
    }

    await this.logActivity(
      adminId,
      `${status}_claim`,
      'company_claim',
      claimId,
      { companyId: claim.companyId, status },
    );

    return claim;
  }

  // ── Users ──────────────────────────────────────────────────────

  async getUsers(filter: { page?: number; limit?: number; status?: UserStatus }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    const qb = this.userRepo
      .createQueryBuilder('user')
      .orderBy('user.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filter.status) {
      qb.where('user.status = :status', { status: filter.status });
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async banUser(userId: string, adminId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = UserStatus.BANNED;
    await this.userRepo.save(user);
    await this.logActivity(adminId, 'ban_user', 'user', userId, {
      email: user.email,
    });

    return user;
  }

  async unbanUser(userId: string, adminId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = UserStatus.ACTIVE;
    await this.userRepo.save(user);
    await this.logActivity(adminId, 'unban_user', 'user', userId, {
      email: user.email,
    });

    return user;
  }

  // ── Reports ────────────────────────────────────────────────────

  async getReports(filter: {
    status?: ReportStatus;
    page?: number;
    limit?: number;
  }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;

    const qb = this.reportRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.review', 'review')
      .orderBy('report.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filter.status) {
      qb.where('report.status = :status', { status: filter.status });
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async processReport(
    reportId: string,
    status: ReportStatus,
    adminId: string,
  ) {
    const report = await this.reportRepo.findOne({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = status;
    report.reviewed_by = adminId;
    report.reviewed_at = new Date();

    await this.reportRepo.save(report);
    await this.logActivity(
      adminId,
      `${status}_report`,
      'report',
      reportId,
      { reason: report.reason },
    );

    return report;
  }

  // ── Categories ─────────────────────────────────────────────────

  async getCategories() {
    const categories = await this.categoryRepo.find({
      relations: ['children'],
      where: { parentId: null as unknown as number },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });

    return categories;
  }

  async createCategory(dto: AdminCreateCategoryDto) {
    const slug = dto.slug ?? (await this.createUniqueCategorySlug(dto.name));
    const category = this.categoryRepo.create({ ...dto, slug });

    const saved = await this.categoryRepo.save(category);

    this.syncCategoryToSearch(saved.id).catch((err) => {
      this.logger.warn(`Kategori index ekleme hatasi: ${err.message}`);
    });

    return saved;
  }

  async updateCategory(categoryId: number, dto: AdminUpdateCategoryDto) {
    const existing = await this.categoryRepo.findOne({ where: { id: categoryId } });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    Object.assign(existing, dto);
    if (dto.name && !dto.slug) {
      existing.slug = await this.createUniqueCategorySlug(dto.name, categoryId);
    }

    const saved = await this.categoryRepo.save(existing);

    this.syncCategoryToSearch(saved.id).catch((err) => {
      this.logger.warn(`Kategori index guncelleme hatasi: ${err.message}`);
    });

    return saved;
  }

  async getPages() {
    await this.ensurePagesTable();
    return this.pageRepo.find({ order: { created_at: 'DESC' } });
  }

  async getPublishedPage(slug: string) {
    await this.ensurePagesTable();
    const page = await this.pageRepo.findOne({ where: { slug, is_published: true } });
    if (!page) throw new NotFoundException({ code: 'PAGE_NOT_FOUND', message: 'Sayfa bulunamadi' });
    return page;
  }

  async getPublishedPages() {
    await this.ensurePagesTable();
    return this.pageRepo.find({
      where: { is_published: true },
      order: { created_at: 'DESC' },
    });
  }

  async createPage(dto: AdminCreatePageDto) {
    await this.ensurePagesTable();
    const slug = dto.slug || (await this.createUniquePageSlug(dto.title));
    const page = new PageEntity();
    page.title = dto.title;
    page.slug = slug;
    page.content = dto.content ?? '';
    page.meta_title = dto.metaTitle ?? '';
    page.meta_description = dto.metaDescription ?? '';
    page.is_published = dto.isPublished ?? false;
    return this.pageRepo.save(page);
  }

  async updatePage(pageId: number, dto: AdminUpdatePageDto) {
    await this.ensurePagesTable();
    const page = await this.pageRepo.findOne({ where: { id: pageId } });
    if (!page) throw new NotFoundException('Page not found');

    if (dto.title !== undefined) page.title = dto.title;
    if (dto.slug !== undefined) page.slug = dto.slug;
    if (dto.content !== undefined) page.content = dto.content;
    if (dto.metaTitle !== undefined) page.meta_title = dto.metaTitle;
    if (dto.metaDescription !== undefined) page.meta_description = dto.metaDescription;
    if (dto.isPublished !== undefined) page.is_published = dto.isPublished;

    return this.pageRepo.save(page);
  }

  // ── Activity Log (private helper) ─────────────────────────────

  private async logActivity(
    adminId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    manager?: EntityManager,
  ) {
    const log = new ActivityLog();
    log.admin_id = adminId;
    log.action = action;
    log.entity_type = entityType;
    log.entity_id = entityId;
    log.details = details ?? ({} as Record<string, unknown>);
    log.ip_address = ipAddress ?? '';

    const repo = manager ? manager.getRepository(ActivityLog) : this.activityLogRepo;
    await repo.save(log);
  }

  private async createNotification(
    manager: EntityManager,
    userId: string,
    type: string,
    title: string,
    message: string,
    data: Record<string, unknown>,
  ) {
    const notification = manager.create(Notification, {
      user_id: userId,
      type,
      title,
      message,
      data,
    });

    await manager.save(notification);
  }

  private async runModerationSideEffects(
    review: Review,
    adminId: string,
    action: string,
    notificationType: string,
    notificationTitle: string,
    notificationMessage: string,
    extraDetails: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await this.recalculateCompanyStats(review.companyId);
    } catch (error) {
      this.logger.error(`Firma istatistikleri guncellenemedi: ${review.companyId}`, error instanceof Error ? error.stack : undefined);
    }

    try {
      await this.notificationRepo.save(
        this.notificationRepo.create({
          user_id: review.userId,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage,
          data: { reviewId: review.id },
        }),
      );
    } catch (error) {
      this.logger.error(`Bildirim olusturulamadi: ${review.id}`, error instanceof Error ? error.stack : undefined);
    }

    try {
      if (notificationType === 'review_published') {
        const user = await this.userRepo.findOne({ where: { id: review.userId } });
        if (user) await this.mailService.sendReviewPublished(user.email, user.full_name, review.title, review.slug);
      } else {
        await this.sendModerationMail(review.userId, notificationTitle, notificationMessage);
      }
    } catch (error) {
      this.logger.error(`Moderasyon emaili gonderilemedi: ${review.id}`, error instanceof Error ? error.stack : undefined);
    }

    try {
      await this.logActivity(adminId, action, 'review', review.id, {
        title: review.title,
        ...extraDetails,
      });
    } catch (error) {
      this.logger.error(`Activity log olusturulamadi: ${review.id}`, error instanceof Error ? error.stack : undefined);
    }
  }

  private async recalculateCompanyStats(companyId: string): Promise<void> {
    const stats = await this.reviewRepo
      .createQueryBuilder('review')
      .select('COUNT(review.id)', 'reviewCount')
      .addSelect('COALESCE(AVG(review.rating), 0)', 'avgRating')
      .where('review.company_id = :companyId', { companyId })
      .andWhere('review.status = :status', { status: ReviewStatus.PUBLISHED })
      .getRawOne<{ reviewCount: string; avgRating: string }>();

    const reviewCount = Number(stats?.reviewCount ?? 0);
    const avgRating = Number(Number(stats?.avgRating ?? 0).toFixed(2));
    const responseCount = await this.companyResponseRepo.count({ where: { companyId } });
    const responseRate = reviewCount > 0
      ? Number(((responseCount / reviewCount) * 100).toFixed(2))
      : 0;
    const reviewVolumeScore = Math.min(reviewCount * 2, 100);
    const memnuniyetScore = Number(
      ((avgRating * 20 * 0.6) + (responseRate * 0.3) + (reviewVolumeScore * 0.1)).toFixed(2),
    );

    await this.companyRepo.update(companyId, {
      avgRating,
      reviewCount,
      responseCount,
      responseRate,
      memnuniyetScore,
    });
  }

  private async createUniqueCompanySlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (await this.companySlugExists(slug, excludeId)) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  private async companySlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await this.companyRepo.findOne({ where: { slug } });
    return Boolean(existing && existing.id !== excludeId);
  }

  private async createUniqueCategorySlug(name: string, excludeId?: number): Promise<string> {
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (await this.categorySlugExists(slug, excludeId)) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  private async categorySlugExists(slug: string, excludeId?: number): Promise<boolean> {
    const existing = await this.categoryRepo.findOne({ where: { slug } });
    return Boolean(existing && existing.id !== excludeId);
  }

  private async createUniquePageSlug(title: string, excludeId?: number): Promise<string> {
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (await this.pageSlugExists(slug, excludeId)) {
      counter += 1;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  private async pageSlugExists(slug: string, excludeId?: number): Promise<boolean> {
    await this.ensurePagesTable();
    const existing = await this.pageRepo.findOne({ where: { slug } });
    return Boolean(existing && existing.id !== excludeId);
  }

  private async sendModerationMail(userId: string, subject: string, message: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) return;
    await this.mailService.sendMail(user.email, `MemnuniyetimVar - ${subject}`, `<p>Merhaba ${user.full_name},</p><p>${message}</p>`);
  }

  private async syncCompanyToSearch(companyId: string): Promise<void> {
    const company = await this.companyRepo.findOne({ where: { id: companyId } });
    if (!company) return;

    const category = company.categoryId
      ? await this.categoryRepo.findOne({ where: { id: company.categoryId } })
      : null;

    const doc: CompanySearchDocument = {
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description ?? '',
      city: company.city ?? '',
      categoryName: category?.name ?? '',
      avgRating: Number(company.avgRating) || 0,
      reviewCount: company.reviewCount || 0,
      memnuniyetScore: Number(company.memnuniyetScore) || 0,
      status: company.status,
    };

    await this.searchService.updateCompany(doc);
  }

  private async syncReviewToSearch(review: Review): Promise<void> {
    const company = await this.companyRepo.findOne({ where: { id: review.companyId } });
    const user = await this.userRepo.findOne({ where: { id: review.userId } });

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

    await this.searchService.updateReview(doc);
  }

  private async syncCategoryToSearch(categoryId: number): Promise<void> {
    const category = await this.categoryRepo.findOne({ where: { id: categoryId } });
    if (!category) return;

    await this.searchService.updateCategory({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      parentId: category.parentId,
      isActive: category.isActive,
    });
  }

  private async ensurePagesTable(): Promise<void> {
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS "pages" (
        "id" SERIAL NOT NULL,
        "title" varchar(200) NOT NULL,
        "slug" varchar(220) NOT NULL,
        "content" text,
        "meta_title" varchar(200),
        "meta_description" varchar(300),
        "is_published" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pages" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_pages_slug" UNIQUE ("slug")
      )
    `);
    await this.dataSource.query(`CREATE INDEX IF NOT EXISTS "IDX_pages_slug" ON "pages" ("slug")`);
  }
}
