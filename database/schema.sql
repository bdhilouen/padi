-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- buat gen_random_uuid()

-- ============================================
-- ENUM TYPES (sesuai Data Dictionary SRS 4.2)
-- ============================================
CREATE TYPE service_name_enum AS ENUM (
  'CORETAX', 'BPJS', 'SATUSEHAT', 'OSS', 'SAMSAT', 'PLN', 'PDAM', 'ETLE', 'MPASPOR'
);

CREATE TYPE status_enum AS ENUM ('ACTIVE', 'WARNING', 'EXPIRED');

CREATE TYPE consent_status_enum AS ENUM ('GRANTED', 'REVOKED', 'PENDING');

CREATE TYPE notification_type_enum AS ENUM ('SMART_REMINDER', 'GENERAL', 'CHECKLIST');

CREATE TYPE notification_channel_enum AS ENUM ('EMAIL', 'PUSH', 'IN_APP');

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
-- 1. USERS  (FR-012 SSO pakai NIK + Email)
-- ============================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nik             CHAR(16) NOT NULL UNIQUE,
  email           VARCHAR(255) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  full_name       VARCHAR(150) NOT NULL,
  phone_number    VARCHAR(20),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- 2. CONSENT_RECORDS  (FR-013)
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
-- 3. SERVICE_STATUS  (FR-001, FR-002, FR-003 - Unified Dashboard)
-- ============================================
CREATE TABLE service_status (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name    service_name_enum NOT NULL,
  status          status_enum NOT NULL DEFAULT 'ACTIVE',
  raw_data        JSONB, -- hasil normalisasi Adapter Service dari Mock API
  last_synced_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, service_name)
);

CREATE INDEX idx_service_status_user_id ON service_status(user_id);

CREATE TRIGGER trg_service_status_updated_at
  BEFORE UPDATE ON service_status
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- 4. DEADLINES  (FR-004, FR-005 - Timeline & Smart Reminder)
-- ============================================
CREATE TABLE deadlines (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_name          service_name_enum NOT NULL,
  title                 VARCHAR(150) NOT NULL,
  description           TEXT,
  due_date              DATE NOT NULL,
  status                status_enum NOT NULL DEFAULT 'ACTIVE',
  reminder_sent_h30     BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_h7      BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_h1      BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deadlines_user_id ON deadlines(user_id);
CREATE INDEX idx_deadlines_due_date ON deadlines(due_date);

CREATE TRIGGER trg_deadlines_updated_at
  BEFORE UPDATE ON deadlines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================
-- 5. NOTIFICATION_LOG
-- ============================================
CREATE TABLE notification_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  deadline_id   UUID REFERENCES deadlines(id) ON DELETE SET NULL,
  type          notification_type_enum NOT NULL,
  channel       notification_channel_enum NOT NULL DEFAULT 'IN_APP',
  message       TEXT NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at       TIMESTAMPTZ
);

CREATE INDEX idx_notification_log_user_id ON notification_log(user_id);

-- ============================================
-- 6. LIFE_EVENTS  (master data - FR-006)
-- ============================================
CREATE TABLE life_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50) NOT NULL UNIQUE, -- MENIKAH, PUNYA_ANAK, PINDAH_RUMAH, BUKA_USAHA
  name        VARCHAR(100) NOT NULL,
  description TEXT
);

INSERT INTO life_events (code, name, description) VALUES
  ('MENIKAH', 'Menikah', 'Kejadian hidup pernikahan'),
  ('PUNYA_ANAK', 'Memiliki Anak', 'Kejadian hidup kelahiran anak'),
  ('PINDAH_RUMAH', 'Pindah Rumah', 'Kejadian hidup perpindahan domisili'),
  ('BUKA_USAHA', 'Membuka Usaha', 'Kejadian hidup pendirian usaha');

-- ============================================
-- 7. LIFE_EVENT_SELECTIONS  (instance per user - FR-006)
-- ============================================
CREATE TABLE life_event_selections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  life_event_id   UUID NOT NULL REFERENCES life_events(id),
  selected_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_life_event_selections_user_id ON life_event_selections(user_id);

-- ============================================
-- 8. CHECKLIST_ITEMS  (FR-007, FR-008)
-- ============================================
CREATE TABLE checklist_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  selection_id    UUID NOT NULL REFERENCES life_event_selections(id) ON DELETE CASCADE,
  document_name   VARCHAR(150) NOT NULL, -- contoh: Akta Kelahiran, NIK, KK
  is_required     BOOLEAN NOT NULL DEFAULT true,
  is_completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_items_selection_id ON checklist_items(selection_id);

-- ============================================
-- 9. DOCUMENT_VAULT  (FR-009, FR-010, FR-011)
-- ============================================
CREATE TABLE document_vault (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type       VARCHAR(50) NOT NULL, -- KTP, KK, NPWP, SIM, dll
  original_filename   VARCHAR(255) NOT NULL,
  encrypted_url       TEXT NOT NULL, -- URL ke S3, filenya udah dienkripsi
  storage_key         VARCHAR(255) NOT NULL, -- reference key di S3
  expiry_date         DATE,
  uploaded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at    TIMESTAMPTZ -- terakhir kali user re-auth buat preview (FR-011)
);

CREATE INDEX idx_document_vault_user_id ON document_vault(user_id);

-- ============================================
-- 10. AUDIT_LOGS  (FR-014, NFR-003 - harus immutable)
-- ============================================
CREATE TABLE audit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  action            VARCHAR(100) NOT NULL, -- contoh: 'LOGIN', 'ACCESS_CORETAX', 'CONSENT_GRANTED'
  service_accessed  service_name_enum,
  ip_address        INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Kunci audit_logs biar bener-bener immutable (gak bisa di-UPDATE/DELETE oleh siapapun)
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