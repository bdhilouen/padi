import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceNameEnum } from '../../../common/enums/index.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('deadlines')
export class Deadline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ServiceNameEnum,
    enumName: 'service_name_enum',
    name: 'service_name',
  })
  serviceName: ServiceNameEnum;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  /**
   * PostgreSQL DATE — TypeORM returns this as a plain string 'YYYY-MM-DD'.
   *
   * Do NOT add a `status` column here. Status (ACTIVE / WARNING / EXPIRED)
   * is calculated dynamically by the deadlines_with_status VIEW in the database.
   */
  @Column({ type: 'date', name: 'due_date' })
  dueDate: string;

  @Column({ type: 'boolean', default: false, name: 'reminder_sent_h30' })
  reminderSentH30: boolean;

  @Column({ type: 'boolean', default: false, name: 'reminder_sent_h7' })
  reminderSentH7: boolean;

  @Column({ type: 'boolean', default: false, name: 'reminder_sent_h1' })
  reminderSentH1: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
