// Mock data — hanya digunakan oleh AI chat (useAIChat) yang belum punya backend.
// Data lainnya sudah diganti dengan real API calls.

import type { NotificationSetting } from "@/types";

export const mockNotificationSettings: NotificationSetting[] = [
  {
    id: "notif_stnk",
    label: "Perpanjangan STNK",
    description: "Ingatkan 30 hari sebelum jatuh tempo",
    enabled: true,
  },
  {
    id: "notif_sim",
    label: "Perpanjangan SIM",
    description: "Ingatkan 60 hari sebelum jatuh tempo",
    enabled: true,
  },
  {
    id: "notif_pajak",
    label: "Batas Lapor Pajak",
    description: "Ingatkan 30 hari sebelum deadline",
    enabled: true,
  },
  {
    id: "notif_bpjs",
    label: "Iuran BPJS",
    description: "Ingatkan 5 hari sebelum jatuh tempo",
    enabled: false,
  },
  {
    id: "notif_pln",
    label: "Tagihan PLN",
    description: "Ingatkan 7 hari sebelum jatuh tempo",
    enabled: true,
  },
];
