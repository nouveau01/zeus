import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { PermissionsProvider } from "@/context/PermissionsContext";
import { UIModeProvider } from "@/context/UIModeContext";
import { OfficesProvider } from "@/context/OfficesContext";
import { SoftphoneProvider } from "@/context/SoftphoneContext";

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
            <OfficesProvider>
              <UIModeProvider>
                <SoftphoneProvider>
                  <AppShell>{children}</AppShell>
                </SoftphoneProvider>
              </UIModeProvider>
            </OfficesProvider>
          </PermissionsProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
