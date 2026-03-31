import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto';

export class CompanyFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Sehir filtresi' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Kategori ID filtresi' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Arama sorgusu' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Siralama alani',
    enum: ['rating', 'reviews', 'name', 'created_at'],
  })
  @IsOptional()
  @IsIn(['rating', 'reviews', 'name', 'created_at'])
  sortBy?: 'rating' | 'reviews' | 'name' | 'created_at';
}
