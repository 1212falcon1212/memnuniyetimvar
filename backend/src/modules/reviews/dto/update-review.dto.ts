import { PartialType, PickType } from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto';

export class UpdateReviewDto extends PartialType(
  PickType(CreateReviewDto, ['title', 'content', 'rating'] as const),
) {}
