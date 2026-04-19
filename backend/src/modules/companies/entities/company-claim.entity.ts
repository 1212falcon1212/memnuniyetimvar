import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { Company } from './company.entity';

export enum ClaimStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('company_claims')
@Index('IDX_company_claims_company_id', ['companyId'])
@Index('IDX_company_claims_status', ['status'])
export class CompanyClaim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'claimer_name', type: 'varchar', length: 100 })
  claimerName: string;

  @Column({ name: 'claimer_email', type: 'varchar', length: 255 })
  claimerEmail: string;

  @Column({ name: 'claimer_phone', type: 'varchar', length: 20 })
  claimerPhone: string;

  @Column({
    name: 'document_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  documentUrl: string | null;

  @Column({
    type: 'enum',
    enum: ClaimStatus,
    default: ClaimStatus.PENDING,
  })
  status: ClaimStatus;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Company, (company) => company.claims, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
