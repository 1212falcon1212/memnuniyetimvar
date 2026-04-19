import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil bilgileri' })
  async getMe(@CurrentUser() user: User) {
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone,
      avatar_url: user.avatar_url,
      is_phone_verified: user.is_phone_verified,
      is_email_verified: user.is_email_verified,
      role: user.role,
      review_count: user.review_count,
      helpful_count: user.helpful_count,
    };
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil güncelle' })
  async updateMe(
    @CurrentUser() user: User,
    @Body() body: { full_name?: string },
  ) {
    if (body.full_name) user.full_name = body.full_name;
    await this.userRepository.save(user);
    return {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
    };
  }
}
