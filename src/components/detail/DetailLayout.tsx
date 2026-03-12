"use client";

import { useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Wrench,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  DetailLayoutConfig,
  FieldDefinition,
  GridColumnDefinition,
  GridColumnPlacement,
} from "@/lib/detail-registry/types";
import { DetailSection } from "./DetailSection";
import { AutocompleteResult } from "@/components/AutocompleteInput";

interface DetailLayoutProps {
  layout: DetailLayoutConfig;
  fieldDefs: FieldDefinition[];
  formData: Record<string, any>;
  onFieldChange: (fieldName: string, value: any) => void;
  isEditing: boolean;
  isLayoutEditMode?: boolean;
  // Custom tab renderers (for embedded grids, special content)
  renderTabContent?: (tabId: string) => React.ReactNode | null;
  // Render extra content above the field sections (e.g., Add Date buttons)
  renderTabHeader?: (tabId: string) => React.ReactNode | null;
  // Allow parent to control active tab
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  // Layout editing callbacks
  onLayoutChange?: (layout: DetailLayoutConfig) => void;
  // Additional content rendered below fields in the tab content area (e.g., embedded grids)
  children?: React.ReactNode;
  // Layout editor controls
  onEnterEditMode?: () => void;
  onSaveLayout?: () => Promise<void>;
  onCancelEdit?: () => void;
  onResetLayout?: () => Promise<void>;
  // Grid column configuration (for embedded data grids like Account Listing)
  gridColumns?: Record<string, GridColumnPlacement[]>;
  gridDefs?: Record<string, GridColumnDefinition[]>;
  onUpdateGridColumns?: (gridId: string, columns: GridColumnPlacement[]) => void;
  // Inline edit support — double-click a field in view mode to edit just that field
  editingField?: string | null;
  onFieldDoubleClick?: (fieldName: string) => void;
  onFieldBlur?: (fieldName: string) => void;
  onFieldKeyDown?: (fieldName: string, e: React.KeyboardEvent) => void;
  // Autocomplete support
  onAutocompleteSelect?: (fieldName: string, result: AutocompleteResult) => void;
}

