import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { LifeEvent } from './life-event.entity.js';

@Entity('life_event_selections')
export class LifeEventSelection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'life_event_id' })
  lifeEventId: string;

  /** No onDelete: CASCADE — referencing the master life_events table */
  @ManyToOne(() => LifeEvent)
  @JoinColumn({ name: 'life_event_id' })
  lifeEvent: LifeEvent;

  @Column({ type: 'timestamptz', name: 'selected_at', default: () => 'now()' })
  selectedAt: Date;
}
