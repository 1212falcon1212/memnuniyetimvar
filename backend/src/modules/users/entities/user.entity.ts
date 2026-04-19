import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

/** Kullanici rolleri */
export enum UserRole {
  USER = 'user',
  MOD = 'mod',
}

/** Kullanici durumlari */
export enum UserStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
  DELETED = 'deleted',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  full_name: string;

  @Index('IDX_USERS_EMAIL', { unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Index('IDX_USERS_PHONE', { unique: true })
  @Column({ type: 'varchar', length: 20, unique: true })
  phone: string;

  /** Bcrypt ile hashlenmi sifre */
  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url: string | null;

  @Column({ type: 'boolean', default: false })
  is_phone_verified: boolean;

  @Column({ type: 'boolean', default: false })
  is_email_verified: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Index('IDX_USERS_STATUS')
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  /** Toplam yorum sayisi - denormalize alan, performans icin */
  @Column({ type: 'int', default: 0 })
  review_count: number;

  /** Toplam faydali oy sayisi - denormalize alan, performans icin */
  @Column({ type: 'int', default: 0 })
  helpful_count: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  // ---- Relations ----
  // Iliskiler ilgili entity'ler olusturulunca aktif edilecek.
  // Asagidaki importlar entity dosyalari hazir oldugunda eklenmelidir.

  // @OneToMany(() => Review, (review) => review.user)
  // reviews: Review[];

  // @OneToMany(() => ReviewHelpful, (helpful) => helpful.user)
  // review_helpfuls: ReviewHelpful[];

  // @OneToMany(() => Notification, (notification) => notification.user)
  // notifications: Notification[];

  // @OneToMany(() => Report, (report) => report.user)
  // reports: Report[];

  // @OneToMany(() => RefreshToken, (token) => token.user)
  // refresh_tokens: RefreshToken[];
}
