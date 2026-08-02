import type { Metadata } from "next";
import Image from "next/image";
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
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { LandingNavbar } from "@/components/shared/LandingNavbar";

import satusehatLogo from "@/assets/logoloop/satusehat.png";
import coretaxLogo from "@/assets/logoloop/coretax.png";
import signalLogo from "@/assets/logoloop/signal.png";

export const metadata: Metadata = {
  title: "PADI — Portal Administrasi Digital Indonesia",
  description:
    "Pantau seluruh administrasi dan kewajiban Anda lewat satu tempat. Pajak, BPJS, SIM, STNK, paspor, dan utilitas dalam satu dashboard terpadu.",
};

const features = [
  { icon: LayoutDashboard, title: "Dashboard Terpadu", description: "Semua layanan administrasi dalam satu tampilan. Tidak perlu berpindah-pindah aplikasi." },
  { icon: Bell, title: "Pengingat Otomatis", description: "Dapatkan notifikasi sebelum batas waktu administrasi Anda mendekati jatuh tempo." },
  { icon: Bot, title: "AI Assistant", description: "Tanya apa saja seputar administrasi kepada asisten AI yang mengerti konteks data Anda." },
  { icon: CalendarDays, title: "Timeline Cerdas", description: "Visualisasi jadwal administrasi tahunan yang mudah dipahami dan terurut prioritas." },
  { icon: FolderOpen, title: "Document Vault", description: "Simpan salinan dokumen penting Anda secara aman dan akses kapan saja." },
  { icon: CheckCircle, title: "Life Event Guide", description: "Panduan langkah-langkah administrasi saat mengalami peristiwa hidup penting." },
];

