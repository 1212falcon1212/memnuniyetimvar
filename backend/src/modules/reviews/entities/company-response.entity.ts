import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Review } from './review.entity';

export enum ResponseStatus {
  PUBLISHED = 'published',
  HIDDEN = 'hidden',
}

@Entity('company_responses')
@Index('IDX_company_responses_review_id', ['reviewId'])
@Index('IDX_company_responses_company_id', ['companyId'])
export class CompanyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'review_id', type: 'uuid' })
  reviewId: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'responder_name', type: 'varchar', length: 100, nullable: true })
  responderName: string | null;

  @Column({
    type: 'enum',
    enum: ResponseStatus,
    default: ResponseStatus.PUBLISHED,
  })
  status: ResponseStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // -- Relations --------------------------------------------------------

  @ManyToOne(() => Review, (review) => review.companyResponses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @ManyToOne('Company', 'companyResponses', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: import('../../companies/entities/company.entity').Company;
}
