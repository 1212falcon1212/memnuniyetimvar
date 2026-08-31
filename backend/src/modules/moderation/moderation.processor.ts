import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { ModerationService } from './moderation.service';

@Processor('moderation')
export class ModerationProcessor {
  private readonly logger = new Logger(ModerationProcessor.name);

  constructor(private readonly moderationService: ModerationService) {}

  @Process('check-review')
  async handleReviewCheck(job: Job<{ reviewId: string }>) {
    this.logger.log(`Yorum moderasyon kontrolu basliyor: ${job.data.reviewId}`);

    try {
      await this.moderationService.markReviewIfNeeded(job.data.reviewId);
    } catch (error) {
      this.logger.error(
        `Moderasyon kontrolu basarisiz: ${job.data.reviewId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
