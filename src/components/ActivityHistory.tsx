"use client";

import { useState, useEffect, useCallback } from "react";

interface FieldHistoryEntry {
  id: string;
  entityType: string;
  entityId: string;
  batchId: string;
  field: string;
  fieldLabel: string;
  oldValue: string | null;
  newValue: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: string;
}

interface GroupedEntry {
  batchId: string;
  userName: string;
  createdAt: string;
  changes: FieldHistoryEntry[];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = String(d.getFullYear()).slice(-2);
  let hours = d.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
}

function groupByBatch(entries: FieldHistoryEntry[]): GroupedEntry[] {
  const map = new Map<string, GroupedEntry>();
  for (const entry of entries) {
    if (!map.has(entry.batchId)) {
      map.set(entry.batchId, {
        batchId: entry.batchId,
        userName: entry.userName || "System",
        createdAt: entry.createdAt,
        changes: [],
      });
    }
    map.get(entry.batchId)!.changes.push(entry);
  }
  return Array.from(map.values());
}

interface ActivityHistoryProps {
  entityType: string;
  entityId: string;
}

export function ActivityHistory({ entityType, entityId }: ActivityHistoryProps) {
  const [entries, setEntries] = useState<FieldHistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  const fetchHistory = useCallback(
    async (newOffset = 0) => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/field-history?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}&limit=${LIMIT}&offset=${newOffset}`
        );
        if (res.ok) {
          const data = await res.json();
          if (newOffset === 0) {
            setEntries(data.entries);
          } else {
            setEntries((prev) => [...prev, ...data.entries]);
          }
          setTotal(data.total);
          setOffset(newOffset + data.entries.length);
        }
      } catch (err) {
        console.error("Failed to load field history:", err);
      } finally {
        setLoading(false);
      }
    },
    [entityType, entityId]
  );

  // Auto-load on mount
  useEffect(() => {
    fetchHistory(0);
  }, [fetchHistory]);

  const handleLoadMore = () => {
    fetchHistory(offset);
  };

  const groups = groupByBatch(entries);

  return (
    <div
      className="flex-1 overflow-y-auto bg-white"
      style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}
    >
      {loading && entries.length === 0 && (
        <div className="px-4 py-8 text-[12px] text-[#888] text-center">
          Loading history...
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="px-4 py-8 text-[12px] text-[#888] text-center">
          No changes recorded yet
        </div>
      )}

      {groups.map((group) => {
        const isCreation =
          group.changes.length === 1 && group.changes[0].field === "_created";
        return (
          <div
            key={group.batchId}
            className="flex gap-3 px-4 py-3 border-b border-[#e0e0e0]"
          >
            {/* Avatar */}
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
              style={{ backgroundColor: "#4a7cc9" }}
            >
              {getInitials(group.userName)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-semibold text-[#333]">
                  {group.userName}
                </span>
                <span className="text-[#999]">&bull;</span>
                <span className="text-[#888]">
                  {formatTimestamp(group.createdAt)}
                </span>
              </div>

              {isCreation ? (
                <div className="text-[12px] text-[#555] mt-1 italic">
                  {group.changes[0].fieldLabel}
                </div>
              ) : (
                <div className="mt-1 space-y-0.5">
                  {group.changes.map((change) => (
                    <div key={change.id} className="text-[12px] text-[#555]">
                      <span className="text-[#333] font-medium">
                        {change.fieldLabel}:
                      </span>{" "}
                      <span className="text-[#999]">
                        {change.oldValue
                          ? `"${change.oldValue}"`
                          : "(empty)"}
                      </span>
                      <span className="mx-1 text-[#999]">&rarr;</span>
                      <span className="text-[#333]">
                        {change.newValue
                          ? `"${change.newValue}"`
                          : "(empty)"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Load more */}
      {offset < total && (
        <button
          onClick={handleLoadMore}
          disabled={loading}
          className="w-full py-2 text-[12px] text-[#0066cc] hover:text-[#004499] hover:bg-[#f8f8f8] border-t border-[#e0e0e0]"
        >
          {loading
            ? "Loading..."
            : `Load more (${total - offset} remaining)`}
        </button>
      )}
    </div>
  );
}
