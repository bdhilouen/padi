import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('user_documents')
export class UserDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** e.g. 'KTP', 'KK', 'NPWP', 'SIM' */
  @Column({ type: 'varchar', length: 50, name: 'document_type' })
  documentType: string;

  @Column({ type: 'varchar', length: 255, name: 'original_filename' })
  originalFilename: string;

  /**
   * Validated from file content (magic bytes), not from the client-supplied
   * Content-Type header. Whitelist: application/pdf, image/jpeg, image/png.
   */
  @Column({ type: 'varchar', length: 100, name: 'mime_type' })
  mimeType: string;

  /** Stored in bytes — the frontend formats this into a human-readable size */
  @Column({ type: 'bigint', name: 'file_size' })
  fileSize: string;

  /**
   * pgcrypto-encrypted storage URL.
   * NEVER return this field in a response DTO — return a temporary signed URL instead.
   */
  @Column({ type: 'text', name: 'encrypted_url' })
  encryptedUrl: string;

  @Column({ type: 'varchar', length: 255, name: 'storage_key' })
  storageKey: string;

  /** PostgreSQL DATE — returned as 'YYYY-MM-DD' string by the pg driver */
  @Column({ type: 'date', nullable: true, name: 'expiry_date' })
  expiryDate: string | null;

  @Column({ type: 'timestamptz', name: 'uploaded_at', default: () => 'now()' })
  uploadedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_verified_at' })
  lastVerifiedAt: Date | null;
}
