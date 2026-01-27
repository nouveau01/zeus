"use client";

import { ReactNode } from "react";
import { TabProvider } from "@/context/TabContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { TabContent } from "@/components/TabContent";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TabProvider>
      <div className="flex flex-col h-screen">
        {/* Top navigation with ZEUS logo and tabs - spans full width */}
        <TopNav />

        {/* Main area: Sidebar + Content side by side */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Tab content area */}
          <main className="flex-1 overflow-auto bg-[#c0c0c0]">
            <TabContent />
          </main>
        </div>
      </div>
    </TabProvider>
  );
}
