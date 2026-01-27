"use client";

import { useState, useEffect } from "react";
import { Filter, FileText, X, Save } from "lucide-react";

export interface FilterField {
  key: string;
  label: string;
  hasLookup?: boolean;
}

export interface FilterValue {
  operator: string;
  value: string;
}

export interface FilterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: Record<string, FilterValue>) => void;
  title: string;
  fields: FilterField[];
  initialFilters?: Record<string, FilterValue>;
}

export function FilterDialog({
  isOpen,
  onClose,
  onApply,
  title,
  fields,
  initialFilters = {},
}: FilterDialogProps) {
  // Filter values state
  const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>(() => {
    const initial: Record<string, FilterValue> = {};
    fields.forEach((f) => {
      initial[f.key] = initialFilters[f.key] || { operator: "=", value: "" };
    });
    return initial;
  });

  // Sort fields state
  const [sortValues, setSortValues] = useState<Record<string, "asc" | "desc" | "">>(() => {
    const initial: Record<string, "asc" | "desc" | ""> = {};
    fields.forEach((f) => {
      initial[f.key] = "";
    });
    return initial;
  });

  // Dialog tab state
  const [activeTab, setActiveTab] = useState<"filtering" | "sorting">("filtering");

  // F3 Lookup state
  const [showLookup, setShowLookup] = useState(false);
  const [lookupField, setLookupField] = useState<string | null>(null);
  const [lookupValues, setLookupValues] = useState<Array<{ id: string; label: string; description?: string }>>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupSearch, setLookupSearch] = useState("");
  const [selectedLookupIndex, setSelectedLookupIndex] = useState(0);

  // Reset filter values when fields change
  useEffect(() => {
    const initial: Record<string, FilterValue> = {};
    fields.forEach((f) => {
      initial[f.key] = initialFilters[f.key] || { operator: "=", value: "" };
    });
    setFilterValues(initial);
  }, [fields, initialFilters]);

  // Clear all filter fields
  const clearFilterFields = () => {
    const reset: Record<string, FilterValue> = {};
    fields.forEach((f) => {
      reset[f.key] = { operator: "=", value: "" };
    });
    setFilterValues(reset);
    const sortReset: Record<string, "asc" | "desc" | ""> = {};
    fields.forEach((f) => {
      sortReset[f.key] = "";
    });
    setSortValues(sortReset);
  };

  // Apply filters
  const handleApply = () => {
    const activeFilters: Record<string, FilterValue> = {};
    Object.entries(filterValues).forEach(([key, val]) => {
      if (val.value.trim() !== "") {
        activeFilters[key] = { ...val };
      }
    });
    onApply(activeFilters);
    onClose();
  };

  // Open F3 lookup
  const openLookup = async (fieldKey: string) => {
    const field = fields.find((f) => f.key === fieldKey);
    if (!field?.hasLookup) return;

    setLookupField(fieldKey);
    setShowLookup(true);
    setLookupLoading(true);
    setLookupSearch("");
    setSelectedLookupIndex(0);

    try {
      const response = await fetch(`/api/lookups/${fieldKey}`);
      if (response.ok) {
        const data = await response.json();
        setLookupValues(data);
      }
    } catch (error) {
      console.error("Error fetching lookup values:", error);
    } finally {
      setLookupLoading(false);
    }
  };

  // Select lookup value
  const selectLookupValue = (value: string) => {
    if (lookupField) {
      setFilterValues((prev) => ({
        ...prev,
        [lookupField]: { ...prev[lookupField], value },
      }));
    }
    setShowLookup(false);
    setLookupField(null);
  };

  // Filter lookup values based on search
  const filteredLookupValues = lookupValues.filter(
    (v) =>
      v.label.toLowerCase().includes(lookupSearch.toLowerCase()) ||
      v.description?.toLowerCase().includes(lookupSearch.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Main Filter Dialog */}
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <div
          className="bg-[#ece9d8] border border-[#808080] shadow-lg flex flex-col"
          style={{
            width: "700px",
            height: "500px",
            fontFamily: "Segoe UI, Tahoma, sans-serif",
            fontSize: "11px",
          }}
        >
          {/* Dialog Title Bar */}
          <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center gap-2">
            <Filter className="w-4 h-4 text-white" />
            <span className="text-white font-bold text-[12px] flex-1">
              Filter & Sort {title}
            </span>
            <button
              onClick={onClose}
              className="text-white hover:bg-[#c45c5c] px-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Menu Bar */}
          <div className="bg-[#ece9d8] flex items-center px-1 py-0.5 border-b border-[#808080]">
            <span className="px-2 py-0.5 hover:bg-[#c0c0c0] cursor-pointer">
              File
            </span>
            <span className="px-2 py-0.5 hover:bg-[#c0c0c0] cursor-pointer">
              Edit
            </span>
            <span className="px-2 py-0.5 hover:bg-[#c0c0c0] cursor-pointer">
              Help
            </span>
          </div>

          {/* Toolbar */}
          <div className="bg-[#ece9d8] flex items-center px-1 py-1 gap-0.5 border-b border-[#808080]">
            <button
              onClick={handleApply}
              className="w-6 h-6 flex items-center justify-center hover:bg-[#c0c0c0] rounded"
              title="Apply Filter"
            >
              <Filter className="w-4 h-4 text-[#7c6b8e]" />
            </button>
            <button
              onClick={clearFilterFields}
              className="w-6 h-6 flex items-center justify-center hover:bg-[#c0c0c0] rounded"
              title="Clear Fields"
            >
              <FileText className="w-4 h-4 text-[#4a7c59]" />
            </button>
            <button
              className="w-6 h-6 flex items-center justify-center hover:bg-[#c0c0c0] rounded"
              title="Delete Existing Record"
            >
              <X className="w-4 h-4 text-[#c45c5c]" />
            </button>
            <div className="w-px h-5 bg-[#808080] mx-1" />
            <button
              className="w-6 h-6 flex items-center justify-center rounded opacity-50 cursor-not-allowed"
              title="Save (Coming Soon)"
              disabled
            >
              <Save className="w-4 h-4 text-[#2980b9]" />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - Filters */}
            <div className="w-[140px] bg-[#ece9d8] border-r border-[#808080] flex flex-col">
              <div className="px-2 py-1 text-[11px] font-bold border-b border-[#808080]">
                Filters
              </div>
              <div className="flex-1 bg-white overflow-y-auto">
                <div className="px-2 py-2 text-[11px] text-[#808080] italic">
                  Coming soon
                </div>
              </div>
            </div>

            {/* Right Panel - Tabs */}
            <div className="flex-1 flex flex-col bg-[#ece9d8]">
              {/* Tab Headers */}
              <div className="flex px-2 pt-1">
                <button
                  onClick={() => setActiveTab("filtering")}
                  className={`px-3 py-1 text-[11px] border border-[#808080] rounded-t -mb-px ${
                    activeTab === "filtering"
                      ? "bg-white border-b-white font-bold"
                      : "bg-[#d4d0c8]"
                  }`}
                >
                  1 Filtering
                </button>
                <button
                  onClick={() => setActiveTab("sorting")}
                  className={`px-3 py-1 text-[11px] border border-[#808080] border-l-0 rounded-t -mb-px ${
                    activeTab === "sorting"
                      ? "bg-white border-b-white font-bold"
                      : "bg-[#d4d0c8]"
                  }`}
                >
                  2 Sorting
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 mx-2 mb-2 border border-[#808080] bg-white overflow-hidden flex flex-col">
                {activeTab === "filtering" ? (
                  <>
                    {/* Filter Table Header */}
                    <div className="flex bg-[#f0f0f0] border-b border-[#808080] text-[11px] font-bold">
                      <div className="w-[140px] px-2 py-1 border-r border-[#808080]">
                        Field
                      </div>
                      <div className="w-[80px] px-2 py-1 border-r border-[#808080]">
                        Operator
                      </div>
                      <div className="flex-1 px-2 py-1">Value</div>
                    </div>
                    {/* Filter Table Body */}
                    <div className="flex-1 overflow-y-auto">
                      {fields.map((field) => (
                        <div
                          key={field.key}
                          className="flex border-b border-[#e0e0e0] text-[11px]"
                        >
                          <div className="w-[140px] px-2 py-0.5 border-r border-[#e0e0e0] bg-[#f9f9f9]">
                            {field.label}
                          </div>
                          <div className="w-[80px] px-1 py-0.5 border-r border-[#e0e0e0]">
                            <select
                              value={filterValues[field.key]?.operator || "="}
                              onChange={(e) => {
                                setFilterValues((prev) => ({
                                  ...prev,
                                  [field.key]: {
                                    ...prev[field.key],
                                    operator: e.target.value,
                                  },
                                }));
                              }}
                              className="w-full text-[11px] border-0 bg-transparent focus:outline-none cursor-pointer"
                            >
                              <option value="=">Equals</option>
                              <option value="contains">Contains</option>
                              <option value="startsWith">Starts With</option>
                              <option value="endsWith">Ends With</option>
                              <option value=">">Greater Than</option>
                              <option value=">=">Greater or Equal</option>
                              <option value="<">Less Than</option>
                              <option value="<=">Less or Equal</option>
                              <option value="<>">Not Equal</option>
                            </select>
                          </div>
                          <div className="flex-1 px-1 py-0.5">
                            <input
                              type="text"
                              value={filterValues[field.key]?.value || ""}
                              onChange={(e) => {
                                setFilterValues((prev) => ({
                                  ...prev,
                                  [field.key]: {
                                    ...prev[field.key],
                                    value: e.target.value,
                                  },
                                }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "F3" && field.hasLookup) {
                                  e.preventDefault();
                                  openLookup(field.key);
                                }
                              }}
                              className="w-full text-[11px] border-0 bg-transparent focus:outline-none"
                              placeholder={
                                field.hasLookup ? "Press F3 for list" : ""
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Sort Table Header */}
                    <div className="flex bg-[#f0f0f0] border-b border-[#808080] text-[11px] font-bold">
                      <div className="w-[180px] px-2 py-1 border-r border-[#808080]">
                        Field
                      </div>
                      <div className="flex-1 px-2 py-1">Direction</div>
                    </div>
                    {/* Sort Table Body */}
                    <div className="flex-1 overflow-y-auto">
                      {fields.map((field) => (
                        <div
                          key={field.key}
                          className="flex border-b border-[#e0e0e0] text-[11px]"
                        >
                          <div className="w-[180px] px-2 py-0.5 border-r border-[#e0e0e0] bg-[#f9f9f9]">
                            {field.label}
                          </div>
                          <div className="flex-1 px-1 py-0.5">
                            <select
                              value={sortValues[field.key] || ""}
                              onChange={(e) => {
                                setSortValues((prev) => ({
                                  ...prev,
                                  [field.key]: e.target.value as
                                    | "asc"
                                    | "desc"
                                    | "",
                                }));
                              }}
                              className="w-full text-[11px] border-0 bg-transparent focus:outline-none cursor-pointer"
                            >
                              <option value=""></option>
                              <option value="asc">Ascending</option>
                              <option value="desc">Descending</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* F3 Lookup Popup */}
      {showLookup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <div
            className="bg-[#ece9d8] border border-[#808080] shadow-lg flex flex-col"
            style={{
              width: "400px",
              height: "350px",
              fontFamily: "Segoe UI, Tahoma, sans-serif",
              fontSize: "11px",
            }}
          >
            {/* Title Bar */}
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center justify-between">
              <span className="text-white font-bold text-[12px]">
                Select{" "}
                {fields
                  .find((f) => f.key === lookupField)
                  ?.label.replace("*", "")}
              </span>
              <button
                onClick={() => setShowLookup(false)}
                className="text-white hover:bg-[#c45c5c] px-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Box */}
            <div className="p-2 border-b border-[#808080]">
              <input
                type="text"
                value={lookupSearch}
                onChange={(e) => {
                  setLookupSearch(e.target.value);
                  setSelectedLookupIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedLookupIndex((prev) =>
                      Math.min(prev + 1, filteredLookupValues.length - 1)
                    );
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedLookupIndex((prev) => Math.max(prev - 1, 0));
                  } else if (
                    e.key === "Enter" &&
                    filteredLookupValues[selectedLookupIndex]
                  ) {
                    selectLookupValue(
                      filteredLookupValues[selectedLookupIndex].id
                    );
                  } else if (e.key === "Escape") {
                    setShowLookup(false);
                  }
                }}
                className="w-full px-2 py-1 border border-[#808080] text-[11px]"
                placeholder="Type to search..."
                autoFocus
              />
            </div>

            {/* Results Table */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex bg-[#f0f0f0] border-b border-[#808080] text-[11px] font-bold">
                <div className="w-[140px] px-2 py-1 border-r border-[#808080]">
                  Value
                </div>
                <div className="flex-1 px-2 py-1">Description</div>
              </div>
              {/* Body */}
              <div className="flex-1 overflow-y-auto bg-white">
                {lookupLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    Loading...
                  </div>
                ) : filteredLookupValues.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No results found
                  </div>
                ) : (
                  filteredLookupValues.map((item, idx) => (
                    <div
                      key={item.id}
                      onDoubleClick={() => selectLookupValue(item.id)}
                      onClick={() => setSelectedLookupIndex(idx)}
                      className={`flex border-b border-[#e0e0e0] text-[11px] cursor-pointer ${
                        idx === selectedLookupIndex
                          ? "bg-[#316ac5] text-white"
                          : "hover:bg-[#e8e8e8]"
                      }`}
                    >
                      <div className="w-[140px] px-2 py-1 border-r border-[#e0e0e0] truncate">
                        {item.label}
                      </div>
                      <div className="flex-1 px-2 py-1 truncate">
                        {item.description || ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 p-2 border-t border-[#808080]">
              <button
                onClick={() => {
                  if (filteredLookupValues[selectedLookupIndex]) {
                    selectLookupValue(
                      filteredLookupValues[selectedLookupIndex].id
                    );
                  }
                }}
                className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
              >
                OK
              </button>
              <button
                onClick={() => setShowLookup(false)}
                className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
