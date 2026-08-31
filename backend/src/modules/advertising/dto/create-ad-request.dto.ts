import {
  IsUUID,
  IsEnum,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  IsDateString,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdType } from '../entities/ad-package.entity';

export class CreateAdRequestDto {
  @ApiProperty({ description: 'Reklam verilecek firma UUID' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ enum: AdType, description: 'Reklam türü' })
  @IsEnum(AdType)
  type: AdType;

  @ApiPropertyOptional({ description: 'Seçilen paket ID' })
  @IsOptional()
  @IsInt()
  packageId?: number;

  @ApiPropertyOptional({ description: 'Kategori sponsorluğu için kategori ID' })
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Talep edilen bütçe (TL)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @ApiPropertyOptional({ description: 'Talep edilen başlangıç tarihi (ISO)' })
  @IsOptional()
  @IsDateString()
  requestedStartDate?: string;

  @ApiPropertyOptional({ description: 'Firma notu' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
