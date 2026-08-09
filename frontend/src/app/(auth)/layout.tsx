import Image from "next/image";
import wayangImg from "@/assets/motives/wayang.png";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      <Image 
        src={wayangImg} 
        alt="Wayang Kiri" 
        className="hidden lg:block absolute -bottom-70 -left-70 h-[125vh] w-auto scale-x-[-1] pointer-events-none select-none z-0 animate-wayang-left" 
      />
      <Image 
        src={wayangImg} 
        alt="Wayang Kanan" 
        className="hidden lg:block absolute -bottom-70 -right-70 h-[125vh] w-auto pointer-events-none select-none z-0 animate-wayang-right" 
      />
      <div className="w-full max-w-md relative z-10">{children}</div>
    </div>
  );
}
