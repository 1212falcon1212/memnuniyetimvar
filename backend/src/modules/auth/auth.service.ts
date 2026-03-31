import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { User, UserStatus } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto, LoginDto, ResetPasswordDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { MailService } from '../mail/mail.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly redis: Redis;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {
    this.redis = new Redis({
      host: this.configService.get<string>('redis.host', 'localhost'),
      port: this.configService.get<number>('redis.port', 6379),
    });
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: [{ email: dto.email }, { phone: dto.phone }],
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException({
          code: 'EMAIL_EXISTS',
          message: 'Bu e-posta adresi zaten kayıtlı',
        });
      }
      throw new ConflictException({
        code: 'PHONE_EXISTS',
        message: 'Bu telefon numarası zaten kayıtlı',
      });
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      full_name: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      password_hash: passwordHash,
    });

    await this.userRepository.save(user);

    // SMS dogrulama kodu gonder
    await this.sendPhoneVerification(user.id, user.phone);

    // Email dogrulama kodu gonder
    await this.sendEmailVerification(user.id, user.email, user.full_name);

    // Hosgeldin emaili
    this.mailService.sendWelcome(user.email, user.full_name).catch((err) => {
      this.logger.warn(`Hosgeldin emaili gonderilemedi: ${err.message}`);
    });

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'E-posta veya şifre hatalı',
      });
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_BANNED',
        message: 'Hesabınız askıya alınmıştır',
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'E-posta veya şifre hatalı',
      });
    }

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken: string) {
    await this.refreshTokenRepository.delete({
      user_id: userId,
      token: refreshToken,
    });
    return { message: 'Çıkış yapıldı' };
  }

  async refreshTokens(oldRefreshToken: string) {
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: oldRefreshToken },
      relations: ['user'],
    });

    if (!tokenRecord || tokenRecord.expires_at < new Date()) {
      if (tokenRecord) {
        await this.refreshTokenRepository.delete(tokenRecord.id);
      }
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Geçersiz veya süresi dolmuş token',
      });
    }

    const user = tokenRecord.user;
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Hesap aktif değil',
      });
    }

    await this.refreshTokenRepository.delete(tokenRecord.id);
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' };
    }

    const resetToken = uuidv4();
    // Redis'te 1 saat gecerli
    await this.redis.set(
      `password_reset:${resetToken}`,
      user.id,
      'EX',
      3600,
    );

    await this.mailService.sendPasswordReset(user.email, user.full_name, resetToken);

    return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const userId = await this.redis.get(`password_reset:${dto.token}`);
    if (!userId) {
      throw new BadRequestException({
        code: 'INVALID_RESET_TOKEN',
        message: 'Geçersiz veya süresi dolmuş sıfırlama bağlantısı',
      });
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı',
      });
    }

    user.password_hash = await bcrypt.hash(dto.newPassword, 12);
    await this.userRepository.save(user);

    // Kullanilmis token'i sil
    await this.redis.del(`password_reset:${dto.token}`);

    // Tum refresh token'lari sil (guvenlik)
    await this.refreshTokenRepository.delete({ user_id: user.id });

    return { message: 'Şifreniz başarıyla güncellendi' };
  }

  async verifyPhone(userId: string, code: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı',
      });
    }

    const storedCode = await this.redis.get(`phone_verify:${userId}`);
    if (!storedCode || storedCode !== code) {
      throw new BadRequestException({
        code: 'INVALID_VERIFICATION_CODE',
        message: 'Geçersiz veya süresi dolmuş doğrulama kodu',
      });
    }

    user.is_phone_verified = true;
    await this.userRepository.save(user);
    await this.redis.del(`phone_verify:${userId}`);

    return { message: 'Telefon numarası doğrulandı' };
  }

  async verifyEmail(token: string) {
    const userId = await this.redis.get(`email_verify:${token}`);
    if (!userId) {
      throw new BadRequestException({
        code: 'INVALID_VERIFICATION_TOKEN',
        message: 'Geçersiz veya süresi dolmuş doğrulama bağlantısı',
      });
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı',
      });
    }

    user.is_email_verified = true;
    await this.userRepository.save(user);
    await this.redis.del(`email_verify:${token}`);

    return { message: 'E-posta adresi doğrulandı' };
  }

  async resendPhoneVerification(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı',
      });
    }

    if (user.is_phone_verified) {
      throw new BadRequestException({
        code: 'ALREADY_VERIFIED',
        message: 'Telefon numarası zaten doğrulanmış',
      });
    }

    await this.sendPhoneVerification(user.id, user.phone);
    return { message: 'Doğrulama kodu tekrar gönderildi' };
  }

  private async sendPhoneVerification(userId: string, phone: string): Promise<void> {
    const code = this.generateCode();
    // Redis'te 15 dakika gecerli
    await this.redis.set(`phone_verify:${userId}`, code, 'EX', 900);
    await this.smsService.sendVerificationCode(phone, code).catch((err) => {
      this.logger.warn(`SMS gonderilemedi: ${err.message}`);
    });
  }

  private async sendEmailVerification(userId: string, email: string, fullName: string): Promise<void> {
    const code = this.generateCode();
    // Redis'te 15 dakika gecerli (code token olarak kullaniliyor)
    await this.redis.set(`email_verify:${code}`, userId, 'EX', 900);
    await this.mailService.sendEmailVerification(email, fullName, code).catch((err) => {
      this.logger.warn(`Email dogrulama gonderilemedi: ${err.message}`);
    });
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign({ ...payload }, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '15m') as any,
    });

    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshTokenEntity = this.refreshTokenRepository.create({
      user_id: user.id,
      token: refreshToken,
      expires_at: expiresAt,
    });
    await this.refreshTokenRepository.save(refreshTokenEntity);

    return {
      accessToken,
      refreshToken,
    };
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      isPhoneVerified: user.is_phone_verified,
      isEmailVerified: user.is_email_verified,
      role: user.role,
      reviewCount: user.review_count,
      helpfulCount: user.helpful_count,
    };
  }
}
