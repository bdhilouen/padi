import { User, Mail, Phone, MapPin, Calendar, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { mockUser } from "@/lib/mock-data";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
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
  const user = mockUser;
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="px-6 py-8 max-w-2xl mx-auto page-enter relative">
      <div className="absolute top-0 right-0 z-[-1] h-full w-full bg-[url('/textureBg.png')] opacity-70"></div>
      <div className="mb-8">
        <h1 className="font-sans text-5xl font-bold text-foreground">Profil</h1>
        <p className="mt-1 text-muted-foreground">Informasi akun dan identitas Anda.</p>
      </div>
      <Card className="mb-6 !bg-white/10 dark:!bg-black/20 backdrop-blur-md border-white/20">
        <CardContent className="p-6 flex justify-center">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="!bg-white/10 dark:!bg-black/20 backdrop-blur-sm border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Data Kependudukan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <InfoRow icon={CreditCard} label="NIK" value={user.nik} />
          <Separator />
          <InfoRow icon={User} label="Nama Lengkap" value={user.name} />
          <Separator />
          <InfoRow icon={Mail} label="Email" value={user.email} />
          <Separator />
          <InfoRow icon={Phone} label="Nomor Telepon" value={user.phone} />
          <Separator />
          <InfoRow icon={Calendar} label="Tanggal Lahir" value={new Date(user.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} />
          <Separator />
          <InfoRow icon={MapPin} label="Alamat" value={user.address} />
        </CardContent>
      </Card>
    </div>
  );
}
