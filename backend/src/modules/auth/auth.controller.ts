import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  VerifyPhoneDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators';
import { CurrentUser } from '../../common/decorators';
import { User } from '../users/entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Yeni kullanıcı kaydı' })
  @ApiResponse({ status: 201, description: 'Kayıt başarılı' })
  @ApiResponse({ status: 409, description: 'E-posta veya telefon zaten kayıtlı' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.getDeviceInfo(req));
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kullanıcı girişi' })
  @ApiResponse({ status: 200, description: 'Giriş başarılı' })
  @ApiResponse({ status: 401, description: 'E-posta veya şifre hatalı' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.getDeviceInfo(req));
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Çıkış yap' })
  async logout(
    @CurrentUser('id') userId: string,
    @Body('refreshToken') refreshToken: string,
  ) {
    return this.authService.logout(userId, refreshToken);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tüm cihazlardan çıkış yap' })
  async logoutAll(@CurrentUser('id') userId: string) {
    return this.authService.logoutAll(userId);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Access token yenile' })
  @ApiResponse({ status: 200, description: 'Token yenilendi' })
  @ApiResponse({ status: 401, description: 'Geçersiz refresh token' })
  async refresh(@Body('refreshToken') refreshToken: string, @Req() req: Request) {
    return this.authService.refreshTokens(refreshToken, this.getDeviceInfo(req));
  }

  @Post('verify-phone')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Telefon numarası doğrulama' })
  async verifyPhone(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyPhoneDto,
  ) {
    return this.authService.verifyPhone(userId, dto.code);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'E-posta doğrulama' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-phone-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Telefon doğrulama kodunu tekrar gönder' })
  async resendPhoneVerification(@CurrentUser('id') userId: string) {
    return this.authService.resendPhoneVerification(userId);
  }

  @Post('resend-email-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'E-posta doğrulama kodunu tekrar gönder' })
  async resendEmailVerification(@CurrentUser('id') userId: string) {
    return this.authService.resendEmailVerification(userId);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Şifre sıfırlama talebi' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Şifre sıfırlama' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  private getDeviceInfo(req: Request): string {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim() || req.ip || 'unknown';

    return `${userAgent} | ip:${ip}`.slice(0, 255);
  }
}
