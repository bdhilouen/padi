import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';

const BCRYPT_ROUNDS = 12;

/**
 * CryptoService — shared service for all cryptographic operations.
 *
 * Responsibilities:
 *   - Password hashing and verification (bcrypt)
 *   - NIK encryption (pgp_sym_encrypt via raw SQL) and SHA-256 hashing
 *   - SHA-256 hashing for refresh token storage
 *   - AES-256-GCM encryption/decryption for uploaded document files
 *
 * This service lives in common/ so it can be injected by any module that
 * needs it (auth, users, document-vault, etc.) without creating cross-module dependencies.
 *
 * NIK encryption key is ALWAYS read from process.env.NIK_ENCRYPTION_KEY.
 * It is never hardcoded here or anywhere else in the codebase.
 */
@Injectable()
export class CryptoService {
  // ─── Passwords ───────────────────────────────────────────────────────────

  async hashPassword(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, BCRYPT_ROUNDS);
  }

  async verifyPassword(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }

  // ─── NIK ─────────────────────────────────────────────────────────────────

  /**
   * Returns the SHA-256 hex digest of the NIK.
   * Used for the nik_hash column — uniqueness checks and lookups only.
   * Never used for identity verification (use the encrypted form for that).
   */
  hashNik(nik: string): string {
    return createHash('sha256').update(nik).digest('hex');
  }

  /**
   * Returns the SQL expression and parameters needed to call pgp_sym_encrypt.
   * The caller must embed this into a raw TypeORM query, e.g.:
   *
   *   queryRunner.query(
   *     `INSERT INTO users (nik_encrypted, ...) VALUES (pgp_sym_encrypt($1, $2), ...)`,
   *     [nik, this.getNikEncryptionKey()]
   *   )
   *
   * This keeps the key out of application memory as much as possible and
   * delegates encryption to the database extension (pgcrypto).
   */
  getNikEncryptionKey(): string {
    const key = process.env.NIK_ENCRYPTION_KEY;
    if (!key) {
      throw new Error(
        'NIK_ENCRYPTION_KEY environment variable is not set. ' +
          'Add it to .env and never hardcode it.',
      );
    }
    return key;
  }

  /**
   * Returns the SQL expression for pgp_sym_decrypt.
   * Same pattern as above — embed in a raw query.
   */
  buildDecryptExpression(): string {
    return `pgp_sym_decrypt(nik_encrypted, $1)`;
  }

  // ─── Refresh Tokens ───────────────────────────────────────────────────────

  /** Generates a cryptographically random 64-byte hex token string. */
  generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  /** SHA-256 hash of a raw token for storage in refresh_tokens.token_hash. */
  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Returns the document encryption key from DOCUMENT_ENCRYPTION_KEY (or falls back
   * to NIK_ENCRYPTION_KEY if DOCUMENT_ENCRYPTION_KEY is not set).
   */
  getDocumentEncryptionKey(): string {
    const key =
      process.env.DOCUMENT_ENCRYPTION_KEY ?? process.env.NIK_ENCRYPTION_KEY;
    if (!key) {
      throw new Error(
        'DOCUMENT_ENCRYPTION_KEY environment variable is not set. ' +
          'Add it to .env and never hardcode it.',
      );
    }
    return key;
  }

  // ─── File Encryption (AES-256-GCM) ────────────────────────────────────────

  /**
   * Encrypts a Buffer using AES-256-GCM.
   * Output structure: IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
   */
  encryptBuffer(plaintext: Buffer): Buffer {
    const key = createHash('sha256')
      .update(this.getDocumentEncryptionKey())
      .digest();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]);
  }

  /**
   * Decrypts a Buffer encrypted with encryptBuffer().
   */
  decryptBuffer(encryptedBuffer: Buffer): Buffer {
    const key = createHash('sha256')
      .update(this.getDocumentEncryptionKey())
      .digest();
    const iv = encryptedBuffer.subarray(0, 12);
    const tag = encryptedBuffer.subarray(12, 28);
    const ciphertext = encryptedBuffer.subarray(28);

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }
}
