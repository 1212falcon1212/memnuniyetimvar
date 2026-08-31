import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../../common/dto';
import { Notification } from '../notifications/entities/notification.entity';
import { Review } from '../reviews/entities/review.entity';
import { User } from './entities/user.entity';
import { UpdateAvatarDto, UpdateProfileDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async getMe(userId: string) {
    const user = await this.findUser(userId);
    return this.sanitizeUser(user);
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.findUser(userId);

    if (dto.email && dto.email !== user.email) {
      await this.ensureUnique('email', dto.email);
      user.email = dto.email;
      user.is_email_verified = false;
    }

    if (dto.phone && dto.phone !== user.phone) {
      await this.ensureUnique('phone', dto.phone);
      user.phone = dto.phone;
      user.is_phone_verified = false;
    }

    if (dto.fullName) {
      user.full_name = dto.fullName;
    }

    return this.sanitizeUser(await this.userRepository.save(user));
  }

  async updateAvatar(userId: string, dto: UpdateAvatarDto) {
    const user = await this.findUser(userId);
    user.avatar_url = dto.avatarUrl;
    return this.sanitizeUser(await this.userRepository.save(user));
  }

  async getMyReviews(userId: string, pagination: PaginationDto) {
    const [data, total] = await this.reviewRepository.findAndCount({
      where: { userId },
      relations: ['company', 'images', 'tags'],
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return this.paginated(data, total, pagination);
  }

  async getMyNotifications(userId: string, pagination: PaginationDto) {
    const [data, total] = await this.notificationRepository.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return this.paginated(data, total, pagination);
  }

  async markNotificationRead(userId: string, notificationId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Bildirim bulunamadi',
      });
    }

    notification.is_read = true;
    return this.notificationRepository.save(notification);
  }

  private async findUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'Kullanici bulunamadi' });
    }
    return user;
  }

  private async ensureUnique(field: 'email' | 'phone', value: string) {
    const existing = await this.userRepository.findOne({ where: { [field]: value } });
    if (existing) {
      throw new ConflictException({
        code: field === 'email' ? 'EMAIL_EXISTS' : 'PHONE_EXISTS',
        message: field === 'email'
          ? 'Bu e-posta adresi zaten kayitli'
          : 'Bu telefon numarasi zaten kayitli',
      });
    }
  }

  private paginated<T>(data: T[], total: number, pagination: PaginationDto) {
    return {
      data,
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit),
      },
    };
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatar_url,
      isPhoneVerified: user.is_phone_verified,
      isEmailVerified: user.is_email_verified,
      role: user.role,
      reviewCount: user.review_count,
      helpfulCount: user.helpful_count,
    };
  }
}
