import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserStatus } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto, LoginDto, ResetPasswordDto } from './dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // E-posta veya telefon zaten kayıtlı mı?
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

    // TODO: SMS doğrulama kodu gönder
    // TODO: Email doğrulama linki gönder

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

    // Eski token'ı sil, yenisini oluştur
    await this.refreshTokenRepository.delete(tokenRecord.id);
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    // Kullanıcı bulunamazsa bile aynı mesajı dön (güvenlik)
    if (!user) {
      return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' };
    }

    // TODO: Redis'te reset token sakla ve email gönder
    return { message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    // TODO: Redis'ten token doğrula, kullanıcıyı bul
    // Şimdilik basit implementasyon
    throw new BadRequestException({
      code: 'INVALID_RESET_TOKEN',
      message: 'Geçersiz veya süresi dolmuş sıfırlama bağlantısı',
    });
  }

  async verifyPhone(userId: string, code: string) {
    // TODO: Redis'teki SMS kodunu doğrula
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException({
        code: 'USER_NOT_FOUND',
        message: 'Kullanıcı bulunamadı',
      });
    }

    user.is_phone_verified = true;
    await this.userRepository.save(user);
    return { message: 'Telefon numarası doğrulandı' };
  }

  async verifyEmail(token: string) {
    // TODO: Token doğrulama implementasyonu
    throw new BadRequestException({
      code: 'INVALID_VERIFICATION_TOKEN',
      message: 'Geçersiz doğrulama bağlantısı',
    });
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
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 gün

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
