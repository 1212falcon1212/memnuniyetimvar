import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from './entities/review.entity';
import { ReviewImage } from './entities/review-image.entity';
import { ReviewHelpful } from './entities/review-helpful.entity';
import { CompanyResponse } from './entities/company-response.entity';
import { Company } from '../companies/entities/company.entity';
import { User } from '../users/entities/user.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Report } from '../reports/entities/report.entity';
import { ReviewInvitation } from '../advertising/entities/review-invitation.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    UploadModule,
    BullModule.registerQueue({ name: 'moderation' }),
    TypeOrmModule.forFeature([
      Review,
      ReviewImage,
      ReviewHelpful,
      CompanyResponse,
      Company,
      User,
      Tag,
      Report,
      ReviewInvitation,
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
