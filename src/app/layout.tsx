import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { PermissionsProvider } from "@/context/PermissionsContext";

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
        <SessionProvider>
          <PermissionsProvider>
            <AppShell>{children}</AppShell>
          </PermissionsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
