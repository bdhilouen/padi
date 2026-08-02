"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  User,
  Settings,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";

const mobileNavItems = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Dokumen", href: ROUTES.DOCUMENT_VAULT, icon: FileText },
  { label: "AI", href: ROUTES.AI_ASSISTANT, icon: Bot },
  { label: "Profil", href: ROUTES.PROFILE, icon: User },
  { label: "Setting", href: ROUTES.SETTINGS, icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/10 backdrop-blur-sm"
      aria-label="Navigasi Mobile"
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 min-w-[56px] transition-colors duration-120",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn("h-5 w-5", isActive ? "text-primary" : "")}
                strokeWidth={isActive ? 2 : 1.5}
              />
              <span className={cn("text-[10px] font-medium leading-tight", isActive ? "text-primary" : "")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for iOS */}
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
}
