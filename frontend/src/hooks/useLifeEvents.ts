"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type {
  ApiLifeEvent,
  ApiSelection,
  ApiSelectionWithChecklist,
  ApiChecklistItem,
} from "@/types/api";
import type { LifeEvent } from "@/types";

// ─── Life Event Code → Icon/Category Mapping ─────────────────────────────────

const LIFE_EVENT_META: Record<
  string,
  { icon: string; category: string }
> = {
  MARRIED: { icon: "Heart", category: "Keluarga" },
  NEWBORN: { icon: "Baby", category: "Keluarga" },
  MOVING: { icon: "Home", category: "Domisili" },
  NEW_BUSINESS: { icon: "Briefcase", category: "Bisnis" },
  RETIRE: { icon: "Sunset", category: "Pekerjaan" },
  DIVORCE: { icon: "UserMinus", category: "Keluarga" },
  DEATH: { icon: "Cross", category: "Keluarga" },
};

function getLifeEventMeta(code: string) {
  return (
    LIFE_EVENT_META[code] ?? {
      icon: "Sparkles",
      category: "Lainnya",
    }
  );
}

// ─── Transform ────────────────────────────────────────────────────────────────

function transformLifeEvent(le: ApiLifeEvent): LifeEvent {
  const meta = getLifeEventMeta(le.code);
  return {
    id: le.id,
    code: le.code,
    title: le.name,
    description: le.description ?? "",
    icon: meta.icon,
    category: meta.category,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** GET /life-events — public, tidak butuh auth */
export function useLifeEvents() {
  return useQuery({
    queryKey: ["life-events"],
    queryFn: async (): Promise<LifeEvent[]> => {
      const { data } = await apiClient.get<ApiLifeEvent[]>("/life-events");
      return data.map(transformLifeEvent);
    },
    staleTime: 10 * 60 * 1000, // master data jarang berubah
  });
}

/** POST /life-events/select — mulai life event */
export function useSelectLifeEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (lifeEventId: string): Promise<ApiSelection> => {
      const { data } = await apiClient.post<ApiSelection>(
        "/life-events/select",
        { life_event_id: lifeEventId }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["life-event-selections"] });
    },
  });
}

/** GET /life-events/selections — selections user */
export function useMySelections() {
  return useQuery({
    queryKey: ["life-event-selections"],
    queryFn: async (): Promise<ApiSelection[]> => {
      const { data } =
        await apiClient.get<ApiSelection[]>("/life-events/selections");
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });
}

/** GET /life-events/selections/:id/checklist */
export function useSelectionChecklist(selectionId: string) {
  return useQuery({
    queryKey: ["life-event-checklist", selectionId],
    queryFn: async (): Promise<ApiSelectionWithChecklist> => {
      const { data } = await apiClient.get<ApiSelectionWithChecklist>(
        `/life-events/selections/${selectionId}/checklist`
      );
      return data;
    },
    enabled: !!selectionId,
  });
}

/** PATCH /checklist-items/:itemId — toggle completed */
export function useToggleChecklistItem(selectionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      isCompleted,
    }: {
      itemId: string;
      isCompleted: boolean;
    }): Promise<ApiChecklistItem> => {
      const { data } = await apiClient.patch<ApiChecklistItem>(
        `/checklist-items/${itemId}`,
        { is_completed: isCompleted }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["life-event-checklist", selectionId],
      });
      queryClient.invalidateQueries({ queryKey: ["life-event-selections"] });
    },
  });
}
