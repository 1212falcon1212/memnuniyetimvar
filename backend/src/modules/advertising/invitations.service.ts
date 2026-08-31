import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { ReviewInvitation, InvitationStatus } from './entities/review-invitation.entity';
import { Company } from '../companies/entities/company.entity';
import { CreateInvitationDto } from './dto';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(ReviewInvitation)
    private readonly invitationRepo: Repository<ReviewInvitation>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly configService: ConfigService,
  ) {}

  async create(userId: string, dto: CreateInvitationDto) {
    const company = await this.companyRepo.findOne({ where: { id: dto.companyId } });
    if (!company) {
      throw new NotFoundException({ code: 'COMPANY_NOT_FOUND', message: 'Firma bulunamadı' });
    }

    const expiresInDays = dto.expiresInDays ?? 30;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invitation = await this.invitationRepo.save(
      this.invitationRepo.create({
        companyId: dto.companyId,
        createdByUserId: userId,
        token: this.generateToken(),
        campaignName: dto.campaignName ?? null,
        recipientEmail: dto.recipientEmail ?? null,
        recipientPhone: dto.recipientPhone ?? null,
        status: InvitationStatus.PENDING,
        expiresAt,
      }),
    );

    return { ...invitation, inviteUrl: this.buildInviteUrl(invitation.token) };
  }

  async listMine(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.invitationRepo.findAndCount({
      where: { createdByUserId: userId },
      relations: ['company'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async cancel(userId: string, id: string): Promise<ReviewInvitation> {
    const invitation = await this.invitationRepo.findOne({ where: { id } });
    if (!invitation) {
      throw new NotFoundException({ code: 'INVITATION_NOT_FOUND', message: 'Davet bulunamadı' });
    }
    if (invitation.createdByUserId !== userId) {
      throw new ForbiddenException({ code: 'INVITATION_NOT_OWNED', message: 'Bu daveti iptal etme yetkiniz yok' });
    }
    if (invitation.status === InvitationStatus.USED) {
      throw new BadRequestException({ code: 'INVITATION_ALREADY_USED', message: 'Kullanılmış davet iptal edilemez' });
    }
    invitation.status = InvitationStatus.CANCELLED;
    return this.invitationRepo.save(invitation);
  }

  /**
   * Davet linki sayfası için token doğrulama. Süresi geçmişse otomatik
   * EXPIRED işaretlenir. Kullanılmış/iptal/expired ise uygun hata döner.
   */
  async getByToken(token: string) {
    const invitation = await this.invitationRepo.findOne({
      where: { token },
      relations: ['company'],
    });
    if (!invitation) {
      throw new NotFoundException({ code: 'INVITATION_NOT_FOUND', message: 'Davet bulunamadı' });
    }

    if (invitation.status === InvitationStatus.PENDING && invitation.expiresAt.getTime() < Date.now()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationRepo.save(invitation);
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException({
        code: `INVITATION_${invitation.status.toUpperCase()}`,
        message: this.statusMessage(invitation.status),
      });
    }

    return {
      token: invitation.token,
      companyId: invitation.companyId,
      companyName: invitation.company?.name ?? null,
      companySlug: invitation.company?.slug ?? null,
      campaignName: invitation.campaignName,
      expiresAt: invitation.expiresAt,
      valid: true,
    };
  }

  private statusMessage(status: InvitationStatus): string {
    switch (status) {
      case InvitationStatus.USED:
        return 'Bu davet zaten kullanılmış';
      case InvitationStatus.EXPIRED:
        return 'Bu davetin süresi dolmuş';
      case InvitationStatus.CANCELLED:
        return 'Bu davet iptal edilmiş';
      default:
        return 'Davet geçerli değil';
    }
  }

  private generateToken(): string {
    return randomBytes(24).toString('hex');
  }

  private buildInviteUrl(token: string): string {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return `${frontendUrl}/davet/${token}`;
  }
}
