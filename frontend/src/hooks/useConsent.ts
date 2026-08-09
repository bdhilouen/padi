"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { ApiConsentRecord, ServiceNameEnum } from "@/types/api";

/** GET /consent — list semua consent records user */
export function useConsents() {
  return useQuery({
    queryKey: ["consents"],
    queryFn: async (): Promise<ApiConsentRecord[]> => {
      const { data } = await apiClient.get<ApiConsentRecord[]>("/consent");
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/** POST /consent — grant satu service */
export function useGrantConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serviceName: ServiceNameEnum) => {
      const { data } = await apiClient.post<ApiConsentRecord>("/consent", {
        service_name: serviceName,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Grant consent untuk semua 9 service sekaligus */
export function useGrantAllConsents() {
  const ALL_SERVICES: ServiceNameEnum[] = [
    "CORETAX",
    "BPJS",
    "SATUSEHAT",
    "OSS",
    "SAMSAT",
    "PLN",
    "PDAM",
    "ETLE",
    "MPASPOR",
  ];

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Kirim semua consent secara paralel — idempotent, aman
      await Promise.all(
        ALL_SERVICES.map((service) =>
          apiClient.post<ApiConsentRecord>("/consent", {
            service_name: service,
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** PATCH /consent/:consentId/revoke */
export function useRevokeConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (consentId: string) => {
      const { data } = await apiClient.patch<ApiConsentRecord>(
        `/consent/${consentId}/revoke`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consents"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
