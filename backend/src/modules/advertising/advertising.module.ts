import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AdvertisingController } from './advertising.controller';
import { AdminAdvertisingController } from './admin-advertising.controller';
import { AdvertisingService } from './advertising.service';
import { InvitationsService } from './invitations.service';

import { AdPackage } from './entities/ad-package.entity';
import { AdRequest } from './entities/ad-request.entity';
import { ReviewInvitation } from './entities/review-invitation.entity';
import { Company } from '../companies/entities/company.entity';
import { AdminUser } from '../users/entities/admin-user.entity';

import { AdminAuthGuard } from '../admin/guards/admin-auth.guard';
import { AdminRolesGuard } from '../admin/guards/admin-roles.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdPackage, AdRequest, ReviewInvitation, Company, AdminUser]),
    NotificationsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ADMIN_JWT_SECRET') || config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [AdvertisingController, AdminAdvertisingController],
  providers: [AdvertisingService, InvitationsService, AdminAuthGuard, AdminRolesGuard],
  exports: [AdvertisingService, InvitationsService],
})
export class AdvertisingModule {}
