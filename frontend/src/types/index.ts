export type ServiceStatus = "active" | "warning" | "expired" | "unknown";

export interface ServiceCard {
  id: string;
  name: string;
  icon: string;
  status: ServiceStatus;
  description: string;
  dueDate?: string;
  lastUpdated?: string;
}

export interface TimelineItem {
  id: string;
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
}

export interface LifeEvent {
  id: string;
  title: string;
  description: string;
  icon: string;
  steps: string[];
  category: string;
}

export interface User {
  id: string;
  name: string;
  nik: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  avatar?: string;
}

export interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}
