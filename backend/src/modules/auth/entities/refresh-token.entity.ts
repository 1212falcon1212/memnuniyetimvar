import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('IDX_REFRESH_TOKENS_USER_ID')
  @Column({ type: 'uuid' })
  user_id: string;

  @Index('IDX_REFRESH_TOKENS_TOKEN')
  @Column({ type: 'varchar', length: 500 })
  token: string;

  /** Token son kullanim tarihi */
  @Column({ type: 'timestamp' })
  expires_at: Date;

  /** Cihaz bilgisi (opsiyonel, ornegin: "Chrome/Windows") */
  @Column({ type: 'varchar', length: 255, nullable: true })
  device_info: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  // ---- Relations ----

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
