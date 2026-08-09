import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-full min-h-screen relative">
      {/* Global batik background — shared across all app pages */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[url('/textureBg.png')] opacity-50 dark:opacity-20"
        aria-hidden="true"
      />
      <Sidebar />
      <main className="relative z-10 flex-1 min-w-0 pb-20 lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

