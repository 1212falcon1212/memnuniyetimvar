import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
} from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';
import { Tag } from './tag.entity';

@Entity('review_tags')
export class ReviewTag {
  @PrimaryColumn({ name: 'review_id', type: 'uuid' })
  reviewId: string;

  @PrimaryColumn({ name: 'tag_id', type: 'int' })
  tagId: number;

  // -- Relations --------------------------------------------------------

  @ManyToOne(() => Review, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @ManyToOne(() => Tag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Tag;
}
