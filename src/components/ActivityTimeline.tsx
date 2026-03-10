"use client";

import { useState, useEffect, useCallback } from "react";
import { LogActivityModal } from "./LogActivityModal";

interface ActivityLogEntry {
  id: string;
  customerId: string | null;
  premisesId: string | null;
  contactId: string | null;
  type: string;
  direction: string | null;
  subject: string | null;
  body: string | null;
  recipients: string | null;
  emailStatus: string | null;
  callDuration: number | null;
  phoneNumber: string | null;
  callStatus: string | null;
  recordingUrl: string | null;
  userId: string | null;
  userName: string | null;
  contactName: string | null;
  source: string;
  sourceId: string | null;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
}

interface ActivityTimelineProps {
  entityType: "Account" | "Customer" | "Contact";
  entityId: string;
  contacts?: Contact[];
}

const TYPE_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  email: { icon: "\u{1F4E7}", label: "Email", color: "#0078d4" },
  call: { icon: "\u{1F4DE}", label: "Call", color: "#107c10" },
  note: { icon: "\u{1F4DD}", label: "Note", color: "#8764b8" },
  linkedin: { icon: "\u{1F4BC}", label: "LinkedIn", color: "#0a66c2" },
  sms: { icon: "\u{1F4AC}", label: "SMS", color: "#e3730a" },
  task: { icon: "\u2611\uFE0F", label: "Task", color: "#ca5010" },
};

const FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "email", label: "Emails" },
  { value: "call", label: "Calls" },
  { value: "note", label: "Notes" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "sms", label: "SMS" },
  { value: "task", label: "Tasks" },
];

