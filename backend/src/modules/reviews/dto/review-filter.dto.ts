import { IsOptional, IsInt, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto';

export class ReviewFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Puana gore filtrele (1-5)', minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Siralama kriteri',
    enum: ['latest', 'helpful', 'rating'],
    default: 'latest',
  })
  @IsOptional()
  @IsIn(['latest', 'helpful', 'rating'])
  sortBy?: 'latest' | 'helpful' | 'rating';
}
