import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './notification-types';
import { NotificationQueryDto } from './dto';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Bildirim oluşturur. Opsiyonel `manager` ile bir transaction içinde çalışabilir.
   * Bildirim başarısız olursa ana işlemi bozmamak için hata loglanır ve yutulur.
   */
  async create(
    input: CreateNotificationInput,
    manager?: EntityManager,
  ): Promise<Notification | null> {
    try {
      const repo = manager ? manager.getRepository(Notification) : this.notificationRepository;
      const notification = repo.create({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ?? {},
      });
      return await repo.save(notification);
    } catch (error) {
      this.logger.error(
        `Bildirim oluşturulamadı (user=${input.userId}, type=${input.type})`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  notifyReviewPublished(userId: string, reviewId: string, reviewTitle: string, manager?: EntityManager) {
    return this.create(
      {
        userId,
        type: NotificationType.REVIEW_PUBLISHED,
        title: 'Yorumunuz yayında',
        message: `"${reviewTitle}" başlıklı memnuniyet yorumunuz onaylandı ve yayınlandı.`,
        data: { reviewId },
      },
      manager,
    );
  }

  notifyReviewRejected(userId: string, reviewId: string, reason: string, manager?: EntityManager) {
    return this.create(
      {
        userId,
        type: NotificationType.REVIEW_REJECTED,
        title: 'Yorumunuz reddedildi',
        message: reason || 'Yorumunuz moderasyon ekibimiz tarafından reddedildi.',
        data: { reviewId, reason },
      },
      manager,
    );
  }

  notifyCompanyResponded(
    userId: string,
    params: { reviewId: string; reviewSlug: string; companyName: string },
    manager?: EntityManager,
  ) {
    return this.create(
      {
        userId,
        type: NotificationType.COMPANY_RESPONDED,
        title: 'Firma yorumunuza yanıt verdi',
        message: `${params.companyName} firması yorumunuza bir yanıt yazdı.`,
        data: { reviewId: params.reviewId, reviewSlug: params.reviewSlug, companyName: params.companyName },
      },
      manager,
    );
  }

  async list(userId: string, query: NotificationQueryDto) {
    const where = query.onlyUnread
      ? { user_id: userId, is_read: false }
      : { user_id: userId };

    const [data, total] = await this.notificationRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getUnreadCount(userId: string): Promise<{ unread: number }> {
    const unread = await this.notificationRepository.count({
      where: { user_id: userId, is_read: false },
    });
    return { unread };
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Bildirim bulunamadı',
      });
    }

    notification.is_read = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepository.update(
      { user_id: userId, is_read: false },
      { is_read: true },
    );
    return { updated: result.affected ?? 0 };
  }
}
