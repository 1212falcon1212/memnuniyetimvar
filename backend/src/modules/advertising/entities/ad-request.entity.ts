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
import { Company } from '../../companies/entities/company.entity';
import { AdPackage, AdType } from './ad-package.entity';

/**
 * Reklam talebi yaşam döngüsü.
 * pending → approved → active → completed
 *        ↘ rejected
 * Kullanıcı her aşamada cancelled yapabilir (active öncesi).
 */
export enum AdRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('ad_requests')
@Index('IDX_ad_requests_company_id', ['companyId'])
@Index('IDX_ad_requests_status', ['status'])
@Index('IDX_ad_requests_requested_by', ['requestedByUserId'])
export class AdRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId: string;

  @Column({ name: 'package_id', type: 'int', nullable: true })
  packageId: number | null;

  @Column({ type: 'enum', enum: AdType, enumName: 'ad_type_enum' })
  type: AdType;

  @Column({
    type: 'enum',
    enum: AdRequestStatus,
    enumName: 'ad_request_status_enum',
    default: AdRequestStatus.PENDING,
  })
  status: AdRequestStatus;

  @Column({ name: 'category_id', type: 'int', nullable: true })
  categoryId: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  budget: number | null;

  @Column({ name: 'requested_start_date', type: 'timestamp', nullable: true })
  requestedStartDate: Date | null;

  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote: string | null;

  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @Column({ type: 'int', default: 0 })
  conversions: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => AdPackage, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'package_id' })
  package: AdPackage | null;
}
