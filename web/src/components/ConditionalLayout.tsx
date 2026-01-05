"use client";

import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/DashboardSidebar";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isVideoPage = pathname?.includes("/dashboard/videos/");

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {!isVideoPage && <DashboardSidebar />}
      <main className={`flex-1 overflow-auto ${isVideoPage ? "h-screen" : ""}`}>
        {children}
      </main>
    </div>
  );
}
