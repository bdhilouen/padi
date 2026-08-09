"use client";

import { useTimeline } from "@/hooks/useTimeline";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TimelineItem } from "@/types";
import { useState } from "react";
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  CalendarDays,
  Filter,
} from "lucide-react";

// ─── Urgency helpers ──────────────────────────────────────────────────────────

function getUrgencyLabel(daysUntil?: number) {
  if (daysUntil === undefined) return null;
  if (daysUntil < 0) return { label: "Lewat tenggat", color: "text-danger", Icon: AlertOctagon };
  if (daysUntil === 0) return { label: "Hari ini!", color: "text-danger", Icon: AlertOctagon };
  if (daysUntil <= 7) return { label: `${daysUntil} hari lagi`, color: "text-warning", Icon: AlertTriangle };
  if (daysUntil <= 30) return { label: `${daysUntil} hari lagi`, color: "text-primary", Icon: Clock };
  return { label: `${daysUntil} hari lagi`, color: "text-muted-foreground", Icon: CalendarDays };
}

// ─── Timeline Item Card ───────────────────────────────────────────────────────

function TimelineItemCard({ item, isLast }: { item: TimelineItem; isLast: boolean }) {
  const dotColor = {
    active: "bg-success",
    warning: "bg-warning",
    expired: "bg-danger",
    unknown: "bg-muted-foreground",
  }[item.status];

  const ringColor = {
    active: "ring-success/30",
    warning: "ring-warning/30",
    expired: "ring-danger/30",
    unknown: "ring-muted/30",
  }[item.status];

  const urgency = getUrgencyLabel(item.daysUntil);

  const formattedDate = new Date(item.date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isExpired = (item.daysUntil ?? 0) < 0;
  const isUrgent = !isExpired && (item.daysUntil ?? 99) <= 7;

  return (
    <div className={cn(
      "flex gap-4 group",
      isExpired && "opacity-70"
    )}>
      {/* Timeline Line */}
      <div className="flex flex-col items-center shrink-0">
        <div className={cn(
          "h-3.5 w-3.5 rounded-full mt-1.5 shrink-0 ring-4 ring-offset-0 transition-transform group-hover:scale-125",
          dotColor,
          ringColor
        )} />
        {!isLast && <div className="w-px flex-1 bg-border mt-1.5 min-h-8" />}
      </div>

      {/* Content Card */}
      <div className={cn(
        "pb-6 min-w-0 flex-1 rounded-xl border p-4 mb-2 transition-all",
        isLast && "pb-0",
        isUrgent
          ? "border-warning/40 bg-warning/5 hover:bg-warning/10"
          : isExpired
          ? "border-danger/30 bg-danger/5"
          : "border-border bg-card hover:bg-accent/30"
      )}>
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {item.service}
          </span>
          <StatusBadge status={item.status} showDot={false} />
          {urgency && (
            <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", urgency.color)}>
              <urgency.Icon className="h-3 w-3" strokeWidth={2} />
              {urgency.label}
            </span>
          )}
        </div>

        {/* Title */}
        <p className="font-semibold text-sm text-foreground leading-snug">{item.title}</p>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.description}</p>
        )}

        {/* Footer: Date + days chip */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{formattedDate}</span>
          </div>
          {isExpired ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-danger bg-danger/10 rounded-full px-2 py-0.5">
              Sudah Lewat
            </span>
          ) : item.daysUntil === 0 ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-danger bg-danger/10 rounded-full px-2 py-0.5">
              Hari Ini
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Filter Tab ───────────────────────────────────────────────────────────────

type FilterType = "all" | "urgent" | "active" | "expired";

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "urgent", label: "Mendesak" },
  { key: "active", label: "Aktif" },
  { key: "expired", label: "Terlewat" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TimelinePage() {
  const { data: items, isLoading, isError } = useTimeline();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredItems = items?.filter((item) => {
    if (filter === "all") return true;
    if (filter === "urgent") return (item.daysUntil ?? 99) >= 0 && (item.daysUntil ?? 99) <= 7;
    if (filter === "active") return item.status === "active" && (item.daysUntil ?? 0) > 7;
    if (filter === "expired") return (item.daysUntil ?? 0) < 0 || item.status === "expired";
    return true;
  });

  const urgentCount = items?.filter((i) => (i.daysUntil ?? 99) >= 0 && (i.daysUntil ?? 99) <= 7).length ?? 0;
  const expiredCount = items?.filter((i) => (i.daysUntil ?? 0) < 0).length ?? 0;

  return (
    <div className="page-container-wide page-enter">

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-sans text-5xl font-bold text-foreground">Timeline</h1>
        <p className="mt-1 text-muted-foreground">
          Jadwal administrasi Anda yang terurut berdasarkan urgensi.
        </p>
      </div>

      {/* Summary chips */}
      {!isLoading && items && (
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold text-foreground">{items.length}</span>
          </div>
          {urgentCount > 0 && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning" strokeWidth={2} />
              <span className="text-warning font-semibold">{urgentCount} mendesak</span>
            </div>
          )}
          {expiredCount > 0 && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm">
              <AlertOctagon className="h-4 w-4 text-danger" strokeWidth={2} />
              <span className="text-danger font-semibold">{expiredCount} terlewat</span>
            </div>
          )}
          {urgentCount === 0 && expiredCount === 0 && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-success/40 bg-success/10 px-4 py-2.5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" strokeWidth={2} />
              <span className="text-success font-semibold">Semua kewajiban aman</span>
            </div>
          )}
        </div>
      )}

      {/* Filter tabs */}
      {!isLoading && items && items.length > 0 && (
        <div className="flex items-center gap-1.5 mb-6 p-1 bg-muted/60 rounded-xl w-fit">
          <Filter className="h-3.5 w-3.5 text-muted-foreground ml-2" strokeWidth={1.5} />
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                filter === opt.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {isError && <ErrorState />}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <Skeleton className="h-3.5 w-3.5 rounded-full mt-1" />
                <Skeleton className="w-px flex-1 mt-1" />
              </div>
              <div className="flex-1 pb-6 space-y-2 rounded-xl border border-border p-4">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-full max-w-sm" />
                <Skeleton className="h-3 w-36 mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredItems && filteredItems.length === 0 && (
        <EmptyState
          title={filter === "all" ? "Tidak ada jadwal" : `Tidak ada item "${FILTER_OPTIONS.find(f=>f.key===filter)?.label}"`}
          description={filter === "all" ? "Belum ada item administrasi yang perlu dipantau." : "Coba pilih filter lain."}
        />
      )}

      {!isLoading && filteredItems && filteredItems.length > 0 && (
        <div>
          {filteredItems.map((item, idx) => (
            <TimelineItemCard key={item.id} item={item} isLast={idx === filteredItems.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}
