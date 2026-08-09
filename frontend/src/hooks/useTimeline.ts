"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { ApiDeadlineList, ServiceNameEnum } from "@/types/api";
import type { TimelineItem, ServiceStatus } from "@/types";

// ─── Service Name → Label ─────────────────────────────────────────────────────

const SERVICE_LABEL: Record<ServiceNameEnum, string> = {
  CORETAX: "Pajak",
  BPJS: "BPJS Kesehatan",
  SATUSEHAT: "SatuSehat",
  OSS: "Perizinan OSS",
  SAMSAT: "STNK / Samsat",
  PLN: "PLN",
  PDAM: "PDAM",
  ETLE: "e-TLE",
  MPASPOR: "Paspor",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toStatus(status: string): ServiceStatus {
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

function calcDaysUntil(dueDateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  return Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Fetch & Transform ────────────────────────────────────────────────────────

async function fetchTimeline(): Promise<TimelineItem[]> {
  const { data } = await apiClient.get<ApiDeadlineList>(
    "/deadlines?sort=due_date&limit=50&page=1"
  );

  return data.data.map((item) => {
    const daysUntil = calcDaysUntil(item.due_date);
    // Override status based on actual days remaining for more accuracy
    let status = toStatus(item.status);
    if (daysUntil < 0) status = "expired";
    else if (daysUntil <= 7) status = "warning";

    return {
      id: item.id,
      serviceId: item.service_name,
      service: SERVICE_LABEL[item.service_name] ?? item.service_name,
      title: item.title,
      date: item.due_date,
      status,
      description: item.description ?? "",
      daysUntil,
    };
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTimeline() {
  return useQuery({
    queryKey: ["timeline"],
    queryFn: fetchTimeline,
    staleTime: 5 * 60 * 1000,
  });
}
