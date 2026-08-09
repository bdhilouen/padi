"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { useGrantAllConsents } from "@/hooks/useConsent";
import { toast } from "sonner";

const consentItems = [
  {
    id: "data_kependudukan",
    title: "Data Perpajakan (CoreTax)",
    description: "Status NPWP dan informasi kewajiban pajak dari DJP.",
  },
  {
    id: "data_bpjs",
    title: "Data BPJS Kesehatan",
    description: "Status kepesertaan dan iuran BPJS Kesehatan Anda.",
  },
  {
    id: "data_satusehat",
    title: "SatuSehat",
    description: "Rekam medis dan riwayat kesehatan digital Anda.",
  },
  {
    id: "data_oss",
    title: "Perizinan OSS",
    description: "Nomor Induk Berusaha dan izin usaha dari sistem OSS.",
  },
  {
    id: "data_kendaraan",
    title: "Data Kendaraan (STNK/Samsat)",
    description: "Informasi pajak kendaraan dan STNK dari Samsat.",
  },
  {
    id: "data_pln",
    title: "Tagihan PLN",
    description: "Status tagihan listrik atas nama Anda.",
  },
  {
    id: "data_pdam",
    title: "Tagihan PDAM",
    description: "Status tagihan air bersih atas nama Anda.",
  },
  {
    id: "data_etle",
    title: "e-TLE (Tilang Elektronik)",
    description: "Pelanggaran lalu lintas elektronik terdaftar atas nama Anda.",
  },
  {
    id: "data_paspor",
    title: "Paspor (M-Paspor)",
    description: "Status dan masa berlaku paspor Anda.",
  },
];

export default function ConsentPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const { mutateAsync: grantAllConsents, isPending } = useGrantAllConsents();

  async function handleContinue() {
    try {
      await grantAllConsents();
      router.push(ROUTES.DASHBOARD);
    } catch {
      toast.error("Gagal menyimpan izin akses. Silakan coba lagi.");
    }
  }

  return (
    <div className="page-enter">
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image src="/LogoPadi.webp" alt="Logo Padi" width={160} height={50} className="w-32 h-auto dark:hidden object-contain" priority />
        <Image src="/LogoPadiWhite.png" alt="Logo Padi" width={160} height={50} className="w-32 h-auto hidden dark:block object-contain" priority />
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Izin Akses Data</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Padi memerlukan izin untuk mengakses data berikut
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {consentItems.map((item) => (
            <div key={item.id} className="flex items-start gap-4 px-6 py-4">
              <CheckCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                strokeWidth={1.5}
              />
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border bg-muted/30 px-6 py-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              id="agree-consent"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-foreground leading-snug">
              Saya menyetujui Padi untuk mengakses dan menampilkan data
              administrasi saya sesuai dengan{" "}
              <button type="button" className="text-primary hover:underline font-medium">
                Kebijakan Privasi
              </button>{" "}
              yang berlaku.
            </span>
          </label>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button
          className="w-full gap-2"
          disabled={!agreed || isPending}
          onClick={handleContinue}
          id="btn-continue-consent"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan izin...
            </>
          ) : (
            <>
              Lanjutkan ke Dashboard
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => router.push(ROUTES.LOGIN)}
          disabled={isPending}
        >
          Kembali
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Data Anda diproses sesuai UU PDP No. 27 Tahun 2022 dan tidak dibagikan
        kepada pihak ketiga.
      </p>
    </div>
  );
}