const EMAIL_STATUS_COLORS: Record<string, string> = {
  sent: "#107c10",
  delivered: "#0078d4",
  opened: "#8764b8",
  bounced: "#d13438",
  failed: "#d13438",
};

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

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ActivityTimeline({ entityType, entityId, contacts = [] }: ActivityTimelineProps) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const LIMIT = 25;

  const fetchEntries = useCallback(
    async (newOffset = 0, reset = false) => {
      setLoading(true);
      try {
        let url = `/api/activity-log?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}&limit=${LIMIT}&offset=${newOffset}`;
        if (typeFilter) url += `&type=${encodeURIComponent(typeFilter)}`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (reset || newOffset === 0) {
            setEntries(data.entries);
          } else {
            setEntries((prev) => [...prev, ...data.entries]);
          }
          setTotal(data.total);
          setOffset(newOffset + data.entries.length);
        }
      } catch (err) {
        console.error("Failed to load activity log:", err);
      } finally {
        setLoading(false);
      }
    },
    [entityType, entityId, typeFilter]
  );

  useEffect(() => {
    setOffset(0);
    setExpandedIds(new Set());
    fetchEntries(0, true);
  }, [fetchEntries]);

  const handleLoadMore = () => fetchEntries(offset);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaved = () => {
    setOffset(0);
    fetchEntries(0, true);
  };

  const renderEntryContent = (entry: ActivityLogEntry) => {
    const config = TYPE_CONFIG[entry.type] || { icon: "\u{1F4CB}", label: entry.type, color: "#666" };
    const isExpanded = expandedIds.has(entry.id);
    const bodyTruncated = entry.body && entry.body.length > 120 && !isExpanded;

    return (
      <div key={entry.id} className="flex gap-3 px-4 py-3 border-b border-[#e0e0e0] hover:bg-[#f8f8f8]">
        {/* Type icon */}
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[14px]"
          style={{ backgroundColor: `${config.color}18`, border: `1px solid ${config.color}40` }}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header line */}
          <div className="flex items-center gap-1.5 text-[12px] flex-wrap">
            <span className="font-semibold text-[#333]">{config.label}</span>
            {entry.direction && (
              <>
                <span className="text-[#999]">&mdash;</span>
                <span className="text-[#555]">{capitalize(entry.direction)}</span>
              </>
            )}
            {entry.type === "call" && entry.callDuration != null && entry.callDuration > 0 && (
              <span className="text-[#888]">({formatDuration(entry.callDuration)})</span>
            )}
          </div>

          {/* Subject */}
          {entry.subject && (
            <div className="text-[12px] font-medium text-[#333] mt-0.5">
              {entry.subject}
            </div>
          )}

          {/* Recipients (email) */}
          {entry.type === "email" && entry.recipients && (
            <div className="text-[11px] text-[#888] mt-0.5">
              To: {entry.recipients}
            </div>
          )}

          {/* Phone number (call) */}
          {entry.type === "call" && entry.phoneNumber && (
            <div className="text-[11px] text-[#888] mt-0.5">
              {entry.phoneNumber}
            </div>
          )}

          {/* Body */}
          {entry.body && (
            <div className="text-[12px] text-[#555] mt-1">
              {bodyTruncated ? (
                <>
                  &ldquo;{entry.body.slice(0, 120)}...&rdquo;{" "}
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="text-[#0066cc] hover:underline text-[11px]"
                  >
                    show more
                  </button>
                </>
              ) : entry.body.length > 120 ? (
                <>
                  &ldquo;{entry.body}&rdquo;{" "}
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="text-[#0066cc] hover:underline text-[11px]"
                  >
                    show less
                  </button>
                </>
              ) : (
                <>&ldquo;{entry.body}&rdquo;</>
              )}
            </div>
          )}

          {/* Footer: userName, timestamp, status badges */}
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-[#888] flex-wrap">
            {entry.userName && <span>{entry.userName}</span>}
            {entry.contactName && (
              <>
                <span>&rarr;</span>
                <span>{entry.contactName}</span>
              </>
            )}
            <span>&bull;</span>
            <span>{formatTimestamp(entry.createdAt)}</span>

            {/* Email status badge */}
            {entry.type === "email" && entry.emailStatus && (
              <>
                <span>&bull;</span>
                <span
                  className="px-1.5 py-0 rounded text-[10px] font-medium"
                  style={{
                    backgroundColor: `${EMAIL_STATUS_COLORS[entry.emailStatus] || "#666"}18`,
                    color: EMAIL_STATUS_COLORS[entry.emailStatus] || "#666",
                    border: `1px solid ${EMAIL_STATUS_COLORS[entry.emailStatus] || "#666"}40`,
                  }}
                >
                  {capitalize(entry.emailStatus)}
                </span>
              </>
            )}

            {/* Call status badge */}
            {entry.type === "call" && entry.callStatus && (
              <>
                <span>&bull;</span>
                <span
                  className="px-1.5 py-0 rounded text-[10px] font-medium"
                  style={{
                    backgroundColor: entry.callStatus === "answered" ? "#107c1018" : "#d1343818",
                    color: entry.callStatus === "answered" ? "#107c10" : "#d13438",
                    border: `1px solid ${entry.callStatus === "answered" ? "#107c1040" : "#d1343840"}`,
                  }}
                >
                  {capitalize(entry.callStatus)}
                </span>
              </>
            )}

            {/* Source badge (non-manual) */}
            {entry.source !== "manual" && (
              <>
                <span>&bull;</span>
                <span className="px-1.5 py-0 rounded text-[10px] font-medium bg-[#f0f0f0] text-[#666] border border-[#d0d0d0]">
                  {entry.source === "twilio" ? "Twilio" : entry.source === "email_trigger" ? "Auto" : entry.source}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white" style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#d0d0d0] bg-[#f8f8f8] flex-shrink-0">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium bg-[#0078d4] text-white border border-[#005a9e] hover:bg-[#006cbd] rounded"
        >
          <span className="text-[13px]">+</span> Log Activity
        </button>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="border border-[#999] px-2 py-1 text-[11px] bg-white focus:outline-none focus:border-[#0078d4] rounded"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Timeline entries */}
      <div className="flex-1 overflow-y-auto">
        {loading && entries.length === 0 && (
          <div className="px-4 py-8 text-[12px] text-[#888] text-center">Loading activities...</div>
        )}

        {!loading && entries.length === 0 && (
          <div className="px-4 py-8 text-[12px] text-[#888] text-center">
            No activities yet. Click &ldquo;Log Activity&rdquo; to add one.
          </div>
        )}

        {entries.map(renderEntryContent)}

        {/* Load more */}
        {offset < total && (
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="w-full py-2 text-[12px] text-[#0066cc] hover:text-[#004499] hover:bg-[#f8f8f8] border-t border-[#e0e0e0]"
          >
            {loading ? "Loading..." : `Load More (${total - offset} remaining)`}
          </button>
        )}
      </div>

      {/* Log Activity Modal */}
      <LogActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        entityType={entityType}
        entityId={entityId}
        contacts={contacts}
      />
    </div>
  );
}
