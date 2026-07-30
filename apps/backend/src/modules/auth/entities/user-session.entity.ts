import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'device_name' })
  deviceName: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string | null;

  /** PostgreSQL inet type — stored as string in TypeScript */
  @Column({ type: 'inet', nullable: true, name: 'ip_address' })
  ipAddress: string | null;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'timestamptz', name: 'login_at', default: () => 'now()' })
  loginAt: Date;

  @Column({
    type: 'timestamptz',
    name: 'last_activity_at',
    default: () => 'now()',
  })
  lastActivityAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'logout_at' })
  logoutAt: Date | null;
}
