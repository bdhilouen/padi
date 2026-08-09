/**
 * api.ts — Backend response type definitions
 * Sesuai PADI API V3 Final (Postman collection).
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type ServiceNameEnum =
  | "CORETAX"
  | "BPJS"
  | "SATUSEHAT"
  | "OSS"
  | "SAMSAT"
  | "PLN"
  | "PDAM"
  | "ETLE"
  | "MPASPOR";

export type StatusEnum = "ACTIVE" | "WARNING" | "EXPIRED";

export type ConsentStatusEnum = "GRANTED" | "REVOKED" | "PENDING";

export type NotificationTypeEnum = "SMART_REMINDER" | "GENERAL" | "CHECKLIST";

export type UserRoleEnum = "USER" | "ADMINISTRATOR";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface ApiTokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface ApiRegisterResponse {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: UserRoleEnum;
  created_at: string;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface ApiUserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: UserRoleEnum;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiSession {
  id: string;
  device_name: string | null;
  user_agent: string | null;
  ip_address: string | null;
  is_active: boolean;
  login_at: string;
  last_activity_at: string | null;
  logout_at: string | null;
}

// ─── Consent ─────────────────────────────────────────────────────────────────

export interface ApiConsentRecord {
  id: string;
  service_name: ServiceNameEnum;
  status: ConsentStatusEnum;
  granted_at: string | null;
  revoked_at: string | null;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface ApiDashboardService {
  service_name: ServiceNameEnum;
  status: StatusEnum | null;
  last_synced_at: string | null;
  consent_required?: boolean;
  sync_error?: boolean;
}

// ─── Timeline / Deadlines ─────────────────────────────────────────────────────

export interface ApiDeadline {
  id: string;
  service_name: ServiceNameEnum;
  title: string;
  description: string | null;
  due_date: string;
  status: StatusEnum;
  created_at: string;
  updated_at: string;
}

export interface ApiPaginationMeta {
  total: number;
  page: number;
  limit: number;
}

export interface ApiDeadlineList {
  data: ApiDeadline[];
  meta: ApiPaginationMeta;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface ApiNotification {
  id: string;
  title: string;
  type: NotificationTypeEnum;
  message: string;
  sent_at: string;
  read_at: string | null;
}

// ─── Life Events ─────────────────────────────────────────────────────────────

export interface ApiLifeEvent {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

export interface ApiSelection {
  id: string;
  life_event: ApiLifeEvent;
  selected_at: string;
  total_items: number;
  completed_items: number;
}

export interface ApiChecklistItem {
  id: string;
  document_name: string;
  display_order: number;
  is_required: boolean;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface ApiSelectionWithChecklist extends ApiSelection {
  checklist: ApiChecklistItem[];
}

// ─── Document Vault ───────────────────────────────────────────────────────────

export interface ApiDocument {
  id: string;
  document_type: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  expiry_date: string | null;
  uploaded_at: string;
  last_verified_at: string | null;
}

// ─── Chat AI ──────────────────────────────────────────────────────────────────

export interface ApiChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ApiChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "USER" | "AI" | "SYSTEM";
  content: string;
  created_at: string;
}

export interface ApiPreviewUrlResponse {
  preview_url: string;
  expires_in: number;
}
