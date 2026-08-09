"use client";

import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Shield, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const loginSchema = z.object({
  nik: z
    .string()
    .min(16, "NIK harus 16 digit")
    .max(16, "NIK harus 16 digit")
    .regex(/^\d+$/, "NIK hanya boleh berisi angka"),
  password: z.string().min(1, "Password tidak boleh kosong"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    try {
      await login(values.nik, values.password);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "NIK atau password salah";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page-enter">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <Image src="/LogoPadi.webp" alt="Logo Padi" width={160} height={50} className="w-32 h-auto dark:hidden object-contain" priority />
        <Image src="/LogoPadiWhite.png" alt="Logo Padi" width={160} height={50} className="w-32 h-auto hidden dark:block object-contain" priority />
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">Masuk ke Padi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola administrasi Indonesia Anda dalam satu tempat
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* NIK */}
          <div className="space-y-2">
            <Label htmlFor="nik">NIK (Nomor Induk Kependudukan)</Label>
            <Input
              id="nik"
              type="text"
              inputMode="numeric"
              maxLength={16}
              placeholder="16 digit NIK Anda"
              autoComplete="off"
              {...register("nik")}
              className={cn(errors.nik && "border-danger focus-visible:ring-danger/30")}
              aria-describedby={errors.nik ? "nik-error" : undefined}
              aria-invalid={!!errors.nik}
            />
            {errors.nik && (
              <p id="nik-error" className="text-xs text-danger">
                {errors.nik.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password Anda"
                autoComplete="current-password"
                {...register("password")}
                className={cn(
                  "pr-10",
                  errors.password && "border-danger focus-visible:ring-danger/30"
                )}
                aria-describedby={errors.password ? "password-error" : undefined}
                aria-invalid={!!errors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-xs text-danger">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Memverifikasi..." : "Masuk"}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Daftar sekarang
        </Link>
      </p>
    </div>
  );
}
