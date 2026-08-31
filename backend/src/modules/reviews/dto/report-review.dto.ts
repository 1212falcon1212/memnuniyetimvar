import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportReason } from '../../reports/entities/report.entity';

export class ReportReviewDto {
  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}
