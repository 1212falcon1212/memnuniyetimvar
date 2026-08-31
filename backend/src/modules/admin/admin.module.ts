import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AdminController } from './admin.controller';
import { PagesController } from './pages.controller';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';

import { AdminUser } from '../users/entities/admin-user.entity';
import { User } from '../users/entities/user.entity';
import { Review } from '../reviews/entities/review.entity';
import { Company } from '../companies/entities/company.entity';
import { CompanyClaim } from '../companies/entities/company-claim.entity';
import { Report } from '../reports/entities/report.entity';
import { ActivityLog } from './entities/activity-log.entity';
import { Category } from '../categories/entities/category.entity';
import { CompanyResponse } from '../reviews/entities/company-response.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Page } from './entities/page.entity';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([
      AdminUser,
      User,
      Review,
      Company,
      CompanyClaim,
      Report,
      ActivityLog,
      Category,
      CompanyResponse,
      Notification,
      Page,
    ]),
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ADMIN_JWT_SECRET') || config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [AdminController, PagesController],
  providers: [AdminService, AdminAuthGuard, AdminRolesGuard],
  exports: [AdminService],
})
export class AdminModule {}
