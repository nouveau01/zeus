"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronRight, ChevronDown, Boxes, LayoutGrid, List, Info } from "lucide-react";
import { MODULE_REGISTRY, getModulesBySection } from "@/lib/moduleRegistry";
import { DETAIL_REGISTRY } from "@/lib/detail-registry";
import { getDetailRegistryByParentPageId, generatePlaceholderData } from "@/lib/detail-registry/helpers";
import { useDetailLayout } from "@/hooks/useDetailLayout";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { ObjectManagerListViewEditor } from "./ObjectManagerListViewEditor";

// ============================================
// Sub-tab types
// ============================================

type SubTab = "overview" | "page-layout" | "list-view";

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

          {/* Quick Info */}
          <div className="border border-[#d0d0d0] rounded p-3 bg-[#fafafa]">
            <div className="text-[11px] text-[#888] mb-1">Entity</div>
            <div className="text-[14px] font-semibold text-[#333]">
              {detailDef?.entityName || module.label}
            </div>
            {detailKey && (
              <div className="text-[11px] text-[#888] mt-1">
                Registry: <code className="bg-[#f0f0f0] px-1 rounded text-[10px]">{detailKey}</code>
              </div>
            )}
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
