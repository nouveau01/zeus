"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface PicklistValue {
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
  metadata: Record<string, any> | null;
  isNew: boolean;
}

interface PicklistInlineEditorProps {
  pageId: string;
  fieldName: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  /** Display label for the field (optional, falls back to fieldName) */
  fieldLabel?: string;
  /** Display label for the module (optional, falls back to pageId) */
  moduleLabel?: string;
}

export function PicklistInlineEditor({
  pageId,
  fieldName,
  isOpen,
  onClose,
  onSaved,
  fieldLabel,
  moduleLabel,
}: PicklistInlineEditorProps) {
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<EditableRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const keyCounter = useRef(0);

  const nextKey = () => {
    keyCounter.current += 1;
    return `_new_${keyCounter.current}`;
  };

  const isStatusField = fieldName?.toLowerCase() === "status";
  const showProbability = pageId === "opportunities" && fieldName === "stage";
  const displayField = fieldLabel || fieldName;
  const displayModule = moduleLabel || pageId;

  // Fetch values on open
  const fetchValues = useCallback(async () => {
    if (!pageId || !fieldName) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/picklist-values?pageId=${encodeURIComponent(pageId)}&fieldName=${encodeURIComponent(fieldName)}&includeInactive=true`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PicklistValue[] = await res.json();
      // Filter to exact pageId (not _global fallback) for editing
      const filtered = data.filter((v) => v.pageId === pageId);
      const editRows: EditableRow[] = filtered.map((v) => ({
        _key: v.id,
        id: v.id,
        value: v.value,
        label: v.label,
        sortOrder: v.sortOrder,
        isDefault: v.isDefault,
        isActive: v.isActive,
        color: v.color,
        metadata: v.metadata,
        isNew: false,
      }));
      setRows(editRows);
      setSavedSnapshot(JSON.parse(JSON.stringify(editRows)));
    } catch (err) {
      console.error("Error fetching picklist values:", err);
      setMessage({ type: "error", text: "Failed to load values." });
    } finally {
      setLoading(false);
    }
  }, [pageId, fieldName]);

  useEffect(() => {
    if (isOpen) {
      fetchValues();
    } else {
      setRows([]);
      setSavedSnapshot([]);
      setMessage(null);
    }
  }, [isOpen, fetchValues]);

  // Row editing
  const addRow = () => {
    const maxSort = rows.reduce((max, r) => Math.max(max, r.sortOrder), -1);
    setRows((prev) => [
      ...prev,
      {
        _key: nextKey(),
        id: null,
        value: "",
        label: "",
        sortOrder: maxSort + 1,
        isDefault: false,
        isActive: true,
        color: null,
        metadata: showProbability ? { probability: 0 } : null,
        isNew: true,
      },
    ]);
  };

  const updateRow = (key: string, field: keyof EditableRow, val: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r._key !== key) return field === "isDefault" && val === true ? { ...r, isDefault: false } : r;
        return { ...r, [field]: val };
      })
    );
  };

  const removeRow = (key: string) => {
    setRows((prev) => prev.filter((r) => r._key !== key));
  };

  const hasChanges = JSON.stringify(rows) !== JSON.stringify(savedSnapshot);

  // Save
  const handleSave = async () => {
    // Validate
    for (const row of rows) {
      if (!row.value.trim()) {
        setMessage({ type: "error", text: "All rows must have a non-empty value." });
        return;
      }
    }
    const vals = rows.map((r) => r.value.trim().toLowerCase());
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
          fieldName,
          values: rows.map((r, i) => ({
            value: r.value.trim(),
            label: r.label.trim() || r.value.trim(),
            sortOrder: i,
            isDefault: r.isDefault,
            isActive: r.isActive,
            color: r.color || null,
            metadata: r.metadata || null,
          })),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const saved: PicklistValue[] = await res.json();
      const newRows: EditableRow[] = saved.map((v) => ({
        _key: v.id,
        id: v.id,
        value: v.value,
        label: v.label,
        sortOrder: v.sortOrder,
        isDefault: v.isDefault,
        isActive: v.isActive,
        color: v.color,
        metadata: v.metadata,
        isNew: false,
      }));
      setRows(newRows);
      setSavedSnapshot(JSON.parse(JSON.stringify(newRows)));
      setMessage({ type: "success", text: "Saved." });

      onSaved?.();
      setTimeout(() => {
        setMessage(null);
      }, 2000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to save." });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", fontSize: "12px" }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className={`relative bg-[#ece9d8] border border-[#0054e3] shadow-lg max-h-[520px] flex flex-col ${showProbability ? "w-[500px]" : "w-[440px]"}`}>
        {/* Title bar */}
        <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-[#0054e3] to-[#2990ea] text-white text-[12px] font-semibold select-none">
          <span className="truncate">
            Edit: {displayField} ({displayModule})
          </span>
          <button
            onClick={onClose}
            className="w-[18px] h-[18px] flex items-center justify-center bg-[#c45c5c] hover:bg-[#d46e6e] text-white text-[12px] leading-none border border-[#fff]/30 rounded-sm"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-3 gap-2">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-[11px] text-[#808080]">
              Loading...
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="flex items-center gap-0 text-[10px] font-semibold text-[#555] flex-shrink-0">
                <div className="w-[130px] flex-shrink-0 px-1">Value</div>
                <div className="w-[130px] flex-shrink-0 px-1">Label</div>
                {isStatusField && <div className="w-[60px] flex-shrink-0 px-1">Color</div>}
                {showProbability && <div className="w-[50px] flex-shrink-0 px-1">Prob %</div>}
                <div className="w-[36px] flex-shrink-0 px-1 text-center">Def</div>
                <div className="w-[36px] flex-shrink-0 px-1 text-center">Act</div>
                <div className="w-[20px] flex-shrink-0"></div>
              </div>

              {/* Rows */}
              <div className="flex-1 overflow-y-auto min-h-0 border border-[#aca899] bg-white">
                {rows.length === 0 ? (
                  <div className="py-4 text-center text-[11px] text-[#808080]">
                    No values yet. Click &quot;+ Add Value&quot; to start.
                  </div>
                ) : (
                  rows.map((row) => (
                    <div
                      key={row._key}
                      className={`flex items-center gap-0 py-0.5 px-1 border-b border-[#f0f0f0] ${
                        !row.isActive ? "opacity-50" : ""
                      }`}
                    >
                      <div className="w-[130px] flex-shrink-0 px-0.5">
                        <input
                          type="text"
                          value={row.value}
                          readOnly={!row.isNew}
                          onChange={(e) => updateRow(row._key, "value", e.target.value)}
                          className={`w-full px-1 py-0.5 border text-[11px] ${
                            row.isNew
                              ? "border-[#a0a0a0] bg-white"
                              : "border-[#e0e0e0] bg-[#f9f9f9] text-[#666] cursor-default"
                          }`}
                          title={row.isNew ? "Enter value key" : "Value cannot be changed"}
                        />
                      </div>
                      <div className="w-[130px] flex-shrink-0 px-0.5">
                        <input
                          type="text"
                          value={row.label}
                          onChange={(e) => updateRow(row._key, "label", e.target.value)}
                          className="w-full px-1 py-0.5 border border-[#a0a0a0] bg-white text-[11px]"
                          placeholder="Display label"
                        />
                      </div>
                      {isStatusField && (
                        <div className="w-[60px] flex-shrink-0 px-0.5 flex items-center gap-0.5">
                          <input
                            type="text"
                            value={row.color || ""}
                            onChange={(e) => updateRow(row._key, "color", e.target.value || null)}
                            className="w-full px-1 py-0.5 border border-[#a0a0a0] bg-white text-[11px]"
                            placeholder="#hex"
                          />
                          {row.color && (
                            <div
                              className="w-3 h-3 flex-shrink-0 border border-[#ccc]"
                              style={{ backgroundColor: row.color }}
                            />
                          )}
                        </div>
                      )}
                      {showProbability && (
                        <div className="w-[50px] flex-shrink-0 px-0.5">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={row.metadata?.probability ?? ""}
                            onChange={(e) => {
                              const prob = e.target.value === "" ? 0 : parseInt(e.target.value);
                              updateRow(row._key, "metadata", { ...(row.metadata || {}), probability: prob });
                            }}
                            className="w-full px-1 py-0.5 border border-[#a0a0a0] bg-white text-[11px] text-center"
                            placeholder="%"
                          />
                        </div>
                      )}
                      <div className="w-[36px] flex-shrink-0 flex justify-center">
                        <input
                          type="radio"
                          name={`inline-default-${pageId}-${fieldName}`}
                          checked={row.isDefault}
                          onChange={() => updateRow(row._key, "isDefault", true)}
                          className="cursor-pointer"
                        />
                      </div>
                      <div className="w-[36px] flex-shrink-0 flex justify-center">
                        <input
                          type="checkbox"
                          checked={row.isActive}
                          onChange={(e) => updateRow(row._key, "isActive", e.target.checked)}
                          className="cursor-pointer"
                        />
                      </div>
                      <div className="w-[20px] flex-shrink-0 flex justify-center">
                        <button
                          onClick={() => removeRow(row._key)}
                          className="text-[#c0c0c0] hover:text-[#c45c5c] text-[13px] leading-none"
                          title="Remove"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add value button */}
              <button
                onClick={addRow}
                className="self-start px-2 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[11px]"
              >
                + Add Value
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-[#aca899] bg-[#ece9d8] flex-shrink-0">
          <div>
            {message && (
              <span
                className={`text-[11px] ${
                  message.type === "error" ? "text-[#c45c5c]" : "text-[#28a745]"
                }`}
              >
                {message.text}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[11px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
