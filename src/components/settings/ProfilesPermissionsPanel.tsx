"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  ShieldAlert,
  Plus,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  Check,
  User,
  RefreshCw,
  Save,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { MODULE_REGISTRY, getModulesBySection } from "@/lib/moduleRegistry";

interface ProfilePermission {
  id: string;
  roleId: string;
  pageId: string;
  canAccess: boolean;
  fields: Record<string, boolean>;
}

interface ProfileRecord {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: ProfilePermission[];
}

export function ProfilesPermissionsPanel() {
  const { data: session } = useSession();
  const currentProfile = (session?.user as any)?.profile;
  const isGodAdmin = currentProfile === "GodAdmin";

  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteUserCount, setDeleteUserCount] = useState(0);
  const [dialogError, setDialogError] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");

  // Local permission edits (unsaved changes)
  const [localPermissions, setLocalPermissions] = useState<Record<string, { canAccess: boolean; fields: Record<string, boolean> }>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const modulesBySection = getModulesBySection();

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
        if (!selectedProfileId && data.length > 0) {
          // Skip GodAdmin (hidden from UI)
          const firstVisible = data.find((r: ProfileRecord) => r.name !== "GodAdmin");
          if (firstVisible) setSelectedProfileId(firstVisible.id);
        }
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // When selected profile changes, load its permissions into local state
  useEffect(() => {
    if (!selectedProfileId) return;
    const profile = profiles.find((r) => r.id === selectedProfileId);
    if (!profile) return;

    const perms: Record<string, { canAccess: boolean; fields: Record<string, boolean> }> = {};

    for (const mod of MODULE_REGISTRY) {
      const existing = profile.permissions.find((p) => p.pageId === mod.pageId);
      if (existing) {
        perms[mod.pageId] = {
          canAccess: existing.canAccess,
          fields: existing.fields as Record<string, boolean>,
        };
      } else {
        // Default: all access, all fields visible
        const fields: Record<string, boolean> = {};
        mod.fields.forEach((f) => (fields[f.fieldName] = true));
        perms[mod.pageId] = { canAccess: true, fields };
      }
    }

    setLocalPermissions(perms);
    setHasChanges(false);
  }, [selectedProfileId, profiles]);

  const selectedProfile = profiles.find((r) => r.id === selectedProfileId);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  const toggleModule = (pageId: string) => {
    setExpandedModules((prev) =>
      prev.includes(pageId) ? prev.filter((p) => p !== pageId) : [...prev, pageId]
    );
  };

  const toggleModuleAccess = (pageId: string) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        canAccess: !prev[pageId]?.canAccess,
      },
    }));
    setHasChanges(true);
  };

  const toggleField = (pageId: string, fieldName: string) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        fields: {
          ...prev[pageId]?.fields,
          [fieldName]: !prev[pageId]?.fields?.[fieldName],
        },
      },
    }));
    setHasChanges(true);
  };

  const toggleAllFields = (pageId: string, value: boolean) => {
    const mod = MODULE_REGISTRY.find((m) => m.pageId === pageId);
    if (!mod) return;
    const fields: Record<string, boolean> = {};
    mod.fields.forEach((f) => (fields[f.fieldName] = value));
    setLocalPermissions((prev) => ({
      ...prev,
      [pageId]: { ...prev[pageId], fields },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!selectedProfileId) return;
    setSaving(true);
    setSaveMessage("");

    try {
      const promises = Object.entries(localPermissions).map(([pageId, perm]) =>
        fetch("/api/profiles/permissions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roleId: selectedProfileId,
            pageId,
            canAccess: perm.canAccess,
            fields: perm.fields,
          }),
        })
      );

      await Promise.all(promises);
      setHasChanges(false);
      setSaveMessage("Permissions saved successfully");
      fetchProfiles();
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving permissions:", error);
      setSaveMessage("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleAddProfile = async () => {
    setDialogError("");
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, description: formDescription }),
      });
      if (res.ok) {
        const newProfile = await res.json();
        setShowAddDialog(false);
        setFormName("");
        setFormDescription("");
        await fetchProfiles();
        setSelectedProfileId(newProfile.id);
      } else {
        const data = await res.json();
        setDialogError(data.error || "Failed to create profile");
      }
    } catch {
      setDialogError("Network error");
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfileId) return;
    try {
      const res = await fetch(`/api/profiles?id=${selectedProfileId}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteConfirm(false);
        setSelectedProfileId(null);
        fetchProfiles();
      } else {
        const data = await res.json();
        setDialogError(data.error || "Failed to delete profile");
      }
    } catch {
      setDialogError("Network error");
    }
  };

  const getProfileIcon = (name: string) => {
    const displayName = name === "GodAdmin" ? "Admin" : name;
    switch (displayName) {
      case "Admin": return <Shield className="w-3.5 h-3.5 text-[#316ac5]" />;
      default: return <User className="w-3.5 h-3.5 text-[#666]" />;
    }
  };

  const getFieldVisibleCount = (pageId: string): string => {
    const perm = localPermissions[pageId];
    if (!perm) return "";
    const mod = MODULE_REGISTRY.find((m) => m.pageId === pageId);
    if (!mod) return "";
    const total = mod.fields.length;
    const visible = Object.values(perm.fields).filter(Boolean).length;
    return `${visible}/${total}`;
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-[12px] text-[#808080]">Loading...</div>;
  }

  return (
    <div className="h-full flex" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Profiles List */}
      <div className="w-[200px] bg-[#f5f5f5] border-r border-[#d0d0d0] flex flex-col flex-shrink-0">
        <div className="px-2 py-2 border-b border-[#d0d0d0] flex items-center justify-between">
          <span className="font-semibold text-[12px]">Profiles</span>
          <button
            onClick={() => { setFormName(""); setFormDescription(""); setDialogError(""); setShowAddDialog(true); }}
            className="w-5 h-5 flex items-center justify-center hover:bg-[#e0e0e0] rounded"
            title="Add Profile"
          >
            <Plus className="w-3.5 h-3.5 text-[#4a7c59]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {profiles
            .filter((p) => p.name !== "GodAdmin")
            .map((p) => {
              const displayName = p.name === "User" ? "Standard User" : p.name;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProfileId(p.id)}
                  className={`w-full flex items-center gap-2 px-2 py-2 text-left text-[12px] border-b border-[#e8e8e8] transition-colors ${
                    selectedProfileId === p.id
                      ? "bg-[#0078d4] text-white"
                      : "text-[#333] hover:bg-[#e0e0e0]"
                  }`}
                >
                  {getProfileIcon(p.name)}
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{displayName}</div>
                    {p.isSystem && (
                      <div className={`text-[9px] ${selectedProfileId === p.id ? "text-white/70" : "text-[#999]"}`}>
                        System
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
        </div>
        {selectedProfile && !selectedProfile.isSystem && (
          <div className="px-2 py-2 border-t border-[#d0d0d0]">
            <button
              onClick={async () => {
                setDialogError("");
                // Pre-check user count for this profile
                try {
                  const res = await fetch(`/api/profiles/user-count?role=${encodeURIComponent(selectedProfile.name)}`);
                  if (res.ok) {
                    const data = await res.json();
                    setDeleteUserCount(data.count || 0);
                  } else {
                    setDeleteUserCount(0);
                  }
                } catch {
                  setDeleteUserCount(0);
                }
                setShowDeleteConfirm(true);
              }}
              className="w-full flex items-center justify-center gap-1 px-2 py-1 text-[10px] text-[#c45c5c] hover:bg-[#fde8e8] rounded border border-[#e0e0e0]"
            >
              <Trash2 className="w-3 h-3" />
              Delete Profile
            </button>
          </div>
        )}
      </div>

      {/* Permissions Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedProfile ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#d0d0d0] bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  {getProfileIcon(selectedProfile.name)}
                  <span className="font-semibold text-[14px]">{selectedProfile.name === "GodAdmin" ? "Admin" : selectedProfile.name === "User" ? "Standard User" : selectedProfile.name}</span>
                  {selectedProfile.isSystem && (
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#f0f0f0] text-[#666] rounded border border-[#ddd]">System</span>
                  )}
                </div>
                {selectedProfile.description && (
                  <p className="text-[11px] text-[#666] mt-0.5">{selectedProfile.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {saveMessage && (
                  <span className={`text-[11px] ${saveMessage.includes("Failed") ? "text-[#c45c5c]" : "text-[#28a745]"}`}>
                    {saveMessage}
                  </span>
                )}
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving || (selectedProfile.name === "GodAdmin" && !isGodAdmin)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] bg-[#316ac5] text-white border border-[#003c74] hover:bg-[#2a5db0] rounded disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Permissions"}
                </button>
              </div>
            </div>

            {/* Module Tree */}
            <div className="flex-1 overflow-auto bg-white px-4 py-2">
              {/* GodAdmin info hidden from UI */}

              {Object.entries(modulesBySection).map(([section, modules]) => {
                const isSectionExpanded = expandedSections.includes(section);
                return (
                  <div key={section} className="mb-1">
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section)}
                      className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left font-semibold text-[12px] bg-[#f0f0f0] hover:bg-[#e8e8e8] rounded"
                    >
                      {isSectionExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      {section}
                      <span className="text-[10px] text-[#999] font-normal">({modules.length} modules)</span>
                    </button>

                    {isSectionExpanded && (
                      <div className="ml-2 mt-1 space-y-1">
                        {modules.map((mod) => {
                          const perm = localPermissions[mod.pageId];
                          const isModuleExpanded = expandedModules.includes(mod.pageId);
                          const canAccess = perm?.canAccess ?? true;

                          return (
                            <div key={mod.pageId} className="border border-[#e0e0e0] rounded">
                              {/* Module Header */}
                              <div className="flex items-center gap-2 px-2 py-1.5 bg-[#fafafa]">
                                <button onClick={() => toggleModule(mod.pageId)} className="flex-shrink-0">
                                  {isModuleExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#666]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#666]" />}
                                </button>
                                <label className="flex items-center gap-2 flex-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={canAccess}
                                    onChange={() => toggleModuleAccess(mod.pageId)}
                                    className="rounded"
                                  />
                                  <span className={`font-medium text-[12px] ${!canAccess ? "text-[#999] line-through" : ""}`}>
                                    {mod.label}
                                  </span>
                                </label>
                                <span className="text-[10px] text-[#999]">
                                  {getFieldVisibleCount(mod.pageId)} fields
                                </span>
                              </div>

                              {/* Fields */}
                              {isModuleExpanded && canAccess && (
                                <div className="px-3 py-2 border-t border-[#e8e8e8] bg-white">
                                  <div className="flex items-center gap-3 mb-2 pb-1 border-b border-[#f0f0f0]">
                                    <button
                                      onClick={() => toggleAllFields(mod.pageId, true)}
                                      className="text-[10px] text-[#316ac5] hover:underline"
                                    >
                                      Select All
                                    </button>
                                    <button
                                      onClick={() => toggleAllFields(mod.pageId, false)}
                                      className="text-[10px] text-[#c45c5c] hover:underline"
                                    >
                                      Deselect All
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                                    {mod.fields.map((field) => {
                                      const isChecked = perm?.fields?.[field.fieldName] ?? true;
                                      return (
                                        <label key={field.fieldName} className="flex items-center gap-1.5 cursor-pointer py-0.5">
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleField(mod.pageId, field.fieldName)}
                                            className="rounded"
                                          />
                                          <span className={`text-[11px] ${!isChecked ? "text-[#999]" : ""}`}>
                                            {field.label}
                                          </span>
                                          <span className="text-[9px] text-[#bbb]">
                                            {field.fieldName}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {isModuleExpanded && !canAccess && (
                                <div className="px-3 py-2 border-t border-[#e8e8e8] bg-[#f9f9f9] text-[11px] text-[#999] italic">
                                  Module access disabled — users with this profile cannot see this module.
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[#808080]">
            Select a profile to configure permissions
          </div>
        )}
      </div>

      {/* Add Profile Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70]">
          <div className="bg-[#ece9d8] border border-[#808080] shadow-lg" style={{ width: "380px", fontSize: "11px" }}>
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center justify-between">
              <span className="text-white font-bold text-[12px]">Create New Profile</span>
              <button onClick={() => setShowAddDialog(false)} className="text-white hover:bg-[#c45c5c] px-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {dialogError && (
                <div className="p-2 bg-red-100 border border-red-300 text-red-700 text-[11px] rounded">{dialogError}</div>
              )}
              <div>
                <label className="block text-[11px] font-medium mb-1">Profile Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                  placeholder="e.g., Technician, Dispatcher, Accountant"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                  placeholder="What this profile is for"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleAddProfile}
                  disabled={!formName.trim()}
                  className="px-4 py-1 text-[11px] bg-[#316ac5] text-white border border-[#003c74] hover:bg-[#2a5db0] min-w-[70px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedProfile && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70]">
          <div className="bg-[#ece9d8] border border-[#808080] shadow-lg" style={{ width: "380px", fontSize: "11px" }}>
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center justify-between">
              <span className="text-white font-bold text-[12px]">Delete Profile</span>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-white hover:bg-[#c45c5c] px-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              {dialogError && (
                <div className="p-2 mb-3 bg-red-100 border border-red-300 text-red-700 text-[11px] rounded">{dialogError}</div>
              )}
              {deleteUserCount > 0 ? (
                <>
                  <div className="flex items-start gap-3 mb-4">
                    <ShieldAlert className="w-5 h-5 text-[#e6a817] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-medium mb-1">Cannot delete this profile</p>
                      <p className="text-[12px]">
                        <strong>{deleteUserCount}</strong> active user{deleteUserCount !== 1 ? "s are" : " is"} currently assigned to{" "}
                        <strong>&quot;{selectedProfile.name}&quot;</strong>. Reassign them to a different profile before deleting.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
                    >
                      OK
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 mb-4">
                    <Trash2 className="w-5 h-5 text-[#c45c5c] flex-shrink-0 mt-0.5" />
                    <p className="text-[12px]">
                      Delete profile <strong>&quot;{selectedProfile.name}&quot;</strong> and all its permissions? This cannot be undone.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleDeleteProfile}
                      className="px-4 py-1 text-[11px] bg-[#c45c5c] text-white border border-[#a03030] hover:bg-[#b04040] min-w-[70px]"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
