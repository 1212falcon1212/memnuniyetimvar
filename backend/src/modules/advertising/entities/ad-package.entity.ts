import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Reklam paketi türleri. Tümü açıkça "Sponsorlu" etiketiyle gösterilir.
 */
export enum AdType {
  SPONSORED_SHOWCASE = 'sponsored_showcase', // Sponsorlu firma vitrini
  FEATURED_CAMPAIGN = 'featured_campaign', // Öne çıkan kampanya
  CATEGORY_SPONSORSHIP = 'category_sponsorship', // Kategori sponsorluğu
}

@Entity('ad_packages')
export class AdPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'enum', enum: AdType, enumName: 'ad_type_enum' })
  type: AdType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ name: 'duration_days', type: 'int', default: 30 })
  durationDays: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