const serviceLogos = [
  { name: "SatuSehat", src: null, label: "SATUSEHAT" },
  { name: "CoreTax", src: null, label: "CORETAX" },
  { name: "Samsat", src: null, label: "SAMSAT" },
  { name: "PLN", src: null, label: "PLN" },
  { name: "PDAM", src: null, label: "PDAM" },
  { name: "Paspor", src: null, label: "M-PASPOR" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f6fa] relative overflow-x-hidden">

      {/* ── Dynamic Navbar ── */}
      <LandingNavbar />

      {/* ── Hero Section ── */}
      <section className="relative mx-auto max-w-6xl px-6 pt-28 pb-0 min-h-[600px] md:h-screen flex items-start overflow-visible">

        {/* Left: Text content */}
        <div className="relative z-10 max-w-[55%] md:max-w-[70%] pt-6 md:pt-16">
          <h1
            className="font-sans md:text-6xl text-4xl font-extrabold leading-[1.15] tracking-tight text-slate-800 animate-slide-up"
            style={{ animationDelay: "50ms" }}
          >
            Portal untuk{" "}
            <br />
            Semua{" "}
            <br />
            <span className="text-[#00254D]">Administrasi</span>
            <br />
            Anda
          </h1>

          <p
            className="mt-5 text-sm text-slate-500 leading-relaxed max-w-xs animate-slide-up"
            style={{ animationDelay: "180ms" }}
          >
            Pantau seluruh administrasi dan kewajiban anda lewat satu tempat
          </p>

          <div
            className="mt-7 animate-slide-up"
            style={{ animationDelay: "300ms" }}
          >
            <Link
              href={ROUTES.LOGIN}
              className={cn(
                buttonVariants({ size: "default" }),
                "bg-[#00254D] hover:bg-[#003870] text-white rounded-xl px-6 py-5 md:py-6 text-sm font-semibold shadow-lg shadow-[#00254D]/20 transition-all duration-200 hover:-translate-y-0.5"
              )}
            >
              Mulai Sekarang
            </Link>
          </div>
        </div>

        {/* Right: Document photos — no card style, slide in from bottom-right */}
        <div
          className="absolute -right-10 top-0 bottom-0 w-[50%] flex items-end justify-end pointer-events-none select-none"
          aria-hidden
        >
          {/* STNK — behind, tilted left, arrives first */}
          <div 
            className="absolute -right-[200px] sm:-right-[300px] lg:-right-[400px] top-16 animate-slide-in-br"
            style={{ animationDelay: "800ms" }}
          >
            <Image
              src="/stnk.webp"
              alt="STNK"
              width={900}
              height={640}
              className="w-[500px] sm:w-[700px] lg:w-[700px] h-auto object-cover drop-shadow-2xl"
              style={{
                transform: "rotate(-12deg) translateX(30px)",
                transformOrigin: "bottom center",
              }}
              priority
              unoptimized={true}
            />
          </div>

          {/* Passport — front, tilted right, arrives slightly after */}
          <div 
            className="absolute z-10 -right-[150px] sm:-right-[100px] lg:-right-[300px] top-48 animate-slide-in-br"
            style={{ animationDelay: "1000ms" }}
          >
            <Image
              src="/paspor.webp"
              alt="Paspor Indonesia"
              width={800}
              height={1120}
              className="w-[450px] sm:w-[600px] lg:w-[600px] h-auto object-cover drop-shadow-2xl"
              style={{
                transform: "rotate(6deg)",
                transformOrigin: "bottom center",
              }}
              priority
              unoptimized={true}
            />
          </div>
        </div>
      </section>

      {/* ── Services strip ── */}
      <section
        className="mx-auto max-w-6xl px-6 pt-12 pb-6 animate-slide-up"
        style={{ animationDelay: "500ms" }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 text-center mb-5">
          Layanan
        </p>
        <div className="relative flex overflow-hidden border-t border-slate-200 pt-8 pb-4 w-full group">
          {/* Gradient edges for fading effect */}
          <div className="absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r from-[#f5f6fa] to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l from-[#f5f6fa] to-transparent z-10 pointer-events-none" />

          {/* Marquee Track */}
          <div className="flex w-max animate-scroll-left items-center gap-48">
            {/* Render 6 sets to guarantee filling ultra-wide screens, translating -50% shifts exactly 3 sets */}
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-8 items-center">
                <Image src={satusehatLogo} alt="SatuSehat" className="h-10 md:h-12 w-auto object-contain drop-shadow-sm transition-transform hover:scale-110" />
                <Image src={coretaxLogo} alt="CoreTax" className="h-10 md:h-12 w-auto object-contain drop-shadow-sm transition-transform hover:scale-110" />
                <Image src={signalLogo} alt="Signal" className="h-10 md:h-12 w-auto object-contain drop-shadow-sm transition-transform hover:scale-110" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div
            className="text-center mb-12 animate-slide-up"
            style={{ animationDelay: "200ms" }}
          >
            <h2 className="font-sans text-3xl font-bold text-slate-900">
              Semua yang Anda butuhkan
            </h2>
            <p className="mt-3 text-slate-500 text-sm">
              Dirancang untuk menyederhanakan dan membantu Anda mengurus administrasi.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/80 bg-white/70 p-6 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#00254D]/8 hover:bg-white animate-slide-up"
                  style={{ animationDelay: `${300 + i * 80}ms` }}
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#00254D]/8 border border-[#00254D]/10">
                    <Icon className="h-5 w-5 text-[#00254D]" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-2 font-semibold text-slate-800 text-sm">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="px-6 pb-24 animate-slide-up"
        style={{ animationDelay: "150ms" }}
      >
        <div className="mx-auto max-w-3xl rounded-3xl bg-[#00254D] px-8 py-14 text-center shadow-2xl shadow-[#00254D]/30 relative overflow-hidden group">
          {/* Batik Overlay - Top Left */}
          <div
            className="absolute -top-50 -left-40 w-80 h-80 pointer-events-none opacity-80 transition-all duration-[1500ms] group-hover:-top-24 group-hover:-left-24 group-hover:-rotate-12"
            style={{ 
              backgroundImage: "url('/textureBg.png')", 
              backgroundSize: "180px",
              borderRadius: "4rem",
              transform: "rotate(-45deg)"
            }}
            aria-hidden
          />
          
          {/* Batik Overlay - Bottom Right */}
          <div
            className="absolute -bottom-50 -right-40 w-80 h-80 pointer-events-none opacity-100 transition-all duration-[1500ms] group-hover:-bottom-24 group-hover:-right-24 group-hover:-rotate-12"
            style={{ 
              backgroundImage: "url('/textureBg.png')", 
              backgroundSize: "180px",
              borderRadius: "4rem",
              transform: "rotate(-45deg)"
            }}
            aria-hidden
          />
          <div className="relative">
            <h2 className="font-sans text-3xl font-bold text-white">Mulai hari ini, gratis.</h2>
            <p className="mt-3 text-blue-200 text-sm">Bergabunglah dan kelola administrasi Anda dengan lebih cerdas.</p>
            <Link
              href={ROUTES.LOGIN}
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-7 gap-2 bg-white text-[#00254D] hover:bg-blue-50 font-semibold shadow-lg"
              )}
            >
              Buat Akun <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white/50 px-6 py-8 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center">
            <Image
              src="/LogoPadi.webp"
              alt="PADI Logo"
              width={100}
              height={32}
              className="h-6 w-auto object-contain grayscale opacity-80"
              unoptimized={true}
            />
          </div>
          <p className="text-xs text-slate-400">© 2026 PADI. Dibuat untuk masyarakat Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}
