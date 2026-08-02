"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Progressive blur layer - Using Parent/Child fix for Chromium backdrop-filter bug */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[140px] pointer-events-none transition-opacity duration-500"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 40%, transparent 100%)",
          opacity: isScrolled ? 0.8 : 1, // Slightly fade the background blur when scrolled
        }}
      >
        <div
          className="w-full h-full"
          style={{
            backdropFilter: "blur(24px) saturate(1.4)",
            WebkitBackdropFilter: "blur(24px) saturate(1.4)",
            backgroundColor: "rgba(245,246,250,0.7)",
          }}
        />
      </div>

      {/* Navbar Content - Transitions into a floating pill on scroll (Laptop only) */}
      <div
        className={cn(
          "relative mx-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isScrolled
            ? "max-w-6xl px-6 py-3 lg:max-w-4xl lg:px-8 lg:py-3 lg:mt-4 lg:bg-white/60 lg:backdrop-blur-sm lg:rounded-full lg:shadow-xl lg:shadow-[#00254D]/5 lg:border lg:border-white/80"
            : "max-w-6xl px-6 py-4 lg:mt-0 lg:bg-transparent lg:shadow-none lg:border-transparent lg:rounded-none"
        )}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center animate-fade-in-down">
          <Image
            src="/LogoPadi.webp"
            alt="PADI Logo"
            width={120}
            height={40}
            className="h-9 w-auto object-contain"
            priority
            unoptimized={true}
          />
        </Link>

        <Link
          href={ROUTES.LOGIN}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 text-[#00254D] font-medium animate-fade-in-down transition-all duration-300",
            isScrolled && "lg:hover:bg-gray-50"
          )}
          style={{ animationDelay: "100ms" }}
        >
          Masuk <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}
