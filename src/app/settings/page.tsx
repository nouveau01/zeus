"use client";

import { useState } from "react";
import {
  Users,
  Shield,
  ShieldAlert,
  Palette,
  Database,
  Bell,
  Globe,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { UserManagementPanel } from "@/components/settings/UserManagementPanel";

interface SettingsSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole: string; // minimum role to see this section
}

const sections: SettingsSection[] = [
  { id: "users", label: "User Management", icon: Users, minRole: "Admin" },
  { id: "roles", label: "Roles & Permissions", icon: Shield, minRole: "Admin" },
  { id: "appearance", label: "Appearance", icon: Palette, minRole: "Admin" },
  { id: "notifications", label: "Notifications", icon: Bell, minRole: "Admin" },
  { id: "database", label: "Database", icon: Database, minRole: "Admin" },
  { id: "system", label: "System", icon: Globe, minRole: "Admin" },
  { id: "godmode", label: "God Mode", icon: ShieldAlert, minRole: "GodAdmin" },
];

const ROLE_LEVEL: Record<string, number> = {
  GodAdmin: 100,
  Admin: 50,
  User: 10,
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const currentRole = (session?.user as any)?.role || "User";
  const [activeSection, setActiveSection] = useState("users");

  const visibleSections = sections.filter(
    (s) => (ROLE_LEVEL[currentRole] || 0) >= (ROLE_LEVEL[s.minRole] || 0)
  );

  const renderContent = () => {
    switch (activeSection) {
      case "users":
        return <UserManagementPanel />;
      case "roles":
        return <ComingSoon title="Roles & Permissions" description="Configure granular permissions for each role. Control access to modules, actions, and data." />;
      case "appearance":
        return <ComingSoon title="Appearance" description="Customize the platform theme, colors, and layout preferences." />;
      case "notifications":
        return <ComingSoon title="Notifications" description="Configure email notifications, alerts, and notification preferences." />;
      case "database":
        return <ComingSoon title="Database" description="View database status, run migrations, manage backups, and configure connections." />;
      case "system":
        return <ComingSoon title="System" description="Platform version, logs, diagnostics, and system-wide configuration." />;
      case "godmode":
        return <GodModePanel />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Settings Sidebar */}
      <div className="w-[200px] bg-[#f5f5f5] border-r border-[#d0d0d0] flex flex-col flex-shrink-0">
        <div className="px-3 py-3 border-b border-[#d0d0d0]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#333]" />
            <span className="font-semibold text-[13px] text-[#333]">Settings</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors ${
                  isActive
                    ? "bg-[#0078d4] text-white"
                    : "text-[#333] hover:bg-[#e0e0e0]"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 truncate">{section.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

function GodModePanel() {
  return (
    <div className="flex-1 flex flex-col overflow-auto" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      <div className="p-4 border-b border-[#d0d0d0] bg-gradient-to-r from-[#fff8e1] to-[#fff3cd]">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-[#d4a017]" />
          <h2 className="text-[16px] font-bold text-[#333]">God Mode</h2>
        </div>
        <p className="text-[11px] text-[#666]">
          Full platform control. Only visible to GodAdmin. Manage all roles, permissions, and destructive operations.
        </p>
      </div>
      <div className="p-4 space-y-4">
        <div className="border border-[#d0d0d0] rounded">
          <div className="px-3 py-2 bg-[#f5f5f5] border-b border-[#d0d0d0] font-semibold text-[12px]">Role Management</div>
          <div className="p-3 text-[11px] text-[#666]">
            Assign and revoke GodAdmin, Admin, and User roles. Override any user&apos;s permissions. Only you can see and use this panel.
          </div>
          <div className="px-3 pb-3">
            <span className="inline-block px-3 py-1 text-[11px] bg-[#fff3cd] text-[#856404] border border-[#ffc107] rounded">
              Coming Soon
            </span>
          </div>
        </div>
        <div className="border border-[#d0d0d0] rounded">
          <div className="px-3 py-2 bg-[#f5f5f5] border-b border-[#d0d0d0] font-semibold text-[12px]">Destructive Actions</div>
          <div className="p-3 text-[11px] text-[#666]">
            Purge data, reset modules, wipe platform. These actions are irreversible and only available at this level.
          </div>
          <div className="px-3 pb-3">
            <span className="inline-block px-3 py-1 text-[11px] bg-[#fff3cd] text-[#856404] border border-[#ffc107] rounded">
              Coming Soon
            </span>
          </div>
        </div>
        <div className="border border-[#d0d0d0] rounded">
          <div className="px-3 py-2 bg-[#f5f5f5] border-b border-[#d0d0d0] font-semibold text-[12px]">Platform Override</div>
          <div className="p-3 text-[11px] text-[#666]">
            Bypass all permission checks, impersonate any user, access backend configuration directly from the UI.
          </div>
          <div className="px-3 pb-3">
            <span className="inline-block px-3 py-1 text-[11px] bg-[#fff3cd] text-[#856404] border border-[#ffc107] rounded">
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 bg-[#f0f0f0] rounded-full flex items-center justify-center mx-auto mb-3">
          <Settings className="w-6 h-6 text-[#999]" />
        </div>
        <h2 className="text-[16px] font-semibold text-[#333] mb-2">{title}</h2>
        <p className="text-[12px] text-[#666] mb-4">{description}</p>
        <span className="inline-block px-3 py-1 text-[11px] bg-[#fff3cd] text-[#856404] border border-[#ffc107] rounded">
          Coming Soon
        </span>
      </div>
    </div>
  );
}
