"use client";

import { useTimeline } from "@/hooks/useTimeline";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TimelineItem } from "@/types";

function TimelineItemCard({ item, isLast }: { item: TimelineItem; isLast: boolean }) {
  const dotColor = {
    active: "bg-success",
    warning: "bg-warning",
    expired: "bg-danger",
    unknown: "bg-muted-foreground",
  }[item.status];

  const daysLabel =
    item.daysUntil === undefined
      ? null
      : item.daysUntil < 0
      ? `${Math.abs(item.daysUntil)} hari yang lalu`
      : item.daysUntil === 0
      ? "Hari ini"
      : `${item.daysUntil} hari lagi`;

  return (
    <div className="flex gap-4">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className={cn("h-3 w-3 rounded-full mt-1 shrink-0 ring-2 ring-background", dotColor)} />
        {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
      </div>

      {/* Content */}
      <div className={cn("pb-6 min-w-0 flex-1", isLast && "pb-0")}>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {item.service}
          </span>
          <StatusBadge status={item.status} showDot={false} />
          {daysLabel && (
            <span
              className={cn(
                "text-xs font-medium",
                item.status === "expired"
                  ? "text-danger"
                  : item.status === "warning"
                  ? "text-warning"
                  : "text-muted-foreground"
              )}
            >
              · {daysLabel}
            </span>
          )}
        </div>
        <p className="font-semibold text-sm text-foreground">{item.title}</p>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(item.date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const { data: items, isLoading, isError } = useTimeline();

  return (
    <div className="px-6 py-8 w-full mx-auto page-enter relative">
      <div className="absolute top-0 right-0 z-[-1] h-full w-full bg-[url('/textureBg.png')] opacity-40 "></div>
      <div className="mb-8">
        <h1 className="font-display text-5xl font-bold text-foreground">Timeline</h1>
        <p className="mt-1 text-muted-foreground">
          Jadwal administrasi Anda yang terurut berdasarkan urgensi.
        </p>
      </div>

      {isError && <ErrorState />}

      {isLoading && (
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <Skeleton className="h-3 w-3 rounded-full mt-1" />
                <Skeleton className="w-px flex-1 mt-1" />
              </div>
              <div className="flex-1 pb-6 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-full max-w-sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && items && items.length === 0 && (
        <EmptyState
          title="Tidak ada jadwal"
          description="Belum ada item administrasi yang perlu dipantau."
        />
      )}

      {!isLoading && items && items.length > 0 && (
        <div>
          {items.map((item, idx) => (
            <TimelineItemCard key={item.id} item={item} isLast={idx === items.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}
