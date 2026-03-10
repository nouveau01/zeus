"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronRight, ChevronDown, Boxes, LayoutGrid, List, Info, ListChecks } from "lucide-react";
import { MODULE_REGISTRY, getModulesBySection } from "@/lib/moduleRegistry";
import { DETAIL_REGISTRY } from "@/lib/detail-registry";
import { getDetailRegistryByParentPageId, generatePlaceholderData } from "@/lib/detail-registry/helpers";
import { useDetailLayout } from "@/hooks/useDetailLayout";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { ObjectManagerListViewEditor } from "./ObjectManagerListViewEditor";

// ============================================
// Sub-tab types
// ============================================

type SubTab = "overview" | "page-layout" | "list-view" | "fields";

// ============================================
// ObjectManagerPanel Component
// ============================================

export function ObjectManagerPanel() {
  const modulesBySection = getModulesBySection();

  // Selection state
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("overview");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const selectedModule = selectedPageId
    ? MODULE_REGISTRY.find((m) => m.pageId === selectedPageId) ?? null
    : null;

  // Check if the selected module has a detail registry entry
  const detailEntry = selectedPageId ? getDetailRegistryByParentPageId(selectedPageId) : null;
  const hasDetailPage = detailEntry !== null;

  // When a module is selected, default to overview
  const handleSelectModule = (pageId: string) => {
    setSelectedPageId(pageId);
    setActiveSubTab("overview");
  };

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  // Filter out _global from the sidebar
  const sidebarSections = useMemo(() => {
    const sections: Record<string, typeof MODULE_REGISTRY> = {};
    for (const [section, modules] of Object.entries(modulesBySection)) {
      if (section === "Global") continue;
      sections[section] = modules.filter((m) => m.pageId !== "_global");
    }
    return sections;
  }, [modulesBySection]);

  // Available sub-tabs for current selection
  const availableSubTabs: { id: SubTab; label: string; icon: typeof Info }[] = useMemo(() => {
    const tabs: { id: SubTab; label: string; icon: typeof Info }[] = [
      { id: "overview", label: "Overview", icon: Info },
    ];
    if (hasDetailPage) {
      tabs.push({ id: "page-layout", label: "Page Layout", icon: LayoutGrid });
    }
    if (selectedPageId && selectedPageId !== "_global") {
      tabs.push({ id: "list-view", label: "List View", icon: List });
    }
    if (selectedPageId) {
      tabs.push({ id: "fields", label: "Fields", icon: ListChecks });
    }
    return tabs;
  }, [hasDetailPage, selectedPageId]);

  // If current sub-tab is not available, reset to overview
  const currentSubTab = availableSubTabs.find((t) => t.id === activeSubTab)
    ? activeSubTab
    : "overview";

  return (
    <div
      className="h-full flex"
      style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", fontSize: "12px" }}
    >
      {/* ─── Left Sidebar: Object List ────────────────────────────────── */}
      <div className="w-[200px] bg-[#f5f5f5] border-r border-[#d0d0d0] flex flex-col flex-shrink-0">
        <div className="px-2 py-2 border-b border-[#d0d0d0] flex items-center gap-1.5">
          <Boxes className="w-3.5 h-3.5 text-[#555]" />
          <span className="font-semibold text-[12px]">Objects</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {Object.entries(sidebarSections).map(([section, modules]) => {
            if (modules.length === 0) return null;
            const collapsed = collapsedSections.has(section);
            return (
              <div key={section}>
                <button
                  onClick={() => toggleSection(section)}
                  className="w-full flex items-center gap-1 px-2 py-1.5 text-left text-[11px] font-semibold bg-[#eaeaea] border-b border-[#d0d0d0] hover:bg-[#ddd] text-[#444]"
                >
                  <span className="text-[10px]">{collapsed ? "\u25B6" : "\u25BC"}</span>
                  {section}
                </button>
                {!collapsed &&
                  modules.map((mod) => (
                    <button
                      key={mod.pageId}
                      onClick={() => handleSelectModule(mod.pageId)}
                      className={`w-full text-left px-3 py-1.5 text-[12px] border-b border-[#e8e8e8] transition-colors ${
                        selectedPageId === mod.pageId
                          ? "bg-[#0078d4] text-white"
                          : "text-[#333] hover:bg-[#e0e0e0]"
                      }`}
                    >
                      {mod.label}
                    </button>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Right Content Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedModule ? (
          <>
            {/* Sub-tab strip */}
            <div className="flex items-end px-3 pt-1.5 border-b border-[#919b9c] bg-white flex-shrink-0">
              {availableSubTabs.map((tab) => {
                const isActive = currentSubTab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 text-[12px] border-t border-l border-r -mb-px ${
                      isActive
                        ? "bg-white border-[#919b9c] border-b-white z-10 font-medium"
                        : "bg-[#d4d0c8] border-[#919b9c] text-[#000] hover:bg-[#e8e8e0]"
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
              <div className="flex-1" />
            </div>

            {/* Sub-tab content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {currentSubTab === "overview" && (
                <OverviewTab
                  pageId={selectedPageId!}
                  module={selectedModule}
                  hasDetailPage={hasDetailPage}
                  detailKey={detailEntry?.key || null}
                  onNavigate={setActiveSubTab}
                />
              )}
              {currentSubTab === "page-layout" && detailEntry && (
                <PageLayoutTab detailPageId={detailEntry.key} />
              )}
              {currentSubTab === "list-view" && selectedPageId && (
                <ObjectManagerListViewEditor
                  pageId={selectedPageId}
                  moduleLabel={selectedModule.label}
                />
              )}
              {currentSubTab === "fields" && selectedPageId && (
                <FieldsTab
                  pageId={selectedPageId}
                  module={selectedModule}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[#808080]">
            <div className="text-center">
              <Boxes className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
              <p>Select an object from the sidebar to view its configuration.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Overview Tab
// ============================================

function OverviewTab({
  pageId,
  module,
  hasDetailPage,
  detailKey,
  onNavigate,
}: {
  pageId: string;
  module: (typeof MODULE_REGISTRY)[number];
  hasDetailPage: boolean;
  detailKey: string | null;
  onNavigate: (tab: SubTab) => void;
}) {
  const detailDef = detailKey ? DETAIL_REGISTRY[detailKey] : null;
  const detailFieldCount = detailDef?.fields.length || 0;
  const gridCount = detailDef?.grids ? Object.keys(detailDef.grids).length : 0;
  const tabCount = detailDef?.defaultLayout.tabs.length || 0;

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="max-w-2xl">
        {/* Title */}
        <h2 className="text-[16px] font-semibold text-[#333] mb-1">{module.label}</h2>
        <p className="text-[11px] text-[#888] mb-4">
          Section: {module.section} &bull; Page ID: <code className="bg-[#f0f0f0] px-1 rounded">{pageId}</code>
        </p>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* List View Fields */}
          <div className="border border-[#d0d0d0] rounded p-3 bg-[#fafafa]">
            <div className="text-[11px] text-[#888] mb-1">List View Fields</div>
            <div className="text-[20px] font-semibold text-[#333]">{module.fields.length}</div>
            <button
              onClick={() => onNavigate("list-view")}
              className="text-[11px] text-[#0078d4] hover:underline mt-1"
            >
              Configure columns &rarr;
            </button>
          </div>

          {/* Detail Layout */}
          <div className="border border-[#d0d0d0] rounded p-3 bg-[#fafafa]">
            <div className="text-[11px] text-[#888] mb-1">Detail Layout</div>
            {hasDetailPage ? (
              <>
                <div className="text-[20px] font-semibold text-[#333]">{detailFieldCount}</div>
                <div className="text-[11px] text-[#888]">
                  {tabCount} tab{tabCount !== 1 ? "s" : ""} &bull; {gridCount} grid{gridCount !== 1 ? "s" : ""}
                </div>
                <button
                  onClick={() => onNavigate("page-layout")}
                  className="text-[11px] text-[#0078d4] hover:underline mt-1"
                >
                  Edit layout &rarr;
                </button>
              </>
            ) : (
              <>
                <div className="text-[14px] text-[#999]">None</div>
                <div className="text-[11px] text-[#888]">No detail page defined</div>
              </>
            )}
          </div>

          {/* Fields */}
          <div className="border border-[#d0d0d0] rounded p-3 bg-[#fafafa]">
            <div className="text-[11px] text-[#888] mb-1">Fields</div>
            <div className="text-[20px] font-semibold text-[#333]">{module.fields.length}</div>
            <div className="text-[11px] text-[#888]">configurable fields</div>
            <button
              onClick={() => onNavigate("fields")}
              className="text-[11px] text-[#0078d4] hover:underline mt-1"
            >
              Manage fields &rarr;
            </button>
          </div>
        </div>

        {/* Field list */}
        <div className="border border-[#d0d0d0] rounded">
          <div className="px-3 py-2 bg-[#f0f0f0] border-b border-[#d0d0d0] font-semibold text-[12px]">
            List View Fields ({module.fields.length})
          </div>
          <div className="divide-y divide-[#f0f0f0]">
            {module.fields.map((field) => (
              <div key={field.fieldName} className="flex items-center px-3 py-1.5 text-[12px]">
                <span className="w-[140px] text-[#888] flex-shrink-0">{field.fieldName}</span>
                <span className="flex-1 text-[#333]">{field.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail fields table (if applicable) */}
        {detailDef && (
          <div className="border border-[#d0d0d0] rounded mt-3">
            <div className="px-3 py-2 bg-[#f0f0f0] border-b border-[#d0d0d0] font-semibold text-[12px]">
              Detail Page Fields ({detailFieldCount})
            </div>
            <div className="divide-y divide-[#f0f0f0] max-h-[300px] overflow-y-auto">
              {detailDef.fields.map((field) => (
                <div key={field.fieldName} className="flex items-center px-3 py-1.5 text-[12px]">
                  <span className="w-[140px] text-[#888] flex-shrink-0">{field.fieldName}</span>
                  <span className="w-[140px] text-[#333] flex-shrink-0">{field.defaultLabel}</span>
                  <span className="text-[11px] text-[#999]">{field.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Page Layout Tab — embeds DetailLayout in edit mode
// ============================================

function PageLayoutTab({ detailPageId }: { detailPageId: string }) {
  const {
    layout,
    registry,
    fieldDefs,
    isLoading,
    activeTab,
    setActiveTab,
    isLayoutEditMode,
    setLayoutEditMode,
    editingLayout,
    updateEditingLayout,
    saveLayout,
    cancelLayoutEdit,
    resetToDefault,
    gridColumns,
    updateGridColumns,
  } = useDetailLayout(detailPageId);

  // Auto-enter edit mode when this tab is shown
  useEffect(() => {
    if (layout && !isLayoutEditMode) {
      setLayoutEditMode(true);
    }
  }, [layout]); // eslint-disable-line react-hooks/exhaustive-deps

  // Generate placeholder data for preview
  const placeholderData = useMemo(() => {
    if (!fieldDefs.length) return {};
    return generatePlaceholderData(fieldDefs);
  }, [fieldDefs]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[11px] text-[#808080]">
        Loading layout...
      </div>
    );
  }

  if (!layout || !registry) {
    return (
      <div className="flex-1 flex items-center justify-center text-[11px] text-[#808080]">
        No layout configuration found.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <DetailLayout
        layout={layout}
        fieldDefs={fieldDefs}
        formData={placeholderData}
        onFieldChange={() => {}}
        isEditing={false}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isLayoutEditMode={isLayoutEditMode}
        onLayoutChange={updateEditingLayout}
        onEnterEditMode={() => setLayoutEditMode(true)}
        onSaveLayout={saveLayout}
        onCancelEdit={cancelLayoutEdit}
        onResetLayout={resetToDefault}
        gridColumns={gridColumns}
        gridDefs={registry.grids}
        onUpdateGridColumns={updateGridColumns}
      />
    </div>
  );
}

// ============================================
// Fields Tab (Salesforce-style Fields & Relationships)
// ============================================

// Friendly type labels and colors for the type badge
const TYPE_DISPLAY: Record<string, { label: string; color: string }> = {
  text: { label: "Text", color: "#6b7280" },
  number: { label: "Number", color: "#0369a1" },
  currency: { label: "Currency", color: "#0d9488" },
  date: { label: "Date", color: "#7c3aed" },
  select: { label: "Picklist", color: "#d97706" },
  "dynamic-select": { label: "Picklist", color: "#d97706" },
  textarea: { label: "Long Text", color: "#6b7280" },
  checkbox: { label: "Checkbox", color: "#059669" },
  readonly: { label: "Formula", color: "#9333ea" },
  phone: { label: "Phone", color: "#0284c7" },
  email: { label: "Email", color: "#0284c7" },
  url: { label: "URL", color: "#0284c7" },
};

function getTypeDisplay(type: string) {
  return TYPE_DISPLAY[type] || { label: type, color: "#6b7280" };
}

interface FieldInfo {
  fieldName: string;
  label: string;
  type: string;       // from detail registry or "unknown"
  isPicklist: boolean; // select or dynamic-select
  picklistCount: number;
}

interface PicklistValueRow {
  id: string;
  pageId: string;
  fieldName: string;
  value: string;
  label: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  color: string | null;
  icon: string | null;
  metadata: any;
}

interface EditableRow {
  _key: string;
  id: string | null;
  value: string;
  label: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  color: string | null;
  isNew: boolean;
}

function FieldsTab({
  pageId,
  module,
}: {
  pageId: string;
  module: (typeof MODULE_REGISTRY)[number];
}) {
  const [fields, setFields] = useState<FieldInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFieldName, setSelectedFieldName] = useState<string | null>(null);

  // Picklist value editor state (only used when a picklist field is selected)
  const [editRows, setEditRows] = useState<EditableRow[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<EditableRow[]>([]);
  const [loadingValues, setLoadingValues] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const keyCounter = useRef(0);
  const nextKey = () => {
    keyCounter.current += 1;
    return `_new_${keyCounter.current}`;
  };

  // Build field list from detail registry + module registry + DB picklist counts
  useEffect(() => {
    setLoading(true);
    setSelectedFieldName(null);
    setEditRows([]);
    setSavedSnapshot([]);

    // Get detail registry for this module (has field types)
    const detailEntry = getDetailRegistryByParentPageId(pageId);
    const detailFields = detailEntry?.definition.fields || [];

    // Build a map: fieldName -> { label, type }
    const fieldMap = new Map<string, { label: string; type: string }>();
    for (const df of detailFields) {
      fieldMap.set(df.fieldName, { label: df.defaultLabel, type: df.type });
    }
    // Also add module registry fields (for list-view-only fields not in detail registry)
    for (const mf of module.fields) {
      if (!fieldMap.has(mf.fieldName)) {
        fieldMap.set(mf.fieldName, { label: mf.label, type: "text" });
      }
    }

    // Fetch picklist value counts from API to show counts for picklist fields
    fetch("/api/picklist-values/fields")
      .then((res) => (res.ok ? res.json() : []))
      .then((apiFields: { pageId: string; fieldName: string; count: number }[]) => {
        const countMap = new Map<string, number>();
        for (const af of apiFields) {
          if (af.pageId === pageId) {
            countMap.set(af.fieldName, af.count);
          }
        }

        // Also add any DB-only fields not in either registry (custom picklist fields)
        for (const af of apiFields) {
          if (af.pageId === pageId && !fieldMap.has(af.fieldName)) {
            // Convert camelCase to Title Case for label
            const label = af.fieldName
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (s) => s.toUpperCase())
              .trim();
            fieldMap.set(af.fieldName, { label, type: "dynamic-select" });
          }
        }

        // Build final field list
        const result: FieldInfo[] = [];
        for (const [fieldName, info] of fieldMap) {
          const isPicklist = info.type === "select" || info.type === "dynamic-select";
          result.push({
            fieldName,
            label: info.label,
            type: info.type,
            isPicklist,
            picklistCount: countMap.get(fieldName) || 0,
          });
        }

        result.sort((a, b) => a.label.localeCompare(b.label));
        setFields(result);
      })
      .catch(() => {
        // Fallback: just use registry fields without counts
        const result: FieldInfo[] = [];
        for (const [fieldName, info] of fieldMap) {
          const isPicklist = info.type === "select" || info.type === "dynamic-select";
          result.push({ fieldName, label: info.label, type: info.type, isPicklist, picklistCount: 0 });
        }
        result.sort((a, b) => a.label.localeCompare(b.label));
        setFields(result);
      })
      .finally(() => setLoading(false));
  }, [pageId, module]);

  // Selected field info
  const selectedField = selectedFieldName
    ? fields.find((f) => f.fieldName === selectedFieldName) ?? null
    : null;

  const isPicklistSelected = selectedField?.isPicklist ?? false;
  const isStatusField = selectedFieldName?.toLowerCase() === "status";
  const hasUnsavedChanges = JSON.stringify(editRows) !== JSON.stringify(savedSnapshot);

  // Fetch picklist values when a picklist field is selected
  useEffect(() => {
    if (!selectedFieldName || !selectedField?.isPicklist) {
      setEditRows([]);
      setSavedSnapshot([]);
      setMessage(null);
      return;
    }

    setLoadingValues(true);
    setMessage(null);

    fetch(
      `/api/picklist-values?pageId=${encodeURIComponent(pageId)}&fieldName=${encodeURIComponent(selectedFieldName)}&includeInactive=true`
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: PicklistValueRow[]) => {
        const filtered = data.filter((v) => v.pageId === pageId);
        const rows: EditableRow[] = filtered.map((v) => ({
          _key: v.id,
          id: v.id,
          value: v.value,
          label: v.label,
          sortOrder: v.sortOrder,
          isDefault: v.isDefault,
          isActive: v.isActive,
          color: v.color,
          isNew: false,
        }));
        setEditRows(rows);
        setSavedSnapshot(JSON.parse(JSON.stringify(rows)));
      })
      .catch(() => {
        setEditRows([]);
        setSavedSnapshot([]);
        setMessage({ type: "error", text: "Failed to load values." });
      })
      .finally(() => setLoadingValues(false));
  }, [pageId, selectedFieldName, selectedField?.isPicklist]);

  // Row editing
  const addRow = () => {
    const maxSort = editRows.reduce((max, r) => Math.max(max, r.sortOrder), -1);
    setEditRows((prev) => [
      ...prev,
      { _key: nextKey(), id: null, value: "", label: "", sortOrder: maxSort + 1, isDefault: false, isActive: true, color: null, isNew: true },
    ]);
  };

  const updateRow = (key: string, field: keyof EditableRow, val: any) => {
    setEditRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) {
          return field === "isDefault" && val === true ? { ...r, isDefault: false } : r;
        }
        return { ...r, [field]: val };
      })
    );
  };

  const removeRow = (key: string) => {
    setEditRows((prev) => prev.filter((r) => r._key !== key));
  };

  const handleCancel = () => {
    setEditRows(JSON.parse(JSON.stringify(savedSnapshot)));
    setMessage(null);
  };

  const handleSave = async () => {
    if (!selectedFieldName) return;
    for (const row of editRows) {
      if (!row.value.trim()) {
        setMessage({ type: "error", text: "All rows must have a non-empty value." });
        return;
      }
    }
    const vals = editRows.map((r) => r.value.trim().toLowerCase());
    const dupes = vals.filter((v, i) => vals.indexOf(v) !== i);
    if (dupes.length > 0) {
      setMessage({ type: "error", text: `Duplicate value: "${dupes[0]}"` });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/picklist-values/bulk", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          fieldName: selectedFieldName,
          values: editRows.map((r, i) => ({
            value: r.value.trim(),
            label: r.label.trim() || r.value.trim(),
            sortOrder: i,
            isDefault: r.isDefault,
            isActive: r.isActive,
            color: r.color || null,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const saved: PicklistValueRow[] = await res.json();
      const rows: EditableRow[] = saved.map((v) => ({
        _key: v.id, id: v.id, value: v.value, label: v.label, sortOrder: v.sortOrder,
        isDefault: v.isDefault, isActive: v.isActive, color: v.color, isNew: false,
      }));
      setEditRows(rows);
      setSavedSnapshot(JSON.parse(JSON.stringify(rows)));

      setFields((prev) =>
        prev.map((f) =>
          f.fieldName === selectedFieldName ? { ...f, picklistCount: saved.length } : f
        )
      );

      setMessage({ type: "success", text: "Changes saved successfully." });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ─── Left: Field List ───────────────────────────────────────── */}
      <div className="w-[280px] bg-[#f5f5f5] border-r border-[#d0d0d0] flex flex-col flex-shrink-0">
        <div className="px-3 py-2 border-b border-[#d0d0d0] font-semibold text-[12px]">
          Fields ({fields.length})
        </div>

        {/* Column header */}
        <div className="flex items-center px-3 py-1 bg-[#eaeaea] border-b border-[#d0d0d0] text-[10px] font-semibold text-[#666]">
          <div className="flex-1">Field Label</div>
          <div className="w-[60px] text-center">Type</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="px-2 py-4 text-[11px] text-[#808080] text-center">Loading...</div>
          ) : (
            fields.map((f) => {
              const isSelected = selectedFieldName === f.fieldName;
              const typeInfo = getTypeDisplay(f.type);
              return (
                <button
                  key={f.fieldName}
                  onClick={() => setSelectedFieldName(f.fieldName)}
                  className={`w-full flex items-center px-3 py-1.5 text-left text-[12px] border-b border-[#e8e8e8] transition-colors ${
                    isSelected
                      ? "bg-[#0078d4] text-white"
                      : "text-[#333] hover:bg-[#e0e0e0]"
                  }`}
                >
                  <span className="flex-1 truncate">{f.label}</span>
                  <span
                    className="w-[60px] text-center text-[9px] px-1.5 py-0.5 rounded-sm font-medium flex-shrink-0"
                    style={{
                      backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : `${typeInfo.color}15`,
                      color: isSelected ? "white" : typeInfo.color,
                    }}
                  >
                    {typeInfo.label}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ─── Right: Field Detail / Value Editor ─────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedField ? (
          isPicklistSelected ? (
            /* ── Picklist Value Editor ─────────────────────────────── */
            <>
              <div className="px-4 py-3 border-b border-[#d0d0d0] bg-white flex items-center justify-between flex-shrink-0">
                <div>
                  <span className="font-semibold text-[13px]">{selectedField.label}</span>
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-sm font-medium"
                    style={{ backgroundColor: `${getTypeDisplay(selectedField.type).color}15`, color: getTypeDisplay(selectedField.type).color }}>
                    {getTypeDisplay(selectedField.type).label}
                  </span>
                  <span className="ml-2 text-[11px] text-[#999]">
                    ({editRows.length} value{editRows.length !== 1 ? "s" : ""})
                  </span>
                </div>
                {message && (
                  <span className={`text-[11px] ${message.type === "error" ? "text-[#c45c5c]" : "text-[#28a745]"}`}>
                    {message.text}
                  </span>
                )}
              </div>

              {/* Column headers */}
              <div className="flex items-center gap-0 px-4 py-1.5 bg-[#f0f0f0] border-b border-[#d0d0d0] text-[11px] font-semibold text-[#555] flex-shrink-0">
                <div className="w-[24px] flex-shrink-0"></div>
                <div className="w-[140px] flex-shrink-0 px-1">Value</div>
                <div className="w-[160px] flex-shrink-0 px-1">Label</div>
                {isStatusField && <div className="w-[90px] flex-shrink-0 px-1">Color</div>}
                <div className="w-[50px] flex-shrink-0 px-1 text-center">Default</div>
                <div className="w-[50px] flex-shrink-0 px-1 text-center">Active</div>
                <div className="w-[24px] flex-shrink-0"></div>
              </div>

              {/* Rows */}
              <div className="flex-1 overflow-y-auto px-4 py-1">
                {loadingValues ? (
                  <div className="py-6 text-center text-[11px] text-[#808080]">Loading...</div>
                ) : editRows.length === 0 ? (
                  <div className="py-6 text-center text-[11px] text-[#808080]">
                    No values yet. Click &quot;Add Value&quot; to create the first entry.
                  </div>
                ) : (
                  editRows.map((row) => (
                    <div key={row._key} className={`flex items-center gap-0 py-1 border-b border-[#f0f0f0] group ${!row.isActive ? "opacity-50" : ""}`}>
                      <div className="w-[24px] flex-shrink-0 flex items-center justify-center text-[#ccc] cursor-grab select-none text-[14px]">≡</div>
                      <div className="w-[140px] flex-shrink-0 px-1">
                        <input type="text" value={row.value} readOnly={!row.isNew}
                          onChange={(e) => updateRow(row._key, "value", e.target.value)}
                          className={`w-full px-1.5 py-0.5 border text-[12px] ${row.isNew ? "border-[#a0a0a0] bg-white" : "border-[#e0e0e0] bg-[#f9f9f9] text-[#666] cursor-default"}`}
                          title={row.isNew ? "Enter the value key" : "Value cannot be changed after creation"} />
                      </div>
                      <div className="w-[160px] flex-shrink-0 px-1">
                        <input type="text" value={row.label}
                          onChange={(e) => updateRow(row._key, "label", e.target.value)}
                          className="w-full px-1.5 py-0.5 border border-[#a0a0a0] bg-white text-[12px]" placeholder="Display label" />
                      </div>
                      {isStatusField && (
                        <div className="w-[90px] flex-shrink-0 px-1 flex items-center gap-1">
                          <input type="text" value={row.color || ""}
                            onChange={(e) => updateRow(row._key, "color", e.target.value || null)}
                            className="w-full px-1.5 py-0.5 border border-[#a0a0a0] bg-white text-[12px]" placeholder="#hex" />
                          {row.color && <div className="w-4 h-4 flex-shrink-0 border border-[#ccc] rounded-sm" style={{ backgroundColor: row.color }} />}
                        </div>
                      )}
                      <div className="w-[50px] flex-shrink-0 px-1 flex justify-center">
                        <input type="radio" name={`default-${pageId}-${selectedFieldName}`}
                          checked={row.isDefault} onChange={() => updateRow(row._key, "isDefault", true)} className="cursor-pointer" />
                      </div>
                      <div className="w-[50px] flex-shrink-0 px-1 flex justify-center">
                        <input type="checkbox" checked={row.isActive}
                          onChange={(e) => updateRow(row._key, "isActive", e.target.checked)} className="cursor-pointer" />
                      </div>
                      <div className="w-[24px] flex-shrink-0 flex items-center justify-center">
                        <button onClick={() => removeRow(row._key)}
                          className="text-[#c0c0c0] hover:text-[#c45c5c] text-[14px] leading-none" title="Remove">×</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Bottom bar */}
              <div className="px-4 py-3 border-t border-[#d0d0d0] bg-[#f5f5f5] flex items-center justify-between flex-shrink-0">
                <button onClick={addRow} className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]">
                  + Add Value
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={handleCancel} disabled={!hasUnsavedChanges}
                    className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px] disabled:opacity-40 disabled:cursor-not-allowed">
                    Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving || !hasUnsavedChanges}
                    className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px] disabled:opacity-40 disabled:cursor-not-allowed">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ── Non-picklist field info panel ─────────────────────── */
            <div className="flex-1 overflow-auto p-4">
              <div className="max-w-md">
                <h3 className="text-[14px] font-semibold text-[#333] mb-3">{selectedField.label}</h3>
                <div className="border border-[#d0d0d0] rounded divide-y divide-[#f0f0f0]">
                  <div className="flex px-3 py-2 text-[12px]">
                    <span className="w-[100px] text-[#888] flex-shrink-0">Field Label</span>
                    <span className="text-[#333]">{selectedField.label}</span>
                  </div>
                  <div className="flex px-3 py-2 text-[12px]">
                    <span className="w-[100px] text-[#888] flex-shrink-0">API Name</span>
                    <code className="text-[11px] bg-[#f5f5f5] px-1 rounded">{selectedField.fieldName}</code>
                  </div>
                  <div className="flex px-3 py-2 text-[12px]">
                    <span className="w-[100px] text-[#888] flex-shrink-0">Type</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-medium"
                      style={{ backgroundColor: `${getTypeDisplay(selectedField.type).color}15`, color: getTypeDisplay(selectedField.type).color }}>
                      {getTypeDisplay(selectedField.type).label}
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-[11px] text-[#999]">
                  This field&apos;s type is configured in the detail registry. Select a Picklist-type field to manage its dropdown values.
                </p>
              </div>
            </div>
          )
        ) : (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[#808080]">
            Select a field to view its details.
          </div>
        )}
      </div>
    </div>
  );
}
