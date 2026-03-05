"use client";

import { useState } from "react";
import {
  Users,
  Shield,
  Palette,
  Database,
  Bell,
  Globe,
  ChevronRight,
  ChevronDown,
  Settings,
  List,
  GitBranch,
  Building2,
  Wrench,
  Boxes,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { UserManagementPanel } from "@/components/settings/UserManagementPanel";
import { RolesPermissionsPanel } from "@/components/settings/RolesPermissionsPanel";
import { PicklistEditorPanel } from "@/components/settings/PicklistEditorPanel";
import { StatusWorkflowEditorPanel } from "@/components/settings/StatusWorkflowEditorPanel";
import { NotificationsPanel } from "@/components/settings/NotificationsPanel";
import { OfficesPanel } from "@/components/settings/OfficesPanel";
import { ObjectManagerPanel } from "@/components/settings/ObjectManagerPanel";
import { SystemPanel } from "@/components/settings/SystemPanel";

// ============================================
// TYPES
// ============================================

interface SettingsItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole: string;
}

interface SettingsGroup {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole: string;
  items: SettingsItem[];
}

// ============================================
// SIDEBAR CONFIGURATION
// ============================================

const settingsGroups: SettingsGroup[] = [
  {
    id: "users-access",
    label: "Users & Access",
    icon: Users,
    minRole: "Admin",
    items: [
      { id: "users", label: "User Management", icon: Users, minRole: "Admin" },
      { id: "offices", label: "Offices", icon: Building2, minRole: "Admin" },
      { id: "roles", label: "Roles & Permissions", icon: Shield, minRole: "Admin" },
    ],
  },
  {
    id: "admin-tools",
    label: "Admin Tools",
    icon: Wrench,
    minRole: "Admin",
    items: [
      { id: "picklists", label: "Picklist Values", icon: List, minRole: "Admin" },
      { id: "workflows", label: "Status Workflows", icon: GitBranch, minRole: "Admin" },
      { id: "object-manager", label: "Object Manager", icon: Boxes, minRole: "Admin" },
    ],
  },
  {
    id: "platform",
    label: "Platform",
    icon: Globe,
    minRole: "Admin",
    items: [
      { id: "appearance", label: "Appearance", icon: Palette, minRole: "Admin" },
      { id: "notifications", label: "Notifications", icon: Bell, minRole: "Admin" },
      { id: "database", label: "Database", icon: Database, minRole: "Admin" },
      { id: "system", label: "System", icon: Globe, minRole: "Admin" },
    ],
  },
];

const ROLE_LEVEL: Record<string, number> = {
  GodAdmin: 100,
  Admin: 50,
  User: 10,
};

// ============================================
// SETTINGS PAGE
// ============================================

export default function SettingsPage() {
  const { data: session } = useSession();
  const currentRole = (session?.user as any)?.role || "User";
  // GodAdmin sees everything Admin sees + their powers work silently
  const userLevel = ROLE_LEVEL[currentRole] || 0;

  const [activeSection, setActiveSection] = useState("users");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(settingsGroups.map((g) => g.id)) // all expanded by default
  );

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Filter groups and items by role
  const visibleGroups = settingsGroups
    .filter((g) => userLevel >= (ROLE_LEVEL[g.minRole] || 0))
    .map((g) => ({
      ...g,
      items: g.items.filter((item) => userLevel >= (ROLE_LEVEL[item.minRole] || 0)),
    }))
    .filter((g) => g.items.length > 0);

  const renderContent = () => {
    switch (activeSection) {
      case "users":
        return <UserManagementPanel />;
      case "offices":
        return <OfficesPanel />;
      case "roles":
        return <RolesPermissionsPanel />;
      case "picklists":
        return <PicklistEditorPanel />;
      case "workflows":
        return <StatusWorkflowEditorPanel />;
      case "appearance":
        return <ComingSoon title="Appearance" description="Customize the platform theme, colors, and layout preferences." />;
      case "notifications":
        return <NotificationsPanel />;
      case "database":
        return <ComingSoon title="Database" description="View database status, run migrations, manage backups, and configure connections." />;
      case "system":
        return <SystemPanel />;
      case "object-manager":
        return <ObjectManagerPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Settings Sidebar */}
      <div className="w-[220px] bg-[#f5f5f5] border-r border-[#d0d0d0] flex flex-col flex-shrink-0">
        <div className="px-3 py-3 border-b border-[#d0d0d0]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#333]" />
            <span className="font-semibold text-[13px] text-[#333]">Setup</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {visibleGroups.map((group) => {
            const GroupIcon = group.icon;
            const isExpanded = expandedGroups.has(group.id);
            const hasActiveChild = group.items.some((item) => item.id === activeSection);

            return (
              <div key={group.id}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors ${
                    hasActiveChild && !isExpanded
                      ? "text-[#0078d4] bg-[#e8f0fe]"
                      : "text-[#666] hover:bg-[#e8e8e8]"
                  }`}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  )}
                  <GroupIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="flex-1 truncate">{group.label}</span>
                </button>

                {/* Group Items */}
                {isExpanded && (
                  <div className="pb-1">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = activeSection === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveSection(item.id)}
                          className={`w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-left text-[12px] transition-colors ${
                            isActive
                              ? "bg-[#0078d4] text-white"
                              : "text-[#333] hover:bg-[#e0e0e0]"
                          }`}
                        >
                          <ItemIcon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="flex-1 truncate">{item.label}</span>
                          {isActive && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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

// ============================================
// GOD MODE PANEL
// ============================================

// ============================================
// COMING SOON PLACEHOLDER
// ============================================

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
