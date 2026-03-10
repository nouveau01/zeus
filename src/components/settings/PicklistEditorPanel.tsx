"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MODULE_REGISTRY } from "@/lib/moduleRegistry";

// ─── Types ──────────────────────────────────────────────────────────────────

interface FieldEntry {
  pageId: string;
  fieldName: string;
  moduleLabel: string;
  fieldLabel: string;
  count: number;
}

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
  isNew: boolean;
}

// Section color pills for module tags
const SECTION_COLORS: Record<string, string> = {
  AR: "#0078d4",
  AP: "#8b5cf6",
  Dispatch: "#d97706",
  "Dispatch Extras": "#b45309",
  "Job Cost": "#059669",
  Sales: "#dc2626",
  Automation: "#7c3aed",
  Reports: "#6b7280",
  Global: "#475569",
};

// ─── Component ──────────────────────────────────────────────────────────────

export function PicklistEditorPanel() {
  // Field list state
  const [fields, setFields] = useState<FieldEntry[]>([]);
  const [loadingFields, setLoadingFields] = useState(true);
  const [search, setSearch] = useState("");

  // Selection
  const [selectedKey, setSelectedKey] = useState<string | null>(null); // "pageId::fieldName"

  // Right column: value editor
  const [editRows, setEditRows] = useState<EditableRow[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<EditableRow[]>([]);
  const [loadingValues, setLoadingValues] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // "Add New Field" dialog
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldPageId, setNewFieldPageId] = useState("");
  const [newFieldName, setNewFieldName] = useState("");

  const keyCounter = useRef(0);
  const nextKey = () => {
    keyCounter.current += 1;
    return `_new_${keyCounter.current}`;
  };

  // ── Fetch flat field list ───────────────────────────────────────────────

  const fetchFields = useCallback(async () => {
    setLoadingFields(true);
    try {
      const res = await fetch("/api/picklist-values/fields");
      if (res.ok) {
        const data: FieldEntry[] = await res.json();
        setFields(data);
      }
    } catch (err) {
      console.error("Error fetching picklist fields:", err);
    } finally {
      setLoadingFields(false);
    }
  }, []);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  // ── Derived ─────────────────────────────────────────────────────────────

  const selectedField = selectedKey
    ? fields.find((f) => `${f.pageId}::${f.fieldName}` === selectedKey) ?? null
    : null;

  const filteredFields = search.trim()
    ? fields.filter((f) => {
        const q = search.toLowerCase();
        return (
          f.fieldLabel.toLowerCase().includes(q) ||
          f.fieldName.toLowerCase().includes(q) ||
          f.moduleLabel.toLowerCase().includes(q) ||
          f.pageId.toLowerCase().includes(q)
        );
      })
    : fields;

  const isStatusField = selectedField?.fieldName?.toLowerCase() === "status";

  const hasUnsavedChanges = JSON.stringify(editRows) !== JSON.stringify(savedSnapshot);

  // ── Fetch values for selected field ─────────────────────────────────────

  const fetchValues = useCallback(
    async (pageId: string, fieldName: string) => {
      setLoadingValues(true);
      setMessage(null);
      try {
        const res = await fetch(
          `/api/picklist-values?pageId=${encodeURIComponent(pageId)}&fieldName=${encodeURIComponent(fieldName)}&includeInactive=true`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: PicklistValue[] = await res.json();
        // Only show values for the exact pageId (not _global fallback)
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
      } catch (err) {
        console.error("Error fetching values:", err);
        setMessage({ type: "error", text: "Failed to load values." });
        setEditRows([]);
        setSavedSnapshot([]);
      } finally {
        setLoadingValues(false);
      }
    },
    []
  );

  // When selection changes, load values
  useEffect(() => {
    if (selectedField) {
      fetchValues(selectedField.pageId, selectedField.fieldName);
    } else {
      setEditRows([]);
      setSavedSnapshot([]);
      setMessage(null);
    }
  }, [selectedKey, selectedField, fetchValues]);

  // ── Row editing handlers ───────────────────────────────────────────────

  const addRow = () => {
    const maxSort = editRows.reduce((max, r) => Math.max(max, r.sortOrder), -1);
    setEditRows((prev) => [
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
        isNew: true,
      },
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

  // ── Save ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!selectedField) return;

    // Validate: no empty values
    for (const row of editRows) {
      if (!row.value.trim()) {
        setMessage({ type: "error", text: "All rows must have a non-empty value." });
        return;
      }
    }

    // Check for duplicate values
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
          pageId: selectedField.pageId,
          fieldName: selectedField.fieldName,
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

      const saved: PicklistValue[] = await res.json();
      const rows: EditableRow[] = saved.map((v) => ({
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

      // Update the count in field list
      setFields((prev) =>
        prev.map((f) =>
          f.pageId === selectedField.pageId && f.fieldName === selectedField.fieldName
            ? { ...f, count: saved.length }
            : f
        )
      );

      setMessage({ type: "success", text: "Changes saved successfully." });
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      console.error("Save error:", err);
      setMessage({ type: "error", text: err.message || "Failed to save changes." });
    } finally {
      setSaving(false);
    }
  };

  // ── Add New Field ──────────────────────────────────────────────────────

  const handleAddField = () => {
    const pId = newFieldPageId.trim();
    const fName = newFieldName.trim();
    if (!pId || !fName) return;

    const key = `${pId}::${fName}`;
    const existing = fields.find((f) => `${f.pageId}::${f.fieldName}` === key);
    if (existing) {
      // Just select it
      setSelectedKey(key);
    } else {
      const mod = MODULE_REGISTRY.find((m) => m.pageId === pId);
      const newEntry: FieldEntry = {
        pageId: pId,
        fieldName: fName,
        moduleLabel: mod?.label || pId,
        fieldLabel: fName,
        count: 0,
      };
      setFields((prev) => [...prev, newEntry].sort((a, b) => {
        const cmp = a.fieldLabel.localeCompare(b.fieldLabel);
        return cmp !== 0 ? cmp : a.moduleLabel.localeCompare(b.moduleLabel);
      }));
      setSelectedKey(key);
    }

    setShowAddField(false);
    setNewFieldPageId("");
    setNewFieldName("");
  };

  // ── Module section color ───────────────────────────────────────────────

  const getModuleColor = (pageId: string): string => {
    const mod = MODULE_REGISTRY.find((m) => m.pageId === pageId);
    if (!mod) return "#6b7280";
    return SECTION_COLORS[mod.section] || "#6b7280";
  };

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div
      className="h-full flex"
      style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", fontSize: "12px" }}
    >
      {/* ─── Left Column: Searchable Field List ────────────────────────── */}
      <div className="w-[280px] bg-[#f5f5f5] border-r border-[#d0d0d0] flex flex-col flex-shrink-0">
        {/* Search */}
        <div className="px-2 py-2 border-b border-[#d0d0d0]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields..."
            className="w-full px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
          />
        </div>

        {/* Field list */}
        <div className="flex-1 overflow-y-auto">
          {loadingFields ? (
            <div className="px-2 py-4 text-[11px] text-[#808080] text-center">Loading...</div>
          ) : filteredFields.length === 0 ? (
            <div className="px-2 py-4 text-[11px] text-[#808080] text-center">
              {search ? "No fields match your search." : "No picklist fields found."}
            </div>
          ) : (
            filteredFields.map((f) => {
              const key = `${f.pageId}::${f.fieldName}`;
              const isSelected = selectedKey === key;
              const color = getModuleColor(f.pageId);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left border-b border-[#e8e8e8] transition-colors ${
                    isSelected
                      ? "bg-[#0078d4] text-white"
                      : "text-[#333] hover:bg-[#e0e0e0]"
                  }`}
                >
                  <span className="font-semibold text-[12px] truncate flex-1">
                    {f.fieldLabel}
                  </span>
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-sm flex-shrink-0 font-medium"
                    style={{
                      backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : `${color}18`,
                      color: isSelected ? "white" : color,
                    }}
                  >
                    {f.moduleLabel}
                  </span>
                  <span
                    className={`text-[10px] flex-shrink-0 tabular-nums ${
                      isSelected ? "text-white/70" : "text-[#999]"
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Add New Field */}
        <div className="px-2 py-2 border-t border-[#d0d0d0]">
          {showAddField ? (
            <div className="space-y-1">
              <select
                value={newFieldPageId}
                onChange={(e) => setNewFieldPageId(e.target.value)}
                className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
              >
                <option value="">Select module...</option>
                {MODULE_REGISTRY.map((m) => (
                  <option key={m.pageId} value={m.pageId}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newFieldName}
                onChange={(e) => setNewFieldName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddField();
                  if (e.key === "Escape") {
                    setShowAddField(false);
                    setNewFieldPageId("");
                    setNewFieldName("");
                  }
                }}
                placeholder="fieldName"
                className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                autoFocus
              />
              <div className="flex gap-1">
                <button
                  onClick={handleAddField}
                  disabled={!newFieldPageId || !newFieldName.trim()}
                  className="flex-1 px-2 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddField(false);
                    setNewFieldPageId("");
                    setNewFieldName("");
                  }}
                  className="flex-1 px-2 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddField(true)}
              className="w-full px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
            >
              + Add New Field
            </button>
          )}
        </div>
      </div>

      {/* ─── Right Column: Value Editor ────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedField ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#d0d0d0] bg-white flex items-center justify-between flex-shrink-0">
              <div>
                <span className="font-semibold text-[13px]">
                  {selectedField.moduleLabel}
                  <span className="text-[#999] font-normal mx-1">&gt;</span>
                  {selectedField.fieldLabel}
                </span>
                <span className="ml-2 text-[11px] text-[#999]">
                  ({editRows.length} value{editRows.length !== 1 ? "s" : ""})
                </span>
              </div>
              <div className="flex items-center gap-2">
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
            </div>

            {/* Column headers */}
            <div className="flex items-center gap-0 px-4 py-1.5 bg-[#f0f0f0] border-b border-[#d0d0d0] text-[11px] font-semibold text-[#555] flex-shrink-0">
              <div className="w-[24px] flex-shrink-0"></div>
              <div className="w-[140px] flex-shrink-0 px-1">Value</div>
              <div className="w-[160px] flex-shrink-0 px-1">Label</div>
              {isStatusField && (
                <div className="w-[90px] flex-shrink-0 px-1">Color</div>
              )}
              <div className="w-[50px] flex-shrink-0 px-1 text-center">Default</div>
              <div className="w-[50px] flex-shrink-0 px-1 text-center">Active</div>
              <div className="w-[24px] flex-shrink-0"></div>
            </div>

            {/* Value rows */}
            <div className="flex-1 overflow-y-auto px-4 py-1">
              {loadingValues ? (
                <div className="py-6 text-center text-[11px] text-[#808080]">Loading...</div>
              ) : editRows.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-[#808080]">
                  No values yet. Click &quot;Add Value&quot; to create the first entry.
                </div>
              ) : (
                editRows.map((row) => (
                  <div
                    key={row._key}
                    className={`flex items-center gap-0 py-1 border-b border-[#f0f0f0] group ${
                      !row.isActive ? "opacity-50" : ""
                    }`}
                  >
                    {/* Drag handle placeholder */}
                    <div className="w-[24px] flex-shrink-0 flex items-center justify-center text-[#ccc] cursor-grab select-none text-[14px]">
                      ≡
                    </div>

                    {/* Value */}
                    <div className="w-[140px] flex-shrink-0 px-1">
                      <input
                        type="text"
                        value={row.value}
                        readOnly={!row.isNew}
                        onChange={(e) => updateRow(row._key, "value", e.target.value)}
                        className={`w-full px-1.5 py-0.5 border text-[12px] ${
                          row.isNew
                            ? "border-[#a0a0a0] bg-white"
                            : "border-[#e0e0e0] bg-[#f9f9f9] text-[#666] cursor-default"
                        }`}
                        title={row.isNew ? "Enter the value key" : "Value cannot be changed after creation"}
                      />
                    </div>

                    {/* Label */}
                    <div className="w-[160px] flex-shrink-0 px-1">
                      <input
                        type="text"
                        value={row.label}
                        onChange={(e) => updateRow(row._key, "label", e.target.value)}
                        className="w-full px-1.5 py-0.5 border border-[#a0a0a0] bg-white text-[12px]"
                        placeholder="Display label"
                      />
                    </div>

                    {/* Color (only for status fields) */}
                    {isStatusField && (
                      <div className="w-[90px] flex-shrink-0 px-1 flex items-center gap-1">
                        <input
                          type="text"
                          value={row.color || ""}
                          onChange={(e) =>
                            updateRow(row._key, "color", e.target.value || null)
                          }
                          className="w-full px-1.5 py-0.5 border border-[#a0a0a0] bg-white text-[12px]"
                          placeholder="#hex"
                        />
                        {row.color && (
                          <div
                            className="w-4 h-4 flex-shrink-0 border border-[#ccc] rounded-sm"
                            style={{ backgroundColor: row.color }}
                          />
                        )}
                      </div>
                    )}

                    {/* Default (radio-like) */}
                    <div className="w-[50px] flex-shrink-0 px-1 flex justify-center">
                      <input
                        type="radio"
                        name={`default-${selectedField.pageId}-${selectedField.fieldName}`}
                        checked={row.isDefault}
                        onChange={() => updateRow(row._key, "isDefault", true)}
                        className="cursor-pointer"
                        title="Set as default value"
                      />
                    </div>

                    {/* Active toggle */}
                    <div className="w-[50px] flex-shrink-0 px-1 flex justify-center">
                      <input
                        type="checkbox"
                        checked={row.isActive}
                        onChange={(e) =>
                          updateRow(row._key, "isActive", e.target.checked)
                        }
                        className="cursor-pointer"
                        title={row.isActive ? "Active" : "Inactive"}
                      />
                    </div>

                    {/* Delete */}
                    <div className="w-[24px] flex-shrink-0 flex items-center justify-center">
                      <button
                        onClick={() => removeRow(row._key)}
                        className="text-[#c0c0c0] hover:text-[#c45c5c] text-[14px] leading-none"
                        title="Remove this value"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom action bar */}
            <div className="px-4 py-3 border-t border-[#d0d0d0] bg-[#f5f5f5] flex items-center justify-between flex-shrink-0">
              <button
                onClick={addRow}
                className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
              >
                + Add Value
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  disabled={!hasUnsavedChanges}
                  className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasUnsavedChanges}
                  className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[#808080]">
            Select a field from the left to edit its picklist values.
          </div>
        )}
      </div>
    </div>
  );
}
