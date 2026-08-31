import {
  IsUUID,
  IsOptional,
  IsString,
  MaxLength,
  IsEmail,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({ description: 'Davet edilecek firma UUID' })
  @IsUUID()
  companyId: string;

  @ApiPropertyOptional({ description: 'Kampanya adı' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  campaignName?: string;

  @ApiPropertyOptional({ description: 'Davet edilen müşteri e-postası' })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;

  @ApiPropertyOptional({ description: 'Davet edilen müşteri telefonu' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  recipientPhone?: string;

  @ApiPropertyOptional({ description: 'Davetin geçerlilik süresi (gün)', default: 30, minimum: 1, maximum: 180 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  expiresInDays?: number;
}
