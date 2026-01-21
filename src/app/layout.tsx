import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/salesforce/Sidebar";
import { TopNav } from "@/components/salesforce/TopNav";

export const metadata: Metadata = {
  title: "ZEUS",
  description: "ZEUS - Field Service Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="flex h-screen">
          {/* Salesforce-style sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top navigation */}
            <TopNav />

            {/* Page content */}
            <main className="flex-1 overflow-auto bg-[#f3f3f3]">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
