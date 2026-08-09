"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Bot,
  FolderOpen,
  Sparkles,
  User,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Timeline", href: ROUTES.TIMELINE, icon: CalendarDays },
  { label: "AI Assistant", href: ROUTES.AI_ASSISTANT, icon: Bot },
  { label: "Dokumen", href: ROUTES.DOCUMENT_VAULT, icon: FolderOpen },
  { label: "Life Event", href: ROUTES.LIFE_EVENT, icon: Sparkles },
  { label: "Profil", href: ROUTES.PROFILE, icon: User },
  { label: "Pengaturan", href: ROUTES.SETTINGS, icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-sidebar h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-border flex justify-center">
        <Link href={ROUTES.DASHBOARD} className="flex items-center justify-center transition-opacity hover:opacity-80">
          <Image src="/LogoPadi.webp" alt="Logo Padi" width={120} height={40} className="w-28 h-auto dark:hidden object-contain" priority />
          <Image src="/LogoPadiWhite.png" alt="Logo Padi" width={120} height={40} className="w-28 h-auto hidden dark:block object-contain" priority />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-120",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={1.5}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-3 pb-4">
        <Separator className="mb-4" />
        <div className="flex items-center gap-3 px-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-primary">
              {user?.full_name?.charAt(0) ?? "U"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.full_name ?? "Pengguna"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-danger hover:bg-danger/10"
          onClick={logout}
        >
          <LogOut className="h-4 w-4" strokeWidth={1.5} />
          Keluar
        </Button>
      </div>
    </aside>
  );
}
