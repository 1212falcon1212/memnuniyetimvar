import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  Index,
} from 'typeorm';
import { Review } from '../../reviews/entities/review.entity';

@Entity('tags')
@Index('IDX_tags_slug', ['slug'], { unique: true })
@Index('IDX_tags_name', ['name'], { unique: true })
export class Tag {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 60, unique: true })
  slug: string;

  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // -- Relations --------------------------------------------------------

  @ManyToMany(() => Review, (review) => review.tags)
  reviews: Review[];
}
