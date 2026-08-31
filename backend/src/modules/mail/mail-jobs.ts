/**
 * Mail kuyruğu iş tanımları. Tüm e-posta gönderimleri BullMQ 'mail' kuyruğu
 * üzerinden asenkron işlenir. Şablonlar MailService içinde üretilir; kuyruğa
 * yalnızca hazır (to, subject, html) içeriği taşınır.
 */
export const MAIL_QUEUE = 'mail';

export enum MailJob {
  SEND = 'send',
}

export interface SendMailPayload {
  to: string;
  subject: string;
  html: string;
}
