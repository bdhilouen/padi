import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('life_events')
export class LifeEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Short machine-readable code, e.g. 'MENIKAH', 'PUNYA_ANAK' */
  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;
}
