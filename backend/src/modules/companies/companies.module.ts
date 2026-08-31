import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company } from './entities/company.entity';
import { CompanyCategory } from './entities/company-category.entity';
import { CompanyClaim } from './entities/company-claim.entity';
import { Category } from '../categories/entities/category.entity';
import { Review } from '../reviews/entities/review.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      CompanyCategory,
      CompanyClaim,
      Category,
      Review,
      User,
    ]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
