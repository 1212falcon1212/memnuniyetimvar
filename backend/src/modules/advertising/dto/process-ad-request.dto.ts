import {
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdRequestStatus } from '../entities/ad-request.entity';

/**
 * Admin tarafı reklam talebi işleme: onay/red/yayın takvimi/bütçe.
 */
export class ProcessAdRequestDto {
  @ApiProperty({ enum: AdRequestStatus, description: 'Yeni durum' })
  @IsEnum(AdRequestStatus)
  status: AdRequestStatus;

  @ApiPropertyOptional({ description: 'Onaylanan bütçe (TL)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ description: 'Yayın başlangıç tarihi (ISO)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Yayın bitiş tarihi (ISO)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Admin notu' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNote?: string;
}
