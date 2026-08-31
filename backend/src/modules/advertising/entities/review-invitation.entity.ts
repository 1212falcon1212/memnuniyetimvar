import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../../companies/entities/company.entity';

/**
 * Doğrulanmış müşteri yorumu daveti durumu.
 * Firma, gerçek müşterisine tekil token içeren davet linki gönderir.
 * Yorum bu token ile yazılırsa "Firma davetiyle yazıldı" olarak işaretlenir.
 */
export enum InvitationStatus {
  PENDING = 'pending',
  USED = 'used',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Entity('review_invitations')
@Index('IDX_review_invitations_token', ['token'], { unique: true })
@Index('IDX_review_invitations_company_id', ['companyId'])
@Index('IDX_review_invitations_status', ['status'])
export class ReviewInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  token: string;

  @Column({ name: 'campaign_name', type: 'varchar', length: 150, nullable: true })
  campaignName: string | null;

  @Column({ name: 'recipient_email', type: 'varchar', length: 255, nullable: true })
  recipientEmail: string | null;

  @Column({ name: 'recipient_phone', type: 'varchar', length: 20, nullable: true })
  recipientPhone: string | null;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    enumName: 'invitation_status_enum',
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'used_review_id', type: 'uuid', nullable: true })
  usedReviewId: string | null;

  @Column({ name: 'used_at', type: 'timestamp', nullable: true })
  usedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
