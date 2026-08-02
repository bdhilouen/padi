export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  CONSENT: "/consent",
  DASHBOARD: "/dashboard",
  TIMELINE: "/timeline",
  AI_ASSISTANT: "/ai-assistant",
  DOCUMENT_VAULT: "/document-vault",
  LIFE_EVENT: "/life-event",
  PROFILE: "/profile",
  SETTINGS: "/settings",
} as const;

export const SERVICE_LABELS: Record<string, string> = {
  pajak: "Pajak",
  bpjs: "BPJS",
  sim: "SIM",
  stnk: "STNK",
  paspor: "Paspor",
  pln: "PLN",
  pdam: "PDAM",
};

export const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  warning: "Akan Habis",
  expired: "Kedaluwarsa",
  unknown: "Tidak Diketahui",
};

export const NAV_ITEMS = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: "LayoutDashboard" },
  { label: "Timeline", href: ROUTES.TIMELINE, icon: "CalendarDays" },
  { label: "AI Assistant", href: ROUTES.AI_ASSISTANT, icon: "Bot" },
  { label: "Dokumen", href: ROUTES.DOCUMENT_VAULT, icon: "FolderOpen" },
  { label: "Life Event", href: ROUTES.LIFE_EVENT, icon: "Sparkles" },
  { label: "Profil", href: ROUTES.PROFILE, icon: "User" },
  { label: "Pengaturan", href: ROUTES.SETTINGS, icon: "Settings" },
] as const;
