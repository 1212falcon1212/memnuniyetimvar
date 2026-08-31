import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AdminUser } from './entities/admin-user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Review } from '../reviews/entities/review.entity';
import { Notification } from '../notifications/entities/notification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, AdminUser, Review, Notification])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
