import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      secure: this.configService.get<boolean>('mail.secure'),
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.password'),
      },
    });
  }

  private get fromAddress(): string {
    return this.configService.get<string>('mail.from', 'noreply@memnuniyetimvar.com');
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
      });
      this.logger.log(`Email gonderildi: ${to}`);
    } catch (error) {
      this.logger.error(`Email gonderilemedi: ${to}`, error);
      throw error;
    }
  }

  async sendEmailVerification(to: string, fullName: string, code: string): Promise<void> {
    const subject = 'MemnuniyetimVar - Email Doğrulama';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #166534;">MemnuniyetimVar</h2>
        <p>Merhaba ${fullName},</p>
        <p>Email adresinizi doğrulamak için aşağıdaki kodu kullanın:</p>
        <div style="background: #f0fdf4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #166534; letter-spacing: 4px;">${code}</span>
        </div>
        <p>Bu kod 15 dakika içinde geçerliliğini yitirecektir.</p>
        <p>Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">MemnuniyetimVar - Türkiye'nin Pozitif Müşteri Deneyimi Platformu</p>
      </div>
    `;
    await this.sendMail(to, subject, html);
  }

  async sendPasswordReset(to: string, fullName: string, resetToken: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const resetLink = `${frontendUrl}/sifre-sifirla?token=${resetToken}`;
    const subject = 'MemnuniyetimVar - Şifre Sıfırlama';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #166534;">MemnuniyetimVar</h2>
        <p>Merhaba ${fullName},</p>
        <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetLink}" style="background: #166534; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
            Şifremi Sıfırla
          </a>
        </div>
        <p>Bu bağlantı 1 saat içinde geçerliliğini yitirecektir.</p>
        <p>Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">MemnuniyetimVar - Türkiye'nin Pozitif Müşteri Deneyimi Platformu</p>
      </div>
    `;
    await this.sendMail(to, subject, html);
  }

  async sendReviewPublished(to: string, fullName: string, reviewTitle: string, reviewSlug: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const reviewLink = `${frontendUrl}/memnuniyet/${reviewSlug}`;
    const subject = 'MemnuniyetimVar - Yorumunuz Yayınlandı!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #166534;">MemnuniyetimVar</h2>
        <p>Merhaba ${fullName},</p>
        <p>"<strong>${reviewTitle}</strong>" başlıklı yorumunuz onaylandı ve yayınlandı!</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${reviewLink}" style="background: #166534; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
            Yorumumu Görüntüle
          </a>
        </div>
        <p>Memnuniyetinizi paylaştığınız için teşekkür ederiz!</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">MemnuniyetimVar - Türkiye'nin Pozitif Müşteri Deneyimi Platformu</p>
      </div>
    `;
    await this.sendMail(to, subject, html);
  }

  async sendWelcome(to: string, fullName: string): Promise<void> {
    const subject = 'MemnuniyetimVar\'a Hoş Geldiniz!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #166534;">MemnuniyetimVar'a Hoş Geldiniz!</h2>
        <p>Merhaba ${fullName},</p>
        <p>MemnuniyetimVar ailesine katıldığınız için teşekkür ederiz!</p>
        <p>Artık firmalar hakkındaki memnuniyetlerinizi paylaşabilir, diğer kullanıcıların deneyimlerini okuyabilirsiniz.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">MemnuniyetimVar - Türkiye'nin Pozitif Müşteri Deneyimi Platformu</p>
      </div>
    `;
    await this.sendMail(to, subject, html);
  }
}
