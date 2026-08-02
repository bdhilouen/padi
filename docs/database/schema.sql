-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE service_name_enum AS ENUM (
  'CORETAX', 'BPJS', 'SATUSEHAT', 'OSS', 'SAMSAT', 'PLN', 'PDAM', 'ETLE', 'MPASPOR'
);
CREATE TYPE status_enum AS ENUM ('ACTIVE', 'WARNING', 'EXPIRED');
CREATE TYPE consent_status_enum AS ENUM ('GRANTED', 'REVOKED', 'PENDING');
CREATE TYPE notification_type_enum AS ENUM ('SMART_REMINDER', 'GENERAL', 'CHECKLIST');
CREATE TYPE notification_channel_enum AS ENUM ('EMAIL', 'PUSH', 'IN_APP');
CREATE TYPE user_role_enum AS ENUM ('USER', 'ADMINISTRATOR');

-- ============================================
-- FUNCTION: auto-update kolom updated_at
-- ============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. USERS
-- ============================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nik_encrypted   BYTEA NOT NULL,
  nik_hash        VARCHAR(64) NOT NULL UNIQUE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(150) NOT NULL,
  phone_number    VARCHAR(20),
  role            user_role_enum NOT NULL DEFAULT 'USER',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_active ON users (id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- 2. USER_SESSIONS
-- ============================================
CREATE TABLE user_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_name       VARCHAR(255),
  user_agent        TEXT,
  ip_address        INET,
  is_active         BOOLEAN NOT NULL DEFAULT true,
  login_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  logout_at         TIMESTAMPTZ
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- ============================================
-- 3. REFRESH_TOKENS  (user_session_id nullable)
-- ============================================
CREATE TABLE refresh_tokens (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_session_id   UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
  token_hash        VARCHAR(255) NOT NULL UNIQUE,
  expires_at        TIMESTAMPTZ NOT NULL,
  revoked_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_session_id ON refresh_tokens(user_session_id);

-- ============================================
-- 4. CONSENT_RECORDS
-- ============================================
CREATE TABLE consent_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name  service_name_enum NOT NULL,
  status        consent_status_enum NOT NULL DEFAULT 'PENDING',
  granted_at    TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, service_name)
);

CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);

-- ============================================
-- 5. SERVICE_STATUS  (status tetap disimpan, hasil sync eksternal)
-- ============================================
CREATE TABLE service_status (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name    service_name_enum NOT NULL,
  status          status_enum NOT NULL DEFAULT 'ACTIVE',
  raw_data        JSONB,
  last_synced_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, service_name)
);

CREATE INDEX idx_service_status_user_id ON service_status(user_id);
CREATE INDEX idx_service_status_raw_data_gin ON service_status USING GIN (raw_data jsonb_path_ops);

CREATE TRIGGER trg_service_status_updated_at
  BEFORE UPDATE ON service_status
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- 6. DEADLINES  (kolom status DIHAPUS, dihitung via VIEW)
-- ============================================
CREATE TABLE deadlines (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name        service_name_enum NOT NULL,
  title               VARCHAR(150) NOT NULL,
  description         TEXT,
  due_date            DATE NOT NULL,
  reminder_sent_h30   BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_h7    BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_h1    BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deadlines_user_id ON deadlines(user_id);
CREATE INDEX idx_deadlines_due_date ON deadlines(due_date);

CREATE TRIGGER trg_deadlines_updated_at
  BEFORE UPDATE ON deadlines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- View: status dihitung real-time dari due_date, gak butuh cron
CREATE VIEW deadlines_with_status AS
SELECT
  *,
  CASE
    WHEN due_date < CURRENT_DATE THEN 'EXPIRED'
    WHEN due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'WARNING'
    ELSE 'ACTIVE'
  END AS status
FROM deadlines;

-- ============================================
-- 7. NOTIFICATION_LOGS
-- ============================================
CREATE TABLE notification_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deadline_id   UUID REFERENCES deadlines(id) ON DELETE SET NULL,
  title         VARCHAR(150) NOT NULL,
  type          notification_type_enum NOT NULL,
  channel       notification_channel_enum NOT NULL DEFAULT 'IN_APP',
  message       TEXT NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at       TIMESTAMPTZ
);

CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);

-- ============================================
-- 8. LIFE_EVENTS
-- ============================================
CREATE TABLE life_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  description TEXT
);

-- ============================================
-- 9. LIFE_EVENT_TEMPLATES  (+display_order)
-- ============================================
CREATE TABLE life_event_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  life_event_id UUID NOT NULL REFERENCES life_events(id) ON DELETE CASCADE,
  document_name VARCHAR(150) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_required   BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO life_events (id, code, name, description) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'MENIKAH', 'Menikah', 'Kejadian hidup pernikahan'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'PUNYA_ANAK', 'Memiliki Anak', 'Kejadian hidup kelahiran anak');

INSERT INTO life_event_templates (life_event_id, document_name, display_order, is_required) VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Fotokopi KTP', 1, true),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Fotokopi KK', 2, true),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Surat Pengantar RT/RW', 3, true),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Surat Keterangan Lahir dari RS/Bidan', 1, true),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Fotokopi Buku Nikah', 2, true);

-- ============================================
-- 10. LIFE_EVENT_SELECTIONS
-- ============================================
CREATE TABLE life_event_selections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  life_event_id UUID NOT NULL REFERENCES life_events(id),
  selected_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_life_event_selections_user_id ON life_event_selections(user_id);

-- ============================================
-- 11. CHECKLIST_ITEMS  (+display_order, di-copy dari template)
-- ============================================
CREATE TABLE checklist_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  selection_id  UUID NOT NULL REFERENCES life_event_selections(id) ON DELETE CASCADE,
  document_name VARCHAR(150) NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_required   BOOLEAN NOT NULL DEFAULT true,
  is_completed  BOOLEAN NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_items_selection_id ON checklist_items(selection_id);

-- ============================================
-- 12. USER_DOCUMENTS  (+mime_type, +file_size)
-- ============================================
CREATE TABLE user_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type       VARCHAR(50) NOT NULL,
  original_filename   VARCHAR(255) NOT NULL,
  mime_type           VARCHAR(100) NOT NULL,
  file_size           BIGINT NOT NULL, -- disimpan dalam bytes, frontend yang format ke "2.4 MB"
  encrypted_url       TEXT NOT NULL,
  storage_key         VARCHAR(255) NOT NULL,
  expiry_date         DATE,
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at    TIMESTAMPTZ
);

CREATE INDEX idx_user_documents_user_id ON user_documents(user_id);

-- ============================================
-- 13. AUDIT_LOGS
-- ============================================
CREATE TABLE audit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  action            VARCHAR(100) NOT NULL,
  service_accessed  service_name_enum,
  ip_address        INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE OR REPLACE FUNCTION block_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs bersifat immutable, tidak boleh diubah atau dihapus';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_logs_no_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION block_audit_log_mutation();

CREATE TRIGGER trg_audit_logs_no_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION block_audit_log_mutation();