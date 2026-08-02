"use client";

import { useState } from "react";
import { Moon, Sun, Monitor, Bell, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { mockNotificationSettings } from "@/lib/mock-data";
import type { NotificationSetting } from "@/types";
import { cn } from "@/lib/utils";

function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const options = [
    { value: "light", label: "Terang", icon: Sun },
    { value: "dark", label: "Gelap", icon: Moon },
    { value: "system", label: "Sistem", icon: Monitor },
  ] as const;

  return (
    <div className="flex gap-2">
      {options.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex-1 flex flex-col items-center gap-1.5 rounded-lg border py-3 px-2 text-xs font-medium transition-colors duration-120",
            theme === value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
          aria-pressed={theme === value}
        >
          <Icon className="h-4 w-4" strokeWidth={1.5} />
          {label}
        </button>
      ))}
    </div>
  );
}

function NotifToggle({ setting }: { setting: NotificationSetting }) {
  const [enabled, setEnabled] = useState(setting.enabled);
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{setting.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{setting.description}</p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        aria-label={setting.label}
        onClick={() => setEnabled((v) => !v)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
          enabled ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200",
            enabled ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { logout } = useAuth();
  return (
    <div className="px-6 py-8 max-w-2xl mx-auto page-enter">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Pengaturan</h1>
        <p className="mt-1 text-muted-foreground">Kelola preferensi dan akun Anda.</p>
      </div>

      {/* Appearance */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Tampilan</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">Pilih tema aplikasi</p>
          <ThemeSelector />
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <CardTitle className="text-base font-semibold">Notifikasi</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {mockNotificationSettings.map((s, idx) => (
            <div key={s.id}>
              <NotifToggle setting={s} />
              {idx < mockNotificationSettings.length - 1 && <Separator className="mt-5" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Akun</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={logout}
            id="btn-logout"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.5} />
            Keluar dari CitizenHub
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
