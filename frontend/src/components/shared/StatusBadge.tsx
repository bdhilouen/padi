import { cn } from "@/lib/utils";
import type { ServiceStatus } from "@/types";

interface StatusBadgeProps {
  status: ServiceStatus;
  className?: string;
  showDot?: boolean;
}

const statusConfig: Record<ServiceStatus, { label: string; className: string }> = {
  active: {
    label: "Aktif",
    className: "bg-success/10 text-success border-success/20",
  },
  warning: {
    label: "Akan Habis",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  expired: {
    label: "Kedaluwarsa",
    className: "bg-danger/10 text-danger border-danger/20",
  },
  unknown: {
    label: "Tidak Diketahui",
    className: "bg-muted text-muted-foreground border-border",
  },
};

const dotColor: Record<ServiceStatus, string> = {
  active: "bg-success",
  warning: "bg-warning",
  expired: "bg-danger",
  unknown: "bg-muted-foreground",
};

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {showDot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColor[status])} />
      )}
      {config.label}
    </span>
  );
}
