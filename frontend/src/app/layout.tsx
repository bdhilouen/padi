import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Padi — Dashboard Administrasi Indonesia",
    template: "%s | CitizenHub",
  },
  description:
    "Platform terpadu untuk memantau seluruh kebutuhan administrasi masyarakat Indonesia dalam satu dashboard — pajak, BPJS, SIM, STNK, paspor, dan lebih banyak lagi.",
  keywords: ["administrasi", "pajak", "BPJS", "SIM", "STNK", "paspor", "pemerintah", "Indonesia"],
  authors: [{ name: "CitizenHub Team" }],
  creator: "CitizenHub",
  manifest: "/manifest.json",
  icons: {
    icon: "/LogoPadi.webp",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1117" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
