import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { PaginationDto } from '../../common/dto';
import { UpdateAvatarDto, UpdateProfileDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mevcut kullanici bilgileri' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil bilgilerini guncelle' })
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMe(userId, dto);
  }

  @Patch('me/avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Avatar URL guncelle' })
  updateAvatar(@CurrentUser('id') userId: string, @Body() dto: UpdateAvatarDto) {
    return this.usersService.updateAvatar(userId, dto);
  }

  @Get('me/reviews')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanicinin yorumlari' })
  getMyReviews(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.usersService.getMyReviews(userId, pagination);
  }

  @Get('me/notifications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kullanicinin bildirimleri' })
  getMyNotifications(@CurrentUser('id') userId: string, @Query() pagination: PaginationDto) {
    return this.usersService.getMyNotifications(userId, pagination);
  }

  @Patch('me/notifications/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bildirimi okundu isaretle' })
  @ApiParam({ name: 'id', description: 'Bildirim UUID' })
  markNotificationRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.usersService.markNotificationRead(userId, id);
  }
}
