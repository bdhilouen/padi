import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import {
  ConsentStatusEnum,
  ServiceNameEnum,
} from '../../../common/enums/index.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('consent_records')
@Unique(['userId', 'serviceName'])
export class ConsentRecord {
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

  @Column({
    type: 'enum',
    enum: ConsentStatusEnum,
    enumName: 'consent_status_enum',
    default: ConsentStatusEnum.PENDING,
  })
  status: ConsentStatusEnum;

  @Column({ type: 'timestamptz', nullable: true, name: 'granted_at' })
  grantedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'revoked_at' })
  revokedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
