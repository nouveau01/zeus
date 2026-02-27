"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TabProvider } from "@/context/TabContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { TabContent } from "@/components/TabContent";
import { useUIMode } from "@/context/UIModeContext";

// Pages that should NOT show the app shell (sidebar/topnav)
const STANDALONE_PAGES = ["/login"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { mode } = useUIMode();

  // For standalone pages, render just the children without the shell
  if (STANDALONE_PAGES.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <TabProvider>
      <div className={`flex flex-col h-screen ${mode === "modern" ? "zeus-modern" : "zeus-classic"}`} data-ui-mode={mode}>
        {/* Top navigation with ZEUS logo and tabs - spans full width */}
        <TopNav />

        {/* Main area: Sidebar + Content side by side */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Tab content area */}
          <main className={`flex-1 overflow-auto ${mode === "modern" ? "bg-[#f5f7fa]" : "bg-[#c0c0c0]"}`}>
            <TabContent />
          </main>
        </div>
      </div>
    </TabProvider>
  );
}
