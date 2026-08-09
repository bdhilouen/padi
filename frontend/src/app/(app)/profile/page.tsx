"use client";

import { User, Mail, Phone, ShieldCheck, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();

  const initials = profile
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "..";

  return (
    <div className="page-container-narrow page-enter">
      <div className="mb-8">
        <h1 className="font-sans text-5xl font-bold text-foreground">Profil</h1>
        <p className="mt-1 text-muted-foreground">Informasi akun dan identitas Anda.</p>
      </div>

      {/* On lg+: side-by-side layout. On mobile: stacked */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Avatar Card — fixed width on desktop */}
        <Card className="lg:w-80 lg:shrink-0 w-full !bg-white/10 dark:!bg-black/20 backdrop-blur-md border-white/20">
          <CardContent className="p-6 flex justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2 text-center">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-48" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {profile?.full_name ?? "-"}
                  </h2>
                  <p className="text-sm text-muted-foreground">{profile?.email ?? "-"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card — fills remaining space */}
        <Card className="flex-1 w-full !bg-white/10 dark:!bg-black/20 backdrop-blur-sm border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Data Akun</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              ))
            ) : profile ? (
              <>
                <InfoRow icon={User} label="Nama Lengkap" value={profile.full_name} />
                <Separator />
                <InfoRow icon={Mail} label="Email" value={profile.email} />
                <Separator />
                <InfoRow
                  icon={Phone}
                  label="Nomor Telepon"
                  value={profile.phone_number ?? "-"}
                />
                <Separator />
                <InfoRow
                  icon={ShieldCheck}
                  label="Role"
                  value={profile.role === "ADMINISTRATOR" ? "Administrator" : "Pengguna"}
                />
                <Separator />
                <InfoRow
                  icon={Calendar}
                  label="Bergabung Sejak"
                  value={new Date(profile.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
