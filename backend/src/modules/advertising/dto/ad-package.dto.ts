import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  Min,
  IsInt,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdType } from '../entities/ad-package.entity';

export class CreateAdPackageDto {
  @ApiProperty({ description: 'Paket adı' })
  @IsString()
  @MaxLength(150)
  name: string;

  @ApiProperty({ enum: AdType })
  @IsEnum(AdType)
  type: AdType;

  @ApiPropertyOptional({ description: 'Açıklama' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Fiyat (TL)' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Süre (gün)', default: 30 })
  @IsInt()
  @Min(1)
  durationDays: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAdPackageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ enum: AdType })
  @IsOptional()
  @IsEnum(AdType)
  type?: AdType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  durationDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
