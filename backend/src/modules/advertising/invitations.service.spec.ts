import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { InvitationsService } from './invitations.service';
import { ReviewInvitation, InvitationStatus } from './entities/review-invitation.entity';
import { Company } from '../companies/entities/company.entity';

describe('InvitationsService (Faz 8)', () => {
  let service: InvitationsService;

  const invitationRepo = { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), findAndCount: jest.fn() };
  const companyRepo = { findOne: jest.fn() };
  const config = { get: jest.fn((_k: string, def?: string) => def ?? 'http://localhost:3000') };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: getRepositoryToken(ReviewInvitation), useValue: invitationRepo },
        { provide: getRepositoryToken(Company), useValue: companyRepo },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = module.get(InvitationsService);
  });

  describe('create', () => {
    it('firma yoksa NotFound fırlatır', async () => {
      companyRepo.findOne.mockResolvedValue(null);
      await expect(service.create('u1', { companyId: 'c1' })).rejects.toThrow(NotFoundException);
    });

    it('tekil token ve davet linki üretir', async () => {
      companyRepo.findOne.mockResolvedValue({ id: 'c1', name: 'ACME' });
      invitationRepo.create.mockImplementation((x) => x);
      invitationRepo.save.mockImplementation(async (x) => ({ id: 'inv-1', ...x }));

      const result = await service.create('u1', { companyId: 'c1', campaignName: 'Yaz' });

      expect(result.token).toHaveLength(48); // randomBytes(24).hex
      expect(result.status).toBe(InvitationStatus.PENDING);
      expect(result.inviteUrl).toContain('/davet/');
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('cancel', () => {
    it('kullanılmış davet iptal edilemez', async () => {
      invitationRepo.findOne.mockResolvedValue({ id: 'i1', createdByUserId: 'u1', status: InvitationStatus.USED });
      await expect(service.cancel('u1', 'i1')).rejects.toThrow(BadRequestException);
    });

    it('sahibi olmayan iptal edemez', async () => {
      invitationRepo.findOne.mockResolvedValue({ id: 'i1', createdByUserId: 'other', status: InvitationStatus.PENDING });
      await expect(service.cancel('u1', 'i1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getByToken', () => {
    it('bulunamayan token NotFound', async () => {
      invitationRepo.findOne.mockResolvedValue(null);
      await expect(service.getByToken('x')).rejects.toThrow(NotFoundException);
    });

    it('süresi geçmiş pending davet EXPIRED işaretlenir ve hata döner', async () => {
      const inv = {
        token: 'x',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() - 1000),
        company: { name: 'ACME', slug: 'acme' },
      };
      invitationRepo.findOne.mockResolvedValue(inv);
      invitationRepo.save.mockImplementation(async (x) => x);

      await expect(service.getByToken('x')).rejects.toThrow(BadRequestException);
      expect(inv.status).toBe(InvitationStatus.EXPIRED);
    });

    it('geçerli pending davet bilgisini döner', async () => {
      invitationRepo.findOne.mockResolvedValue({
        token: 'x',
        companyId: 'c1',
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + 100000),
        campaignName: 'Yaz',
        company: { name: 'ACME', slug: 'acme' },
      });

      const result = await service.getByToken('x');
      expect(result.valid).toBe(true);
      expect(result.companyName).toBe('ACME');
      expect(result.companySlug).toBe('acme');
    });
  });
});
