"use client";

import { useState } from "react";
import { Briefcase, ChevronDown, ChevronUp } from "lucide-react";

interface HistoryEntry {
  id: string;
  date: string;
  field: string;
  user: {
    name: string;
  };
  originalValue: string | null;
  newValue: string | null;
}

interface JobHistoryProps {
  entries: HistoryEntry[];
  totalCount?: number;
  onLoadMore?: () => Promise<HistoryEntry[]>;
}

export function JobHistory({ entries, totalCount, onLoadMore }: JobHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const [allEntries, setAllEntries] = useState<HistoryEntry[]>(entries);
  const [isLoading, setIsLoading] = useState(false);

  const displayedEntries = expanded ? allEntries : entries.slice(0, 10);
  const hasMore = (totalCount || entries.length) > 10;

  const handleViewAll = async () => {
    if (expanded) {
      setExpanded(false);
    } else {
      if (onLoadMore && allEntries.length <= 10) {
        setIsLoading(true);
        try {
          const moreEntries = await onLoadMore();
          setAllEntries(moreEntries);
        } catch (error) {
          console.error("Error loading more history:", error);
        } finally {
          setIsLoading(false);
        }
      }
      setExpanded(true);
    }
  };

  if (entries.length === 0) {
    return (
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-[#7f8de1] rounded flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-medium text-[#3e3e3c]">
            Job History (0)
          </h3>
        </div>
        <p className="text-sm text-[#706e6b]">No history records.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#7f8de1] rounded flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-sm font-medium text-[#3e3e3c]">
            Job History ({totalCount !== undefined ? totalCount : entries.length})
          </h3>
        </div>
        {hasMore && (
          <button
            onClick={handleViewAll}
            disabled={isLoading}
            className="text-sm text-[#0176d3] hover:underline flex items-center gap-1"
          >
            {isLoading ? (
              "Loading..."
            ) : expanded ? (
              <>
                Show Less
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                View All
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="sf-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Field</th>
              <th>User</th>
              <th>Original Value</th>
              <th>New Value</th>
            </tr>
          </thead>
          <tbody>
            {displayedEntries.map((entry) => (
              <tr key={entry.id}>
                <td className="text-[#3e3e3c] whitespace-nowrap">{entry.date}</td>
                <td className="text-[#3e3e3c]">{entry.field}</td>
                <td>
                  <span className="text-[#0176d3]">
                    {entry.user.name}
                  </span>
                </td>
                <td className="text-[#706e6b] max-w-[200px] truncate">
                  {entry.originalValue || "—"}
                </td>
                <td className="text-[#3e3e3c] max-w-[200px] truncate">
                  {entry.newValue || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
