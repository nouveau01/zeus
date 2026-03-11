"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  Plus,
  Bell,
  HelpCircle,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Eye,
  EyeOff,
  Building2,
  Check as CheckIcon,
  Phone,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { useSession, signOut } from "next-auth/react";
import { usePermissions } from "@/context/PermissionsContext";
import { useUIMode } from "@/context/UIModeContext";
import { useOffices } from "@/context/OfficesContext";
import { useSoftphone } from "@/context/SoftphoneContext";

export function TopNav() {
  const { tabs, activeTabId, setActiveTab, closeTab, addBlankTab, openTab } = useTabs();
  const { data: session } = useSession();
  const { previewProfile, setPreviewProfile } = usePermissions();
  const { mode, toggleMode } = useUIMode();
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPreviewMenu, setShowPreviewMenu] = useState(false);
  const [showOfficeMenu, setShowOfficeMenu] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<{ id: string; name: string }[]>([]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const previewMenuRef = useRef<HTMLDivElement>(null);
  const officeMenuRef = useRef<HTMLDivElement>(null);

  const { offices, selectedOfficeIds, setSelectedOfficeIds, allSelected, primaryOfficeId } = useOffices();
  const { config: softphoneConfig, registrationStatus, callState, panelOpen, setPanelOpen, setPanelMinimized } = useSoftphone();

  const user = session?.user as any;
  const userInitials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const isGodAdmin = user?.profile === "GodAdmin";

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (previewMenuRef.current && !previewMenuRef.current.contains(e.target as Node)) {
        setShowPreviewMenu(false);
      }
      if (officeMenuRef.current && !officeMenuRef.current.contains(e.target as Node)) {
        setShowOfficeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch available profiles when GodAdmin opens preview menu
  useEffect(() => {
    if (isGodAdmin && showPreviewMenu && availableProfiles.length === 0) {
      fetch("/api/profiles")
        .then((r) => r.json())
        .then((profiles) => {
          if (Array.isArray(profiles)) {
            setAvailableProfiles(profiles.filter((r: any) => r.name !== "GodAdmin"));
          }
        })
        .catch(() => {});
    }
  }, [isGodAdmin, showPreviewMenu, availableProfiles.length]);

  // Check if we need scroll arrows
  useEffect(() => {
    const checkOverflow = () => {
      const container = tabsContainerRef.current;
      if (container) {
        const hasOverflow = container.scrollWidth > container.clientWidth;
        setShowLeftArrow(hasOverflow && container.scrollLeft > 0);
        setShowRightArrow(hasOverflow && container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
      }
    };

    checkOverflow();
    const container = tabsContainerRef.current;
    container?.addEventListener("scroll", checkOverflow);
    window.addEventListener("resize", checkOverflow);

    return () => {
      container?.removeEventListener("scroll", checkOverflow);
      window.removeEventListener("resize", checkOverflow);
    };
  }, [tabs.length]);

  const scrollTabs = (direction: "left" | "right") => {
    const container = tabsContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Scroll active tab into view
  useEffect(() => {
    const container = tabsContainerRef.current;
    if (container && activeTabId) {
      const activeTabElement = container.querySelector(`[data-tab-id="${activeTabId}"]`);
      if (activeTabElement) {
        activeTabElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      }
    }
  }, [activeTabId]);

  return (
    <header className="flex-shrink-0">
      {/* Tab bar row - Chrome style gray background */}
      <div className="bg-[#dee1e6] flex items-end h-[40px] pt-[6px]">
        {/* ZEUS Logo area - no fixed width, flows naturally */}
        <div className="flex-shrink-0 flex items-center px-3 h-full">
          <Link href="/" className="flex items-center">
            <span
              className="font-bold text-xl tracking-tight"
              style={{
                fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
                color: "#1e3a5f",
              }}
            >
              Z.E.U.S.
            </span>
          </Link>
        </div>

        {/* Tabs area */}
        <div className="flex-1 flex items-end min-w-0 h-full">
          {/* Left scroll arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scrollTabs("left")}
              className="flex-shrink-0 w-7 h-[34px] flex items-center justify-center hover:bg-[#c8ccd1] text-[#5f6368] rounded-t-lg"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Tabs container */}
          <div
            ref={tabsContainerRef}
            className="flex-1 flex items-end overflow-x-auto h-full gap-[2px]"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {tabs.map((tab) => {
              const isActive = activeTabId === tab.id;
              return (
                <div
                  key={tab.id}
                  data-tab-id={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center h-[34px] cursor-pointer group px-3 rounded-t-lg transition-colors
                    ${isActive
                      ? "bg-white"
                      : "bg-[#c8ccd1] hover:bg-[#d5d8dc]"
                    }
                  `}
                  style={{
                    minWidth: "160px",
                    maxWidth: "240px",
                  }}
                >
                  {/* Tab content */}
                  <span
                    className={`flex-1 text-[13px] truncate select-none pr-1 ${
                      isActive ? "text-[#202124] font-medium" : "text-[#5f6368]"
                    }`}
                    title={tab.title || "New Tab"}
                  >
                    {tab.title || "New Tab"}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full
                      hover:bg-[#d3d5d8]
                      ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                    `}
                    title="Close tab"
                  >
                    <X className="w-3.5 h-3.5 text-[#5f6368]" />
                  </button>
                </div>
              );
            })}

            {/* New Tab Button - Chrome style circular plus */}
            <button
              onClick={addBlankTab}
              className="flex-shrink-0 w-7 h-7 ml-1 flex items-center justify-center hover:bg-[#c8ccd1] text-[#5f6368] rounded-full self-center mb-[3px]"
              title="New tab"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Right scroll arrow */}
          {showRightArrow && (
            <button
              onClick={() => scrollTabs("right")}
              className="flex-shrink-0 w-7 h-[34px] flex items-center justify-center hover:bg-[#c8ccd1] text-[#5f6368] rounded-t-lg"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex-shrink-0 flex items-center gap-1 px-3 h-full pb-[6px]">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-8 pr-3 py-1.5 w-40 border border-[#dadce0] rounded-full text-[12px] focus:outline-none focus:ring-1 focus:ring-[#1a73e8] focus:border-[#1a73e8] bg-white"
            />
          </div>

          {/* Office Filter Dropdown */}
          {offices.length > 0 && (
            <div className="relative" ref={officeMenuRef}>
              <button
                onClick={() => setShowOfficeMenu(!showOfficeMenu)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[12px] border transition-colors ${
                  showOfficeMenu
                    ? "bg-white border-[#1a73e8] text-[#1a73e8]"
                    : allSelected
                    ? "bg-white border-[#dadce0] text-[#5f6368] hover:border-[#bdc1c6]"
                    : "bg-[#e8f0fe] border-[#1a73e8] text-[#1a73e8]"
                }`}
                title="Filter by office"
              >
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="max-w-[120px] truncate font-medium">
                  {allSelected
                    ? "All Offices"
                    : selectedOfficeIds.length === 1
                    ? offices.find((o) => o.id === selectedOfficeIds[0])?.code || "1 Office"
                    : `${selectedOfficeIds.length} Offices`}
                </span>
                <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${showOfficeMenu ? "rotate-180" : ""}`} />
              </button>

              {showOfficeMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-[#dadce0] z-50 py-1">
                  <div className="px-3 py-2 border-b border-[#e0e0e0] text-[11px] font-semibold text-[#333]">
                    Show data from:
                  </div>
                  {/* All Offices toggle */}
                  <button
                    onClick={() => {
                      if (allSelected) {
                        // Uncheck all → default to primary office (or first office)
                        const defaultId = primaryOfficeId || offices[0]?.id;
                        if (defaultId) setSelectedOfficeIds([defaultId]);
                      } else {
                        setSelectedOfficeIds(offices.map((o) => o.id));
                      }
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#f1f3f4] ${
                      allSelected ? "bg-[#e8f0fe] text-[#1a73e8] font-medium" : "text-[#333]"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                      allSelected ? "bg-[#1a73e8] border-[#1a73e8]" : "border-[#dadce0]"
                    }`}>
                      {allSelected && <CheckIcon className="w-3 h-3 text-white" />}
                    </div>
                    All Offices
                  </button>
                  <div className="border-b border-[#e0e0e0] my-1" />
                  {/* Individual offices */}
                  {offices.map((office) => {
                    const isChecked = selectedOfficeIds.includes(office.id);
                    return (
                      <button
                        key={office.id}
                        onClick={() => {
                          if (isChecked) {
                            // Don't allow deselecting the last one
                            if (selectedOfficeIds.length <= 1) return;
                            setSelectedOfficeIds(selectedOfficeIds.filter((id) => id !== office.id));
                          } else {
                            setSelectedOfficeIds([...selectedOfficeIds, office.id]);
                          }
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#f1f3f4] ${
                          isChecked ? "text-[#333]" : "text-[#999]"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          isChecked ? "bg-[#1a73e8] border-[#1a73e8]" : "border-[#dadce0]"
                        }`}>
                          {isChecked && <CheckIcon className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-mono font-medium mr-1">{office.code}</span>
                        <span className="text-[11px] text-[#888] truncate">{office.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Icon buttons */}
          <button className="p-1.5 hover:bg-[#c8ccd1] rounded-full" title="Notifications">
            <Bell className="w-4 h-4 text-[#5f6368]" />
          </button>
          <button className="p-1.5 hover:bg-[#c8ccd1] rounded-full" title="Help">
            <HelpCircle className="w-4 h-4 text-[#5f6368]" />
          </button>
          {softphoneConfig.enabled && (
            <button
              className={`relative p-1.5 rounded-full ${
                panelOpen ? "bg-[#d3e8fc]" : "hover:bg-[#c8ccd1]"
              }`}
              title="Phone"
              onClick={() => {
                setPanelOpen(!panelOpen);
                setPanelMinimized(false);
              }}
            >
              <Phone className="w-4 h-4 text-[#5f6368]" />
              {/* Status dot */}
              {registrationStatus === "registered" && (
                <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#16a34a] border border-white" />
              )}
              {/* Incoming call pulse */}
              {callState === "incoming" && (
                <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#dc2626] border border-white animate-ping" />
              )}
            </button>
          )}
          <button
            className="p-1.5 hover:bg-[#c8ccd1] rounded-full"
            title="Settings"
            onClick={() => openTab("Settings", "/settings")}
          >
            <Settings className="w-4 h-4 text-[#5f6368]" />
          </button>

          {/* UI Mode Toggle — Thunder (Classic) / Lightning (Modern) */}
          <div
            className="flex items-center gap-0 cursor-pointer select-none"
            onClick={toggleMode}
            title={mode === "classic" ? "Switch to Lightning (Modern)" : "Switch to Thunder (Classic)"}
          >
            <span className={`text-[12px] font-semibold tracking-wide transition-colors ${mode === "classic" ? "text-[#333]" : "text-[#aaa]"}`}>
              Thunder
            </span>
            <div className="relative mx-2 w-[40px] h-[20px]">
              <div className={`absolute inset-0 rounded-full transition-colors duration-200 ${mode === "modern" ? "bg-[#6366f1]" : "bg-[#b0b3b8]"}`} />
              <div
                className={`absolute top-[2px] w-[16px] h-[16px] rounded-full bg-white shadow transition-transform duration-200 ${mode === "modern" ? "translate-x-[22px]" : "translate-x-[2px]"}`}
              />
            </div>
            <span className={`text-[12px] font-semibold tracking-wide transition-colors ${mode === "modern" ? "text-[#6366f1]" : "text-[#aaa]"}`}>
              Lightning
            </span>
          </div>

          {/* Preview as Profile - GodAdmin only */}
          {isGodAdmin && (
            <div className="relative" ref={previewMenuRef}>
              <button
                onClick={() => setShowPreviewMenu(!showPreviewMenu)}
                className={`p-1.5 rounded-full ${previewProfile ? "bg-[#fef3cd]" : "hover:bg-[#c8ccd1]"}`}
                title={previewProfile ? `Previewing as: ${previewProfile}` : "Preview as Profile"}
              >
                {previewProfile ? (
                  <EyeOff className="w-4 h-4 text-[#856404]" />
                ) : (
                  <Eye className="w-4 h-4 text-[#5f6368]" />
                )}
              </button>

              {showPreviewMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-[#dadce0] z-50 py-1">
                  <div className="px-3 py-2 border-b border-[#e0e0e0] text-[11px] font-semibold text-[#333]">
                    Preview as Profile
                  </div>
                  {previewProfile && (
                    <button
                      onClick={() => { setPreviewProfile(null); setShowPreviewMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-[#dc2626] hover:bg-[#f1f3f4]"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      Exit Preview
                    </button>
                  )}
                  {availableProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      onClick={() => { setPreviewProfile(profile.name); setShowPreviewMenu(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-[#f1f3f4] ${
                        previewProfile === profile.name ? "bg-[#e8f0fe] text-[#1a73e8] font-medium" : "text-[#333]"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {profile.name}
                    </button>
                  ))}
                  {availableProfiles.length === 0 && (
                    <div className="px-3 py-2 text-[11px] text-[#999]">Loading profiles...</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* User avatar & menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium ml-1 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#1a73e8] focus:ring-offset-1"
              title={user?.name || "User"}
            >
              {user?.avatar && !avatarBroken ? (
                <img src={user.avatar} alt={user.name || "User"} className="w-7 h-7 rounded-full object-cover" onError={() => setAvatarBroken(true)} />
              ) : (
                <div className="w-7 h-7 bg-[#1a73e8] rounded-full flex items-center justify-center">
                  {userInitials}
                </div>
              )}
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-[#dadce0] z-50 py-1">
                <div className="px-4 py-3 border-b border-[#e0e0e0]">
                  <div className="flex items-center gap-3">
                    {user?.avatar && !avatarBroken ? (
                      <img src={user.avatar} alt="" className="w-9 h-9 rounded-full" onError={() => setAvatarBroken(true)} />
                    ) : (
                      <div className="w-9 h-9 bg-[#1a73e8] rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {userInitials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#202124] truncate">{user?.name || "User"}</div>
                      <div className="text-xs text-[#5f6368] truncate">{user?.email || ""}</div>
                      {user?.profile && (
                        <div className="text-[10px] text-[#1a73e8] font-medium mt-0.5">{user.profile === "GodAdmin" ? "Admin" : user.profile}</div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#202124] hover:bg-[#f1f3f4] transition-colors"
                >
                  <LogOut className="w-4 h-4 text-[#5f6368]" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* White content area border - seamlessly connects with active tab */}
      <div className="h-[1px] bg-white" />

      {/* Preview mode banner */}
      {previewProfile && (
        <div className="bg-[#fff3cd] border-b border-[#ffc107] px-4 py-1.5 flex items-center justify-between" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
          <div className="flex items-center gap-2 text-[12px] text-[#856404]">
            <Eye className="w-4 h-4" />
            <span>
              <strong>Preview Mode:</strong> Viewing as <strong>{previewProfile}</strong> profile. Restrictions are active.
            </span>
          </div>
          <button
            onClick={() => setPreviewProfile(null)}
            className="px-3 py-0.5 text-[11px] bg-white border border-[#ffc107] text-[#856404] rounded hover:bg-[#fff8e1] font-medium"
          >
            Exit Preview
          </button>
        </div>
      )}
    </header>
  );
}
