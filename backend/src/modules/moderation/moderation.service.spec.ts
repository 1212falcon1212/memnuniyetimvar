import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ModerationService } from './moderation.service';
import { Review, ReviewStatus } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notifications/entities/notification.entity';
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

describe('ModerationService - Spam Score', () => {
  let service: ModerationService;

  const mockReviewRepo = {
    findOne: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
  };

  const mockNotificationRepo = {
    save: jest.fn(),
    create: jest.fn(),
  };

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
        ModerationService,
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(Notification), useValue: mockNotificationRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
  });

  describe('calculateSpamScore', () => {
    it('temiz yorum icin dusuk skor donmeli', async () => {
      mockReviewRepo.findOne.mockResolvedValue({
        id: 'r1',
        userId: 'u1',
        companyId: 'c1',
        title: 'Harika deneyim',
        content: 'Firmadan çok memnun kaldım, herkese tavsiye ederim. Harika hizmet kalitesi ve profesyonel ekip.',
        rating: 5,
      });

      mockUserRepo.findOne.mockResolvedValue({
        id: 'u1',
        is_phone_verified: true,
        is_email_verified: true,
        created_at: new Date(Date.now() - 30 * 24 * 3600000),
      });

      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockReviewRepo.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.calculateSpamScore('r1');

      expect(result.score).toBeLessThan(50);
      expect(result.flags.length).toBe(0);
    });

    it('yasakli kelime iceren yorum icin yuksek skor donmeli', async () => {
      mockReviewRepo.findOne.mockResolvedValue({
        id: 'r2',
        userId: 'u2',
        companyId: 'c1',
        title: 'Casino deneyimi',
        content: 'En iyi bahis sitesi',
        rating: 5,
      });

      mockUserRepo.findOne.mockResolvedValue({
        id: 'u2',
        is_phone_verified: false,
        is_email_verified: false,
        created_at: new Date(),
      });

      mockRedis.get.mockResolvedValue('5');
      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockReviewRepo.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.calculateSpamScore('r2');

      expect(result.score).toBeGreaterThanOrEqual(50);
      expect(result.flags).toContainEqual(expect.stringContaining('forbidden_words'));
      expect(result.flags).toContainEqual('unverified_account');
    });

    it('dogrulanmamiz yeni hesap + kisa icerik skor artirmali', async () => {
      mockReviewRepo.findOne.mockResolvedValue({
        id: 'r3',
        userId: 'u3',
        companyId: 'c1',
        title: 'İyi',
        content: 'Kısa yorum',
        rating: 5,
      });

      mockUserRepo.findOne.mockResolvedValue({
        id: 'u3',
        is_phone_verified: false,
        is_email_verified: false,
        created_at: new Date(),
      });

      mockRedis.get.mockResolvedValue('0');
      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockReviewRepo.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.calculateSpamScore('r3');

      expect(result.score).toBeGreaterThan(0);
      expect(result.flags).toContain('too_short');
      expect(result.flags).toContain('unverified_account');
      expect(result.flags).toContain('brand_new_account');
    });
  });

  describe('markReviewIfNeeded', () => {
    it('dusuk skorlu yorum degistirilmemeli', async () => {
      mockReviewRepo.findOne.mockResolvedValue({
        id: 'r1',
        userId: 'u1',
        title: 'Normal yorum',
        content: 'Normal uzunlukta bir yorum içeriği burada yer alıyor.',
      });
      mockUserRepo.findOne.mockResolvedValue({
        id: 'u1',
        is_phone_verified: true,
        is_email_verified: true,
        created_at: new Date(Date.now() - 30 * 24 * 3600000),
      });
      mockRedis.get.mockResolvedValue('1');
      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockReviewRepo.createQueryBuilder.mockReturnValue(qbMock);

      await service.markReviewIfNeeded('r1');

      expect(mockReviewRepo.update).not.toHaveBeenCalledWith(
        'r1',
        expect.objectContaining({ status: ReviewStatus.PENDING }),
      );
    });

    it('yuksek skorlu yorum pending olarak isaretlenmeli ve bildirim olusturulmali', async () => {
      mockReviewRepo.findOne.mockResolvedValue({
        id: 'r2',
        userId: 'u2',
        title: 'Casino yorumu',
        content: 'Bahis ve casino deneyimi harika',
      });
      mockUserRepo.findOne.mockResolvedValue({
        id: 'u2',
        is_phone_verified: false,
        is_email_verified: false,
        created_at: new Date(),
      });
      mockRedis.get.mockResolvedValue('5');
      const qbMock = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([]),
      };
      mockReviewRepo.createQueryBuilder.mockReturnValue(qbMock);

      mockNotificationRepo.create.mockReturnValue({});
      mockNotificationRepo.save.mockResolvedValue({});

      await service.markReviewIfNeeded('r2');

      expect(mockReviewRepo.update).toHaveBeenCalled();
      expect(mockNotificationRepo.save).toHaveBeenCalled();
    });
  });
});
