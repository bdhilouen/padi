import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  ArrowRight,
  CalendarDays,
  Bot,
  FolderOpen,
  Bell,
  CheckCircle,
  LayoutDashboard,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "CitizenHub — Satu Dashboard untuk Semua Administrasi",
  description:
    "Pantau status pajak, BPJS, SIM, STNK, paspor, dan utilitas dalam satu dashboard terpadu. Administrasi Indonesia jadi lebih mudah.",
};

const features = [
  { icon: LayoutDashboard, title: "Dashboard Terpadu", description: "Semua layanan administrasi dalam satu tampilan. Tidak perlu berpindah-pindah aplikasi." },
  { icon: Bell, title: "Pengingat Otomatis", description: "Dapatkan notifikasi sebelum batas waktu administrasi Anda mendekati jatuh tempo." },
  { icon: Bot, title: "AI Assistant", description: "Tanya apa saja seputar administrasi kepada asisten AI yang mengerti konteks data Anda." },
  { icon: CalendarDays, title: "Timeline Cerdas", description: "Visualisasi jadwal administrasi tahunan yang mudah dipahami dan terurut prioritas." },
  { icon: FolderOpen, title: "Document Vault", description: "Simpan salinan dokumen penting Anda secara aman dan akses kapan saja." },
  { icon: CheckCircle, title: "Life Event Guide", description: "Panduan langkah-langkah administrasi saat mengalami peristiwa hidup penting." },
];

const services = ["Pajak", "BPJS", "SIM", "STNK", "Paspor", "PLN", "PDAM"];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <span className="font-sans font-bold text-lg text-foreground">PADI</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* <Link href={ROUTES.LOGIN} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
              Masuk
            </Link> */}
            <Link href={ROUTES.LOGIN} className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
              Mulai Sekarang <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-16 text-left page-enter">
        <div aria-hidden className=" hidden pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="relative mx-auto max-w-3xl">
          {/* <Badge variant="secondary" className="mb-6 gap-1.5 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Platform Administrasi Indonesia
          </Badge> */}
          <h1 className="font-sans text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
            Portal untuk{" "}
            <span className="text-blue-900">Semua Administrasi</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-md text-muted-foreground leading-relaxed">
            Pantau pajak, BPJS, SIM, STNK, paspor, dan utilitas dalam satu tempat. Tidak ada lagi kewajiban yang terlupa.
          </p>
          <div className="mt-8 flex flex-wrap items-start justify-start gap-3">
            <Link href={ROUTES.LOGIN} className={cn(buttonVariants({ size: "lg" }), "gap-2")}>
              Buat Akun <ArrowRight className="h-4 w-4" />
            </Link>
            {/* <Link href={ROUTES.LOGIN} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
              Lihat Demo
            </Link> */}
          </div>
        </div>
      </section>

      {/* Services Strip */}
      <section className="border-y border-border bg-muted/30 px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">Layanan yang didukung</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {services.map((s) => (
              <Badge key={s} variant="outline" className="px-4 py-1.5 text-sm font-medium">{s}</Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-bold text-foreground">Semua yang Anda butuhkan</h2>
            <p className="mt-3 text-muted-foreground">Dirancang untuk menyederhanakan birokrasi, bukan mempersulit.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="group rounded-xl border border-border bg-card p-6 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl rounded-2xl border border-primary/20 bg-primary/5 px-8 py-12 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">Mulai hari ini, gratis.</h2>
          <p className="mt-3 text-muted-foreground">Bergabunglah dan kelola administrasi Anda dengan lebih cerdas.</p>
          <Link href={ROUTES.LOGIN} className={cn(buttonVariants({ size: "lg" }), "mt-6 gap-2")}>
            Buat Akun <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <Shield className="h-3 w-3" />
            </div>
            <span className="font-display font-semibold text-sm text-foreground">CitizenHub</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 CitizenHub. Dibuat untuk masyarakat Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}
