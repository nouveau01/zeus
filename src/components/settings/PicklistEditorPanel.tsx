"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MODULE_REGISTRY, getModulesBySection } from "@/lib/moduleRegistry";

// ─── Types ──────────────────────────────────────────────────────────────────

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
  /** Temp client key for React keys on new rows */
  _key: string;
  id: string | null; // null for unsaved new rows
  value: string;
  label: string;
  sortOrder: number;
  isDefault: boolean;
  isActive: boolean;
  color: string | null;
  isNew: boolean;
}

// A fallback module entry for the _global picklist bucket (used if not in registry)
const GLOBAL_MODULE = {
  pageId: "_global",
  label: "Global (Shared)",
  section: "_global",
  fields: [] as { fieldName: string; label: string }[],
};

// ─── Component ──────────────────────────────────────────────────────────────

export function PicklistEditorPanel() {
  const modulesBySection = getModulesBySection();

  // Selection state
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedFieldName, setSelectedFieldName] = useState<string | null>(null);

  // Data for the middle column: field name -> array of picklist values
  const [fieldValuesMap, setFieldValuesMap] = useState<Record<string, PicklistValue[]>>({});
  const [loadingFields, setLoadingFields] = useState(false);

  // Data for the right column: the editable rows
  const [editRows, setEditRows] = useState<EditableRow[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<EditableRow[]>([]);

  // Extra fields discovered from the DB (not in MODULE_REGISTRY)
  const [extraFieldNames, setExtraFieldNames] = useState<string[]>([]);

  // "Add New Field" dialog
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");

  // Save / messages
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Collapsed sidebar sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Unique key counter for new rows
  const keyCounter = useRef(0);
  const nextKey = () => {
    keyCounter.current += 1;
    return `_new_${keyCounter.current}`;
  };

  // ── Helpers ─────────────────────────────────────────────────────────────

  const selectedModule =
    selectedPageId === "_global"
      ? GLOBAL_MODULE
      : MODULE_REGISTRY.find((m) => m.pageId === selectedPageId) ?? null;

  /** All field names for the currently selected module (from registry + DB extras) */
  const allFieldNames: string[] = (() => {
    if (!selectedModule) return [];
    const registryNames = selectedModule.fields.map((f) => f.fieldName);
    // Merge in extra fields from DB that aren't in registry
    const combined = [...registryNames];
    for (const ef of extraFieldNames) {
      if (!combined.includes(ef)) combined.push(ef);
    }
    return combined;
  })();

  const fieldLabel = (fieldName: string): string => {
    if (!selectedModule) return fieldName;
    const found = selectedModule.fields.find((f) => f.fieldName === fieldName);
    return found ? found.label : fieldName;
  };

  const hasUnsavedChanges = (): boolean => {
    return JSON.stringify(editRows) !== JSON.stringify(savedSnapshot);
  };

  // ── Fetch all picklist values for a given pageId ───────────────────────

  const fetchAllFieldsForPage = useCallback(
    async (pageId: string) => {
      setLoadingFields(true);
      setFieldValuesMap({});
      setExtraFieldNames([]);

      try {
        const mod =
          pageId === "_global"
            ? GLOBAL_MODULE
            : MODULE_REGISTRY.find((m) => m.pageId === pageId);

        const knownFields = mod ? mod.fields.map((f) => f.fieldName) : [];

        // For known fields, fetch in parallel
        const results: Record<string, PicklistValue[]> = {};
        if (knownFields.length > 0) {
          const promises = knownFields.map(async (fn) => {
            const res = await fetch(
              `/api/picklist-values?pageId=${encodeURIComponent(pageId)}&fieldName=${encodeURIComponent(fn)}`
            );
            if (res.ok) {
              const data: PicklistValue[] = await res.json();
              // Only include values that truly belong to this pageId (not fallback _global)
              return { fieldName: fn, values: data.filter((v) => v.pageId === pageId) };
            }
            return { fieldName: fn, values: [] };
          });
          const settled = await Promise.all(promises);
          for (const s of settled) {
            results[s.fieldName] = s.values;
          }
        }

        // For _global or to discover extra fields, we also need to check if there are
        // fields stored in the DB that aren't in the registry. We can do a quick scan
        // by checking a few common picklist field names.
        if (pageId === "_global") {
          const commonGlobalFields = ["status", "type", "category", "priority", "source"];
          const globalPromises = commonGlobalFields.map(async (fn) => {
            const res = await fetch(
              `/api/picklist-values?pageId=_global&fieldName=${encodeURIComponent(fn)}`
            );
            if (res.ok) {
              const data: PicklistValue[] = await res.json();
              const filtered = data.filter((v) => v.pageId === "_global");
              if (filtered.length > 0) {
                return { fieldName: fn, values: filtered };
              }
            }
            return null;
          });
          const globalResults = await Promise.all(globalPromises);
          for (const r of globalResults) {
            if (r) results[r.fieldName] = r.values;
          }
        }

        setFieldValuesMap(results);

        // Detect extra fields not in registry
        const extras = Object.keys(results).filter(
          (fn) => !knownFields.includes(fn)
        );
        setExtraFieldNames(extras);
      } catch (err) {
        console.error("Error fetching fields for page:", err);
      } finally {
        setLoadingFields(false);
      }
    },
    []
  );

  // When selectedPageId changes, fetch fields
  useEffect(() => {
    if (selectedPageId) {
      setSelectedFieldName(null);
      setEditRows([]);
      setSavedSnapshot([]);
      setMessage(null);
      fetchAllFieldsForPage(selectedPageId);
    }
  }, [selectedPageId, fetchAllFieldsForPage]);

  // When selectedFieldName changes, populate edit rows
  useEffect(() => {
    if (!selectedFieldName || !selectedPageId) {
      setEditRows([]);
      setSavedSnapshot([]);
      return;
    }

    const values = fieldValuesMap[selectedFieldName] || [];
    const rows: EditableRow[] = values.map((v) => ({
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
    setMessage(null);
  }, [selectedFieldName, fieldValuesMap, selectedPageId]);

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
        if (r._key !== key) return r;
        // If setting isDefault to true, unset all others
        if (field === "isDefault" && val === true) {
          return { ...r, isDefault: true };
        }
        return { ...r, [field]: val };
      })
    );
    // If toggling isDefault on, unset others
    if (field === "isDefault" && val === true) {
      setEditRows((prev) =>
        prev.map((r) => (r._key === key ? r : { ...r, isDefault: false }))
      );
    }
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
    if (!selectedPageId || !selectedFieldName) return;

    // Validate: all rows must have a value
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
          pageId: selectedPageId,
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

      const saved: PicklistValue[] = await res.json();

      // Update the field values map
      setFieldValuesMap((prev) => ({ ...prev, [selectedFieldName]: saved }));

      // Rebuild edit rows from saved data
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
    const name = newFieldName.trim();
    if (!name) return;

    // Add it as an extra field and select it
    if (!allFieldNames.includes(name)) {
      setExtraFieldNames((prev) => [...prev, name]);
    }
    setFieldValuesMap((prev) => ({ ...prev, [name]: [] }));
    setSelectedFieldName(name);
    setShowAddField(false);
    setNewFieldName("");
  };

  // ── Toggle sidebar section ─────────────────────────────────────────────

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  // Is this a "status" field? (used to decide whether to show color column)
  const isStatusField =
    selectedFieldName?.toLowerCase() === "status";

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div
      className="h-full flex"
      style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", fontSize: "12px" }}
    >
      {/* ─── Left Sidebar: Module List ─────────────────────────────────── */}
      <div className="w-[180px] bg-[#f5f5f5] border-r border-[#d0d0d0] flex flex-col flex-shrink-0">
        <div className="px-2 py-2 border-b border-[#d0d0d0] font-semibold text-[12px]">
          Modules
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Grouped modules (includes _global from registry) */}
          {Object.entries(modulesBySection).map(([section, modules]) => {
            const collapsed = collapsedSections.has(section);
            return (
              <div key={section}>
                {/* Section header */}
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
                      onClick={() => setSelectedPageId(mod.pageId)}
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

      {/* ─── Middle Column: Field List ────────────────────────────────── */}
      <div className="w-[200px] bg-[#f5f5f5] border-r border-[#d0d0d0] flex flex-col flex-shrink-0">
        <div className="px-2 py-2 border-b border-[#d0d0d0] font-semibold text-[12px] truncate">
          {selectedModule ? `Fields: ${selectedModule.label}` : "Select a module"}
        </div>

        {selectedPageId ? (
          <>
            <div className="flex-1 overflow-y-auto">
              {loadingFields ? (
                <div className="px-2 py-4 text-[11px] text-[#808080] text-center">
                  Loading...
                </div>
              ) : allFieldNames.length === 0 ? (
                <div className="px-2 py-4 text-[11px] text-[#808080] text-center">
                  No fields.
                  <br />
                  Use &quot;Add New Field&quot; below.
                </div>
              ) : (
                allFieldNames.map((fn) => {
                  const count = (fieldValuesMap[fn] || []).length;
                  return (
                    <button
                      key={fn}
                      onClick={() => setSelectedFieldName(fn)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-left text-[12px] border-b border-[#e8e8e8] transition-colors ${
                        selectedFieldName === fn
                          ? "bg-[#0078d4] text-white"
                          : "text-[#333] hover:bg-[#e0e0e0]"
                      }`}
                    >
                      <span className="truncate">{fieldLabel(fn)}</span>
                      <span
                        className={`ml-1 flex-shrink-0 text-[10px] ${
                          selectedFieldName === fn ? "text-white/70" : "text-[#999]"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Add New Field button */}
            <div className="px-2 py-2 border-t border-[#d0d0d0]">
              {showAddField ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddField();
                      if (e.key === "Escape") {
                        setShowAddField(false);
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
                      disabled={!newFieldName.trim()}
                      className="flex-1 px-2 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddField(false);
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[11px] text-[#808080] px-2 text-center">
            Select a module from the left to view its picklist fields.
          </div>
        )}
      </div>

      {/* ─── Right Column: Value Editor ───────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {selectedPageId && selectedFieldName ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#d0d0d0] bg-white flex items-center justify-between flex-shrink-0">
              <div>
                <span className="font-semibold text-[13px]">
                  {selectedPageId}
                  <span className="text-[#999] font-normal mx-1">&gt;</span>
                  {selectedFieldName}
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

            {/* Column headers for the value rows */}
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
              {editRows.length === 0 ? (
                <div className="py-6 text-center text-[11px] text-[#808080]">
                  No values yet. Click &quot;Add Value&quot; to create the first entry.
                </div>
              ) : (
                editRows.map((row) => (
                  <div
                    key={row._key}
                    className="flex items-center gap-0 py-1 border-b border-[#f0f0f0] group"
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
                        name={`default-${selectedPageId}-${selectedFieldName}`}
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
                  disabled={!hasUnsavedChanges()}
                  className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !hasUnsavedChanges()}
                  className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[12px] text-[#808080]">
            {selectedPageId
              ? "Select a field from the middle column to edit its picklist values."
              : "Select a module, then a field, to manage picklist values."}
          </div>
        )}
      </div>
    </div>
  );
}
