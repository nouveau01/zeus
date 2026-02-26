"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MODULE_REGISTRY, getModulesBySection } from "@/lib/moduleRegistry";
import {
  Save,
  RefreshCw,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface PicklistValue {
  id: string;
  pageId: string;
  fieldName: string;
  value: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  color: string | null;
}

interface StatusWorkflow {
  id: string;
  pageId: string;
  fromStatus: string;
  toStatus: string;
  sortOrder: number;
  isActive: boolean;
  requiresRole: string | null;
  requiresNote: boolean;
}

// A transition key is "fromStatus::toStatus"
interface TransitionSettings {
  allowed: boolean;
  requiresNote: boolean;
  requiresRole: string;
  existingId: string | null; // id if already persisted
}

const INITIAL_STATUS = "_initial";

// ── Component ────────────────────────────────────────────────────────────────

export function StatusWorkflowEditorPanel() {
  const { data: session } = useSession();
  const currentRole = (session?.user as any)?.role;

  // Left sidebar
  const [modulesWithStatus, setModulesWithStatus] = useState<string[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [sidebarLoading, setSidebarLoading] = useState(true);

  // Right content
  const [statuses, setStatuses] = useState<PicklistValue[]>([]);
  const [workflows, setWorkflows] = useState<StatusWorkflow[]>([]);
  const [transitions, setTransitions] = useState<Record<string, TransitionSettings>>({});
  const [contentLoading, setContentLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const modulesBySection = getModulesBySection();

  // ── Helpers ──────────────────────────────────────────────────────────────

  const transitionKey = (from: string, to: string) => `${from}::${to}`;

  const getModuleLabel = (pageId: string) => {
    const mod = MODULE_REGISTRY.find((m) => m.pageId === pageId);
    return mod?.label || pageId;
  };

  // ── Discover which modules have status picklists ─────────────────────────

  useEffect(() => {
    const discoverModules = async () => {
      setSidebarLoading(true);
      try {
        // Check each module in the registry that has a "status" field defined
        const candidates = MODULE_REGISTRY.filter((mod) =>
          mod.fields.some((f) => f.fieldName === "status")
        );

        const found: string[] = [];

        // Batch-check by fetching status picklists for each candidate
        const checks = await Promise.allSettled(
          candidates.map(async (mod) => {
            const res = await fetch(
              `/api/picklist-values?pageId=${encodeURIComponent(mod.pageId)}&fieldName=status`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.length > 0) {
                return mod.pageId;
              }
            }
            return null;
          })
        );

        for (const result of checks) {
          if (result.status === "fulfilled" && result.value) {
            found.push(result.value);
          }
        }

        setModulesWithStatus(found);

        // Auto-expand all sections that contain found modules
        const sections = new Set<string>();
        for (const pageId of found) {
          const mod = MODULE_REGISTRY.find((m) => m.pageId === pageId);
          if (mod) sections.add(mod.section);
        }
        setExpandedSections(Array.from(sections));

        // Auto-select first if none selected
        if (found.length > 0 && !selectedPageId) {
          setSelectedPageId(found[0]);
        }
      } catch (error) {
        console.error("Error discovering status modules:", error);
      } finally {
        setSidebarLoading(false);
      }
    };

    discoverModules();
  }, []);

  // ── Load data for selected module ────────────────────────────────────────

  const loadModuleData = useCallback(async (pageId: string) => {
    setContentLoading(true);
    setMessage(null);
    setHasChanges(false);

    try {
      // Fetch status picklist values and existing workflows in parallel
      const [statusRes, workflowRes] = await Promise.all([
        fetch(`/api/picklist-values?pageId=${encodeURIComponent(pageId)}&fieldName=status`),
        fetch(`/api/status-workflows?pageId=${encodeURIComponent(pageId)}`),
      ]);

      if (!statusRes.ok) throw new Error("Failed to fetch status values");
      if (!workflowRes.ok) throw new Error("Failed to fetch workflows");

      const statusData: PicklistValue[] = await statusRes.json();
      const workflowData: StatusWorkflow[] = await workflowRes.json();

      setStatuses(statusData);
      setWorkflows(workflowData);

      // Build transitions map from existing workflows
      const map: Record<string, TransitionSettings> = {};

      // Initialize all possible transitions as disallowed
      const fromStatuses = [INITIAL_STATUS, ...statusData.map((s) => s.value)];
      const toStatuses = statusData.map((s) => s.value);

      for (const from of fromStatuses) {
        for (const to of toStatuses) {
          if (from === to) continue; // skip self-transitions
          map[transitionKey(from, to)] = {
            allowed: false,
            requiresNote: false,
            requiresRole: "",
            existingId: null,
          };
        }
      }

      // Mark existing workflows as allowed
      for (const wf of workflowData) {
        const key = transitionKey(wf.fromStatus, wf.toStatus);
        if (map[key] !== undefined) {
          map[key] = {
            allowed: true,
            requiresNote: wf.requiresNote,
            requiresRole: wf.requiresRole || "",
            existingId: wf.id,
          };
        }
      }

      setTransitions(map);
    } catch (error) {
      console.error("Error loading module data:", error);
      setMessage({ type: "error", text: "Failed to load workflow data" });
    } finally {
      setContentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPageId) {
      loadModuleData(selectedPageId);
    }
  }, [selectedPageId, loadModuleData]);

  // ── Toggle transition allowed ────────────────────────────────────────────

  const toggleTransition = (from: string, to: string) => {
    const key = transitionKey(from, to);
    setTransitions((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        allowed: !prev[key]?.allowed,
      },
    }));
    setHasChanges(true);
  };

  const updateTransitionNote = (from: string, to: string, value: boolean) => {
    const key = transitionKey(from, to);
    setTransitions((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        requiresNote: value,
      },
    }));
    setHasChanges(true);
  };

  const updateTransitionRole = (from: string, to: string, value: string) => {
    const key = transitionKey(from, to);
    setTransitions((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        requiresRole: value,
      },
    }));
    setHasChanges(true);
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selectedPageId) return;
    setSaving(true);
    setMessage(null);

    try {
      const promises: Promise<Response>[] = [];

      for (const [key, settings] of Object.entries(transitions)) {
        const [fromStatus, toStatus] = key.split("::");

        if (settings.allowed && !settings.existingId) {
          // CREATE: new transition
          promises.push(
            fetch("/api/status-workflows", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pageId: selectedPageId,
                fromStatus,
                toStatus,
                requiresNote: settings.requiresNote,
                requiresRole: settings.requiresRole || null,
              }),
            })
          );
        } else if (settings.allowed && settings.existingId) {
          // UPDATE: existing transition (may have changed note/role)
          promises.push(
            fetch(`/api/status-workflows/${settings.existingId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                requiresNote: settings.requiresNote,
                requiresRole: settings.requiresRole || null,
              }),
            })
          );
        } else if (!settings.allowed && settings.existingId) {
          // DELETE: transition was removed
          promises.push(
            fetch(`/api/status-workflows/${settings.existingId}`, {
              method: "DELETE",
            })
          );
        }
        // If !allowed && !existingId, nothing to do
      }

      const results = await Promise.all(promises);
      const failed = results.filter((r) => !r.ok);

      if (failed.length > 0) {
        setMessage({
          type: "error",
          text: `Saved with ${failed.length} error(s). Please try again.`,
        });
      } else {
        setMessage({ type: "success", text: "Workflow transitions saved successfully" });
        // Reload to get fresh IDs
        await loadModuleData(selectedPageId);
      }

      setTimeout(() => setMessage(null), 4000);
    } catch (error) {
      console.error("Error saving workflows:", error);
      setMessage({ type: "error", text: "Failed to save workflow transitions" });
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle sidebar section ───────────────────────────────────────────────

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const fromStatuses = [INITIAL_STATUS, ...statuses.map((s) => s.value)];
  const toStatuses = statuses.map((s) => s.value);

  const getFromLabel = (value: string) => {
    if (value === INITIAL_STATUS) return "New Record";
    const s = statuses.find((st) => st.value === value);
    return s?.label || value;
  };

  const getToLabel = (value: string) => {
    const s = statuses.find((st) => st.value === value);
    return s?.label || value;
  };

  // Get allowed transitions for the detail editor below the matrix
  const allowedTransitions = Object.entries(transitions)
    .filter(([, settings]) => settings.allowed)
    .map(([key, settings]) => {
      const [from, to] = key.split("::");
      return { from, to, ...settings };
    })
    .sort((a, b) => {
      // Sort: _initial first, then alphabetically by from, then by to
      if (a.from === INITIAL_STATUS && b.from !== INITIAL_STATUS) return -1;
      if (b.from === INITIAL_STATUS && a.from !== INITIAL_STATUS) return 1;
      if (a.from !== b.from) return a.from.localeCompare(b.from);
      return a.to.localeCompare(b.to);
    });

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="h-full flex"
      style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}
    >
      {/* ── Left Sidebar: Module Selector ─────────────────────────────────── */}
      <div className="w-[200px] bg-[#f5f5f5] border-r border-[#d0d0d0] flex flex-col flex-shrink-0">
        <div className="px-2 py-2 border-b border-[#d0d0d0] flex items-center justify-between">
          <span className="font-semibold text-[12px]">Modules</span>
          <span className="text-[10px] text-[#999]">
            {modulesWithStatus.length} with status
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sidebarLoading ? (
            <div className="px-3 py-4 text-[11px] text-[#808080] text-center">
              Discovering modules...
            </div>
          ) : modulesWithStatus.length === 0 ? (
            <div className="px-3 py-4 text-[11px] text-[#808080] text-center">
              No modules with status picklists found
            </div>
          ) : (
            Object.entries(modulesBySection).map(([section, modules]) => {
              const sectionModules = modules.filter((m) =>
                modulesWithStatus.includes(m.pageId)
              );
              if (sectionModules.length === 0) return null;

              const isExpanded = expandedSections.includes(section);

              return (
                <div key={section}>
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section)}
                    className="w-full flex items-center gap-1 px-2 py-1.5 text-left text-[11px] font-semibold text-[#555] bg-[#e8e8e8] border-b border-[#d0d0d0] hover:bg-[#ddd]"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    {section}
                    <span className="text-[9px] text-[#999] font-normal ml-auto">
                      {sectionModules.length}
                    </span>
                  </button>

                  {/* Module Items */}
                  {isExpanded &&
                    sectionModules.map((mod) => (
                      <button
                        key={mod.pageId}
                        onClick={() => setSelectedPageId(mod.pageId)}
                        className={`w-full flex items-center px-3 py-2 text-left text-[12px] border-b border-[#e8e8e8] transition-colors ${
                          selectedPageId === mod.pageId
                            ? "bg-[#0078d4] text-white"
                            : "text-[#333] hover:bg-[#e0e0e0]"
                        }`}
                      >
                        <span className="truncate">{mod.label}</span>
                      </button>
                    ))}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Content: Transition Matrix Editor ───────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedPageId ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#d0d0d0] bg-white flex items-center justify-between flex-shrink-0">
              <div>
                <div className="font-semibold text-[14px]">
                  Status Workflow: {getModuleLabel(selectedPageId)}
                </div>
                <div className="text-[11px] text-[#666] mt-0.5">
                  Define which status transitions are allowed and their requirements
                </div>
              </div>
              <div className="flex items-center gap-2">
                {message && (
                  <span
                    className={`text-[11px] flex items-center gap-1 ${
                      message.type === "error" ? "text-[#c45c5c]" : "text-[#28a745]"
                    }`}
                  >
                    {message.type === "success" ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5" />
                    )}
                    {message.text}
                  </span>
                )}
                <button
                  onClick={() => loadModuleData(selectedPageId)}
                  disabled={contentLoading}
                  className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px] flex items-center gap-1 disabled:opacity-40"
                  title="Reload"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${contentLoading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px] flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-white px-4 py-3">
              {contentLoading ? (
                <div className="flex items-center justify-center h-full text-[12px] text-[#808080]">
                  Loading workflow data...
                </div>
              ) : statuses.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-[12px] text-[#808080] gap-2">
                  <AlertCircle className="w-5 h-5" />
                  <span>No status values found for this module.</span>
                  <span className="text-[10px]">
                    Add status picklist values first via the Picklist Editor.
                  </span>
                </div>
              ) : (
                <>
                  {/* ── Transition Matrix ──────────────────────────────────── */}
                  <div className="mb-6">
                    <div className="text-[12px] font-semibold mb-2 text-[#333]">
                      Transition Matrix
                    </div>
                    <div className="text-[10px] text-[#888] mb-3">
                      Rows = &quot;From Status&quot; | Columns = &quot;To Status&quot; | Check a cell to allow that transition
                    </div>

                    <div className="overflow-auto border border-[#d0d0d0]">
                      <table
                        className="border-collapse text-[11px]"
                        style={{ minWidth: "fit-content" }}
                      >
                        <thead>
                          <tr>
                            {/* Top-left corner cell */}
                            <th className="bg-[#e8e8e8] border border-[#d0d0d0] px-2 py-1.5 text-left font-semibold text-[#555] sticky left-0 z-10 min-w-[120px]">
                              From \ To
                            </th>
                            {toStatuses.map((to) => (
                              <th
                                key={to}
                                className="bg-[#e8e8e8] border border-[#d0d0d0] px-2 py-1.5 text-center font-semibold text-[#555] min-w-[80px] whitespace-nowrap"
                              >
                                {getToLabel(to)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {fromStatuses.map((from) => (
                            <tr key={from}>
                              <td
                                className={`border border-[#d0d0d0] px-2 py-1.5 font-medium sticky left-0 z-10 whitespace-nowrap ${
                                  from === INITIAL_STATUS
                                    ? "bg-[#fff8e1] text-[#7c6700]"
                                    : "bg-[#f5f5f5] text-[#333]"
                                }`}
                              >
                                {getFromLabel(from)}
                              </td>
                              {toStatuses.map((to) => {
                                if (from === to) {
                                  // Self-transition cell - disabled
                                  return (
                                    <td
                                      key={to}
                                      className="border border-[#d0d0d0] bg-[#f0f0f0] text-center"
                                    >
                                      <span className="text-[#ccc]">&mdash;</span>
                                    </td>
                                  );
                                }

                                const key = transitionKey(from, to);
                                const settings = transitions[key];
                                const isAllowed = settings?.allowed ?? false;

                                return (
                                  <td
                                    key={to}
                                    className={`border border-[#d0d0d0] text-center cursor-pointer transition-colors ${
                                      isAllowed
                                        ? "bg-[#e8f5e9] hover:bg-[#c8e6c9]"
                                        : "bg-white hover:bg-[#f5f5f5]"
                                    }`}
                                    onClick={() => toggleTransition(from, to)}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isAllowed}
                                      onChange={() => toggleTransition(from, to)}
                                      className="cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ── Transition Details ─────────────────────────────────── */}
                  {allowedTransitions.length > 0 && (
                    <div>
                      <div className="text-[12px] font-semibold mb-2 text-[#333]">
                        Transition Details
                      </div>
                      <div className="text-[10px] text-[#888] mb-3">
                        Configure requirements for each allowed transition
                      </div>

                      <div className="border border-[#d0d0d0] overflow-hidden">
                        {/* Detail Header */}
                        <div className="flex bg-[#e8e8e8] border-b border-[#d0d0d0] text-[11px] font-semibold text-[#555]">
                          <div className="px-2 py-1.5 border-r border-[#d0d0d0]" style={{ width: 160 }}>
                            From
                          </div>
                          <div className="px-2 py-1.5 border-r border-[#d0d0d0]" style={{ width: 160 }}>
                            To
                          </div>
                          <div className="px-2 py-1.5 border-r border-[#d0d0d0] text-center" style={{ width: 100 }}>
                            Requires Note
                          </div>
                          <div className="px-2 py-1.5 flex-1">
                            Requires Role
                          </div>
                        </div>

                        {/* Detail Rows */}
                        {allowedTransitions.map((t) => {
                          const key = transitionKey(t.from, t.to);
                          return (
                            <div
                              key={key}
                              className="flex border-b border-[#e8e8e8] last:border-b-0 items-center hover:bg-[#f8f8f8]"
                            >
                              <div
                                className={`px-2 py-1.5 border-r border-[#e8e8e8] text-[11px] truncate ${
                                  t.from === INITIAL_STATUS
                                    ? "text-[#7c6700] font-medium"
                                    : "text-[#333]"
                                }`}
                                style={{ width: 160 }}
                              >
                                {getFromLabel(t.from)}
                              </div>
                              <div
                                className="px-2 py-1.5 border-r border-[#e8e8e8] text-[11px] truncate text-[#333]"
                                style={{ width: 160 }}
                              >
                                {getToLabel(t.to)}
                              </div>
                              <div
                                className="px-2 py-1.5 border-r border-[#e8e8e8] text-center"
                                style={{ width: 100 }}
                              >
                                <input
                                  type="checkbox"
                                  checked={t.requiresNote}
                                  onChange={(e) =>
                                    updateTransitionNote(t.from, t.to, e.target.checked)
                                  }
                                  className="cursor-pointer"
                                />
                              </div>
                              <div className="px-2 py-1 flex-1">
                                <input
                                  type="text"
                                  value={t.requiresRole}
                                  onChange={(e) =>
                                    updateTransitionRole(t.from, t.to, e.target.value)
                                  }
                                  placeholder="e.g. Admin"
                                  className="w-full px-1.5 py-0.5 border border-[#c0c0c0] text-[11px] bg-white focus:border-[#0078d4] focus:outline-none"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Summary ────────────────────────────────────────────── */}
                  <div className="mt-4 pt-3 border-t border-[#e0e0e0] flex items-center justify-between">
                    <span className="text-[11px] text-[#888]">
                      {statuses.length} status value{statuses.length !== 1 ? "s" : ""} &middot;{" "}
                      {allowedTransitions.length} allowed transition
                      {allowedTransitions.length !== 1 ? "s" : ""}
                    </span>
                    {hasChanges && (
                      <span className="text-[11px] text-[#e67e22] font-medium">
                        Unsaved changes
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[#808080]">
            {sidebarLoading
              ? "Discovering modules with status fields..."
              : "Select a module to configure its status workflow"}
          </div>
        )}
      </div>
    </div>
  );
}
