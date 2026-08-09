"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { ApiDashboardService, ServiceNameEnum } from "@/types/api";
import type { ServiceCard, ServiceStatus } from "@/types";

// ─── Service Name → Display Mapping ──────────────────────────────────────────

const SERVICE_DISPLAY: Record<
  ServiceNameEnum,
  { name: string; icon: string; description: string }
> = {
  CORETAX: {
    name: "Pajak (CoreTax)",
    icon: "Receipt",
    description: "Pajak Penghasilan & Kewajiban Perpajakan",
  },
  BPJS: {
    name: "BPJS Kesehatan",
    icon: "HeartPulse",
    description: "Status kepesertaan & iuran BPJS",
  },
  SATUSEHAT: {
    name: "SatuSehat",
    icon: "Activity",
    description: "Rekam medis & riwayat kesehatan",
  },
  OSS: {
    name: "Perizinan (OSS)",
    icon: "Briefcase",
    description: "Nomor Induk Berusaha & izin usaha",
  },
  SAMSAT: {
    name: "STNK / Samsat",
    icon: "Car",
    description: "Pajak kendaraan bermotor & STNK",
  },
  PLN: {
    name: "PLN",
    icon: "Zap",
    description: "Tagihan & penggunaan listrik",
  },
  PDAM: {
    name: "PDAM",
    icon: "Droplets",
    description: "Tagihan & penggunaan air bersih",
  },
  ETLE: {
    name: "e-TLE",
    icon: "AlertOctagon",
    description: "Tilang elektronik & pelanggaran lalu lintas",
  },
  MPASPOR: {
    name: "Paspor (M-Paspor)",
    icon: "BookOpen",
    description: "Status & perpanjangan paspor",
  },
};

// ─── Status Transform ─────────────────────────────────────────────────────────

function toFrontendStatus(
  status: string | null,
  consentRequired?: boolean
): ServiceStatus {
  if (consentRequired) return "unknown";
  switch (status) {
    case "ACTIVE":
      return "active";
    case "WARNING":
      return "warning";
    case "EXPIRED":
      return "expired";
    default:
      return "unknown";
  }
}

// ─── Transform Backend → ServiceCard ─────────────────────────────────────────

function transformDashboard(items: ApiDashboardService[]): ServiceCard[] {
  return items.map((item) => {
    const display = SERVICE_DISPLAY[item.service_name] ?? {
      name: item.service_name,
      icon: "FileText",
      description: "",
    };

    return {
      id: item.service_name,
      name: display.name,
      icon: display.icon,
      description: item.sync_error
        ? `${display.description} (Gagal sinkronisasi)`
        : display.description,
      status: toFrontendStatus(item.status, item.consent_required),
      lastUpdated: item.last_synced_at ?? undefined,
      consentRequired: item.consent_required,
      syncError: item.sync_error,
    };
  });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

async function fetchDashboard(): Promise<ServiceCard[]> {
  const { data } = await apiClient.get<ApiDashboardService[]>("/dashboard");
  return transformDashboard(data);
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRefreshDashboard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } =
        await apiClient.post<ApiDashboardService[]>("/dashboard/refresh");
      return transformDashboard(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["dashboard"], data);
    },
  });
}
