import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { ModerationService } from './moderation.service';
import { ModerationProcessor } from './moderation.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, User, Notification]),
    BullModule.registerQueue({
      name: 'moderation',
    }),
  ],
  providers: [ModerationService, ModerationProcessor],
  exports: [ModerationService],
})
export class ModerationModule {}
