"use client";

import { cn } from "@/lib/utils";
import {
  Receipt,
  HeartPulse,
  Car,
  FileText,
  BookOpen,
  Zap,
  Droplets,
  AlertTriangle,
  Activity,
  Briefcase,
  AlertOctagon,
  Lock,
  RefreshCw,
  CheckCircle,
  CalendarDays,
} from "lucide-react";
import { useDashboard, useRefreshDashboard } from "@/hooks/useDashboard";
import { useTimeline } from "@/hooks/useTimeline";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import type { ServiceCard, TimelineItem } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  Receipt,
  HeartPulse,
  Car,
  FileText,
  BookOpen,
  Zap,
  Droplets,
  Activity,
  Briefcase,
  AlertOctagon,
};

function ServiceStatusCard({ service, deadline }: { service: ServiceCard; deadline?: TimelineItem }) {
  const Icon = iconMap[service.icon] ?? FileText;

  const isExpired = deadline && (deadline.daysUntil ?? 0) < 0;
  const isUrgent = deadline && !isExpired && (deadline.daysUntil ?? 99) <= 7;

  return (
    <Card className={cn(
      "group transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm backdrop-blur-lg",
      isUrgent && "border-warning/40",
      isExpired && "border-danger/30"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              isUrgent ? "bg-warning/15" : isExpired ? "bg-danger/10" : "bg-primary/10"
            )}>
              <Icon className={cn(
                "h-5 w-5",
                isUrgent ? "text-warning" : isExpired ? "text-danger" : "text-primary"
              )} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground">{service.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {service.description}
              </p>
            </div>
          </div>
          {service.consentRequired ? (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              <Lock className="h-3 w-3" /> Izin
            </span>
          ) : service.syncError ? (
            <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning">
              <AlertTriangle className="h-3 w-3" /> Error
            </span>
          ) : (
            <StatusBadge status={service.status} className="shrink-0" />
          )}
        </div>
        
        {/* Deadline Information */}
        {!service.consentRequired && !service.syncError && (
          <div className="mt-4 text-xs border-t border-border pt-3">
            {deadline ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground font-medium">Tenggat terdekat:</span>
                  {isExpired ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-danger bg-danger/10 rounded-full px-2 py-0.5">
                      <AlertOctagon className="h-3 w-3" strokeWidth={2} /> Terlewat
                    </span>
                  ) : deadline.daysUntil === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-danger bg-danger/10 rounded-full px-2 py-0.5">
                      Hari ini!
                    </span>
                  ) : (deadline.daysUntil ?? 99) <= 7 ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-warning bg-warning/10 rounded-full px-2 py-0.5">
                      <AlertTriangle className="h-3 w-3" strokeWidth={2} /> {deadline.daysUntil} hari lagi
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{deadline.daysUntil} hari lagi</span>
                  )}
                </div>
                <p className="font-semibold text-foreground line-clamp-1">{deadline.title}</p>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CalendarDays className="h-3 w-3 shrink-0" strokeWidth={1.5} />
                  <span>
                    {new Date(deadline.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {deadline.description && (
                  <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2 pt-0.5">{deadline.description}</p>
                )}
              </div>
            ) : service.lastUpdated ? (
              <div className="inline-flex items-center gap-1.5 font-medium text-primary bg-primary/10 px-2.5 py-1.5 rounded-md">
                <CheckCircle className="h-3.5 w-3.5" /> Semua kewajiban terpenuhi
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: services, isLoading, isError } = useDashboard();
  const { data: timelines } = useTimeline();
  const { mutate: refresh, isPending: isRefreshing } = useRefreshDashboard();

  return (
    <div className="page-container-wide page-enter">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-5xl font-bold text-foreground">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Pantau seluruh status administrasi Anda dalam satu tempat.
          </p>
        </div>
        
      </div>

      <button
          onClick={() => refresh()}
          disabled={isRefreshing || isLoading}
          className="shrink-0 flex items-center gap-1.5 text-md text-muted-foreground hover:text-foreground transition-colors mt-2 disabled:opacity-50 w-full justify-end mb-4"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          {isRefreshing ? 'Menyinkronkan...' : 'Sinkronkan'}
        </button>
      {isError && <ErrorState className="mb-6" />}

      {isLoading ? (
        <>
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-8 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : services ? (
        <>
          <h2 className="font-semibold text-foreground mb-4">Layanan Administrasi</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((service) => (
              <ServiceStatusCard 
                key={service.id} 
                service={service} 
                deadline={timelines?.find(t => t.serviceId === service.id)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
