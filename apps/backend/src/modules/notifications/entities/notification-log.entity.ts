import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  NotificationChannelEnum,
  NotificationTypeEnum,
} from '../../../common/enums/index.js';
import { Deadline } from '../../timeline-reminder/entities/deadline.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('notification_logs')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** Nullable — general notifications may not be tied to a specific deadline */
  @Column({ type: 'uuid', nullable: true, name: 'deadline_id' })
  deadlineId: string | null;

  @ManyToOne(() => Deadline, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'deadline_id' })
  deadline: Deadline | null;

  @Column({ type: 'varchar', length: 150 })
  title: string;

  @Column({
    type: 'enum',
    enum: NotificationTypeEnum,
    enumName: 'notification_type_enum',
  })
  type: NotificationTypeEnum;

  @Column({
    type: 'enum',
    enum: NotificationChannelEnum,
    enumName: 'notification_channel_enum',
    default: NotificationChannelEnum.IN_APP,
  })
  channel: NotificationChannelEnum;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'timestamptz', name: 'sent_at', default: () => 'now()' })
  sentAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'read_at' })
  readAt: Date | null;
}
