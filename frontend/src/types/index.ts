export type ServiceStatus = "active" | "warning" | "expired" | "unknown";

export interface ServiceCard {
  id: string;
  name: string;
  icon: string;
  status: ServiceStatus;
  description: string;
  lastUpdated?: string;
  /** True jika user belum memberikan consent untuk service ini */
  consentRequired?: boolean;
  /** True jika sync ke external service gagal */
  syncError?: boolean;
}

export interface TimelineItem {
  id: string;
  serviceId: string;
  service: string;
  title: string;
  date: string;
  status: ServiceStatus;
  description: string;
  daysUntil?: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  category: string;
  mimeType?: string;
  expiryDate?: string | null;
}

export interface LifeEvent {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
}

/** User profile dari GET /users/me — NIK tidak pernah dikembalikan backend */
export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

