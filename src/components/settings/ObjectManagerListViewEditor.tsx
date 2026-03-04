"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from "lucide-react";
import { MODULE_REGISTRY } from "@/lib/moduleRegistry";

interface FieldRow {
  fieldName: string;
  displayLabel: string;
  visible: boolean;
  width: number | undefined;
  sortOrder: number;
}

interface ObjectManagerListViewEditorProps {
  pageId: string;
  moduleLabel: string;
}

export function ObjectManagerListViewEditor({ pageId, moduleLabel }: ObjectManagerListViewEditorProps) {
  const [rows, setRows] = useState<FieldRow[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<FieldRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Get default fields from MODULE_REGISTRY
  const moduleDef = MODULE_REGISTRY.find((m) => m.pageId === pageId);
  const defaultFields = moduleDef?.fields || [];

  // Fetch saved config and merge with defaults
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/page-config/${pageId}`);
      if (res.ok) {
        const savedFields = await res.json();
        if (savedFields.length > 0) {
          // Merge saved config with defaults
          const merged = defaultFields.map((df, index) => {
            const saved = savedFields.find((sf: any) => sf.fieldName === df.fieldName);
            if (saved) {
              return {
                fieldName: df.fieldName,
                displayLabel: saved.displayLabel || df.label,
                visible: saved.visible ?? true,
                width: saved.width ?? undefined,
                sortOrder: saved.sortOrder ?? index,
              };
            }
            return {
              fieldName: df.fieldName,
              displayLabel: df.label,
              visible: true,
              width: undefined,
              sortOrder: index + 1000,
            };
          });
          merged.sort((a, b) => a.sortOrder - b.sortOrder);
          setRows(merged);
          setSavedSnapshot(JSON.parse(JSON.stringify(merged)));
        } else {
          const defaults = defaultFields.map((df, index) => ({
            fieldName: df.fieldName,
            displayLabel: df.label,
            visible: true,
            width: undefined,
            sortOrder: index,
          }));
          setRows(defaults);
          setSavedSnapshot(JSON.parse(JSON.stringify(defaults)));
        }
      } else {
        const defaults = defaultFields.map((df, index) => ({
          fieldName: df.fieldName,
          displayLabel: df.label,
          visible: true,
          width: undefined,
          sortOrder: index,
        }));
        setRows(defaults);
        setSavedSnapshot(JSON.parse(JSON.stringify(defaults)));
      }
    } catch (err) {
      console.error("Error fetching page config:", err);
    } finally {
      setLoading(false);
    }
  }, [pageId, defaultFields]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const hasChanges = JSON.stringify(rows) !== JSON.stringify(savedSnapshot);

  const moveRow = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= rows.length) return;
    setRows((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated.map((r, i) => ({ ...r, sortOrder: i }));
    });
  };

  const updateRow = (index: number, field: keyof FieldRow, value: any) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      moveRow(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const fields = rows.map((r, i) => ({
        fieldName: r.fieldName,
        displayLabel: r.displayLabel,
        sortOrder: i,
        visible: r.visible,
        width: r.width ?? null,
      }));

      const res = await fetch(`/api/page-config/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      setSavedSnapshot(JSON.parse(JSON.stringify(rows)));
      setMessage({ type: "success", text: "Column configuration saved." });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRows(JSON.parse(JSON.stringify(savedSnapshot)));
    setMessage(null);
  };

  const handleReset = () => {
    const defaults = defaultFields.map((df, index) => ({
      fieldName: df.fieldName,
      displayLabel: df.label,
      visible: true,
      width: undefined,
      sortOrder: index,
    }));
    setRows(defaults);
    setMessage(null);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[11px] text-[#808080]">
        Loading column configuration...
      </div>
    );
  }

  if (defaultFields.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[11px] text-[#808080]">
        No fields defined for this module.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-[#d0d0d0] bg-white flex items-center justify-between flex-shrink-0">
        <div>
          <span className="font-semibold text-[13px]">{moduleLabel}</span>
          <span className="text-[11px] text-[#999] ml-2">List View Columns</span>
        </div>
        {message && (
          <span className={`text-[11px] ${message.type === "error" ? "text-[#c45c5c]" : "text-[#28a745]"}`}>
            {message.text}
          </span>
        )}
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-0 px-4 py-1.5 bg-[#f0f0f0] border-b border-[#d0d0d0] text-[11px] font-semibold text-[#555] flex-shrink-0">
        <div className="w-[28px] flex-shrink-0" />
        <div className="w-[140px] flex-shrink-0 px-1">Field Name</div>
        <div className="w-[180px] flex-shrink-0 px-1">Display Label</div>
        <div className="w-[60px] flex-shrink-0 px-1 text-center">Visible</div>
        <div className="w-[80px] flex-shrink-0 px-1">Width (px)</div>
        <div className="w-[60px] flex-shrink-0 px-1 text-center">Order</div>
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto px-4 py-1">
        {rows.map((row, index) => (
          <div
            key={row.fieldName}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`flex items-center gap-0 py-1 border-b border-[#f0f0f0] group ${
              !row.visible ? "opacity-50" : ""
            }`}
          >
            {/* Drag handle */}
            <div className="w-[28px] flex-shrink-0 flex items-center justify-center text-[#ccc] cursor-grab select-none">
              <GripVertical className="w-3.5 h-3.5" />
            </div>

            {/* Field name (readonly) */}
            <div className="w-[140px] flex-shrink-0 px-1">
              <span className="text-[12px] text-[#888]">{row.fieldName}</span>
            </div>

            {/* Display label (editable) */}
            <div className="w-[180px] flex-shrink-0 px-1">
              <input
                type="text"
                value={row.displayLabel}
                onChange={(e) => updateRow(index, "displayLabel", e.target.value)}
                className="w-full px-1.5 py-0.5 border border-[#a0a0a0] bg-white text-[12px]"
              />
            </div>

            {/* Visible toggle */}
            <div className="w-[60px] flex-shrink-0 px-1 flex justify-center">
              <button
                onClick={() => updateRow(index, "visible", !row.visible)}
                className="p-0.5 hover:bg-[#e0e0e0] rounded"
                title={row.visible ? "Hide column" : "Show column"}
              >
                {row.visible ? (
                  <Eye className="w-3.5 h-3.5 text-[#333]" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-[#999]" />
                )}
              </button>
            </div>

            {/* Width */}
            <div className="w-[80px] flex-shrink-0 px-1">
              <input
                type="number"
                value={row.width ?? ""}
                onChange={(e) => updateRow(index, "width", e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-1.5 py-0.5 border border-[#a0a0a0] bg-white text-[12px]"
                placeholder="auto"
                min={30}
              />
            </div>

            {/* Move up/down */}
            <div className="w-[60px] flex-shrink-0 px-1 flex justify-center gap-0.5">
              <button
                onClick={() => moveRow(index, index - 1)}
                disabled={index === 0}
                className="p-0.5 hover:bg-[#e0e0e0] rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => moveRow(index, index + 1)}
                disabled={index === rows.length - 1}
                className="p-0.5 hover:bg-[#e0e0e0] rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Preview section */}
      <div className="px-4 py-2 border-t border-[#d0d0d0] bg-[#fafafa] flex-shrink-0">
        <div className="text-[11px] font-semibold text-[#555] mb-1">Column Preview</div>
        <div className="border border-[#c0c0c0] bg-white overflow-x-auto">
          <div className="flex bg-[#f0f0f0] border-b border-[#999] text-[11px] font-semibold">
            {rows
              .filter((r) => r.visible)
              .map((r) => (
                <div
                  key={r.fieldName}
                  className="px-2 py-1 border-r border-[#999] truncate"
                  style={{ width: r.width || 100, minWidth: r.width || 100 }}
                >
                  {r.displayLabel}
                </div>
              ))}
          </div>
          <div className="flex text-[11px] text-[#999]">
            {rows
              .filter((r) => r.visible)
              .map((r) => (
                <div
                  key={r.fieldName}
                  className="px-2 py-1 border-r border-[#e0e0e0] truncate"
                  style={{ width: r.width || 100, minWidth: r.width || 100 }}
                >
                  sample data
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-4 py-3 border-t border-[#d0d0d0] bg-[#f5f5f5] flex items-center justify-between flex-shrink-0">
        <button
          onClick={handleReset}
          className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#fde8e8] text-[#c45c5c] text-[12px]"
        >
          Reset to Defaults
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            disabled={!hasChanges}
            className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-3 py-1 bg-[#4a7c59] text-white border border-[#3d6b4a] hover:bg-[#5a8c69] text-[12px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
