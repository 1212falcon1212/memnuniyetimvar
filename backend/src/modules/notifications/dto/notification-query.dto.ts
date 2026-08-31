import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBooleanString, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class NotificationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ description: 'Sadece okunmamış bildirimleri getir', enum: ['true', 'false'] })
  @IsOptional()
  @IsBooleanString()
  @Transform(({ value }) => (value === undefined ? undefined : value))
  unreadOnly?: string;

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

  get onlyUnread(): boolean {
    return this.unreadOnly === 'true';
  }
}
