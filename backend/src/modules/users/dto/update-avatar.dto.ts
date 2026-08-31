import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({ example: 'https://cdn.example.com/avatar.jpg', maxLength: 500 })
  @IsString()
  @IsUrl()
  @MaxLength(500)
  avatarUrl: string;
}
