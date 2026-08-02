import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LifeEvent } from './life-event.entity.js';

@Entity('life_event_templates')
export class LifeEventTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'life_event_id' })
  lifeEventId: string;

  @ManyToOne(() => LifeEvent, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'life_event_id' })
  lifeEvent: LifeEvent;

  @Column({ type: 'varchar', length: 150, name: 'document_name' })
  documentName: string;

  /** Ordering hint for the UI — lower numbers appear first */
  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder: number;

  @Column({ type: 'boolean', default: true, name: 'is_required' })
  isRequired: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
