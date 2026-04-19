import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Review } from './review.entity';

@Entity('review_helpfuls')
@Unique('UQ_review_helpfuls_review_user', ['reviewId', 'userId'])
export class ReviewHelpful {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'review_id', type: 'uuid' })
  reviewId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // -- Relations --------------------------------------------------------

  @ManyToOne(() => Review, (review) => review.helpfuls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @ManyToOne('User', 'reviewHelpfuls', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: import('../../users/entities/user.entity').User;
}
