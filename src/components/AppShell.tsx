"use client";

import { ReactNode } from "react";
import { TabProvider } from "@/context/TabContext";
import { Sidebar } from "@/components/salesforce/Sidebar";
import { TopNav } from "@/components/salesforce/TopNav";
import { TabContent } from "@/components/TabContent";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TabProvider>
      <div className="flex h-screen">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top navigation with tabs */}
          <TopNav />

          {/* Tab content area */}
          <main className="flex-1 overflow-auto bg-[#c0c0c0]">
            <TabContent />
          </main>
        </div>
      </div>
    </TabProvider>
  );
}
