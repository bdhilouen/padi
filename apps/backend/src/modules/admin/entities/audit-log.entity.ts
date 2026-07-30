import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServiceNameEnum } from '../../../common/enums/index.js';
import { User } from '../../users/entities/user.entity.js';

/**
 * Append-only audit log.
 *
 * This table is protected at the database level by triggers that block
 * UPDATE and DELETE operations (see schema.sql: trg_audit_logs_no_update,
 * trg_audit_logs_no_delete). Never create any endpoint that attempts to
 * modify or delete these rows.
 */
@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Nullable — SET NULL when the referenced user is hard-deleted.
   * This preserves the audit record without dangling FK errors.
   */
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({
    type: 'enum',
    enum: ServiceNameEnum,
    enumName: 'service_name_enum',
    nullable: true,
    name: 'service_accessed',
  })
  serviceAccessed: ServiceNameEnum | null;

  /** PostgreSQL inet type — stored as string in TypeScript */
  @Column({ type: 'inet', nullable: true, name: 'ip_address' })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
