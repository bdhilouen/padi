import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { UserSession } from './user-session.entity.js';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** Nullable — token may not be tied to a tracked session */
  @Column({ type: 'uuid', nullable: true, name: 'user_session_id' })
  userSessionId: string | null;

  @ManyToOne(() => UserSession, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_session_id' })
  userSession: UserSession | null;

  /** SHA-256 hash of the raw token — never store or return the original token */
  @Column({ type: 'varchar', length: 255, unique: true, name: 'token_hash' })
  tokenHash: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  /** Set when revoked — always check revoked_at IS NULL before accepting a token */
  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revokedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
