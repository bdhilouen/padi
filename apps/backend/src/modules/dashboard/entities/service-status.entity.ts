import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ServiceNameEnum, StatusEnum } from '../../../common/enums/index.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('service_status')
@Unique(['userId', 'serviceName'])
export class ServiceStatus {
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

  /**
   * Stored because it originates from external sync results — unlike
   * deadlines.status, which is calculated via the deadlines_with_status VIEW.
   */
  @Column({
    type: 'enum',
    enum: StatusEnum,
    enumName: 'status_enum',
    default: StatusEnum.ACTIVE,
  })
  status: StatusEnum;

  /**
   * Raw JSON payload from the mock external service.
   * Never expose this field directly in response DTOs — prune at the serializer level.
   */
  @Column({ type: 'jsonb', nullable: true, name: 'raw_data' })
  rawData: Record<string, unknown> | null;

  @Column({
    type: 'timestamptz',
    name: 'last_synced_at',
    default: () => 'now()',
  })
  lastSyncedAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
