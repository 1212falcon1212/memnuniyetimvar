import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdvertisingService } from './advertising.service';
import { AdPackage, AdType } from './entities/ad-package.entity';
import { AdRequest, AdRequestStatus } from './entities/ad-request.entity';
import { ReviewInvitation, InvitationStatus } from './entities/review-invitation.entity';
import { Company } from '../companies/entities/company.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notification-types';

describe('AdvertisingService (Faz 8)', () => {
  let service: AdvertisingService;

  const packageRepo = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
  const requestRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    increment: jest.fn(),
  };
  const invitationRepo = { count: jest.fn() };
  const companyRepo = { findOne: jest.fn(), update: jest.fn(), find: jest.fn() };
  const notificationsService = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvertisingService,
        { provide: getRepositoryToken(AdPackage), useValue: packageRepo },
        { provide: getRepositoryToken(AdRequest), useValue: requestRepo },
        { provide: getRepositoryToken(ReviewInvitation), useValue: invitationRepo },
        { provide: getRepositoryToken(Company), useValue: companyRepo },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();
    service = module.get(AdvertisingService);
  });

  describe('createRequest', () => {
    it('firma yoksa NotFound fırlatır', async () => {
      companyRepo.findOne.mockResolvedValue(null);
      await expect(
        service.createRequest('u1', { companyId: 'c1', type: AdType.FEATURED_CAMPAIGN }),
      ).rejects.toThrow(NotFoundException);
    });

    it('pending durumda talep oluşturur', async () => {
      companyRepo.findOne.mockResolvedValue({ id: 'c1' });
      requestRepo.create.mockImplementation((x) => x);
      requestRepo.save.mockImplementation(async (x) => ({ id: 'req-1', ...x }));

      const result = await service.createRequest('u1', {
        companyId: 'c1',
        type: AdType.SPONSORED_SHOWCASE,
        budget: 1000,
      });

      expect(result.status).toBe(AdRequestStatus.PENDING);
      expect(result.requestedByUserId).toBe('u1');
      expect(result.budget).toBe(1000);
    });
  });

  describe('cancelRequest', () => {
    it('başkasının talebini iptal edemez', async () => {
      requestRepo.findOne.mockResolvedValue({ id: 'r1', requestedByUserId: 'other', status: AdRequestStatus.PENDING });
      await expect(service.cancelRequest('u1', 'r1')).rejects.toThrow(ForbiddenException);
    });

    it('aktif talep iptal edilemez', async () => {
      requestRepo.findOne.mockResolvedValue({ id: 'r1', requestedByUserId: 'u1', status: AdRequestStatus.ACTIVE });
      await expect(service.cancelRequest('u1', 'r1')).rejects.toThrow(BadRequestException);
    });

    it('pending talep iptal edilir', async () => {
      requestRepo.findOne.mockResolvedValue({ id: 'r1', requestedByUserId: 'u1', status: AdRequestStatus.PENDING });
      requestRepo.save.mockImplementation(async (x) => x);
      const result = await service.cancelRequest('u1', 'r1');
      expect(result.status).toBe(AdRequestStatus.CANCELLED);
    });
  });

  describe('processRequest', () => {
    it('ACTIVE yapıldığında firmayı sponsorlu işaretler ve bildirir', async () => {
      requestRepo.findOne.mockResolvedValue({
        id: 'r1',
        companyId: 'c1',
        requestedByUserId: 'u1',
        type: AdType.SPONSORED_SHOWCASE,
        status: AdRequestStatus.PENDING,
        startDate: null,
        endDate: null,
        package: { durationDays: 30 },
      });
      requestRepo.save.mockImplementation(async (x) => x);

      const result = await service.processRequest('r1', {
        status: AdRequestStatus.ACTIVE,
        budget: 500,
      });

      expect(companyRepo.update).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ isSponsored: true }),
      );
      expect(result.endDate).toBeInstanceOf(Date);
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.AD_REQUEST_APPROVED }),
      );
    });

    it('REJECTED yapıldığında red bildirimi gönderir, sponsorluk açmaz', async () => {
      requestRepo.findOne.mockResolvedValue({
        id: 'r1', companyId: 'c1', requestedByUserId: 'u1',
        type: AdType.FEATURED_CAMPAIGN, status: AdRequestStatus.PENDING,
      });
      requestRepo.save.mockImplementation(async (x) => x);

      await service.processRequest('r1', { status: AdRequestStatus.REJECTED, adminNote: 'Uygun değil' });

      expect(companyRepo.update).not.toHaveBeenCalled();
      expect(notificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: NotificationType.AD_REQUEST_REJECTED }),
      );
    });
  });

  describe('getReport', () => {
    it('CTR ve davet dönüşümlerini hesaplar', async () => {
      requestRepo.findOne.mockResolvedValue({
        id: 'r1', companyId: 'c1', company: { name: 'ACME' },
        type: AdType.SPONSORED_SHOWCASE, status: AdRequestStatus.ACTIVE,
        impressions: 200, clicks: 10, budget: 500, startDate: null, endDate: null,
      });
      invitationRepo.count.mockResolvedValue(4);

      const report = await service.getReport('r1');

      expect(report.ctr).toBe(5); // 10/200 * 100
      expect(report.invitationConversions).toBe(4);
      expect(report.companyName).toBe('ACME');
    });
  });

  describe('tracking', () => {
    it('impression sadece aktif talebi sayar', async () => {
      requestRepo.increment.mockResolvedValue({ affected: 1 });
      await service.recordImpression('r1');
      expect(requestRepo.increment).toHaveBeenCalledWith(
        { id: 'r1', status: AdRequestStatus.ACTIVE },
        'impressions',
        1,
      );
    });
  });
});
