import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminService {
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
    private readonly jwtService: JwtService,
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
    await this.logActivity(
      adminId,
      'approve_review',
      'review',
      reviewId,
      { title: review.title },
    );

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
    await this.logActivity(
      adminId,
      'reject_review',
      'review',
      reviewId,
      { title: review.title, reason },
    );

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

    await this.reviewRepo.remove(review);

    // Decrement company review_count
    await this.companyRepo
      .createQueryBuilder()
      .update(Company)
      .set({ reviewCount: () => 'GREATEST(review_count - 1, 0)' })
      .where('id = :id', { id: review.companyId })
      .execute();

    await this.logActivity(
      adminId,
      'delete_review',
      'review',
      reviewId,
      { title: review.title, companyId: review.companyId },
    );

    return { deleted: true };
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
      .orderBy('company.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filter.status) {
      qb.where('company.status = :status', { status: filter.status });
    }

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async createCompany(dto: Partial<Company>) {
    if (!dto.name) {
      throw new BadRequestException('Company name is required');
    }

    const slug = this.generateSlug(dto.name);

    const existing = await this.companyRepo.findOne({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    const company = this.companyRepo.create({
      ...dto,
      slug: finalSlug,
    });

    return this.companyRepo.save(company);
  }

  async updateCompany(companyId: string, dto: Partial<Company>) {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    Object.assign(company, dto);

    if (dto.name && dto.name !== company.name) {
      company.slug = this.generateSlug(dto.name);
    }

    return this.companyRepo.save(company);
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

  async createOrUpdateCategory(dto: Partial<Category>) {
    if (dto.id) {
      const existing = await this.categoryRepo.findOne({
        where: { id: dto.id },
      });

      if (!existing) {
        throw new NotFoundException('Category not found');
      }

      Object.assign(existing, dto);
      return this.categoryRepo.save(existing);
    }

    if (!dto.name) {
      throw new BadRequestException('Category name is required');
    }

    const slug = dto.slug ?? this.generateSlug(dto.name);
    const category = this.categoryRepo.create({ ...dto, slug });

    return this.categoryRepo.save(category);
  }

  // ── Activity Log (private helper) ─────────────────────────────

  private async logActivity(
    adminId: string,
    action: string,
    entityType: string,
    entityId: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
  ) {
    const log = new ActivityLog();
    log.admin_id = adminId;
    log.action = action;
    log.entity_type = entityType;
    log.entity_id = entityId;
    log.details = details ?? ({} as Record<string, unknown>);
    log.ip_address = ipAddress ?? '';

    await this.activityLogRepo.save(log);
  }

  // ── Helpers ────────────────────────────────────────────────────

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
