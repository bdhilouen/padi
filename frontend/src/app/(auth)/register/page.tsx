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
import { useRouter } from "next/navigation";

const registerSchema = z
  .object({
    nik: z
      .string()
      .min(16, "NIK harus 16 digit")
      .max(16, "NIK harus 16 digit")
      .regex(/^\d+$/, "NIK hanya boleh berisi angka"),
    full_name: z
      .string()
      .min(3, "Nama lengkap minimal 3 karakter")
      .max(100, "Nama terlalu panjang"),
    email: z.string().email("Format email tidak valid"),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .regex(/[A-Z]/, "Password harus mengandung huruf kapital")
      .regex(/[0-9]/, "Password harus mengandung angka"),
    confirm_password: z.string().min(1, "Konfirmasi password tidak boleh kosong"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm_password"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    try {
      await registerUser({
        nik: values.nik,
        email: values.email,
        full_name: values.full_name,
        password: values.password,
      });
      toast.success("Akun berhasil dibuat! Silakan masuk.");
      router.push(ROUTES.LOGIN);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Gagal membuat akun. Pastikan data Anda benar.";
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
          <h1 className="font-display text-2xl font-bold text-foreground">
            Daftar ke Padi
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Buat akun untuk mengelola administrasi Indonesia Anda
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

          {/* Nama Lengkap */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Nama Lengkap</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Sesuai KTP"
              autoComplete="name"
              {...register("full_name")}
              className={cn(
                errors.full_name && "border-danger focus-visible:ring-danger/30"
              )}
              aria-describedby={errors.full_name ? "full-name-error" : undefined}
              aria-invalid={!!errors.full_name}
            />
            {errors.full_name && (
              <p id="full-name-error" className="text-xs text-danger">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              autoComplete="email"
              {...register("email")}
              className={cn(
                errors.email && "border-danger focus-visible:ring-danger/30"
              )}
              aria-describedby={errors.email ? "email-error" : undefined}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p id="email-error" className="text-xs text-danger">
                {errors.email.message}
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
                placeholder="Min. 8 karakter, huruf kapital & angka"
                autoComplete="new-password"
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

          {/* Konfirmasi Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Konfirmasi Password</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirm ? "text" : "password"}
                placeholder="Ulangi password Anda"
                autoComplete="new-password"
                {...register("confirm_password")}
                className={cn(
                  "pr-10",
                  errors.confirm_password &&
                    "border-danger focus-visible:ring-danger/30"
                )}
                aria-describedby={
                  errors.confirm_password ? "confirm-password-error" : undefined
                }
                aria-invalid={!!errors.confirm_password}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirm ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
            {errors.confirm_password && (
              <p id="confirm-password-error" className="text-xs text-danger">
                {errors.confirm_password.message}
              </p>
            )}
          </div>

          <Button
            id="btn-register-submit"
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Mendaftar..." : "Buat Akun"}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
          Masuk sekarang
        </Link>
      </p>
    </div>
  );
}
