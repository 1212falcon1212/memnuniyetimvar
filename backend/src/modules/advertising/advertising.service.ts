import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, IsNull } from 'typeorm';
import { AdPackage } from './entities/ad-package.entity';
import { AdRequest, AdRequestStatus } from './entities/ad-request.entity';
import { ReviewInvitation, InvitationStatus } from './entities/review-invitation.entity';
import { Company, CompanyStatus } from '../companies/entities/company.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification-types';
import { CreateAdRequestDto, ProcessAdRequestDto, CreateAdPackageDto, UpdateAdPackageDto } from './dto';

@Injectable()
export class AdvertisingService {
  private readonly logger = new Logger(AdvertisingService.name);

  constructor(
    @InjectRepository(AdPackage)
    private readonly packageRepo: Repository<AdPackage>,
    @InjectRepository(AdRequest)
    private readonly requestRepo: Repository<AdRequest>,
    @InjectRepository(ReviewInvitation)
    private readonly invitationRepo: Repository<ReviewInvitation>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Packages ───────────────────────────────────────────────────

  listActivePackages(): Promise<AdPackage[]> {
    return this.packageRepo.find({ where: { isActive: true }, order: { price: 'ASC' } });
  }

  listAllPackages(): Promise<AdPackage[]> {
    return this.packageRepo.find({ order: { id: 'ASC' } });
  }

  createPackage(dto: CreateAdPackageDto): Promise<AdPackage> {
    return this.packageRepo.save(this.packageRepo.create(dto));
  }

  async updatePackage(id: number, dto: UpdateAdPackageDto): Promise<AdPackage> {
    const pkg = await this.packageRepo.findOne({ where: { id } });
    if (!pkg) {
      throw new NotFoundException({ code: 'AD_PACKAGE_NOT_FOUND', message: 'Reklam paketi bulunamadı' });
    }
    Object.assign(pkg, dto);
    return this.packageRepo.save(pkg);
  }

  // ── Ad Requests (company side) ─────────────────────────────────

  async createRequest(userId: string, dto: CreateAdRequestDto): Promise<AdRequest> {
    const company = await this.companyRepo.findOne({ where: { id: dto.companyId } });
    if (!company) {
      throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'Firma bulunamadı' });
    }

    const request = this.requestRepo.create({
      companyId: dto.companyId,
      requestedByUserId: userId,
      packageId: dto.packageId ?? null,
      type: dto.type,
      categoryId: dto.categoryId ?? null,
      budget: dto.budget ?? null,
      requestedStartDate: dto.requestedStartDate ? new Date(dto.requestedStartDate) : null,
      note: dto.note ?? null,
      status: AdRequestStatus.PENDING,
    });

