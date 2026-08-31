import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { getQueueToken } from '@nestjs/bull';
import { ReviewsService } from './reviews.service';
import { SearchService } from '../search/search.service';
import { Review, ReviewStatus } from './entities/review.entity';
import { ReviewImage } from './entities/review-image.entity';
import { ReviewHelpful } from './entities/review-helpful.entity';
import { CompanyResponse } from './entities/company-response.entity';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Report } from '../reports/entities/report.entity';
import { ReviewInvitation } from '../advertising/entities/review-invitation.entity';
import Redis from 'ioredis';

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedis);
});

describe('ReviewsService - Faz 2 Spam/Rate Kontrolleri', () => {
  let service: ReviewsService;

  const mockReviewRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findBy: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockImageRepo = { save: jest.fn() };
  const mockHelpfulRepo = { findOne: jest.fn(), save: jest.fn(), remove: jest.fn() };
  const mockCompanyResponseRepo = { count: jest.fn() };
  const mockCompanyRepo = { findOne: jest.fn(), update: jest.fn() };
  const mockUserRepo = { findOne: jest.fn(), increment: jest.fn(), decrement: jest.fn() };
  const mockTagRepo = { findBy: jest.fn(), createQueryBuilder: jest.fn() };
  const mockReportRepo = { create: jest.fn(), save: jest.fn() };
  const mockInvitationRepo = { findOne: jest.fn(), save: jest.fn() };
  const mockDataSource = { transaction: jest.fn() };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const map: Record<string, any> = { 'redis.host': 'localhost', 'redis.port': 6379 };
      return map[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(ReviewImage), useValue: mockImageRepo },
        { provide: getRepositoryToken(ReviewHelpful), useValue: mockHelpfulRepo },
        { provide: getRepositoryToken(CompanyResponse), useValue: mockCompanyResponseRepo },
        { provide: getRepositoryToken(Company), useValue: mockCompanyRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Tag), useValue: mockTagRepo },
        { provide: getRepositoryToken(Report), useValue: mockReportRepo },
        { provide: getRepositoryToken(ReviewInvitation), useValue: mockInvitationRepo },
        { provide: DataSource, useValue: mockDataSource },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: getQueueToken('moderation'), useValue: { add: jest.fn().mockResolvedValue(undefined) } },
        { provide: SearchService, useValue: { indexReview: jest.fn(), updateReview: jest.fn(), removeReview: jest.fn() } },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  describe('ensureContentIsNotSpam', () => {
    it('yasakli kelime iceren yorum reddedilmeli', () => {
      expect(() => service['ensureContentIsNotSpam']('Harika bahis sitesi', 'içerik')).toThrow(BadRequestException);
    });

    it('casino kelimesi spam tespit etmeli', () => {
      expect(() => service['ensureContentIsNotSpam']('Casino deneyimi', 'içerik')).toThrow(BadRequestException);
    });

    it('fazla link iceren yorum spam tespit etmeli', () => {
      const content = 'Linkler: https://a.com https://b.com https://c.com';
      expect(() => service['ensureContentIsNotSpam']('Başlık', content)).toThrow(BadRequestException);
    });

    it('temiz yorum gecmeli', () => {
      expect(() => service['ensureContentIsNotSpam']('Harika firma', 'Çok memnun kaldım')).not.toThrow();
    });

    it('1-2 link olan yorum gecmeli', () => {
      const content = 'Detay: https://example.com ve https://test.com';
      expect(() => service['ensureContentIsNotSpam']('Başlık', content)).not.toThrow();
    });

    it('telegram kelimesi spam tespit etmeli', () => {
      expect(() => service['ensureContentIsNotSpam']('Telegram grubu', 'katılın')).toThrow(BadRequestException);
    });
  });

  describe('validateInvitation (Faz 8 - doğrulanmış müşteri)', () => {
    const { InvitationStatus } = jest.requireActual('../advertising/entities/review-invitation.entity');

    it('davet bulunamazsa hata fırlatır', async () => {
      mockInvitationRepo.findOne.mockResolvedValue(null);
      await expect(service['validateInvitation']('tok', 'c1')).rejects.toThrow(BadRequestException);
    });

    it('firma uyuşmazsa hata fırlatır', async () => {
      mockInvitationRepo.findOne.mockResolvedValue({ token: 'tok', companyId: 'other', status: InvitationStatus.PENDING, expiresAt: new Date(Date.now() + 1e6) });
      await expect(service['validateInvitation']('tok', 'c1')).rejects.toThrow(BadRequestException);
    });

    it('süresi geçen daveti EXPIRED işaretler ve reddeder', async () => {
      const inv = { token: 'tok', companyId: 'c1', status: InvitationStatus.PENDING, expiresAt: new Date(Date.now() - 1000) };
      mockInvitationRepo.findOne.mockResolvedValue(inv);
      mockInvitationRepo.save.mockImplementation(async (x: any) => x);
      await expect(service['validateInvitation']('tok', 'c1')).rejects.toThrow(BadRequestException);
      expect(inv.status).toBe(InvitationStatus.EXPIRED);
    });

    it('geçerli daveti döner', async () => {
      const inv = { token: 'tok', companyId: 'c1', status: InvitationStatus.PENDING, expiresAt: new Date(Date.now() + 1e6) };
      mockInvitationRepo.findOne.mockResolvedValue(inv);
      await expect(service['validateInvitation']('tok', 'c1')).resolves.toBe(inv);
    });
  });

  describe('ensureReviewRateLimit', () => {
    it('ilk yorum icin rate limit gecmeli', async () => {
      mockRedis.incr.mockResolvedValue(1);

      await expect(service['ensureReviewRateLimit']('user-1')).resolves.toBeUndefined();
      expect(mockRedis.expire).toHaveBeenCalledWith('rate_limit:review_create:user-1', 3600);
    });

    it('5. yorum icin rate limit gecmeli', async () => {
      mockRedis.incr.mockResolvedValue(5);

      await expect(service['ensureReviewRateLimit']('user-1')).resolves.toBeUndefined();
    });

    it('6. yorum icin 429 hatasi donmeli', async () => {
      mockRedis.incr.mockResolvedValue(6);

      await expect(service['ensureReviewRateLimit']('user-1')).rejects.toThrow(
        new HttpException({
          code: 'REVIEW_RATE_LIMITED',
          message: 'Bir saat içinde en fazla 5 yorum gönderebilirsiniz',
        }, HttpStatus.TOO_MANY_REQUESTS),
      );
    });
  });
});
