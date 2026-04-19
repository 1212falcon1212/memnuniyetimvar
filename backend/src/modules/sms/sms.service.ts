import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendVerificationCode(phone: string, code: string): Promise<void> {
    const message = `MemnuniyetimVar dogrulama kodunuz: ${code}`;
    await this.send(phone, message);
  }

  private async send(phone: string, message: string): Promise<void> {
    const provider = this.configService.get<string>('SMS_PROVIDER', 'netgsm');
    const apiKey = this.configService.get<string>('SMS_API_KEY', '');
    const apiSecret = this.configService.get<string>('SMS_API_SECRET', '');
    const sender = this.configService.get<string>('SMS_SENDER', 'MEMNUNIYET');

    if (!apiKey) {
      this.logger.warn(`SMS gonderilemedi (API key eksik): ${phone} -> ${message}`);
      return;
    }

    try {
      if (provider === 'netgsm') {
        await this.sendViaNetgsm(phone, message, apiKey, apiSecret, sender);
      } else {
        await this.sendViaIletiMerkezi(phone, message, apiKey, apiSecret, sender);
      }
      this.logger.log(`SMS gonderildi: ${phone}`);
    } catch (error) {
      this.logger.error(`SMS gonderilemedi: ${phone}`, error);
      throw error;
    }
  }

  private async sendViaNetgsm(
    phone: string,
    message: string,
    apiKey: string,
    apiSecret: string,
    sender: string,
  ): Promise<void> {
    const params = new URLSearchParams({
      usercode: apiKey,
      password: apiSecret,
      gsmno: phone.replace('+90', '').replace(/\s/g, ''),
      msgheader: sender,
      message,
    });

    const response = await fetch(
      `https://api.netgsm.com.tr/sms/send/get/?${params.toString()}`,
    );

    const result = await response.text();
    // Netgsm basarili cevap: 00 ile baslar
    if (!result.startsWith('00')) {
      throw new Error(`Netgsm hata: ${result}`);
    }
  }

  private async sendViaIletiMerkezi(
    phone: string,
    message: string,
    apiKey: string,
    apiSecret: string,
    sender: string,
  ): Promise<void> {
    const response = await fetch('https://api.iletimerkezi.com/v1/send-sms/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request: {
          authentication: { key: apiKey, hash: apiSecret },
          order: {
            sender,
            message: {
              text: message,
              receipts: { number: [phone.replace('+90', '90')] },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ileti Merkezi hata: ${response.status}`);
    }
  }
}
