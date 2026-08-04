import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRoleEnum } from '../../../common/enums/index.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** pgcrypto pgp_sym_encrypt output — never store or log the plaintext NIK */
  @Column({ type: 'bytea', name: 'nik_encrypted' })
  nikEncrypted: Buffer;

  /** SHA-256 hash of the plaintext NIK — used for lookups and uniqueness checks */
  @Column({ type: 'varchar', length: 64, unique: true, name: 'nik_hash' })
  nikHash: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /** bcrypt / argon2 hash — never returned in any response DTO */
  @Column({ type: 'varchar', length: 255, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 150, name: 'full_name' })
  fullName: string;

  @Column({ type: 'varchar', length: 20, nullable: true, name: 'phone_number' })
  phoneNumber: string | null;

  @Column({
    type: 'enum',
    enum: UserRoleEnum,
    enumName: 'user_role_enum',
    default: UserRoleEnum.USER,
  })
  role: UserRoleEnum;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  /** Soft delete — TypeORM automatically filters WHERE deleted_at IS NULL */
  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
