"use client";

import { useRouter } from "next/navigation";
import {
  Heart,
  Baby,
  Home,
  Briefcase,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useLifeEvents, useSelectLifeEvent, useMySelections } from "@/hooks/useLifeEvents";
import { toast } from "sonner";
import type { LifeEvent } from "@/types";
import type { ApiSelection } from "@/types/api";

const iconMap: Record<string, React.ElementType> = {
  Heart,
  Baby,
  Home,
  Briefcase,
  Sparkles,
};

function LifeEventCard({
  event,
  activeSelectionId,
  onSelect,
  isSelecting,
}: {
  event: LifeEvent;
  activeSelectionId: string | undefined;
  onSelect: () => void;
  isSelecting: boolean;
}) {
  const Icon = iconMap[event.icon] ?? Sparkles;
  const isActive = !!activeSelectionId;

  return (
    <Card className="group transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{event.title}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
            </div>
          </div>
          <Badge variant="secondary" className="shrink-0 text-xs">
            {event.category}
          </Badge>
        </div>

        {isActive ? (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-success font-medium flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Sedang berjalan
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={onSelect}
            >
              Lihat Checklist <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <div className="pt-3 border-t border-border">
            <Button
              size="sm"
              className="w-full gap-1.5 text-xs"
              onClick={onSelect}
              disabled={isSelecting}
            >
              {isSelecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  Mulai <ChevronRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function LifeEventPage() {
  const router = useRouter();
  const { data: lifeEvents, isLoading, isError } = useLifeEvents();
  const { data: selections } = useMySelections();
  const { mutateAsync: selectEvent, isPending: isSelecting } = useSelectLifeEvent();

  // Map lifeEventId → selectionId untuk cek yang sudah aktif
  const activeMap = new Map<string, string>(
    (selections ?? []).map((s: ApiSelection) => [s.life_event.id, s.id])
  );

  async function handleSelect(event: LifeEvent) {
    const existingSelectionId = activeMap.get(event.id);
    if (existingSelectionId) {
      // Sudah ada selection → langsung ke checklist
      router.push(`/life-event/${existingSelectionId}`);
      return;
    }

    try {
      const selection = await selectEvent(event.id);
      router.push(`/life-event/${selection.id}`);
    } catch {
      toast.error("Gagal memulai life event. Silakan coba lagi.");
    }
  }

  return (
    <div className="page-container-wide page-enter">
      <div className="mb-8">
        <h1 className="font-display text-5xl font-bold text-foreground">Life Event</h1>
        <p className="mt-1 text-muted-foreground">
          Panduan administrasi untuk peristiwa penting dalam hidup Anda.
        </p>
      </div>

      {isError && <ErrorState />}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
                <Skeleton className="h-8 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !lifeEvents || lifeEvents.length === 0 ? (
        <EmptyState
          title="Tidak ada life event"
          description="Belum ada event yang tersedia saat ini."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {lifeEvents.map((event) => (
            <LifeEventCard
              key={event.id}
              event={event}
              activeSelectionId={activeMap.get(event.id)}
              onSelect={() => handleSelect(event)}
              isSelecting={isSelecting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
