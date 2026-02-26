"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Trash2 } from "lucide-react";
import { FilterValue } from "@/components/FilterDialog";

interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, FilterValue>;
  isPublic: boolean;
  userId: string;
  user: { name: string };
}

interface SavedFiltersDropdownProps {
  pageId: string;
  onApply: (filters: Record<string, FilterValue>) => void;
  onClear: () => void;
}

export function SavedFiltersDropdown({ pageId, onApply, onClear }: SavedFiltersDropdownProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [selectedFilterId, setSelectedFilterId] = useState("None");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchSavedFilters = useCallback(async () => {
    try {
      const res = await fetch(`/api/saved-filters?pageId=${pageId}`);
      if (res.ok) {
        const data = await res.json();
        setSavedFilters(data);
      }
    } catch (error) {
      console.error("Error fetching saved filters:", error);
    }
  }, [pageId]);

  useEffect(() => {
    fetchSavedFilters();
  }, [fetchSavedFilters]);

  // Allow FilterDialog to trigger a refresh via a custom event
  useEffect(() => {
    const handler = () => fetchSavedFilters();
    window.addEventListener(`savedFilters:${pageId}:refresh`, handler);
    return () => window.removeEventListener(`savedFilters:${pageId}:refresh`, handler);
  }, [pageId, fetchSavedFilters]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedFilterId(value);

    if (value === "None") {
      onClear();
      return;
    }

    const filter = savedFilters.find((f) => f.id === value);
    if (filter) {
      onApply(filter.filters as Record<string, FilterValue>);
    }
  };

  const handleDeleteClick = () => {
    if (selectedFilterId === "None") return;
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await fetch(`/api/saved-filters?id=${selectedFilterId}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedFilterId("None");
        setShowDeleteConfirm(false);
        onClear();
        fetchSavedFilters();
      }
    } catch (error) {
      console.error("Error deleting saved filter:", error);
    }
  };

  const filterToDelete = savedFilters.find((f) => f.id === selectedFilterId);

  return (
    <>
      <div className="flex items-center gap-1">
        <span className="text-[11px]">Saved Filters</span>
        <select
          value={selectedFilterId}
          onChange={handleChange}
          className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white min-w-[100px]"
        >
          <option value="None">None</option>
          {savedFilters.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}{f.isPublic ? "" : " (private)"}
            </option>
          ))}
        </select>
        {selectedFilterId !== "None" && (
          <button
            onClick={handleDeleteClick}
            className="w-4 h-4 flex items-center justify-center hover:bg-[#e0e0e0] rounded"
            title="Delete saved filter"
          >
            <X className="w-3 h-3 text-[#c45c5c]" />
          </button>
        )}
      </div>

      {/* Themed Delete Confirmation */}
      {showDeleteConfirm && filterToDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70]">
          <div
            className="bg-[#ece9d8] border border-[#808080] shadow-lg"
            style={{ width: "320px", fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "11px" }}
          >
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center justify-between">
              <span className="text-white font-bold text-[12px]">Confirm Delete</span>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-white hover:bg-[#c45c5c] px-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3 mb-4">
                <Trash2 className="w-5 h-5 text-[#c45c5c] flex-shrink-0 mt-0.5" />
                <p className="text-[12px]">
                  Delete saved filter <strong>&quot;{filterToDelete.name}&quot;</strong>?
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
