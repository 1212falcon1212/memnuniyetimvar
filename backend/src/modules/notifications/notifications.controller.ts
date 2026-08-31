import { Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Bildirimleri listele (opsiyonel: sadece okunmamış)' })
  @ApiResponse({ status: 200, description: 'Bildirim listesi' })
  list(@CurrentUser('id') userId: string, @Query() query: NotificationQueryDto) {
    return this.notificationsService.list(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Okunmamış bildirim sayısı' })
  @ApiResponse({ status: 200, description: 'Okunmamış bildirim sayısı' })
  unreadCount(@CurrentUser('id') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Tüm bildirimleri okundu işaretle' })
  @ApiResponse({ status: 200, description: 'Güncellenen bildirim sayısı' })
  markAllAsRead(@CurrentUser('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Bildirimi okundu işaretle' })
  @ApiParam({ name: 'id', description: 'Bildirim UUID' })
  @ApiResponse({ status: 200, description: 'Bildirim okundu işaretlendi' })
  @ApiResponse({ status: 404, description: 'Bildirim bulunamadı' })
  markAsRead(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }
}
