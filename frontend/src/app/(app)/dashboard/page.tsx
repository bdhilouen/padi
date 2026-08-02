"use client";

import type { Metadata } from "next";
import {
  Receipt,
  HeartPulse,
  Car,
  FileText,
  BookOpen,
  Zap,
  Droplets,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useDashboard } from "@/hooks/useDashboard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServiceCard, ServiceStatus } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  Receipt,
  HeartPulse,
  Car,
  FileText,
  BookOpen,
  Zap,
  Droplets,
};

function ServiceStatusCard({ service }: { service: ServiceCard }) {
  const Icon = iconMap[service.icon] ?? FileText;
  return (
    <Card className="group transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm backdrop-blur-lg">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground">{service.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {service.description}
              </p>
            </div>
          </div>
          <StatusBadge status={service.status} className="shrink-0" />
        </div>
        {service.dueDate && (
          <p className="mt-3 text-xs text-muted-foreground border-t border-border pt-3">
            Jatuh tempo:{" "}
            <span className="font-medium text-foreground">
              {new Date(service.dueDate).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryBar({ services }: { services: ServiceCard[] }) {
  const counts = services.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    },
    {} as Record<ServiceStatus, number>
  );

  return (
    <div className="grid grid-cols-3 gap-4 mb-6 backdrop-blur-sm">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <CheckCircle className="h-5 w-5 text-success shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-2xl font-bold text-foreground">{counts.active ?? 0}</p>
            <p className="text-xs text-muted-foreground">Aktif</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <AlertTriangle className="h-5 w-5 text-warning shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-2xl font-bold text-foreground">{counts.warning ?? 0}</p>
            <p className="text-xs text-muted-foreground">Perlu Perhatian</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <XCircle className="h-5 w-5 text-danger shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-2xl font-bold text-foreground">{counts.expired ?? 0}</p>
            <p className="text-xs text-muted-foreground">Kedaluwarsa</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { data: services, isLoading, isError } = useDashboard();

  return (
    <div className=" px-6 py-8 max-w-5xl mx-auto page-enter relative">
      <div className="absolute top-0 right-0 z-[-1] h-full w-full bg-[url('/textureBg.png')] opacity-70 "></div>
      <div className="mb-8">
        <h1 className="font-sans text-5xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Pantau seluruh status administrasi Anda dalam satu tempat.
        </p>
      </div>

      {isError && <ErrorState className="mb-6" />}

      {isLoading ? (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-8 w-8 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          {/* <SummaryBar services={services} /> */}
          <h2 className="font-semibold text-foreground mb-4">Layanan Administrasi</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceStatusCard key={service.id} service={service} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
