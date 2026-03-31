import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { CompanyCategory } from './company-category.entity';
import { CompanyClaim } from './company-claim.entity';

export enum CompanyStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  HIDDEN = 'hidden',
}

@Entity('companies')
@Index('IDX_companies_slug', ['slug'], { unique: true })
@Index('IDX_companies_status', ['status'])
@Index('IDX_companies_city', ['city'])
@Index('IDX_companies_category_id', ['categoryId'])
@Index('IDX_companies_created_at', ['createdAt'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 220, unique: true })
  slug: string;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({ name: 'cover_url', type: 'varchar', length: 500, nullable: true })
  coverUrl: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  website: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  city: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  district: string | null;

  @Column({ name: 'tax_number', type: 'varchar', length: 20, nullable: true })
  taxNumber: string | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'is_claimed', type: 'boolean', default: false })
  isClaimed: boolean;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.PENDING,
  })
  status: CompanyStatus;

  @Column({
    name: 'avg_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
  })
  avgRating: number;

  @Column({ name: 'review_count', type: 'int', default: 0 })
  reviewCount: number;

  @Column({ name: 'response_count', type: 'int', default: 0 })
  responseCount: number;

  @Column({
    name: 'response_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  responseRate: number;

  @Column({
    name: 'memnuniyet_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  memnuniyetScore: number;

  @Column({ name: 'category_id', type: 'int', nullable: true })
  categoryId: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Category, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @OneToMany(() => CompanyCategory, (cc) => cc.company)
  companyCategories: CompanyCategory[];

  @OneToMany(() => CompanyClaim, (claim) => claim.company)
  claims: CompanyClaim[];
}
