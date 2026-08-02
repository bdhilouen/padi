import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema migration — equivalent to database/schema.sql.
 *
 * TypeORM auto-generates tables, indexes, and FK constraints from entity
 * definitions but CANNOT generate:
 *   - Native PostgreSQL extensions        → added here manually
 *   - Native PostgreSQL enum TYPES        → added here manually
 *   - The deadlines_with_status VIEW      → added here manually
 *   - The set_updated_at() trigger fn     → added here manually (kept for raw-SQL safety)
 *   - The audit_logs immutability trigger → added here manually (critical for security)
 *   - Seed data (life_events + templates) → added here manually
 *
 * Run:  npm run migration:run
 * Undo: npm run migration:revert
 */
export class InitialSchema1753791000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // =========================================================
    // EXTENSIONS
    // =========================================================
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // =========================================================
    // NATIVE ENUM TYPES
    // =========================================================
    await queryRunner.query(`
      CREATE TYPE "service_name_enum" AS ENUM (
        'CORETAX', 'BPJS', 'SATUSEHAT', 'OSS', 'SAMSAT',
        'PLN', 'PDAM', 'ETLE', 'MPASPOR'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "status_enum" AS ENUM ('ACTIVE', 'WARNING', 'EXPIRED')
    `);

    await queryRunner.query(`
      CREATE TYPE "consent_status_enum" AS ENUM ('GRANTED', 'REVOKED', 'PENDING')
    `);

    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'SMART_REMINDER', 'GENERAL', 'CHECKLIST'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "notification_channel_enum" AS ENUM ('EMAIL', 'PUSH', 'IN_APP')
    `);

    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('USER', 'ADMINISTRATOR')
    `);

    // =========================================================
    // TRIGGER FUNCTION: auto-update updated_at
    // (TypeORM @UpdateDateColumn handles this at the ORM level,
    //  but this trigger protects rows updated via raw SQL too.)
    // =========================================================
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    // =========================================================
    // 1. USERS
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
        "nik_encrypted" BYTEA       NOT NULL,
        "nik_hash"      VARCHAR(64) NOT NULL,
        "email"         VARCHAR(255) NOT NULL,
        "password_hash" VARCHAR(255) NOT NULL,
        "full_name"     VARCHAR(150) NOT NULL,
        "phone_number"  VARCHAR(20),
        "role"          "user_role_enum" NOT NULL DEFAULT 'USER',
        "is_active"     BOOLEAN     NOT NULL DEFAULT true,
        "deleted_at"    TIMESTAMPTZ,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_nik_hash" UNIQUE ("nik_hash"),
        CONSTRAINT "UQ_users_email"    UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_users_active"
        ON "users" ("id") WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE TRIGGER "trg_users_updated_at"
        BEFORE UPDATE ON "users"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `);

    // =========================================================
    // 2. USER_SESSIONS
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "user_sessions" (
        "id"               UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"          UUID        NOT NULL,
        "device_name"      VARCHAR(255),
        "user_agent"       TEXT,
        "ip_address"       INET,
        "is_active"        BOOLEAN     NOT NULL DEFAULT true,
        "login_at"         TIMESTAMPTZ NOT NULL DEFAULT now(),
        "last_activity_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "logout_at"        TIMESTAMPTZ,
        CONSTRAINT "PK_user_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_sessions_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_sessions_user_id" ON "user_sessions"("user_id")
    `);

    // =========================================================
    // 3. REFRESH_TOKENS
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"              UUID         NOT NULL DEFAULT gen_random_uuid(),
        "user_id"         UUID         NOT NULL,
        "user_session_id" UUID,
        "token_hash"      VARCHAR(255) NOT NULL,
        "expires_at"      TIMESTAMPTZ  NOT NULL,
        "revoked_at"      TIMESTAMPTZ,
        "created_at"      TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_refresh_tokens_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_refresh_tokens_session"
          FOREIGN KEY ("user_session_id") REFERENCES "user_sessions"("id")
          ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_user_id"    ON "refresh_tokens"("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_session_id" ON "refresh_tokens"("user_session_id")
    `);

    // =========================================================
    // 4. CONSENT_RECORDS
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "consent_records" (
        "id"           UUID                 NOT NULL DEFAULT gen_random_uuid(),
        "user_id"      UUID                 NOT NULL,
        "service_name" "service_name_enum"  NOT NULL,
        "status"       "consent_status_enum" NOT NULL DEFAULT 'PENDING',
        "granted_at"   TIMESTAMPTZ,
        "revoked_at"   TIMESTAMPTZ,
        "created_at"   TIMESTAMPTZ          NOT NULL DEFAULT now(),
        CONSTRAINT "PK_consent_records" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_consent_records_user_service" UNIQUE ("user_id", "service_name"),
        CONSTRAINT "FK_consent_records_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_consent_records_user_id" ON "consent_records"("user_id")
    `);

    // =========================================================
    // 5. SERVICE_STATUS
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "service_status" (
        "id"             UUID                NOT NULL DEFAULT gen_random_uuid(),
        "user_id"        UUID                NOT NULL,
        "service_name"   "service_name_enum" NOT NULL,
        "status"         "status_enum"       NOT NULL DEFAULT 'ACTIVE',
        "raw_data"       JSONB,
        "last_synced_at" TIMESTAMPTZ         NOT NULL DEFAULT now(),
        "created_at"     TIMESTAMPTZ         NOT NULL DEFAULT now(),
        "updated_at"     TIMESTAMPTZ         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_service_status" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_service_status_user_service" UNIQUE ("user_id", "service_name"),
        CONSTRAINT "FK_service_status_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_service_status_user_id" ON "service_status"("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_service_status_raw_data_gin"
        ON "service_status" USING GIN ("raw_data" jsonb_path_ops)
    `);

    await queryRunner.query(`
      CREATE TRIGGER "trg_service_status_updated_at"
        BEFORE UPDATE ON "service_status"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `);

    // =========================================================
    // 6. DEADLINES  (no status column — computed by VIEW)
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "deadlines" (
        "id"                UUID                NOT NULL DEFAULT gen_random_uuid(),
        "user_id"           UUID                NOT NULL,
        "service_name"      "service_name_enum" NOT NULL,
        "title"             VARCHAR(150)        NOT NULL,
        "description"       TEXT,
        "due_date"          DATE                NOT NULL,
        "reminder_sent_h30" BOOLEAN             NOT NULL DEFAULT false,
        "reminder_sent_h7"  BOOLEAN             NOT NULL DEFAULT false,
        "reminder_sent_h1"  BOOLEAN             NOT NULL DEFAULT false,
        "created_at"        TIMESTAMPTZ         NOT NULL DEFAULT now(),
        "updated_at"        TIMESTAMPTZ         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_deadlines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_deadlines_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_deadlines_user_id" ON "deadlines"("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_deadlines_due_date" ON "deadlines"("due_date")
    `);

    await queryRunner.query(`
      CREATE TRIGGER "trg_deadlines_updated_at"
        BEFORE UPDATE ON "deadlines"
        FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    `);

    // VIEW: deadline status is always calculated from due_date, never stored
    await queryRunner.query(`
      CREATE VIEW "deadlines_with_status" AS
      SELECT
        *,
        CASE
          WHEN due_date < CURRENT_DATE THEN 'EXPIRED'
          WHEN due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'WARNING'
          ELSE 'ACTIVE'
        END AS status
      FROM deadlines
    `);

    // =========================================================
    // 7. NOTIFICATION_LOGS
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "notification_logs" (
        "id"          UUID                         NOT NULL DEFAULT gen_random_uuid(),
        "user_id"     UUID                         NOT NULL,
        "deadline_id" UUID,
        "title"       VARCHAR(150)                 NOT NULL,
        "type"        "notification_type_enum"     NOT NULL,
        "channel"     "notification_channel_enum"  NOT NULL DEFAULT 'IN_APP',
        "message"     TEXT                         NOT NULL,
        "sent_at"     TIMESTAMPTZ                  NOT NULL DEFAULT now(),
        "read_at"     TIMESTAMPTZ,
        CONSTRAINT "PK_notification_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notification_logs_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notification_logs_deadline"
          FOREIGN KEY ("deadline_id") REFERENCES "deadlines"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notification_logs_user_id" ON "notification_logs"("user_id")
    `);

    // =========================================================
    // 8. LIFE_EVENTS
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "life_events" (
        "id"          UUID         NOT NULL DEFAULT gen_random_uuid(),
        "code"        VARCHAR(50)  NOT NULL,
        "name"        VARCHAR(100) NOT NULL,
        "description" TEXT,
        CONSTRAINT "PK_life_events" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_life_events_code" UNIQUE ("code")
      )
    `);

    // =========================================================
    // 9. LIFE_EVENT_TEMPLATES
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "life_event_templates" (
        "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
        "life_event_id" UUID         NOT NULL,
        "document_name" VARCHAR(150) NOT NULL,
        "display_order" INTEGER      NOT NULL DEFAULT 0,
        "is_required"   BOOLEAN      NOT NULL DEFAULT true,
        "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_life_event_templates" PRIMARY KEY ("id"),
        CONSTRAINT "FK_life_event_templates_event"
          FOREIGN KEY ("life_event_id") REFERENCES "life_events"("id") ON DELETE CASCADE
      )
    `);

    // =========================================================
    // SEED DATA — life_events and life_event_templates
    // (IDs match schema.sql exactly so they can be referenced safely)
    // =========================================================
    await queryRunner.query(`
      INSERT INTO "life_events" ("id", "code", "name", "description") VALUES
        ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'MENIKAH',    'Menikah',        'Kejadian hidup pernikahan'),
        ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'PUNYA_ANAK', 'Memiliki Anak',  'Kejadian hidup kelahiran anak')
    `);

    await queryRunner.query(`
      INSERT INTO "life_event_templates"
        ("life_event_id", "document_name", "display_order", "is_required")
      VALUES
        ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Fotokopi KTP',            1, true),
        ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Fotokopi KK',             2, true),
        ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Surat Pengantar RT/RW',   3, true),
        ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Surat Keterangan Lahir dari RS/Bidan', 1, true),
        ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Fotokopi Buku Nikah',     2, true)
    `);

    // =========================================================
    // 10. LIFE_EVENT_SELECTIONS
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "life_event_selections" (
        "id"            UUID        NOT NULL DEFAULT gen_random_uuid(),
        "user_id"       UUID        NOT NULL,
        "life_event_id" UUID        NOT NULL,
        "selected_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_life_event_selections" PRIMARY KEY ("id"),
        CONSTRAINT "FK_life_event_selections_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_life_event_selections_event"
          FOREIGN KEY ("life_event_id") REFERENCES "life_events"("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_life_event_selections_user_id"
        ON "life_event_selections"("user_id")
    `);

    // =========================================================
    // 11. CHECKLIST_ITEMS
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "checklist_items" (
        "id"            UUID         NOT NULL DEFAULT gen_random_uuid(),
        "selection_id"  UUID         NOT NULL,
        "document_name" VARCHAR(150) NOT NULL,
        "display_order" INTEGER      NOT NULL DEFAULT 0,
        "is_required"   BOOLEAN      NOT NULL DEFAULT true,
        "is_completed"  BOOLEAN      NOT NULL DEFAULT false,
        "completed_at"  TIMESTAMPTZ,
        "created_at"    TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT "PK_checklist_items" PRIMARY KEY ("id"),
        CONSTRAINT "FK_checklist_items_selection"
          FOREIGN KEY ("selection_id") REFERENCES "life_event_selections"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_checklist_items_selection_id"
        ON "checklist_items"("selection_id")
    `);

    // =========================================================
    // 12. USER_DOCUMENTS
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "user_documents" (
        "id"                UUID         NOT NULL DEFAULT gen_random_uuid(),
        "user_id"           UUID         NOT NULL,
        "document_type"     VARCHAR(50)  NOT NULL,
        "original_filename" VARCHAR(255) NOT NULL,
        "mime_type"         VARCHAR(100) NOT NULL,
        "file_size"         BIGINT       NOT NULL,
        "encrypted_url"     TEXT         NOT NULL,
        "storage_key"       VARCHAR(255) NOT NULL,
        "expiry_date"       DATE,
        "uploaded_at"       TIMESTAMPTZ  NOT NULL DEFAULT now(),
        "last_verified_at"  TIMESTAMPTZ,
        CONSTRAINT "PK_user_documents" PRIMARY KEY ("id"),
        CONSTRAINT "FK_user_documents_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_documents_user_id" ON "user_documents"("user_id")
    `);

    // =========================================================
    // 13. AUDIT_LOGS  (immutable — protected by triggers below)
    // =========================================================
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id"               UUID                NOT NULL DEFAULT gen_random_uuid(),
        "user_id"          UUID,
        "action"           VARCHAR(100)        NOT NULL,
        "service_accessed" "service_name_enum",
        "ip_address"       INET,
        "user_agent"       TEXT,
        "created_at"       TIMESTAMPTZ         NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_user_id"    ON "audit_logs"("user_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_audit_logs_created_at" ON "audit_logs"("created_at")
    `);

    // Immutability enforcement — these triggers make audit_logs append-only
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION block_audit_log_mutation()
      RETURNS TRIGGER AS $$
      BEGIN
        RAISE EXCEPTION 'audit_logs bersifat immutable, tidak boleh diubah atau dihapus';
      END;
      $$ LANGUAGE plpgsql
    `);

    await queryRunner.query(`
      CREATE TRIGGER "trg_audit_logs_no_update"
        BEFORE UPDATE ON "audit_logs"
        FOR EACH ROW EXECUTE FUNCTION block_audit_log_mutation()
    `);

    await queryRunner.query(`
      CREATE TRIGGER "trg_audit_logs_no_delete"
        BEFORE DELETE ON "audit_logs"
        FOR EACH ROW EXECUTE FUNCTION block_audit_log_mutation()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop in reverse dependency order

    // Triggers and functions first
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "trg_audit_logs_no_delete"  ON "audit_logs"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "trg_audit_logs_no_update"  ON "audit_logs"`,
    );
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS block_audit_log_mutation()`,
    );

    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "trg_deadlines_updated_at"     ON "deadlines"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "trg_service_status_updated_at" ON "service_status"`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS "trg_users_updated_at"          ON "users"`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_updated_at()`);

    // VIEW
    await queryRunner.query(`DROP VIEW IF EXISTS "deadlines_with_status"`);

    // Tables (leaf → root)
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "checklist_items"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "life_event_selections"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "life_event_templates"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "life_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "deadlines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "service_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "consent_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Enum types
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_channel_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "consent_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "service_name_enum"`);
  }
}