    return this.requestRepo.save(request);
  }

  async listMyRequests(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.requestRepo.findAndCount({
      where: { requestedByUserId: userId },
      relations: ['company', 'package'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return this.paginated(data, total, page, limit);
  }

  async cancelRequest(userId: string, id: string): Promise<AdRequest> {
    const request = await this.requestRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException({ code: 'AD_REQUEST_NOT_FOUND', message: 'Reklam talebi bulunamadı' });
    }
    if (request.requestedByUserId !== userId) {
      throw new ForbiddenException({ code: 'AD_REQUEST_NOT_OWNED', message: 'Bu talebi iptal etme yetkiniz yok' });
    }
    if (![AdRequestStatus.PENDING, AdRequestStatus.APPROVED].includes(request.status)) {
      throw new BadRequestException({
        code: 'AD_REQUEST_NOT_CANCELLABLE',
        message: 'Sadece beklemede veya onaylanmış talepler iptal edilebilir',
      });
    }
    request.status = AdRequestStatus.CANCELLED;
    return this.requestRepo.save(request);
  }

  // ── Ad Requests (admin side) ───────────────────────────────────

  async listRequests(filter: { status?: AdRequestStatus; page?: number; limit?: number }) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const [data, total] = await this.requestRepo.findAndCount({
      where: filter.status ? { status: filter.status } : {},
      relations: ['company', 'package'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return this.paginated(data, total, page, limit);
  }

  async processRequest(id: string, dto: ProcessAdRequestDto): Promise<AdRequest> {
    const request = await this.requestRepo.findOne({ where: { id }, relations: ['package'] });
    if (!request) {
      throw new NotFoundException({ code: 'AD_REQUEST_NOT_FOUND', message: 'Reklam talebi bulunamadı' });
    }

    request.status = dto.status;
    if (dto.budget !== undefined) request.budget = dto.budget;
    if (dto.startDate) request.startDate = new Date(dto.startDate);
    if (dto.endDate) request.endDate = new Date(dto.endDate);
    if (dto.adminNote !== undefined) request.adminNote = dto.adminNote;

    if (dto.status === AdRequestStatus.ACTIVE) {
      await this.activateSponsorship(request);
    }

    const saved = await this.requestRepo.save(request);
    await this.notifyRequester(saved);
    return saved;
  }

  async getReport(id: string) {
    const request = await this.requestRepo.findOne({ where: { id }, relations: ['company'] });
    if (!request) {
      throw new NotFoundException({ code: 'AD_REQUEST_NOT_FOUND', message: 'Reklam talebi bulunamadı' });
    }

    const invitationConversions = await this.invitationRepo.count({
      where: { companyId: request.companyId, status: InvitationStatus.USED },
    });

    const ctr = request.impressions > 0
      ? Number(((request.clicks / request.impressions) * 100).toFixed(2))
      : 0;

    return {
      requestId: request.id,
      companyId: request.companyId,
      companyName: request.company?.name ?? null,
      type: request.type,
      status: request.status,
      impressions: request.impressions,
      clicks: request.clicks,
      ctr,
      invitationConversions,
      startDate: request.startDate,
      endDate: request.endDate,
      budget: request.budget,
    };
  }

  // ── Sponsored showcase (public) ────────────────────────────────

  getSponsoredCompanies(limit = 12): Promise<Company[]> {
    const now = new Date();
    return this.companyRepo.find({
      where: [
        { isSponsored: true, status: CompanyStatus.ACTIVE, sponsoredUntil: MoreThan(now) },
        { isSponsored: true, status: CompanyStatus.ACTIVE, sponsoredUntil: IsNull() },
      ],
      relations: ['category'],
      order: { memnuniyetScore: 'DESC' },
      take: limit,
    });
  }

  // ── Tracking ───────────────────────────────────────────────────

  async recordImpression(id: string): Promise<{ ok: boolean }> {
    await this.requestRepo.increment({ id, status: AdRequestStatus.ACTIVE }, 'impressions', 1);
    return { ok: true };
  }

  async recordClick(id: string): Promise<{ ok: boolean }> {
    await this.requestRepo.increment({ id, status: AdRequestStatus.ACTIVE }, 'clicks', 1);
    return { ok: true };
  }

  // ── Helpers ────────────────────────────────────────────────────

  private async activateSponsorship(request: AdRequest): Promise<void> {
    const start = request.startDate ?? new Date();
    let end = request.endDate;
    if (!end) {
      const days = request.package?.durationDays ?? 30;
      end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    }
    request.startDate = start;
    request.endDate = end;
    await this.companyRepo.update(request.companyId, { isSponsored: true, sponsoredUntil: end });
  }

  private async notifyRequester(request: AdRequest): Promise<void> {
    if (request.status === AdRequestStatus.APPROVED || request.status === AdRequestStatus.ACTIVE) {
      await this.notificationsService.create({
        userId: request.requestedByUserId,
        type: NotificationType.AD_REQUEST_APPROVED,
        title: 'Reklam talebiniz onaylandı',
        message: 'Reklam talebiniz onaylandı ve yayın takvimine alındı.',
        data: { adRequestId: request.id },
      });
    } else if (request.status === AdRequestStatus.REJECTED) {
      await this.notificationsService.create({
        userId: request.requestedByUserId,
        type: NotificationType.AD_REQUEST_REJECTED,
        title: 'Reklam talebiniz reddedildi',
        message: request.adminNote || 'Reklam talebiniz reddedildi.',
        data: { adRequestId: request.id },
      });
    }
  }

  private paginated<T>(data: T[], total: number, page: number, limit: number) {
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
