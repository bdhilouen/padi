"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";

const consentItems = [
  {
    id: "data_kependudukan",
    title: "Data Kependudukan",
    description:
      "Nama, NIK, alamat, dan tanggal lahir dari data Dukcapil Anda.",
  },
  {
    id: "data_pajak",
    title: "Data Perpajakan",
    description:
      "Status NPWP dan informasi kewajiban pajak dari DJP.",
  },
  {
    id: "data_bpjs",
    title: "Data BPJS",
    description:
      "Status kepesertaan dan iuran BPJS Kesehatan Anda.",
  },
  {
    id: "data_kendaraan",
    title: "Data Kendaraan",
    description:
      "Informasi SIM dan STNK dari Korlantas Polri.",
  },
  {
    id: "data_utilitas",
    title: "Tagihan Utilitas",
    description:
      "Status tagihan PLN dan PDAM atas nama Anda.",
  },
];

export default function ConsentPage() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleContinue() {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    router.push(ROUTES.DASHBOARD);
  }

  return (
    <div className="page-enter">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Shield className="h-6 w-6" />
        </div>
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Izin Akses Data</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            CitizenHub memerlukan izin untuk mengakses data berikut
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
              Saya menyetujui CitizenHub untuk mengakses dan menampilkan data
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
          disabled={!agreed || isLoading}
          onClick={handleContinue}
          id="btn-continue-consent"
        >
          {isLoading ? "Memproses..." : "Lanjutkan ke Dashboard"}
          {!isLoading && <ChevronRight className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => router.push(ROUTES.LOGIN)}
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
