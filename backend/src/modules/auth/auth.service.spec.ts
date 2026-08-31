import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User, UserStatus } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';
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

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid'),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('$2b$12$mockhash'),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUserRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    increment: jest.fn(),
  };

  const mockRefreshTokenRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-access-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const map: Record<string, any> = {
        'JWT_SECRET': 'test-secret',
        'JWT_EXPIRES_IN': '15m',
        'redis.host': 'localhost',
        'redis.port': 6379,
      };
      return map[key];
    }),
  };

  const mockMailService = {
    sendWelcome: jest.fn(),
    sendEmailVerification: jest.fn(),
    sendPasswordReset: jest.fn(),
    sendReviewPublished: jest.fn(),
    sendMail: jest.fn(),
  };

  const mockSmsService = {
    sendVerificationCode: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
        { provide: SmsService, useValue: mockSmsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('resendPhoneVerification', () => {
    it('dogrulanmamis kullanici icin kod gondermeli', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        phone: '05551234567',
        is_phone_verified: false,
      });
      mockRedis.incr.mockResolvedValue(1);
      mockSmsService.sendVerificationCode.mockResolvedValue(undefined);

      const result = await service.resendPhoneVerification('user-1');

      expect(result.message).toBe('Doğrulama kodu tekrar gönderildi');
      expect(mockSmsService.sendVerificationCode).toHaveBeenCalledWith('05551234567', expect.any(String));
    });

    it('zaten dogrulanmis telefon icin hata donmeli', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        phone: '05551234567',
        is_phone_verified: true,
      });
      mockRedis.incr.mockResolvedValue(1);

      await expect(service.resendPhoneVerification('user-1')).rejects.toThrow(BadRequestException);
    });

    it('rate limit asildiginda 429 donmeli', async () => {
      mockRedis.incr.mockResolvedValue(4);

      await expect(service.resendPhoneVerification('user-1')).rejects.toThrow(
        new HttpException({ code: 'RATE_LIMITED', message: 'Telefon doğrulama kodu çok sık istendi' }, HttpStatus.TOO_MANY_REQUESTS),
      );
    });
  });

  describe('resendEmailVerification', () => {
    it('dogrulanmamis kullanici icin email gondermeli', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        full_name: 'Test User',
        is_email_verified: false,
      });
      mockRedis.incr.mockResolvedValue(1);
      mockMailService.sendEmailVerification.mockResolvedValue(undefined);

      const result = await service.resendEmailVerification('user-1');

      expect(result.message).toBe('E-posta doğrulama kodu tekrar gönderildi');
      expect(mockMailService.sendEmailVerification).toHaveBeenCalledWith('test@test.com', 'Test User', expect.any(String));
    });

    it('zaten dogrulanmis email icin hata donmeli', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        is_email_verified: true,
      });
      mockRedis.incr.mockResolvedValue(1);

      await expect(service.resendEmailVerification('user-1')).rejects.toThrow(BadRequestException);
    });

    it('rate limit asildiginda 429 donmeli', async () => {
      mockRedis.incr.mockResolvedValue(4);

      await expect(service.resendEmailVerification('user-1')).rejects.toThrow(
        new HttpException({ code: 'RATE_LIMITED', message: 'E-posta doğrulama kodu çok sık istendi' }, HttpStatus.TOO_MANY_REQUESTS),
      );
    });
  });

  describe('logoutAll', () => {
    it('kullanicinin tum refresh tokenlarini silmeli', async () => {
      mockRefreshTokenRepo.delete.mockResolvedValue({ affected: 3 });

      const result = await service.logoutAll('user-1');

      expect(result.message).toBe('Tüm cihazlardan çıkış yapıldı');
      expect(mockRefreshTokenRepo.delete).toHaveBeenCalledWith({ user_id: 'user-1' });
    });
  });

  describe('login - device info', () => {
    it('device info ile refresh token olusturmalu', async () => {
      mockUserRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        password_hash: '$2b$12$hash',
        status: UserStatus.ACTIVE,
      });

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      mockRefreshTokenRepo.create.mockReturnValue({ user_id: 'user-1', token: 'rt', expires_at: new Date(), device_info: 'Chrome | ip:1.2.3.4' });
      mockRefreshTokenRepo.save.mockResolvedValue({});

      const result = await service.login({ email: 'test@test.com', password: 'pass123' }, 'Chrome | ip:1.2.3.4');

      expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ device_info: 'Chrome | ip:1.2.3.4' }),
      );
    });
  });

  describe('refreshTokens - device info fallback', () => {
    it('yeni device info yoksa eski device info kullanilmali', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      mockRefreshTokenRepo.findOne.mockResolvedValue({
        id: 'rt-1',
        token: 'old-rt',
        expires_at: futureDate,
        device_info: 'Firefox | ip:5.6.7.8',
        user: { id: 'user-1', email: 'test@test.com', status: UserStatus.ACTIVE },
      });
      mockRefreshTokenRepo.delete.mockResolvedValue(undefined);
      mockRefreshTokenRepo.create.mockReturnValue({});
      mockRefreshTokenRepo.save.mockResolvedValue({});

      await service.refreshTokens('old-rt');

      expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ device_info: 'Firefox | ip:5.6.7.8' }),
      );
    });
  });
});