export function DetailLayout({
  layout,
  fieldDefs,
  formData,
  onFieldChange,
  isEditing,
  isLayoutEditMode,
  renderTabContent,
  renderTabHeader,
  activeTab: controlledTab,
  onTabChange,
  onLayoutChange,
  children,
  onEnterEditMode,
  onSaveLayout,
  onCancelEdit,
  onResetLayout,
  gridColumns,
  gridDefs,
  onUpdateGridColumns,
  editingField,
  onFieldDoubleClick,
  onFieldBlur,
  onFieldKeyDown,
  onAutocompleteSelect,
}: DetailLayoutProps) {
  const { data: session } = useSession();
  const userProfile = (session?.user as any)?.profile;
  const canEditLayout = userProfile === "Admin" || userProfile === "GodAdmin";

  const [internalTab, setInternalTab] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const fieldDefMap = useMemo(() => {
    const map = new Map<string, FieldDefinition>();
    fieldDefs.forEach((f) => map.set(f.fieldName, f));
    return map;
  }, [fieldDefs]);

  // Filter to visible tabs (or all in edit mode)
  const visibleTabs = useMemo(() => {
    if (isLayoutEditMode) return layout.tabs;
    return layout.tabs.filter((t) => t.visible);
  }, [layout.tabs, isLayoutEditMode]);

  const activeTabId = controlledTab || internalTab || visibleTabs[0]?.id || "";
  const activeTabConfig = visibleTabs.find((t) => t.id === activeTabId) || visibleTabs[0];

  const handleTabChange = useCallback(
    (tabId: string) => {
      if (onTabChange) onTabChange(tabId);
      else setInternalTab(tabId);
    },
    [onTabChange]
  );

  // ========================
  // Layout Editing Handlers
  // ========================

  const handleToggleTabVisibility = useCallback(
    (tabId: string) => {
      if (!onLayoutChange) return;
      const newLayout = JSON.parse(JSON.stringify(layout)) as DetailLayoutConfig;
      const tab = newLayout.tabs.find((t) => t.id === tabId);
      if (!tab) return;
      tab.visible = !tab.visible;
      onLayoutChange(newLayout);
    },
    [layout, onLayoutChange]
  );

  const handleToggleFieldVisibility = useCallback(
    (sectionId: string, fieldName: string) => {
      if (!onLayoutChange) return;
      const newLayout = JSON.parse(JSON.stringify(layout)) as DetailLayoutConfig;
      const tab = newLayout.tabs.find((t) => t.id === activeTabId);
      if (!tab) return;
      const section = tab.sections.find((s) => s.id === sectionId);
      if (!section) return;
      const field = section.fields.find((f) => f.fieldName === fieldName);
      if (!field) return;
      field.visible = !field.visible;
      onLayoutChange(newLayout);
    },
    [layout, activeTabId, onLayoutChange]
  );

  const handleToggleFieldRequired = useCallback(
    (sectionId: string, fieldName: string) => {
      if (!onLayoutChange) return;
      const newLayout = JSON.parse(JSON.stringify(layout)) as DetailLayoutConfig;
      const tab = newLayout.tabs.find((t) => t.id === activeTabId);
      if (!tab) return;
      const section = tab.sections.find((s) => s.id === sectionId);
      if (!section) return;
      const field = section.fields.find((f) => f.fieldName === fieldName);
      if (!field) return;
      // If placement.required is undefined, look up the field def default
      const def = fieldDefMap.get(fieldName);
      const currentRequired = field.required ?? def?.required ?? false;
      field.required = !currentRequired;
      onLayoutChange(newLayout);
    },
    [layout, activeTabId, onLayoutChange, fieldDefMap]
  );

  const handleSwitchFieldColumn = useCallback(
    (sectionId: string, fieldName: string) => {
      if (!onLayoutChange) return;
      const newLayout = JSON.parse(JSON.stringify(layout)) as DetailLayoutConfig;
      const tab = newLayout.tabs.find((t) => t.id === activeTabId);
      if (!tab) return;
      const section = tab.sections.find((s) => s.id === sectionId);
      if (!section) return;
      const field = section.fields.find((f) => f.fieldName === fieldName);
      if (!field) return;
      field.column = field.column === 0 ? 1 : 0;
      onLayoutChange(newLayout);
    },
    [layout, activeTabId, onLayoutChange]
  );

  const handleMoveField = useCallback(
    (sectionId: string, fieldName: string, direction: "up" | "down") => {
      if (!onLayoutChange) return;
      const newLayout = JSON.parse(JSON.stringify(layout)) as DetailLayoutConfig;
      const tab = newLayout.tabs.find((t) => t.id === activeTabId);
      if (!tab) return;
      const section = tab.sections.find((s) => s.id === sectionId);
      if (!section) return;

      const fieldIdx = section.fields.findIndex((f) => f.fieldName === fieldName);
      if (fieldIdx === -1) return;
      const field = section.fields[fieldIdx];

      // Find adjacent field in the SAME column (column-aware move)
      const sameColumnFields = section.fields
        .map((f, i) => ({ field: f, index: i }))
        .filter((item) => item.field.column === field.column && (item.field.colSpan || 1) === (field.colSpan || 1));

      const colPos = sameColumnFields.findIndex((item) => item.field.fieldName === fieldName);
      if (colPos === -1) return;

      const swapPos = direction === "up" ? colPos - 1 : colPos + 1;
      if (swapPos < 0 || swapPos >= sameColumnFields.length) return;

      const swapIdx = sameColumnFields[swapPos].index;
      [section.fields[fieldIdx], section.fields[swapIdx]] = [section.fields[swapIdx], section.fields[fieldIdx]];
      onLayoutChange(newLayout);
    },
    [layout, activeTabId, onLayoutChange]
  );

  // Drag and drop for layout editing
  const handleFieldDragStart = useCallback(
    (sectionId: string, fieldName: string, e: React.DragEvent) => {
      e.dataTransfer.setData("text/plain", JSON.stringify({ sectionId, fieldName }));
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleFieldDragOver = useCallback(
    (_sectionId: string, _fieldName: string, e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    },
    []
  );

  const handleFieldDrop = useCallback(
    (targetSectionId: string, targetFieldName: string, e: React.DragEvent) => {
      e.preventDefault();
      if (!onLayoutChange || !activeTabConfig) return;

      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        const { sectionId: sourceSectionId, fieldName: sourceFieldName } = data;

        if (sourceSectionId === targetSectionId && sourceFieldName === targetFieldName) return;

        const newLayout = JSON.parse(JSON.stringify(layout)) as DetailLayoutConfig;
        const tab = newLayout.tabs.find((t) => t.id === activeTabId);
        if (!tab) return;

        const sourceSection = tab.sections.find((s) => s.id === sourceSectionId);
        const targetSection = tab.sections.find((s) => s.id === targetSectionId);
        if (!sourceSection || !targetSection) return;

        // Capture the target field's column before removing the source
        const targetField = targetSection.fields.find((f) => f.fieldName === targetFieldName);
        const targetColumn = targetField?.column ?? 0;

        // Remove from source
        const sourceIdx = sourceSection.fields.findIndex((f) => f.fieldName === sourceFieldName);
        if (sourceIdx === -1) return;
        const [movedField] = sourceSection.fields.splice(sourceIdx, 1);

        // Update the moved field's column to match the target field's column
        movedField.column = targetColumn;

        // Insert at target position
        const targetIdx = targetSection.fields.findIndex((f) => f.fieldName === targetFieldName);
        if (targetIdx === -1) {
          targetSection.fields.push(movedField);
        } else {
          targetSection.fields.splice(targetIdx, 0, movedField);
        }

        onLayoutChange(newLayout);
      } catch {}
    },
    [layout, activeTabId, activeTabConfig, onLayoutChange]
  );

  // Drop handler for dropping at the END of a column (not on a specific field)
  const handleDropOnColumn = useCallback(
    (sectionId: string, targetColumn: 0 | 1, e: React.DragEvent) => {
      e.preventDefault();
      if (!onLayoutChange || !activeTabConfig) return;

      try {
        const data = JSON.parse(e.dataTransfer.getData("text/plain"));
        const { sectionId: sourceSectionId, fieldName: sourceFieldName } = data;

        const newLayout = JSON.parse(JSON.stringify(layout)) as DetailLayoutConfig;
        const tab = newLayout.tabs.find((t) => t.id === activeTabId);
        if (!tab) return;

        const sourceSection = tab.sections.find((s) => s.id === sourceSectionId);
        const targetSection = tab.sections.find((s) => s.id === sectionId);
        if (!sourceSection || !targetSection) return;

        // Remove from source
        const sourceIdx = sourceSection.fields.findIndex((f) => f.fieldName === sourceFieldName);
        if (sourceIdx === -1) return;
        const [movedField] = sourceSection.fields.splice(sourceIdx, 1);

        // Set the column to the target column
        movedField.column = targetColumn;

        // Append to the end of the section's fields array
        targetSection.fields.push(movedField);

        onLayoutChange(newLayout);
      } catch {}
    },
    [layout, activeTabId, activeTabConfig, onLayoutChange]
  );

  const handleSave = useCallback(async () => {
    if (!onSaveLayout) return;
    setSaving(true);
    try {
      await onSaveLayout();
    } finally {
      setSaving(false);
    }
  }, [onSaveLayout]);

  if (visibleTabs.length === 0) return null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Layout Editor Toolbar — appears when in edit mode */}
      {isLayoutEditMode && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#d6e8f7] border-b border-[#7fb0d4] flex-shrink-0">
          <Wrench className="w-3.5 h-3.5 text-[#2b5f8a]" />
          <span className="text-[11px] font-semibold text-[#2b5f8a]">Layout Editor</span>
          <span className="text-[11px] text-[#555] ml-2">
            Drag to reorder &bull; Toggle visibility &bull; Toggle required &bull; Switch columns
          </span>
          <div className="flex-1" />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-0.5 bg-[#4a7c59] text-white text-[11px] border border-[#3d6b4a] hover:bg-[#5a8c69] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Layout"}
          </button>
          <button
            onClick={onCancelEdit}
            className="px-3 py-0.5 bg-[#f0f0f0] text-[#333] text-[11px] border border-[#a0a0a0] hover:bg-[#e0e0e0]"
          >
            Cancel
          </button>
          <button
            onClick={onResetLayout}
            className="px-3 py-0.5 bg-[#f0f0f0] text-[#c45c5c] text-[11px] border border-[#a0a0a0] hover:bg-[#fde8e8]"
          >
            Reset to Default
          </button>
        </div>
      )}

      {/* Tab Strip */}
      <div className="flex items-end px-2 pt-1 border-b border-[#919b9c] bg-white flex-shrink-0">
        {visibleTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div key={tab.id} className="flex items-center">
              <button
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-1.5 text-[12px] border-t border-l border-r -mb-px ${
                  isActive
                    ? "bg-white border-[#919b9c] border-b-[#f5f5f5] z-10 font-medium"
                    : "bg-[#d4d0c8] border-[#919b9c] text-[#000] hover:bg-[#e8e8e0]"
                } ${isLayoutEditMode && !tab.visible ? "opacity-40 line-through" : ""}`}
              >
                {tab.label}
              </button>
              {/* Tab visibility toggle in edit mode */}
              {isLayoutEditMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleTabVisibility(tab.id);
                  }}
                  className="px-1 py-1.5 -mb-px border-t border-r border-[#919b9c] bg-[#d4d0c8] hover:bg-[#e0e0e0]"
                  title={tab.visible ? "Hide this tab" : "Show this tab"}
                >
                  {tab.visible ? (
                    <Eye className="w-3 h-3 text-[#333]" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-[#999]" />
                  )}
                </button>
              )}
            </div>
          );
        })}

        {/* Spacer + Wrench button */}
        <div className="flex-1" />
        {canEditLayout && !isLayoutEditMode && onEnterEditMode && (
          <button
            onClick={onEnterEditMode}
            className="px-2 py-1 mb-0.5 text-[11px] text-[#666] hover:text-[#333] hover:bg-[#e8e8e0] rounded flex items-center gap-1"
            title="Edit page layout"
          >
            <Wrench className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col overflow-auto bg-white p-2">
        {/* Tab header (e.g., Add Date buttons) */}
        {!isLayoutEditMode && renderTabHeader?.(activeTabId)}

        {/* Custom content renderer takes priority (but not in layout edit mode) */}
        {!isLayoutEditMode && renderTabContent && renderTabContent(activeTabId) !== null ? (
          renderTabContent(activeTabId)
        ) : activeTabConfig ? (
          <div className="space-y-1">
            {activeTabConfig.sections.map((section) => (
              <DetailSection
                key={section.id}
                section={section}
                fieldDefs={fieldDefMap}
                formData={formData}
                onFieldChange={onFieldChange}
                isEditing={isEditing}
                isLayoutEditMode={isLayoutEditMode}
                onFieldDragStart={isLayoutEditMode ? handleFieldDragStart : undefined}
                onFieldDragOver={isLayoutEditMode ? handleFieldDragOver : undefined}
                onFieldDrop={isLayoutEditMode ? handleFieldDrop : undefined}
                onDropOnColumn={isLayoutEditMode ? handleDropOnColumn : undefined}
                onToggleFieldVisibility={isLayoutEditMode ? handleToggleFieldVisibility : undefined}
                onToggleFieldRequired={isLayoutEditMode ? handleToggleFieldRequired : undefined}
                onSwitchFieldColumn={isLayoutEditMode ? handleSwitchFieldColumn : undefined}
                onMoveField={isLayoutEditMode ? handleMoveField : undefined}
                editingField={editingField}
                onFieldDoubleClick={onFieldDoubleClick}
                onFieldBlur={onFieldBlur}
                onFieldKeyDown={onFieldKeyDown}
                onAutocompleteSelect={onAutocompleteSelect}
              />
            ))}
          </div>
        ) : null}

        {/* Grid column picker — shown in layout edit mode */}
        {isLayoutEditMode && gridDefs && Object.entries(gridDefs).map(([gridId, defs]) => {
          const columns = gridColumns?.[gridId] || [];
          // Build a display label from the grid ID
          const gridLabel = gridId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") + " Columns";
          return (
            <div key={gridId} className="mt-4 border border-[#c0c0c0] rounded bg-white p-3">
              <div className="text-[11px] font-semibold mb-2">{gridLabel}</div>
              <div className="flex flex-wrap gap-3">
                {columns.map(col => (
                  <label key={col.fieldName} className="flex items-center gap-1 text-[11px] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => {
                        const updated = columns.map(c =>
                          c.fieldName === col.fieldName ? { ...c, visible: !c.visible } : c
                        );
                        onUpdateGridColumns?.(gridId, updated);
                      }}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </div>
          );
        })}

        {/* Additional content below fields (e.g., embedded grids) */}
        {!isLayoutEditMode && children}
      </div>
    </div>
  );
}
