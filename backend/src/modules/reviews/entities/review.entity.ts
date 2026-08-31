import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { ReviewImage } from './review-image.entity';
import { ReviewHelpful } from './review-helpful.entity';
import { CompanyResponse } from './company-response.entity';
import { Tag } from '../../tags/entities/tag.entity';

export enum ReviewStatus {
  PENDING = 'pending',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

/**
 * Yorumun kaynağı. Şeffaflık için doğrulanmış müşteri davetiyle yazılan
 * yorumlar açıkça işaretlenir.
 */
export enum ReviewSource {
  ORGANIC = 'organic',
  CAMPAIGN_INVITE = 'campaign_invite',
}

@Entity('reviews')
@Index('IDX_reviews_slug', ['slug'], { unique: true })
@Index('IDX_reviews_status', ['status'])
@Index('IDX_reviews_user_id', ['userId'])
@Index('IDX_reviews_company_id', ['companyId'])
@Index('IDX_reviews_created_at', ['createdAt'])
@Index('IDX_reviews_is_featured', ['isFeatured'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.PENDING,
  })
  status: ReviewStatus;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'helpful_count', type: 'int', default: 0 })
  helpfulCount: number;

  @Column({ type: 'varchar', length: 250, unique: true })
  slug: string;

  @Column({ name: 'moderated_by', type: 'uuid', nullable: true })
  moderatedBy: string | null;

  @Column({ name: 'moderated_at', type: 'timestamp', nullable: true })
  moderatedAt: Date | null;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'spam_score', type: 'smallint', default: 0 })
  spamScore: number;

  @Column({ name: 'moderation_note', type: 'text', nullable: true })
  moderationNote: string | null;

  // ── Doğrulanmış müşteri / kampanya (Faz 8) ──
  @Column({ name: 'verified_customer', type: 'boolean', default: false })
  verifiedCustomer: boolean;

  @Column({
    type: 'enum',
    enum: ReviewSource,
    enumName: 'review_source_enum',
    default: ReviewSource.ORGANIC,
  })
  source: ReviewSource;

  @Column({ name: 'invitation_id', type: 'uuid', nullable: true })
  invitationId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // -- Relations --------------------------------------------------------

  @ManyToOne('User', 'reviews', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: import('../../users/entities/user.entity').User;

  @ManyToOne('Company', 'reviews', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: import('../../companies/entities/company.entity').Company;

  @OneToMany(() => ReviewImage, (image) => image.review, { cascade: true })
  images: ReviewImage[];

  @OneToMany(() => ReviewHelpful, (helpful) => helpful.review)
  helpfuls: ReviewHelpful[];

  @OneToMany(() => CompanyResponse, (response) => response.review)
  companyResponses: CompanyResponse[];

  @ManyToMany(() => Tag, (tag) => tag.reviews)
  @JoinTable({
    name: 'review_tags',
    joinColumn: { name: 'review_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];
}
