import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MailService } from './mail.service';
import { MAIL_QUEUE, MailJob, SendMailPayload } from './mail-jobs';

@Processor(MAIL_QUEUE)
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process(MailJob.SEND)
  async handleSend(job: Job<SendMailPayload>): Promise<void> {
    await this.mailService.deliver(job.data);
  }

  @OnQueueFailed()
  onFailed(job: Job<SendMailPayload>, error: Error): void {
    this.logger.error(
      `Mail isi basarisiz (jobId=${job.id}, deneme=${job.attemptsMade}): ${job.data?.to}`,
      error?.stack,
    );
  }
}
