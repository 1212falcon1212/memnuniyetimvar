import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './notification-types';
import { NotificationQueryDto } from './dto';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: mockRepo },
      ],
    }).compile();
    service = module.get(NotificationsService);
  });

  describe('create', () => {
    it('bildirim oluşturur ve kaydeder', async () => {
      const built = { id: 'n1' };
      mockRepo.create.mockReturnValue(built);
      mockRepo.save.mockResolvedValue(built);

      const result = await service.create({
        userId: 'u1',
        type: NotificationType.REVIEW_PUBLISHED,
        title: 'T',
        message: 'M',
        data: { reviewId: 'r1' },
      });

      expect(mockRepo.create).toHaveBeenCalledWith({
        user_id: 'u1',
        type: NotificationType.REVIEW_PUBLISHED,
        title: 'T',
        message: 'M',
        data: { reviewId: 'r1' },
      });
      expect(result).toBe(built);
    });

    it('hata olursa null döner, fırlatmaz', async () => {
      mockRepo.create.mockReturnValue({});
      mockRepo.save.mockRejectedValue(new Error('db down'));

      const result = await service.create({
        userId: 'u1',
        type: NotificationType.REVIEW_PUBLISHED,
        title: 'T',
        message: 'M',
      });

      expect(result).toBeNull();
    });

    it('manager verildiğinde transaction repository kullanır', async () => {
      const managerRepo = { create: jest.fn().mockReturnValue({}), save: jest.fn().mockResolvedValue({}) };
      const manager = { getRepository: jest.fn().mockReturnValue(managerRepo) } as any;

      await service.create({ userId: 'u1', type: 'x', title: 'T', message: 'M' }, manager);

      expect(manager.getRepository).toHaveBeenCalledWith(Notification);
      expect(managerRepo.save).toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('typed helpers', () => {
    beforeEach(() => {
      mockRepo.create.mockImplementation((x) => x);
      mockRepo.save.mockImplementation(async (x) => x);
    });

    it('notifyCompanyResponded doğru tip ve veriyi üretir', async () => {
      await service.notifyCompanyResponded('u1', {
        reviewId: 'r1',
        reviewSlug: 'harika-firma',
        companyName: 'ACME',
      });

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'u1',
          type: NotificationType.COMPANY_RESPONDED,
          data: { reviewId: 'r1', reviewSlug: 'harika-firma', companyName: 'ACME' },
        }),
      );
    });

    it('notifyReviewRejected reason boşsa varsayılan mesaj kullanır', async () => {
      await service.notifyReviewRejected('u1', 'r1', '');
      const arg = mockRepo.create.mock.calls[0][0];
      expect(arg.type).toBe(NotificationType.REVIEW_REJECTED);
      expect(arg.message).toContain('moderasyon');
    });
  });

  describe('list', () => {
    it('onlyUnread=false ise tüm bildirimleri getirir', async () => {
      mockRepo.findAndCount.mockResolvedValue([[{ id: 'n1' }], 1]);
      const query = Object.assign(new NotificationQueryDto(), { page: 1, limit: 20 });

      const result = await service.list('u1', query);

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: 'u1' } }),
      );
      expect(result.meta.total).toBe(1);
    });

    it('unreadOnly=true ise sadece okunmamışları getirir', async () => {
      mockRepo.findAndCount.mockResolvedValue([[], 0]);
      const query = Object.assign(new NotificationQueryDto(), { page: 1, limit: 20, unreadOnly: 'true' });

      await service.list('u1', query);

      expect(mockRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: 'u1', is_read: false } }),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('okunmamış sayısını döner', async () => {
      mockRepo.count.mockResolvedValue(3);
      const result = await service.getUnreadCount('u1');
      expect(result).toEqual({ unread: 3 });
      expect(mockRepo.count).toHaveBeenCalledWith({ where: { user_id: 'u1', is_read: false } });
    });
  });

  describe('markAsRead', () => {
    it('bildirim yoksa 404 fırlatır', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.markAsRead('u1', 'n1')).rejects.toThrow(NotFoundException);
    });

    it('bildirimi okundu işaretler', async () => {
      const n = { id: 'n1', is_read: false };
      mockRepo.findOne.mockResolvedValue(n);
      mockRepo.save.mockImplementation(async (x) => x);

      const result = await service.markAsRead('u1', 'n1');
      expect(result.is_read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('tüm okunmamışları okundu işaretler ve sayıyı döner', async () => {
      mockRepo.update.mockResolvedValue({ affected: 5 });
      const result = await service.markAllAsRead('u1');
      expect(mockRepo.update).toHaveBeenCalledWith(
        { user_id: 'u1', is_read: false },
        { is_read: true },
      );
      expect(result).toEqual({ updated: 5 });
    });
  });
});
