"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DetailLayoutConfig,
  DetailPageDefinition,
  FieldDefinition,
  GridColumnPlacement,
} from "@/lib/detail-registry/types";
import { DETAIL_REGISTRY } from "@/lib/detail-registry";

interface UseDetailLayoutResult {
  layout: DetailLayoutConfig | null;
  registry: DetailPageDefinition | null;
  fieldDefs: FieldDefinition[];
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  // Layout editing
  isLayoutEditMode: boolean;
  setLayoutEditMode: (editing: boolean) => void;
  editingLayout: DetailLayoutConfig | null;
  updateEditingLayout: (layout: DetailLayoutConfig) => void;
  saveLayout: () => Promise<void>;
  cancelLayoutEdit: () => void;
  resetToDefault: () => Promise<void>;
  // Grid column handling
  gridColumns: Record<string, GridColumnPlacement[]>;
  updateGridColumns: (gridId: string, columns: GridColumnPlacement[]) => void;
}

export function useDetailLayout(pageId: string): UseDetailLayoutResult {
  const registry = DETAIL_REGISTRY[pageId] || null;
  const [savedLayout, setSavedLayout] = useState<DetailLayoutConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [isLayoutEditMode, setLayoutEditMode] = useState(false);
  const [editingLayout, setEditingLayout] = useState<DetailLayoutConfig | null>(null);

  // Fetch saved layout from DB
  useEffect(() => {
    const fetchLayout = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/detail-layouts/${pageId}`);
        if (res.ok) {
          const data = await res.json();
          if (data) setSavedLayout(data);
        }
      } catch {} finally {
        setIsLoading(false);
      }
    };
    fetchLayout();
  }, [pageId]);

  // Merge saved layout with registry defaults
  // Saved layout wins, but new fields from registry get appended
  const layout = useMemo(() => {
    if (!registry) return null;
    const base = savedLayout || registry.defaultLayout;

    // Check for fields in registry not present in layout
    const layoutFieldNames = new Set<string>();
    base.tabs.forEach((t) =>
      t.sections.forEach((s) =>
        s.fields.forEach((f) => layoutFieldNames.add(f.fieldName))
      )
    );

    const missingFields = registry.fields.filter(
      (f) => !layoutFieldNames.has(f.fieldName)
    );

    if (missingFields.length === 0) return base;

    // Append missing fields to the first section of the first tab (hidden)
    const merged = JSON.parse(JSON.stringify(base)) as DetailLayoutConfig;
    const firstTab = merged.tabs[0];
    if (firstTab && firstTab.sections[0]) {
      for (const field of missingFields) {
        firstTab.sections[0].fields.push({
          fieldName: field.fieldName,
          label: field.defaultLabel,
          column: 0,
          visible: false,
        });
      }
    }

    return merged;
  }, [savedLayout, registry]);

  const fieldDefs = registry?.fields || [];

  // Set initial active tab
  useEffect(() => {
    if (layout && !activeTab) {
      const firstVisible = layout.tabs.find((t) => t.visible);
      if (firstVisible) setActiveTab(firstVisible.id);
    }
  }, [layout, activeTab]);

  const enterEditMode = useCallback(
    (editing: boolean) => {
      setLayoutEditMode(editing);
      if (editing && layout) {
        const cloned = JSON.parse(JSON.stringify(layout)) as DetailLayoutConfig;
        // Also clone grid configs into the editing layout
        if (registry?.grids) {
          const currentGrids = layout.grids || {};
          const clonedGrids: Record<string, GridColumnPlacement[]> = {};
          for (const [gridId, defs] of Object.entries(registry.grids)) {
            if (currentGrids[gridId]) {
              const savedNames = new Set(currentGrids[gridId].map(c => c.fieldName));
              const missing = defs.filter(d => !savedNames.has(d.fieldName)).map(d => ({
                fieldName: d.fieldName,
                label: d.defaultLabel,
                visible: d.defaultVisible,
                width: d.defaultWidth,
              }));
              clonedGrids[gridId] = [...currentGrids[gridId], ...missing];
            } else {
              clonedGrids[gridId] = defs.map(d => ({
                fieldName: d.fieldName,
                label: d.defaultLabel,
                visible: d.defaultVisible,
                width: d.defaultWidth,
              }));
            }
          }
          cloned.grids = clonedGrids;
        }
        setEditingLayout(cloned);
      } else {
        setEditingLayout(null);
      }
    },
    [layout, registry]
  );

  const updateEditingLayout = useCallback((newLayout: DetailLayoutConfig) => {
    setEditingLayout(newLayout);
  }, []);

  const saveLayout = useCallback(async () => {
    if (!editingLayout) return;
    try {
      const res = await fetch(`/api/detail-layouts/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layout: editingLayout }),
      });
      if (res.ok) {
        setSavedLayout(editingLayout);
        setLayoutEditMode(false);
        setEditingLayout(null);
      }
    } catch {}
  }, [editingLayout, pageId]);

  const cancelLayoutEdit = useCallback(() => {
    setLayoutEditMode(false);
    setEditingLayout(null);
  }, []);

  const resetToDefault = useCallback(async () => {
    try {
      await fetch(`/api/detail-layouts/${pageId}`, { method: "DELETE" });
      setSavedLayout(null);
      setLayoutEditMode(false);
      setEditingLayout(null);
    } catch {}
  }, [pageId]);

  // Grid column handling — merge saved grid configs with registry defaults
  const gridColumns = useMemo(() => {
    if (!registry?.grids) return {};
    const saved = (isLayoutEditMode ? editingLayout : layout)?.grids || {};
    const result: Record<string, GridColumnPlacement[]> = {};

    for (const [gridId, defs] of Object.entries(registry.grids)) {
      if (saved[gridId]) {
        // Use saved, but add any new columns from registry that aren't in saved
        const savedNames = new Set(saved[gridId].map(c => c.fieldName));
        const missing = defs.filter(d => !savedNames.has(d.fieldName)).map(d => ({
          fieldName: d.fieldName,
          label: d.defaultLabel,
          visible: d.defaultVisible,
          width: d.defaultWidth,
        }));
        result[gridId] = [...saved[gridId], ...missing];
      } else {
        result[gridId] = defs.map(d => ({
          fieldName: d.fieldName,
          label: d.defaultLabel,
          visible: d.defaultVisible,
          width: d.defaultWidth,
        }));
      }
    }
    return result;
  }, [registry, layout, editingLayout, isLayoutEditMode]);

  const updateGridColumns = useCallback((gridId: string, columns: GridColumnPlacement[]) => {
    if (!editingLayout) return;
    const newLayout = JSON.parse(JSON.stringify(editingLayout)) as DetailLayoutConfig;
    if (!newLayout.grids) newLayout.grids = {};
    newLayout.grids[gridId] = columns;
    setEditingLayout(newLayout);
  }, [editingLayout]);

  return {
    layout: isLayoutEditMode ? editingLayout : layout,
    registry,
    fieldDefs,
    isLoading,
    activeTab,
    setActiveTab,
    isLayoutEditMode,
    setLayoutEditMode: enterEditMode,
    editingLayout,
    updateEditingLayout,
    saveLayout,
    cancelLayoutEdit,
    resetToDefault,
    gridColumns,
    updateGridColumns,
  };
}
