import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LifeEventSelection } from './life-event-selection.entity.js';

@Entity('checklist_items')
export class ChecklistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'selection_id' })
  selectionId: string;

  @ManyToOne(() => LifeEventSelection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'selection_id' })
  selection: LifeEventSelection;

  /** Copied from life_event_templates.document_name at selection time */
  @Column({ type: 'varchar', length: 150, name: 'document_name' })
  documentName: string;

  /** Copied from life_event_templates.display_order at selection time */
  @Column({ type: 'int', default: 0, name: 'display_order' })
  displayOrder: number;

  @Column({ type: 'boolean', default: true, name: 'is_required' })
  isRequired: boolean;

  @Column({ type: 'boolean', default: false, name: 'is_completed' })
  isCompleted: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;
}
