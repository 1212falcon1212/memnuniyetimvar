import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';

import { AdminService } from './admin.service';
import { AdminUser } from '../users/entities/admin-user.entity';
import { User } from '../users/entities/user.entity';
import { Review, ReviewStatus } from '../reviews/entities/review.entity';
import { Company } from '../companies/entities/company.entity';
import { CompanyClaim } from '../companies/entities/company-claim.entity';
import { Report } from '../reports/entities/report.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { Category } from '../categories/entities/category.entity';
import { CompanyResponse } from '../reviews/entities/company-response.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Page } from './entities/page.entity';
import { MailService } from '../mail/mail.service';
import { SearchService } from '../search/search.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('AdminService - respondToReview (Faz 7)', () => {
  let service: AdminService;

  const reviewRepo = { findOne: jest.fn(), createQueryBuilder: jest.fn() };
  const companyRepo = { findOne: jest.fn(), update: jest.fn() };
  const userRepo = { findOne: jest.fn() };
  const companyResponseRepo = { create: jest.fn(), save: jest.fn(), count: jest.fn() };
  const activityLogRepo = { save: jest.fn() };
  const mailService = { sendCompanyResponded: jest.fn() };
  const notificationsService = { notifyCompanyResponded: jest.fn() };

  const noop = () => ({});

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(AdminUser), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Review), useValue: reviewRepo },
        { provide: getRepositoryToken(Company), useValue: companyRepo },
        { provide: getRepositoryToken(CompanyClaim), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(Report), useValue: {} },
        { provide: getRepositoryToken(ActivityLog), useValue: activityLogRepo },
        { provide: getRepositoryToken(Category), useValue: {} },
        { provide: getRepositoryToken(CompanyResponse), useValue: companyResponseRepo },
        { provide: getRepositoryToken(Notification), useValue: { create: noop, save: jest.fn() } },
        { provide: getRepositoryToken(Page), useValue: {} },
        { provide: JwtService, useValue: { sign: jest.fn() } },
        { provide: DataSource, useValue: { transaction: jest.fn() } },
        { provide: MailService, useValue: mailService },
        { provide: SearchService, useValue: { indexReview: jest.fn(), removeReview: jest.fn() } },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get(AdminService);
    // recalculateCompanyStats uses a query builder; stub it to a no-op
    jest.spyOn(service as any, 'recalculateCompanyStats').mockResolvedValue(undefined);
  });

  it('yorum yoksa NotFound fırlatır', async () => {
    reviewRepo.findOne.mockResolvedValue(null);
    await expect(
      service.respondToReview('r1', { content: 'Teşekkür ederiz' }, 'admin-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('yorum yayında değilse BadRequest fırlatır', async () => {
    reviewRepo.findOne.mockResolvedValue({ id: 'r1', status: ReviewStatus.PENDING });
    await expect(
      service.respondToReview('r1', { content: 'Teşekkür ederiz' }, 'admin-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('yayında yoruma yanıt ekler, bildirim ve e-posta gönderir', async () => {
    reviewRepo.findOne.mockResolvedValue({
      id: 'r1',
      status: ReviewStatus.PUBLISHED,
      userId: 'u1',
      companyId: 'c1',
      slug: 'harika-firma',
      title: 'Harika',
    });
    companyRepo.findOne.mockResolvedValue({ id: 'c1', name: 'ACME' });
    companyResponseRepo.create.mockImplementation((x) => x);
    companyResponseRepo.save.mockImplementation(async (x) => ({ id: 'resp-1', ...x }));
    userRepo.findOne.mockResolvedValue({ id: 'u1', email: 'u@x.com', full_name: 'Ali' });

    const result = await service.respondToReview('r1', { content: 'Teşekkür ederiz!' }, 'admin-1');

    expect(result.id).toBe('resp-1');
    expect(companyResponseRepo.save).toHaveBeenCalled();
    expect(notificationsService.notifyCompanyResponded).toHaveBeenCalledWith('u1', {
      reviewId: 'r1',
      reviewSlug: 'harika-firma',
      companyName: 'ACME',
    });
    expect(mailService.sendCompanyResponded).toHaveBeenCalledWith('u@x.com', 'Ali', 'ACME', 'harika-firma');
    expect(activityLogRepo.save).toHaveBeenCalled();
  });

  it('responderName verilmezse firma adını kullanır', async () => {
    reviewRepo.findOne.mockResolvedValue({
      id: 'r1', status: ReviewStatus.PUBLISHED, userId: 'u1', companyId: 'c1', slug: 's', title: 't',
    });
    companyRepo.findOne.mockResolvedValue({ id: 'c1', name: 'ACME' });
    companyResponseRepo.create.mockImplementation((x) => x);
    companyResponseRepo.save.mockImplementation(async (x) => ({ id: 'resp-1', ...x }));
    userRepo.findOne.mockResolvedValue(null);

    await service.respondToReview('r1', { content: 'Teşekkürler hepsi' }, 'admin-1');

    const created = companyResponseRepo.create.mock.calls[0][0];
    expect(created.responderName).toBe('ACME');
  });
});
