"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Plus, Search, Trash2, Save, X, Eye, Copy, ArrowLeft,
  Mail, RefreshCw, ChevronDown, ChevronRight, Play, Pause, Settings,
  Clock, Zap, MoreVertical, GripVertical, Bold, Italic, Underline,
  Link as LinkIcon, Braces, Code, Send, Check, AlertCircle,
  Phone, CheckSquare, Users, BarChart3, FileText,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SequenceStep {
  id: string;
  stepOrder: number;
  stepType: string;
  delayDays: number;
  delayHours: number;
  subject: string;
  bodyHtml: string;
  templateId: string | null;
  threading: string;
  taskNotes: string | null;
  priority: string;
  isActive: boolean;
}

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string | null;
  ownerId: string | null;
  sharingScope: string;
  exitOnReply: boolean;
  exitOnBounce: boolean;
  exitOnMeeting: boolean;
  pauseOnOOO: boolean;
  maxEmailsPer24h: number;
  ccAddresses: string | null;
  bccAddresses: string | null;
  scheduleId: string | null;
  timezone: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  steps: SequenceStep[];
  owner?: { name: string; email: string } | null;
  schedule?: { id: string; name: string } | null;
  _count: { enrollments: number; steps?: number };
}

interface Enrollment {
  id: string;
  contactEmail: string;
  contactName: string | null;
  status: string;
  currentStep: number;
  enrolledAt: string;
  enrolledBy: string | null;
  lastActivityAt: string | null;
  contact?: { name: string; email: string; customer?: { name: string } } | null;
}

interface StepExecution {
  id: string;
  status: string;
  scheduledAt: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
  repliedAt: string | null;
  bouncedAt: string | null;
  openCount: number;
  clickCount: number;
  subjectSent: string | null;
  enrollment: { contactEmail: string; contactName: string | null };
  step: { stepOrder: number; stepType: string; subject: string };
}

interface ReportData {
  totalEnrolled: number;
  active: number;
  paused: number;
  finished: number;
  replied: number;
  bounced: number;
  failed: number;
  removed: number;
  stepStats: {
    stepId: string;
    stepOrder: number;
    stepType: string;
    subject: string;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    repliedCount: number;
    bouncedCount: number;
  }[];
}

interface ScheduleOption {
  id: string;
  name: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[#e8e8e8] text-[#555]",
  active: "bg-[#dcfce7] text-[#166534]",
  paused: "bg-[#fef9c3] text-[#854d0e]",
  archived: "bg-[#fee2e2] text-[#991b1b]",
};

const ENROLLMENT_STATUS_COLORS: Record<string, string> = {
  active: "bg-[#dcfce7] text-[#166534]",
  paused: "bg-[#fef9c3] text-[#854d0e]",
  finished: "bg-[#e0e7ff] text-[#3730a3]",
  replied: "bg-[#d1fae5] text-[#065f46]",
  bounced: "bg-[#fee2e2] text-[#991b1b]",
  removed: "bg-[#f3f4f6] text-[#6b7280]",
  failed: "bg-[#fee2e2] text-[#991b1b]",
};

const EXECUTION_STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-[#f3f4f6] text-[#6b7280]",
  sent: "bg-[#dbeafe] text-[#1e40af]",
  delivered: "bg-[#dcfce7] text-[#166534]",
  opened: "bg-[#ccfbf1] text-[#0f766e]",
  clicked: "bg-[#ede9fe] text-[#6d28d9]",
  replied: "bg-[#d1fae5] text-[#065f46] font-semibold",
  bounced: "bg-[#fee2e2] text-[#991b1b]",
  failed: "bg-[#fee2e2] text-[#991b1b]",
  skipped: "bg-[#f3f4f6] text-[#9ca3af]",
};

const TYPE_OPTIONS = [
  { value: "", label: "None" },
  { value: "sales", label: "Sales" },
  { value: "service", label: "Service" },
  { value: "ar", label: "AR / Collections" },
  { value: "onboarding", label: "Onboarding" },
];

const STEP_TYPES = [
  { value: "auto_email", label: "Auto Email", icon: Mail },
  { value: "manual_email", label: "Manual Email", icon: FileText },
  { value: "phone_call", label: "Phone Call", icon: Phone },
  { value: "action_item", label: "Action Item", icon: CheckSquare },
];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HT)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "UTC", label: "UTC" },
];

const MERGE_FIELDS: { group: string; fields: { token: string; label: string }[] }[] = [
  { group: "Account", fields: [
    { token: "accountName", label: "Account Name" }, { token: "accountId", label: "Account ID" },
    { token: "address", label: "Address" }, { token: "city", label: "City" },
  ]},
  { group: "Customer", fields: [
    { token: "customerName", label: "Customer Name" }, { token: "customerEmail", label: "Customer Email" },
  ]},
  { group: "Contact", fields: [
    { token: "contactName", label: "Contact Name" }, { token: "contactEmail", label: "Contact Email" },
    { token: "contactPhone", label: "Contact Phone" },
  ]},
  { group: "Ticket", fields: [
    { token: "ticketNumber", label: "Ticket #" }, { token: "worker", label: "Worker" },
  ]},
  { group: "Job", fields: [
    { token: "jobNumber", label: "Job #" }, { token: "jobTitle", label: "Job Title" },
  ]},
  { group: "Invoice", fields: [
    { token: "invoiceNumber", label: "Invoice #" }, { token: "invoiceAmount", label: "Amount" },
  ]},
  { group: "Sender", fields: [
    { token: "senderName", label: "Your Name" }, { token: "senderEmail", label: "Your Email" },
    { token: "companyName", label: "Company Name" },
  ]},
];

const DETAIL_TABS = [
  { id: "editor", label: "Editor", icon: Zap },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "emails", label: "Emails", icon: Mail },
  { id: "report", label: "Report", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type DetailTab = typeof DETAIL_TABS[number]["id"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch { return "-"; }
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch { return "-"; }
}

function getStepTypeInfo(stepType: string) {
  return STEP_TYPES.find(t => t.value === stepType) || STEP_TYPES[0];
}

// ─── Merge Fields Popover (shared) ───────────────────────────────────────────

function MergeFieldsPopover({ onSelect, onClose }: { onSelect: (token: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState(MERGE_FIELDS[0].group);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const currentGroup = MERGE_FIELDS.find(g => g.group === activeGroup);
  const fields = currentGroup?.fields || [];
  const filtered = search
    ? MERGE_FIELDS.flatMap(g => g.fields).filter(f => f.label.toLowerCase().includes(search.toLowerCase()))
    : fields;

  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 bg-white border border-[#ddd] rounded-lg shadow-xl z-50 w-[300px]" onClick={e => e.stopPropagation()}>
      <div className="p-2 border-b border-[#eee]">
        <input
          autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search merge fields..."
          className="w-full px-2.5 py-1.5 text-[12px] border border-[#ddd] rounded bg-[#fafafa] outline-none focus:border-[#316ac5]"
        />
      </div>
      {!search && (
        <div className="flex border-b border-[#eee] px-1 overflow-x-auto">
          {MERGE_FIELDS.map(g => (
            <button
              key={g.group}
              onClick={() => { setActiveGroup(g.group); setSearch(""); }}
              className={`px-2 py-2 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${activeGroup === g.group ? "border-[#316ac5] text-[#316ac5]" : "border-transparent text-[#888] hover:text-[#555]"}`}
            >
              {g.group}
            </button>
          ))}
        </div>
      )}
      <div className="max-h-[200px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-[#999] p-4 text-center">No matching fields</p>
        ) : filtered.map(f => (
          <button
            key={f.token}
            onClick={() => onSelect(f.token)}
            className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-[#f5f8ff] transition-colors border-b border-[#f5f5f5] last:border-b-0"
          >
            <span className="text-[12px] text-[#333]">{f.label}</span>
            <code className="text-[10px] text-[#aaa] font-mono">{`{{${f.token}}}`}</code>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step Editor (inline expanded) ───────────────────────────────────────────

function StepEditor({
  step,
  stepIndex,
  totalSteps,
  onChange,
  onClose,
}: {
  step: SequenceStep;
  stepIndex: number;
  totalSteps: number;
  onChange: (updated: SequenceStep) => void;
  onClose: () => void;
}) {
  const [stepType, setStepType] = useState(step.stepType || "auto_email");
  const [delayDays, setDelayDays] = useState(step.delayDays);
  const [delayHours, setDelayHours] = useState(step.delayHours || 0);
  const [subject, setSubject] = useState(step.subject);
  const [threading, setThreading] = useState(step.threading || "new_thread");
  const [taskNotes, setTaskNotes] = useState(step.taskNotes || "");
  const [priority, setPriority] = useState(step.priority || "medium");
  const [showMergeFields, setShowMergeFields] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [htmlSource, setHtmlSource] = useState(step.bodyHtml);
  const [bodyEmpty, setBodyEmpty] = useState(!step.bodyHtml);

  const bodyRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);
  const isEmailType = stepType === "auto_email" || stepType === "manual_email";

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = step.bodyHtml || "";
      checkEmpty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkEmpty = () => {
    const html = bodyRef.current?.innerHTML || "";
    setBodyEmpty(!html || html === "<br>" || html === "<div><br></div>" || html.trim() === "");
  };

  const saveSelState = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && bodyRef.current?.contains(sel.anchorNode)) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const insertMergeField = useCallback((token: string) => {
    if (!bodyRef.current) return;
    bodyRef.current.focus();
    if (savedSelection.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection.current);
    }
    document.execCommand("insertText", false, `{{${token}}}`);
    setHtmlSource(bodyRef.current.innerHTML);
    checkEmpty();
    setShowMergeFields(false);
  }, []);

  const execFormat = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    bodyRef.current?.focus();
    if (bodyRef.current) setHtmlSource(bodyRef.current.innerHTML);
  }, []);

  const handleBodyInput = useCallback(() => {
    if (bodyRef.current) { setHtmlSource(bodyRef.current.innerHTML); checkEmpty(); }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
  }, []);

  const toggleHtml = useCallback(() => {
    if (showHtml && bodyRef.current) { bodyRef.current.innerHTML = htmlSource; checkEmpty(); }
    else if (bodyRef.current) setHtmlSource(bodyRef.current.innerHTML);
    setShowHtml(!showHtml);
  }, [showHtml, htmlSource]);

  const handleSave = () => {
    const bodyHtml = showHtml ? htmlSource : (bodyRef.current?.innerHTML || step.bodyHtml || "");
    onChange({
      ...step,
      stepType,
      delayDays,
      delayHours,
      subject,
      bodyHtml: isEmailType ? bodyHtml : step.bodyHtml,
      threading,
      taskNotes: !isEmailType ? taskNotes : step.taskNotes,
      priority,
    });
    onClose();
  };

  const typeInfo = getStepTypeInfo(stepType);

  return (
    <div className="bg-white border border-[#316ac5] rounded-lg shadow-lg overflow-hidden">
      <div className="bg-[#f0f5ff] px-4 py-2.5 border-b border-[#d0dff5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <typeInfo.icon className="w-4 h-4 text-[#316ac5]" />
          <span className="text-[13px] font-semibold text-[#1e3a5f]">Edit Step {stepIndex + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1 bg-[#316ac5] text-white text-[11px] rounded hover:bg-[#2a5db0] transition-colors">
            <Check className="w-3 h-3" /> Done
          </button>
          <button onClick={onClose} className="text-[#888] hover:text-[#555]"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-4">
        {/* Step Type */}
        <div className="mb-4">
          <label className="text-[11px] font-medium text-[#555] block mb-1.5">Step Type:</label>
          <select
            value={stepType}
            onChange={e => setStepType(e.target.value)}
            className="w-full px-2.5 py-1.5 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5] bg-white"
          >
            {STEP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Delay */}
        <div className="mb-4">
          <label className="text-[11px] font-medium text-[#555] block mb-1.5">
            {stepIndex === 0 ? "Timing:" : "Wait:"}
          </label>
          {stepIndex === 0 ? (
            <span className="text-[12px] text-[#888] italic">Immediately after enrollment</span>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={0} value={delayDays}
                  onChange={e => setDelayDays(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-[55px] px-2 py-1.5 border border-[#ddd] rounded text-[12px] text-center outline-none focus:border-[#316ac5]"
                />
                <span className="text-[11px] text-[#666]">days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={0} max={23} value={delayHours}
                  onChange={e => setDelayHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                  className="w-[55px] px-2 py-1.5 border border-[#ddd] rounded text-[12px] text-center outline-none focus:border-[#316ac5]"
                />
                <span className="text-[11px] text-[#666]">hours</span>
              </div>
              <span className="text-[11px] text-[#999]">after previous step</span>
            </div>
          )}
        </div>

        {/* Email-specific fields */}
        {isEmailType && (
          <>
            {/* Threading (only for step 2+) */}
            {stepIndex > 0 && (
              <div className="mb-4">
                <label className="text-[11px] font-medium text-[#555] block mb-1.5">Threading:</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-[12px] text-[#555] cursor-pointer">
                    <input
                      type="radio" name={`threading_${step.id}`} value="new_thread"
                      checked={threading === "new_thread"} onChange={() => setThreading("new_thread")}
                      className="accent-[#316ac5]"
                    />
                    New Thread
                  </label>
                  <label className="flex items-center gap-1.5 text-[12px] text-[#555] cursor-pointer">
                    <input
                      type="radio" name={`threading_${step.id}`} value="reply_to_previous"
                      checked={threading === "reply_to_previous"} onChange={() => setThreading("reply_to_previous")}
                      className="accent-[#316ac5]"
                    />
                    Reply to Previous
                  </label>
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="mb-4">
              <label className="text-[11px] font-medium text-[#555] block mb-1.5">Subject:</label>
              <input
                type="text" value={subject} onChange={e => setSubject(e.target.value)}
                placeholder="Email subject line"
                className="w-full px-3 py-2 border border-[#ddd] rounded text-[13px] bg-white outline-none focus:border-[#316ac5] transition-colors"
              />
            </div>

            {/* Body WYSIWYG */}
            <div>
              <label className="text-[11px] font-medium text-[#555] block mb-1.5">Body:</label>
              <div className="border border-[#ddd] rounded bg-white overflow-hidden focus-within:border-[#316ac5] transition-colors">
                {showHtml ? (
                  <textarea
                    value={htmlSource} onChange={e => setHtmlSource(e.target.value)}
                    className="w-full min-h-[200px] px-3 py-2 text-[12px] font-mono outline-none resize-y border-none"
                    spellCheck={false}
                  />
                ) : (
                  <div className="relative">
                    {bodyEmpty && <div className="absolute top-2 left-3 text-[13px] text-[#bbb] pointer-events-none select-none">Write your email here...</div>}
                    <div
                      ref={bodyRef} contentEditable
                      onInput={handleBodyInput} onMouseUp={saveSelState} onKeyUp={saveSelState}
                      onFocus={saveSelState} onPaste={handlePaste}
                      className="min-h-[200px] px-3 py-2 text-[13px] outline-none leading-relaxed"
                      suppressContentEditableWarning
                    />
                  </div>
                )}
                {/* Toolbar */}
                <div className="flex items-center gap-0.5 px-2 py-1 border-t border-[#eee] bg-[#fafafa]">
                  <button onMouseDown={e => e.preventDefault()} onClick={() => execFormat("bold")} className="p-1 rounded hover:bg-[#e0e0e0] text-[#555]" title="Bold"><Bold className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={e => e.preventDefault()} onClick={() => execFormat("italic")} className="p-1 rounded hover:bg-[#e0e0e0] text-[#555]" title="Italic"><Italic className="w-3.5 h-3.5" /></button>
                  <button onMouseDown={e => e.preventDefault()} onClick={() => execFormat("underline")} className="p-1 rounded hover:bg-[#e0e0e0] text-[#555]" title="Underline"><Underline className="w-3.5 h-3.5" /></button>
                  <div className="w-px h-4 bg-[#ddd] mx-0.5" />
                  <button onClick={toggleHtml} className={`p-1 rounded transition-colors ${showHtml ? "bg-[#316ac5] text-white" : "hover:bg-[#e0e0e0] text-[#555]"}`} title="HTML Source"><Code className="w-3.5 h-3.5" /></button>
                  <div className="w-px h-4 bg-[#ddd] mx-0.5" />
                  <div className="relative">
                    <button
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { if (!showHtml) saveSelState(); setShowMergeFields(!showMergeFields); }}
                      className={`p-1 rounded transition-colors ${showMergeFields ? "bg-[#e8f0fe] text-[#316ac5]" : "hover:bg-[#e0e0e0] text-[#555]"}`}
                      title="Merge Fields"
                    >
                      <Braces className="w-3.5 h-3.5" />
                    </button>
                    {showMergeFields && <MergeFieldsPopover onSelect={insertMergeField} onClose={() => setShowMergeFields(false)} />}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Task-specific fields */}
        {!isEmailType && (
          <>
            <div className="mb-4">
              <label className="text-[11px] font-medium text-[#555] block mb-1.5">Task Notes:</label>
              <textarea
                value={taskNotes} onChange={e => setTaskNotes(e.target.value)}
                placeholder="Describe the task to be completed..."
                rows={4}
                className="w-full px-3 py-2 border border-[#ddd] rounded text-[13px] bg-white outline-none focus:border-[#316ac5] resize-y transition-colors"
              />
            </div>
            <div className="mb-4">
              <label className="text-[11px] font-medium text-[#555] block mb-1.5">Priority:</label>
              <select
                value={priority} onChange={e => setPriority(e.target.value)}
                className="w-[140px] px-2.5 py-1.5 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5] bg-white"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Add Step Dropdown ───────────────────────────────────────────────────────

function AddStepDropdown({ onAdd }: { onAdd: (stepType: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-dashed border-[#ccc] text-[#666] text-[12px] rounded-lg hover:border-[#316ac5] hover:text-[#316ac5] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Step <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-[#ddd] rounded-lg shadow-lg z-40 w-[180px]">
          {STEP_TYPES.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.value}
                onClick={() => { onAdd(t.value); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#f5f8ff] transition-colors text-[12px] text-[#333] border-b border-[#f5f5f5] last:border-b-0"
              >
                <Icon className="w-3.5 h-3.5 text-[#888]" />
                {t.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Inline Confirm Button ───────────────────────────────────────────────────

function InlineConfirm({ label, onConfirm, className = "" }: { label: string; onConfirm: () => void; className?: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-[#888]">Sure?</span>
        <button onClick={() => { onConfirm(); setConfirming(false); }} className="text-[10px] text-red-600 font-medium hover:underline">Yes</button>
        <button onClick={() => setConfirming(false)} className="text-[10px] text-[#888] hover:underline">No</button>
      </div>
    );
  }

  return (
    <button onClick={() => setConfirming(true)} className={className} title={label}>
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

// ─── Editor Tab ──────────────────────────────────────────────────────────────

function EditorTab({
  steps,
  setSteps,
  editingStep,
  setEditingStep,
}: {
  steps: SequenceStep[];
  setSteps: React.Dispatch<React.SetStateAction<SequenceStep[]>>;
  editingStep: number | null;
  setEditingStep: (i: number | null) => void;
}) {
  const addStep = (stepType: string) => {
    const newStep: SequenceStep = {
      id: `temp_${Date.now()}`,
      stepOrder: steps.length + 1,
      stepType,
      delayDays: steps.length === 0 ? 0 : 3,
      delayHours: 0,
      subject: "",
      bodyHtml: "",
      templateId: null,
      threading: "new_thread",
      taskNotes: null,
      priority: "medium",
      isActive: true,
    };
    setSteps(prev => [...prev, newStep]);
    setEditingStep(steps.length);
  };

  const updateStep = (index: number, updated: SequenceStep) => {
    setSteps(prev => prev.map((s, i) => i === index ? updated : s));
  };

  const removeStep = (index: number) => {
    setSteps(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((s, i) => ({ ...s, stepOrder: i + 1 }));
    });
    if (editingStep === index) setEditingStep(null);
    else if (editingStep !== null && editingStep > index) setEditingStep(editingStep - 1);
  };

  const getAccumulatedDay = (index: number) => {
    let days = 0;
    for (let i = 0; i <= index; i++) days += steps[i]?.delayDays || 0;
    return days;
  };

  const formatDelay = (step: SequenceStep) => {
    const parts: string[] = [];
    if (step.delayDays > 0) parts.push(`${step.delayDays} day${step.delayDays !== 1 ? "s" : ""}`);
    if (step.delayHours > 0) parts.push(`${step.delayHours} hour${step.delayHours !== 1 ? "s" : ""}`);
    return parts.length > 0 ? `Wait ${parts.join(", ")}` : "Wait 0 days";
  };

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full bg-[#e8f0fe] flex items-center justify-center mb-4">
          <Mail className="w-7 h-7 text-[#316ac5]" />
        </div>
        <p className="text-[14px] font-medium text-[#555] mb-1">No steps yet</p>
        <p className="text-[12px] text-[#999] mb-5">Add your first step to build this sequence.</p>
        <AddStepDropdown onAdd={addStep} />
      </div>
    );
  }

  return (
    <>
      {steps.map((step, index) => {
        const typeInfo = getStepTypeInfo(step.stepType);
        const Icon = typeInfo.icon;

        return (
          <div key={step.id}>
            {/* Delay indicator between steps */}
            {index > 0 && (
              <div className="flex items-center justify-center py-2">
                <div className="flex items-center gap-2 text-[11px] text-[#999]">
                  <div className="w-px h-4 bg-[#ddd]" />
                  <Clock className="w-3 h-3" />
                  <span>{formatDelay(step)}</span>
                  <div className="w-px h-4 bg-[#ddd]" />
                </div>
              </div>
            )}

            {/* Step card or editor */}
            {editingStep === index ? (
              <StepEditor
                step={step}
                stepIndex={index}
                totalSteps={steps.length}
                onChange={(updated) => updateStep(index, updated)}
                onClose={() => setEditingStep(null)}
              />
            ) : (
              <div
                className="bg-white border border-[#ddd] rounded-lg hover:border-[#b0c4de] transition-colors cursor-pointer group"
                onClick={() => setEditingStep(index)}
              >
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Drag handle (visual) */}
                      <div className="text-[#ddd] mt-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      {/* Step badge */}
                      <div className="w-7 h-7 rounded-full bg-[#316ac5] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Icon className="w-3 h-3 text-[#888]" />
                          <span className="text-[10px] text-[#999] uppercase font-medium">{typeInfo.label}</span>
                          <span className="text-[10px] text-[#ccc]">&middot;</span>
                          <span className="text-[10px] text-[#999]">
                            {index === 0 ? "Immediate" : `Day ${getAccumulatedDay(index)}`}
                          </span>
                        </div>
                        {(step.stepType === "auto_email" || step.stepType === "manual_email") ? (
                          <>
                            <p className="text-[13px] font-medium text-[#333] truncate">
                              {step.subject || "(No subject)"}
                            </p>
                            <p className="text-[11px] text-[#888] mt-0.5 truncate">
                              {stripHtml(step.bodyHtml).slice(0, 100) || "(No content)"}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-[13px] font-medium text-[#333] truncate">
                              {step.taskNotes?.slice(0, 60) || "(No notes)"}
                            </p>
                            {step.priority && (
                              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full uppercase mt-1 inline-block ${step.priority === "high" ? "bg-red-100 text-red-700" : step.priority === "low" ? "bg-gray-100 text-gray-500" : "bg-yellow-100 text-yellow-700"}`}>
                                {step.priority}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2" onClick={e => e.stopPropagation()}>
                      <InlineConfirm
                        label="Remove step"
                        onConfirm={() => removeStep(index)}
                        className="p-1 text-[#bbb] hover:text-red-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add step button */}
      <div className="flex items-center justify-center py-4">
        <div className="flex flex-col items-center">
          <div className="w-px h-4 bg-[#ddd]" />
          <AddStepDropdown onAdd={addStep} />
        </div>
      </div>
    </>
  );
}

// ─── Contacts Tab ────────────────────────────────────────────────────────────

function ContactsTab({ sequenceId }: { sequenceId: string }) {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sequences?id=${sequenceId}&tab=contacts&limit=200`);
      if (res.ok) {
        const data = await res.json();
        setEnrollments(data.enrollments || []);
        setTotal(data.total || 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [sequenceId]);

  useEffect(() => { fetchEnrollments(); }, [fetchEnrollments]);

  const handleStatusChange = async (enrollmentId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/sequences/enroll", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, status: newStatus }),
      });
      if (res.ok) fetchEnrollments();
    } catch (err) { console.error(err); }
  };

  const handleRemove = async (enrollmentId: string) => {
    try {
      const res = await fetch(`/api/sequences/enroll?id=${enrollmentId}`, { method: "DELETE" });
      if (res.ok) fetchEnrollments();
    } catch (err) { console.error(err); }
  };

  const filteredEnrollments = statusFilter === "all"
    ? enrollments
    : enrollments.filter(e => e.status === statusFilter);

  const CONTACT_STATUSES = ["all", "active", "paused", "finished", "replied", "bounced"];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1">
          {CONTACT_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 text-[11px] rounded capitalize transition-colors ${statusFilter === s ? "bg-[#316ac5] text-white" : "bg-[#f0f0f0] text-[#666] hover:bg-[#e0e0e0]"}`}
            >
              {s} {s === "all" ? `(${total})` : ""}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowEnrollModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#316ac5] text-white text-[11px] rounded hover:bg-[#2a5db0] transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Contacts
        </button>
      </div>

      {/* Enrollment table */}
      {loading ? (
        <div className="flex items-center justify-center h-40"><RefreshCw className="w-5 h-5 animate-spin text-[#888]" /></div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-10 h-10 text-[#ccc] mb-3" />
          <p className="text-[13px] font-medium text-[#555] mb-1">
            {total === 0 ? "No contacts enrolled" : "No matching contacts"}
          </p>
          <p className="text-[11px] text-[#999] mb-4">
            {total === 0 ? "Add contacts to start running this sequence." : "Try a different filter."}
          </p>
          {total === 0 && (
            <button onClick={() => setShowEnrollModal(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#316ac5] text-white text-[12px] rounded hover:bg-[#2a5db0]">
              <Plus className="w-3.5 h-3.5" /> Enroll Contacts
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-[#ddd] rounded overflow-hidden">
          {/* Header */}
          <div className="flex bg-[#f5f5f5] border-b border-[#ddd] text-[10px] font-semibold text-[#555] uppercase">
            <div className="flex-[2] px-3 py-2">Name</div>
            <div className="flex-[2] px-3 py-2">Email</div>
            <div className="flex-1 px-3 py-2">Status</div>
            <div className="flex-1 px-3 py-2">Step</div>
            <div className="flex-[1.5] px-3 py-2">Enrolled</div>
            <div className="flex-[1.5] px-3 py-2">Last Activity</div>
            <div className="w-[90px] px-3 py-2">Actions</div>
          </div>
          {/* Rows */}
          {filteredEnrollments.map(e => (
            <div key={e.id} className="flex border-b border-[#eee] text-[12px] text-[#333] hover:bg-[#fafafa] items-center">
              <div className="flex-[2] px-3 py-2 truncate">{e.contactName || "-"}</div>
              <div className="flex-[2] px-3 py-2 truncate text-[#666]">{e.contactEmail}</div>
              <div className="flex-1 px-3 py-2">
                <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase ${ENROLLMENT_STATUS_COLORS[e.status] || "bg-gray-100 text-gray-500"}`}>
                  {e.status}
                </span>
              </div>
              <div className="flex-1 px-3 py-2 text-[#666]">{e.currentStep || 0}</div>
              <div className="flex-[1.5] px-3 py-2 text-[#888] text-[11px]">{formatDate(e.enrolledAt)}</div>
              <div className="flex-[1.5] px-3 py-2 text-[#888] text-[11px]">{formatDate(e.lastActivityAt)}</div>
              <div className="w-[90px] px-3 py-2 flex items-center gap-1">
                {e.status === "active" && (
                  <button onClick={() => handleStatusChange(e.id, "paused")} className="p-0.5 text-[#aaa] hover:text-amber-600" title="Pause">
                    <Pause className="w-3 h-3" />
                  </button>
                )}
                {e.status === "paused" && (
                  <button onClick={() => handleStatusChange(e.id, "active")} className="p-0.5 text-[#aaa] hover:text-green-600" title="Resume">
                    <Play className="w-3 h-3" />
                  </button>
                )}
                <InlineConfirm
                  label="Remove"
                  onConfirm={() => handleRemove(e.id)}
                  className="p-0.5 text-[#aaa] hover:text-red-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && (
        <EnrollModal
          sequenceId={sequenceId}
          onClose={() => { setShowEnrollModal(false); fetchEnrollments(); }}
        />
      )}
    </div>
  );
}

// ─── Enroll Modal ────────────────────────────────────────────────────────────

function EnrollModal({ sequenceId, onClose }: { sequenceId: string; onClose: () => void }) {
  const [mode, setMode] = useState<"search" | "create">("search");
  // Search mode
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [enrolling, setEnrolling] = useState(false);
  const [enrollResult, setEnrollResult] = useState<string | null>(null);
  // Create mode
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [attachQuery, setAttachQuery] = useState("");
  const [attachResults, setAttachResults] = useState<any[]>([]);
  const [selectedAttach, setSelectedAttach] = useState<{ id: string; name: string; type: "customer" | "account" } | null>(null);
  const [searchingAttach, setSearchingAttach] = useState(false);
  const [creating, setCreating] = useState(false);

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attachTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?type=contacts&q=${encodeURIComponent(q)}&limit=20`);
      if (res.ok) setSearchResults(await res.json());
      else setSearchResults([]);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => doSearch(val), 300);
  };

  const toggleSelected = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleEnrollSelected = async () => {
    const contacts = searchResults
      .filter(r => selected.has(r.id))
      .map(r => ({
        contactId: r.data?.id || r.id,
        contactEmail: r.data?.email || "",
        contactName: r.label || r.data?.name || "",
        customerId: r.data?.customerId || r.data?.customer?.id || null,
      }));
    if (contacts.length === 0) return;
    setEnrolling(true);
    try {
      const res = await fetch("/api/sequences/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequenceId, contacts }),
      });
      if (res.ok) {
        const result = await res.json();
        setEnrollResult(`Enrolled ${result.enrolledCount} contact${result.enrolledCount !== 1 ? "s" : ""}${result.skippedCount > 0 ? `, ${result.skippedCount} skipped (duplicates)` : ""}`);
        setSelected(new Set());
      } else {
        const err = await res.json();
        setEnrollResult(`Error: ${err.error || "Failed to enroll"}`);
      }
    } catch { setEnrollResult("Error: Failed to enroll contacts"); }
    finally { setEnrolling(false); }
  };

  // Search customers + accounts for Create mode
  const doAttachSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setAttachResults([]); return; }
    setSearchingAttach(true);
    try {
      const [custRes, acctRes] = await Promise.all([
        fetch(`/api/search?type=customers&q=${encodeURIComponent(q)}&limit=8`),
        fetch(`/api/search?type=accounts&q=${encodeURIComponent(q)}&limit=8`),
      ]);
      const custs = custRes.ok ? (await custRes.json()).map((c: any) => ({ ...c, _type: "customer" as const })) : [];
      const accts = acctRes.ok ? (await acctRes.json()).map((a: any) => ({ ...a, _type: "account" as const })) : [];
      setAttachResults([...custs, ...accts]);
    } catch { /* ignore */ }
    finally { setSearchingAttach(false); }
  }, []);

  const handleAttachQueryChange = (val: string) => {
    setAttachQuery(val);
    setSelectedAttach(null);
    if (attachTimeoutRef.current) clearTimeout(attachTimeoutRef.current);
    attachTimeoutRef.current = setTimeout(() => doAttachSearch(val), 300);
  };

  const selectAttach = (item: any) => {
    setSelectedAttach({ id: item.id, name: item.label || item.data?.name || "", type: item._type });
    setAttachQuery(item.label || item.data?.name || "");
    setAttachResults([]);
  };

  // Create contact + enroll
  const handleCreateAndEnroll = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    if (!selectedAttach) {
      setEnrollResult("Error: Please select a customer or account for this contact");
      return;
    }
    setCreating(true);
    try {
      // If attached to an account, look up its customerId first
      let customerId: string | null = null;
      let premisesId: string | null = null;

      if (selectedAttach.type === "customer") {
        customerId = selectedAttach.id;
      } else {
        // Account selected — use its customerId for the Contact FK, and premisesId for enrollment
        premisesId = selectedAttach.id;
        // Fetch the account to get its customerId
        const acctRes = await fetch(`/api/search?type=accounts&q=${encodeURIComponent(selectedAttach.name)}&limit=1`);
        if (acctRes.ok) {
          const accts = await acctRes.json();
          const acct = accts.find((a: any) => a.id === selectedAttach.id);
          customerId = acct?.data?.customerId || null;
        }
      }

      if (!customerId) {
        setEnrollResult("Error: Could not resolve customer for this account. Try selecting a customer instead.");
        setCreating(false);
        return;
      }

      // 1. Create the contact in the DB
      const createRes = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim() || null,
          title: newTitle.trim() || null,
          customerId,
        }),
      });
      if (!createRes.ok) {
        const err = await createRes.json();
        setEnrollResult(`Error creating contact: ${err.error || "Failed"}`);
        return;
      }
      const newContact = await createRes.json();

      // 2. Enroll the new contact into the sequence
      const enrollRes = await fetch("/api/sequences/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sequenceId,
          contacts: [{
            contactId: newContact.id,
            contactEmail: newContact.email,
            contactName: newContact.name,
            customerId,
            premisesId,
          }],
        }),
      });
      if (enrollRes.ok) {
        setEnrollResult(`Created "${newContact.name}" and enrolled into sequence`);
        setNewName(""); setNewEmail(""); setNewPhone(""); setNewTitle("");
        setAttachQuery(""); setSelectedAttach(null);
      } else {
        const err = await enrollRes.json();
        setEnrollResult(`Contact created but enrollment failed: ${err.error || "Unknown error"}`);
      }
    } catch { setEnrollResult("Error: Failed to create contact"); }
    finally { setCreating(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-[520px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()} style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
        <div className="px-4 py-3 border-b border-[#ddd] flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-[#333]">Add Contacts to Sequence</h3>
          <button onClick={onClose} className="text-[#888] hover:text-[#555]"><X className="w-4 h-4" /></button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-[#ddd]">
          <button
            onClick={() => { setMode("search"); setEnrollResult(null); }}
            className={`flex-1 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${mode === "search" ? "border-[#316ac5] text-[#316ac5]" : "border-transparent text-[#888] hover:text-[#555]"}`}
          >
            <div className="flex items-center justify-center gap-1.5"><Search className="w-3.5 h-3.5" /> Search Existing</div>
          </button>
          <button
            onClick={() => { setMode("create"); setEnrollResult(null); }}
            className={`flex-1 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${mode === "create" ? "border-[#316ac5] text-[#316ac5]" : "border-transparent text-[#888] hover:text-[#555]"}`}
          >
            <div className="flex items-center justify-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Create New Contact</div>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {enrollResult && (
            <div className={`mb-3 px-3 py-2 rounded text-[12px] ${enrollResult.startsWith("Error") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
              {enrollResult}
            </div>
          )}

          {mode === "search" ? (
            <>
              <div className="flex items-center bg-[#f5f5f5] border border-[#ddd] rounded px-2.5 py-1.5 mb-3">
                <Search className="w-3.5 h-3.5 text-[#aaa] mr-2" />
                <input
                  type="text" value={searchQuery} onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search contacts by name or email..."
                  className="text-[12px] border-none outline-none bg-transparent w-full"
                  autoFocus
                />
                {searching && <RefreshCw className="w-3 h-3 animate-spin text-[#aaa]" />}
              </div>

              {searchResults.length > 0 ? (
                <div className="border border-[#ddd] rounded max-h-[280px] overflow-y-auto mb-3">
                  {searchResults.map(r => (
                    <label
                      key={r.id}
                      className={`flex items-center gap-3 px-3 py-2.5 border-b border-[#f0f0f0] last:border-b-0 cursor-pointer hover:bg-[#f9f9f9] ${selected.has(r.id) ? "bg-[#f0f5ff]" : ""}`}
                    >
                      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelected(r.id)} className="accent-[#316ac5]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-[#333] truncate">{r.label}</p>
                        <p className="text-[11px] text-[#888] truncate">{r.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              ) : searchQuery && !searching ? (
                <div className="text-center py-8">
                  <p className="text-[12px] text-[#999] mb-3">No contacts found for &ldquo;{searchQuery}&rdquo;</p>
                  <button
                    onClick={() => { setMode("create"); setNewName(searchQuery); setEnrollResult(null); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#316ac5] text-white text-[12px] rounded hover:bg-[#2a5db0] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create New Contact
                  </button>
                </div>
              ) : !searchQuery ? (
                <div className="text-center py-8 text-[12px] text-[#999]">
                  Type a name or email to search existing contacts
                </div>
              ) : null}

              {selected.size > 0 && (
                <button
                  onClick={handleEnrollSelected}
                  disabled={enrolling}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-[#316ac5] text-white text-[12px] rounded hover:bg-[#2a5db0] disabled:opacity-50 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  {enrolling ? "Enrolling..." : `Enroll ${selected.size} Selected`}
                </button>
              )}
            </>
          ) : (
            <>
              {/* Create New Contact form */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#555] block mb-1">Name *</label>
                    <input
                      type="text" value={newName} onChange={e => setNewName(e.target.value)}
                      placeholder="John Smith"
                      className="w-full px-3 py-2 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5]"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#555] block mb-1">Email *</label>
                    <input
                      type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full px-3 py-2 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-[#555] block mb-1">Phone</label>
                    <input
                      type="text" value={newPhone} onChange={e => setNewPhone(e.target.value)}
                      placeholder="(212) 555-0100"
                      className="w-full px-3 py-2 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#555] block mb-1">Title</label>
                    <input
                      type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)}
                      placeholder="Building Manager"
                      className="w-full px-3 py-2 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5]"
                    />
                  </div>
                </div>

                {/* Customer or Account search */}
                <div>
                  <label className="text-[11px] font-medium text-[#555] block mb-1">Customer or Account *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={attachQuery}
                      onChange={e => handleAttachQueryChange(e.target.value)}
                      placeholder="Search for a customer or account..."
                      className={`w-full px-3 py-2 border rounded text-[12px] outline-none focus:border-[#316ac5] ${selectedAttach ? "border-green-400 bg-green-50" : "border-[#ddd]"}`}
                    />
                    {searchingAttach && <RefreshCw className="absolute right-2.5 top-2.5 w-3 h-3 animate-spin text-[#aaa]" />}
                    {selectedAttach && <Check className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-green-600" />}

                    {/* Search results dropdown */}
                    {attachResults.length > 0 && !selectedAttach && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#ddd] rounded shadow-lg z-10 max-h-[200px] overflow-y-auto">
                        {attachResults.map(item => (
                          <button
                            key={`${item._type}-${item.id}`}
                            onClick={() => selectAttach(item)}
                            className="w-full text-left px-3 py-2 hover:bg-[#f0f5ff] border-b border-[#f0f0f0] last:border-b-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${item._type === "customer" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-700"}`}>
                                {item._type === "customer" ? "Customer" : "Account"}
                              </span>
                              <p className="text-[12px] font-medium text-[#333] truncate">{item.label}</p>
                            </div>
                            {item.description && <p className="text-[10px] text-[#888] mt-0.5 ml-[62px] truncate">{item.description}</p>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedAttach && (
                    <p className="text-[10px] text-green-600 mt-1">
                      {selectedAttach.type === "customer" ? "Customer" : "Account"}: {selectedAttach.name}
                    </p>
                  )}
                </div>

                <button
                  onClick={handleCreateAndEnroll}
                  disabled={creating || !newName.trim() || !newEmail.trim() || !selectedAttach}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#316ac5] text-white text-[12px] rounded hover:bg-[#2a5db0] disabled:opacity-50 transition-colors mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {creating ? "Creating..." : "Create Contact & Enroll"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Emails Tab ──────────────────────────────────────────────────────────────

function EmailsTab({ sequenceId }: { sequenceId: string }) {
  const [executions, setExecutions] = useState<StepExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/sequences?id=${sequenceId}&tab=emails&limit=200`);
        if (res.ok) {
          const data = await res.json();
          setExecutions(data.executions || []);
          setTotal(data.total || 0);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [sequenceId]);

  if (loading) {
    return <div className="flex items-center justify-center h-40"><RefreshCw className="w-5 h-5 animate-spin text-[#888]" /></div>;
  }

  if (executions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Send className="w-10 h-10 text-[#ccc] mb-3" />
        <p className="text-[13px] font-medium text-[#555] mb-1">No emails sent yet</p>
        <p className="text-[11px] text-[#999]">Emails will appear here once the sequence starts sending.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#ddd] rounded overflow-hidden">
      <div className="flex bg-[#f5f5f5] border-b border-[#ddd] text-[10px] font-semibold text-[#555] uppercase">
        <div className="flex-[1.5] px-3 py-2">Contact</div>
        <div className="flex-[2] px-3 py-2">Subject</div>
        <div className="w-[60px] px-3 py-2 text-center">Step</div>
        <div className="w-[80px] px-3 py-2">Status</div>
        <div className="flex-1 px-3 py-2">Sent</div>
        <div className="w-[55px] px-3 py-2 text-center">Opens</div>
        <div className="w-[55px] px-3 py-2 text-center">Clicks</div>
        <div className="w-[50px] px-3 py-2 text-center">Reply</div>
      </div>
      {executions.map(ex => (
        <div key={ex.id} className="flex border-b border-[#eee] text-[12px] text-[#333] hover:bg-[#fafafa] items-center">
          <div className="flex-[1.5] px-3 py-2 truncate">
            <div className="text-[12px] font-medium truncate">{ex.enrollment.contactName || "-"}</div>
            <div className="text-[10px] text-[#888] truncate">{ex.enrollment.contactEmail}</div>
          </div>
          <div className="flex-[2] px-3 py-2 truncate text-[#555]">{ex.subjectSent || ex.step.subject || "-"}</div>
          <div className="w-[60px] px-3 py-2 text-center text-[#888]">{ex.step.stepOrder}</div>
          <div className="w-[80px] px-3 py-2">
            <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full capitalize ${EXECUTION_STATUS_COLORS[ex.status] || "bg-gray-100 text-gray-500"}`}>
              {ex.status}
            </span>
          </div>
          <div className="flex-1 px-3 py-2 text-[11px] text-[#888]">{formatDateTime(ex.sentAt || ex.scheduledAt)}</div>
          <div className="w-[55px] px-3 py-2 text-center text-[#888]">{ex.openCount > 0 ? ex.openCount : "-"}</div>
          <div className="w-[55px] px-3 py-2 text-center text-[#888]">{ex.clickCount > 0 ? ex.clickCount : "-"}</div>
          <div className="w-[50px] px-3 py-2 text-center">
            {ex.repliedAt ? <Check className="w-3.5 h-3.5 text-green-600 mx-auto" /> : <span className="text-[#ddd]">-</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Report Tab ──────────────────────────────────────────────────────────────

function ReportTab({ sequenceId }: { sequenceId: string }) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/sequences?id=${sequenceId}&tab=report`);
        if (res.ok) setReport(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [sequenceId]);

  if (loading) {
    return <div className="flex items-center justify-center h-40"><RefreshCw className="w-5 h-5 animate-spin text-[#888]" /></div>;
  }

  if (!report || report.totalEnrolled === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="w-10 h-10 text-[#ccc] mb-3" />
        <p className="text-[13px] font-medium text-[#555] mb-1">No report data yet</p>
        <p className="text-[11px] text-[#999]">Enroll contacts and start sending to see analytics here.</p>
      </div>
    );
  }

  const pct = (n: number) => report.totalEnrolled > 0 ? Math.round((n / report.totalEnrolled) * 100) : 0;

  // Funnel data
  const totalSent = report.stepStats.reduce((s, st) => s + st.sentCount, 0);
  const totalDelivered = report.stepStats.reduce((s, st) => s + st.deliveredCount, 0);
  const totalOpened = report.stepStats.reduce((s, st) => s + st.openedCount, 0);
  const totalReplied = report.stepStats.reduce((s, st) => s + st.repliedCount, 0);
  const funnelMax = Math.max(totalSent, 1);

  const summaryCards = [
    { label: "Total Enrolled", value: report.totalEnrolled, color: "#316ac5" },
    { label: "Active", value: report.active, pctVal: pct(report.active), color: "#16a34a" },
    { label: "Finished", value: report.finished, pctVal: pct(report.finished), color: "#6366f1" },
    { label: "Replied", value: report.replied, pctVal: pct(report.replied), color: "#059669" },
    { label: "Bounced", value: report.bounced, pctVal: pct(report.bounced), color: "#dc2626" },
  ];

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {summaryCards.map(c => (
          <div key={c.label} className="bg-white border border-[#ddd] rounded-lg p-3 text-center">
            <div className="text-[22px] font-bold" style={{ color: c.color }}>{c.value}</div>
            <div className="text-[10px] text-[#888] uppercase font-medium mt-0.5">{c.label}</div>
            {c.pctVal !== undefined && (
              <div className="text-[10px] text-[#aaa] mt-0.5">{c.pctVal}%</div>
            )}
          </div>
        ))}
      </div>

      {/* Funnel visualization */}
      <div className="bg-white border border-[#ddd] rounded-lg p-4 mb-6">
        <h4 className="text-[12px] font-semibold text-[#333] mb-3 uppercase tracking-wide">Email Funnel</h4>
        <div className="space-y-2">
          {[
            { label: "Sent", value: totalSent, color: "#3b82f6" },
            { label: "Delivered", value: totalDelivered, color: "#22c55e" },
            { label: "Opened", value: totalOpened, color: "#14b8a6" },
            { label: "Replied", value: totalReplied, color: "#059669" },
          ].map(bar => (
            <div key={bar.label} className="flex items-center gap-3">
              <div className="w-[70px] text-[11px] text-[#555] font-medium text-right">{bar.label}</div>
              <div className="flex-1 bg-[#f0f0f0] rounded-full h-6 overflow-hidden">
                <div
                  className="h-full rounded-full flex items-center justify-end px-2 transition-all duration-500"
                  style={{
                    width: `${Math.max((bar.value / funnelMax) * 100, bar.value > 0 ? 8 : 0)}%`,
                    backgroundColor: bar.color,
                  }}
                >
                  {bar.value > 0 && <span className="text-[10px] text-white font-bold">{bar.value}</span>}
                </div>
              </div>
              <div className="w-[40px] text-[11px] text-[#888] text-right">
                {funnelMax > 0 ? Math.round((bar.value / funnelMax) * 100) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-step breakdown */}
      {report.stepStats.length > 0 && (
        <div className="bg-white border border-[#ddd] rounded overflow-hidden">
          <div className="px-4 py-2.5 border-b border-[#ddd] bg-[#f9f9f9]">
            <h4 className="text-[12px] font-semibold text-[#333] uppercase tracking-wide">Per-Step Breakdown</h4>
          </div>
          <div className="flex bg-[#f5f5f5] border-b border-[#ddd] text-[10px] font-semibold text-[#555] uppercase">
            <div className="w-[50px] px-3 py-2 text-center">Step</div>
            <div className="w-[70px] px-3 py-2">Type</div>
            <div className="flex-[2] px-3 py-2">Subject</div>
            <div className="w-[55px] px-3 py-2 text-center">Sent</div>
            <div className="w-[55px] px-3 py-2 text-center">Delivered</div>
            <div className="w-[55px] px-3 py-2 text-center">Opened</div>
            <div className="w-[55px] px-3 py-2 text-center">Clicked</div>
            <div className="w-[55px] px-3 py-2 text-center">Replied</div>
            <div className="w-[55px] px-3 py-2 text-center">Bounced</div>
          </div>
          {report.stepStats.map(st => (
            <div key={st.stepId} className="flex border-b border-[#eee] text-[12px] text-[#333] hover:bg-[#fafafa] items-center">
              <div className="w-[50px] px-3 py-2 text-center font-medium">{st.stepOrder}</div>
              <div className="w-[70px] px-3 py-2 text-[10px] text-[#888] capitalize">{st.stepType.replace("_", " ")}</div>
              <div className="flex-[2] px-3 py-2 truncate text-[#555]">{st.subject || "-"}</div>
              <div className="w-[55px] px-3 py-2 text-center text-[#888]">{st.sentCount}</div>
              <div className="w-[55px] px-3 py-2 text-center text-[#888]">{st.deliveredCount}</div>
              <div className="w-[55px] px-3 py-2 text-center text-[#888]">{st.openedCount}</div>
              <div className="w-[55px] px-3 py-2 text-center text-[#888]">{st.clickedCount}</div>
              <div className="w-[55px] px-3 py-2 text-center text-[#888]">{st.repliedCount}</div>
              <div className="w-[55px] px-3 py-2 text-center text-[#888]">{st.bouncedCount}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────────────────

function SettingsTab({
  description, setDescription,
  type, setType,
  ownerName,
  sharingScope, setSharingScope,
  exitOnReply, setExitOnReply,
  exitOnBounce, setExitOnBounce,
  exitOnMeeting, setExitOnMeeting,
  pauseOnOOO, setPauseOnOOO,
  maxEmailsPer24h, setMaxEmailsPer24h,
  ccAddresses, setCcAddresses,
  bccAddresses, setBccAddresses,
  scheduleId, setScheduleId,
  timezone, setTimezone,
  onSave,
  saving,
}: {
  description: string;
  setDescription: (v: string) => void;
  type: string;
  setType: (v: string) => void;
  ownerName: string;
  sharingScope: string;
  setSharingScope: (v: string) => void;
  exitOnReply: boolean;
  setExitOnReply: (v: boolean) => void;
  exitOnBounce: boolean;
  setExitOnBounce: (v: boolean) => void;
  exitOnMeeting: boolean;
  setExitOnMeeting: (v: boolean) => void;
  pauseOnOOO: boolean;
  setPauseOnOOO: (v: boolean) => void;
  maxEmailsPer24h: number | null;
  setMaxEmailsPer24h: (v: number | null) => void;
  ccAddresses: string;
  setCcAddresses: (v: string) => void;
  bccAddresses: string;
  setBccAddresses: (v: string) => void;
  scheduleId: string | null;
  setScheduleId: (v: string | null) => void;
  timezone: string;
  setTimezone: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [schedules, setSchedules] = useState<ScheduleOption[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/sequences/schedules");
        if (res.ok) setSchedules(await res.json());
      } catch { /* schedules endpoint may not exist yet */ }
    })();
  }, []);

  return (
    <div>
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Left column */}
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-medium text-[#555] block mb-1.5">Description:</label>
            <textarea
              value={description} onChange={e => setDescription(e.target.value)}
              placeholder="What is this sequence for?"
              rows={3}
              className="w-full px-3 py-2 border border-[#ddd] rounded text-[12px] bg-white outline-none focus:border-[#316ac5] resize-y"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#555] block mb-1.5">Type:</label>
            <select
              value={type} onChange={e => setType(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5] bg-white"
            >
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#555] block mb-1.5">Owner:</label>
            <div className="px-3 py-2 bg-[#f5f5f5] border border-[#ddd] rounded text-[12px] text-[#666]">
              {ownerName || "Unknown"}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-[#555] block mb-1.5">Sharing:</label>
            <div className="space-y-1.5">
              {[
                { value: "private", label: "Private - Only you" },
                { value: "team", label: "Team - Your team can see" },
                { value: "organization", label: "Organization - Everyone can see" },
              ].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 text-[12px] text-[#555] cursor-pointer">
                  <input
                    type="radio" name="sharingScope" value={opt.value}
                    checked={sharingScope === opt.value}
                    onChange={() => setSharingScope(opt.value)}
                    className="accent-[#316ac5]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Rulesets */}
        <div>
          <h4 className="text-[11px] font-semibold text-[#333] uppercase tracking-wide mb-3">Rulesets</h4>
          <div className="space-y-2.5 mb-5">
            <label className="flex items-center gap-2 text-[12px] text-[#555] cursor-pointer">
              <input type="checkbox" checked={exitOnReply} onChange={e => setExitOnReply(e.target.checked)} className="accent-[#316ac5]" />
              Exit on Reply
            </label>
            <label className="flex items-center gap-2 text-[12px] text-[#555] cursor-pointer">
              <input type="checkbox" checked={exitOnBounce} onChange={e => setExitOnBounce(e.target.checked)} className="accent-[#316ac5]" />
              Exit on Bounce
            </label>
            <label className="flex items-center gap-2 text-[12px] text-[#555] cursor-pointer">
              <input type="checkbox" checked={exitOnMeeting} onChange={e => setExitOnMeeting(e.target.checked)} className="accent-[#316ac5]" />
              Exit on Meeting Booked
            </label>
            <label className="flex items-center gap-2 text-[12px] text-[#555] cursor-pointer">
              <input type="checkbox" checked={pauseOnOOO} onChange={e => setPauseOnOOO(e.target.checked)} className="accent-[#316ac5]" />
              Pause on Out of Office
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-[#555] block mb-1.5">Max emails per 24h:</label>
              <input
                type="number" min={1} max={200}
                value={maxEmailsPer24h ?? ""}
                onChange={e => setMaxEmailsPer24h(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="No limit"
                className="w-[120px] px-2.5 py-1.5 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#555] block mb-1.5">CC addresses:</label>
              <input
                type="text" value={ccAddresses} onChange={e => setCcAddresses(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className="w-full px-2.5 py-1.5 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5]"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-[#555] block mb-1.5">BCC addresses:</label>
              <input
                type="text" value={bccAddresses} onChange={e => setBccAddresses(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
                className="w-full px-2.5 py-1.5 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Full width: Schedule */}
      <div className="border-t border-[#eee] pt-4 mb-4">
        <h4 className="text-[11px] font-semibold text-[#333] uppercase tracking-wide mb-3">Schedule</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-medium text-[#555] block mb-1.5">Sending Schedule:</label>
            <select
              value={scheduleId || ""}
              onChange={e => setScheduleId(e.target.value || null)}
              className="w-full px-2.5 py-1.5 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5] bg-white"
            >
              <option value="">Default (any time)</option>
              {schedules.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-medium text-[#555] block mb-1.5">Timezone:</label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5] bg-white"
            >
              {TIMEZONES.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-2 bg-[#316ac5] text-white text-[12px] rounded hover:bg-[#2a5db0] disabled:opacity-50 transition-colors"
        >
          <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// ─── Sequence Detail View (multi-tab) ────────────────────────────────────────

function SequenceDetailView({
  sequence: initial,
  onBack,
  onRefresh,
}: {
  sequence: Sequence | null;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [seq, setSeq] = useState<Sequence | null>(initial);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("editor");

  // Editable fields
  const [name, setName] = useState(initial?.name || "Untitled Sequence");
  const [description, setDescription] = useState(initial?.description || "");
  const [type, setType] = useState(initial?.type || "");
  const [sharingScope, setSharingScope] = useState(initial?.sharingScope || "private");
  const [exitOnReply, setExitOnReply] = useState(initial?.exitOnReply ?? true);
  const [exitOnBounce, setExitOnBounce] = useState(initial?.exitOnBounce ?? true);
  const [exitOnMeeting, setExitOnMeeting] = useState(initial?.exitOnMeeting ?? false);
  const [pauseOnOOO, setPauseOnOOO] = useState(initial?.pauseOnOOO ?? false);
  const [maxEmailsPer24h, setMaxEmailsPer24h] = useState<number | null>(initial?.maxEmailsPer24h ?? null);
  const [ccAddresses, setCcAddresses] = useState(initial?.ccAddresses || "");
  const [bccAddresses, setBccAddresses] = useState(initial?.bccAddresses || "");
  const [scheduleId, setScheduleId] = useState<string | null>(initial?.scheduleId || null);
  const [timezone, setTimezone] = useState(initial?.timezone || "America/New_York");
  const [steps, setSteps] = useState<SequenceStep[]>(initial?.steps || []);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load full sequence if summary only
  useEffect(() => {
    if (initial?.id && (!initial.steps || initial.steps.length === 0)) {
      setLoading(true);
      fetch(`/api/sequences?id=${initial.id}`)
        .then(r => r.json())
        .then(data => {
          setSeq(data);
          setName(data.name);
          setDescription(data.description || "");
          setType(data.type || "");
          setSharingScope(data.sharingScope || "private");
          setExitOnReply(data.exitOnReply ?? true);
          setExitOnBounce(data.exitOnBounce ?? true);
          setExitOnMeeting(data.exitOnMeeting ?? false);
          setPauseOnOOO(data.pauseOnOOO ?? false);
          setMaxEmailsPer24h(data.maxEmailsPer24h ?? null);
          setCcAddresses(data.ccAddresses || "");
          setBccAddresses(data.bccAddresses || "");
          setScheduleId(data.scheduleId || null);
          setTimezone(data.timezone || "America/New_York");
          setSteps(data.steps || []);
        })
        .finally(() => setLoading(false));
    }
  }, [initial]);

  const flashStatus = (msg: string) => {
    setSaveStatus(msg);
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleSave = async () => {
    if (!name.trim()) { flashStatus("Enter a sequence name"); return; }
    setSaving(true);
    try {
      const orderedSteps = steps.map((s, i) => ({ ...s, stepOrder: i + 1 }));

      if (seq?.id) {
        const res = await fetch("/api/sequences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: seq.id, name, description, type: type || null, sharingScope,
            exitOnReply, exitOnBounce, exitOnMeeting, pauseOnOOO,
            maxEmailsPer24h, ccAddresses: ccAddresses || null, bccAddresses: bccAddresses || null,
            scheduleId, timezone, steps: orderedSteps,
          }),
        });
        if (!res.ok) throw new Error("Failed");
        const updated = await res.json();
        setSeq(updated);
        setSteps(updated.steps || []);
      } else {
        const res = await fetch("/api/sequences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name, description, type: type || null, sharingScope,
            exitOnReply, exitOnBounce, exitOnMeeting, pauseOnOOO,
            maxEmailsPer24h, ccAddresses: ccAddresses || null, bccAddresses: bccAddresses || null,
            scheduleId, timezone,
          }),
        });
        if (!res.ok) throw new Error("Failed");
        const created = await res.json();

        if (orderedSteps.length > 0) {
          const res2 = await fetch("/api/sequences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: created.id, steps: orderedSteps }),
          });
          if (!res2.ok) throw new Error("Failed to save steps");
          const updated = await res2.json();
          setSeq(updated);
          setSteps(updated.steps || []);
        } else {
          setSeq(created);
        }
      }
      flashStatus("Saved");
    } catch { flashStatus("Error saving"); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!seq?.id) return;
    if (newStatus === "active" && steps.length === 0) {
      flashStatus("Add at least one step before activating");
      return;
    }
    if (newStatus === "active") {
      const emailSteps = steps.filter(s => s.stepType === "auto_email" || s.stepType === "manual_email");
      const empty = emailSteps.find(s => !s.subject.trim());
      if (empty) { flashStatus("All email steps need a subject line"); return; }
    }
    try {
      const res = await fetch("/api/sequences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: seq.id, status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSeq(updated);
        setSteps(updated.steps || []);
      }
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f4f4]">
        <RefreshCw className="w-5 h-5 animate-spin text-[#888]" />
      </div>
    );
  }

  const ownerName = seq?.owner?.name || seq?.owner?.email || seq?.createdBy || "Unknown";

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f4f4]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-[#ddd] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { onRefresh(); onBack(); }} className="flex items-center gap-1 text-[12px] text-[#316ac5] hover:text-[#1a4a8a] font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Sequences
          </button>
          <div className="w-px h-5 bg-[#ddd]" />
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="text-[14px] font-semibold bg-transparent border-none outline-none w-[300px] placeholder:text-[#bbb] text-[#333] hover:bg-[#f5f5f5] focus:bg-[#f5f5f5] px-1.5 py-0.5 rounded transition-colors"
            placeholder="Sequence name"
          />
          {seq && (
            <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[seq.status] || STATUS_COLORS.draft}`}>
              {seq.status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {seq?.id && seq.status === "draft" && (
            <button onClick={() => handleStatusChange("active")} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-[11px] rounded hover:bg-green-700 transition-colors">
              <Play className="w-3 h-3" /> Activate
            </button>
          )}
          {seq?.id && seq.status === "active" && (
            <button onClick={() => handleStatusChange("paused")} className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 text-white text-[11px] rounded hover:bg-amber-600 transition-colors">
              <Pause className="w-3 h-3" /> Pause
            </button>
          )}
          {seq?.id && seq.status === "paused" && (
            <button onClick={() => handleStatusChange("active")} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-[11px] rounded hover:bg-green-700 transition-colors">
              <Play className="w-3 h-3" /> Resume
            </button>
          )}
          {saveStatus && (
            <span className={`text-[11px] px-2 py-0.5 rounded ${saveStatus === "Saved" ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"}`}>
              {saveStatus}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#316ac5] text-white text-[12px] rounded hover:bg-[#2a5db0] disabled:opacity-50 transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-[#ddd] px-4">
        <div className="flex items-center gap-0">
          {DETAIL_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${activeTab === tab.id
                  ? "border-[#316ac5] text-[#316ac5]"
                  : "border-transparent text-[#888] hover:text-[#555]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto py-6">
        <div className={`mx-auto px-4 ${activeTab === "editor" ? "max-w-[650px]" : "max-w-[1000px]"}`}>
          {activeTab === "editor" && (
            <EditorTab
              steps={steps}
              setSteps={setSteps}
              editingStep={editingStep}
              setEditingStep={setEditingStep}
            />
          )}

          {activeTab === "contacts" && seq?.id && (
            <ContactsTab sequenceId={seq.id} />
          )}
          {activeTab === "contacts" && !seq?.id && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-8 h-8 text-[#ccc] mb-3" />
              <p className="text-[13px] text-[#555]">Save the sequence first to manage contacts.</p>
            </div>
          )}

          {activeTab === "emails" && seq?.id && (
            <EmailsTab sequenceId={seq.id} />
          )}
          {activeTab === "emails" && !seq?.id && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-8 h-8 text-[#ccc] mb-3" />
              <p className="text-[13px] text-[#555]">Save the sequence first to view emails.</p>
            </div>
          )}

          {activeTab === "report" && seq?.id && (
            <ReportTab sequenceId={seq.id} />
          )}
          {activeTab === "report" && !seq?.id && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-8 h-8 text-[#ccc] mb-3" />
              <p className="text-[13px] text-[#555]">Save the sequence first to view reports.</p>
            </div>
          )}

          {activeTab === "settings" && (
            <SettingsTab
              description={description} setDescription={setDescription}
              type={type} setType={setType}
              ownerName={ownerName}
              sharingScope={sharingScope} setSharingScope={setSharingScope}
              exitOnReply={exitOnReply} setExitOnReply={setExitOnReply}
              exitOnBounce={exitOnBounce} setExitOnBounce={setExitOnBounce}
              exitOnMeeting={exitOnMeeting} setExitOnMeeting={setExitOnMeeting}
              pauseOnOOO={pauseOnOOO} setPauseOnOOO={setPauseOnOOO}
              maxEmailsPer24h={maxEmailsPer24h} setMaxEmailsPer24h={setMaxEmailsPer24h}
              ccAddresses={ccAddresses} setCcAddresses={setCcAddresses}
              bccAddresses={bccAddresses} setBccAddresses={setBccAddresses}
              scheduleId={scheduleId} setScheduleId={setScheduleId}
              timezone={timezone} setTimezone={setTimezone}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sequence Card ───────────────────────────────────────────────────────────

function SequenceCard({ sequence, onClick, onDuplicate, onDelete }: {
  sequence: Sequence;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const statusColor = STATUS_COLORS[sequence.status] || STATUS_COLORS.draft;
  const stepCount = sequence._count?.steps ?? sequence.steps?.length ?? 0;
  const enrolledCount = sequence._count?.enrollments ?? 0;
  const ownerName = sequence.owner?.name || sequence.owner?.email || sequence.createdBy || "";

  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#ddd] rounded hover:border-[#316ac5] hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="h-1 bg-[#316ac5] rounded-t opacity-40 group-hover:opacity-100 transition-opacity" />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-semibold text-[#333] truncate">{sequence.name}</h3>
            {sequence.description && (
              <p className="text-[11px] text-[#999] truncate mt-0.5">{sequence.description}</p>
            )}
          </div>
          <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ml-2 uppercase whitespace-nowrap ${statusColor}`}>
            {sequence.status}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] text-[#888]">
            <Mail className="w-3 h-3" /> {stepCount} step{stepCount !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#888]">
            <Users className="w-3 h-3" /> {enrolledCount} enrolled
          </div>
          {ownerName && (
            <div className="text-[10px] text-[#aaa] truncate max-w-[100px]">{ownerName}</div>
          )}
          {sequence.type && (
            <div className="text-[10px] text-[#aaa] bg-[#f5f5f5] px-1.5 py-0.5 rounded capitalize">{sequence.type}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0]">
          <div className="text-[10px] text-[#aaa]">
            Updated {formatDate(sequence.updatedAt)}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={onDuplicate} className="p-1 text-[#bbb] hover:text-[#316ac5] transition-colors" title="Duplicate">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <InlineConfirm
              label="Delete"
              onConfirm={onDelete}
              className="p-1 text-[#bbb] hover:text-red-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export default function EmailSequencesView() {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editing, setEditing] = useState<Sequence | null | "new">(null);

  const fetchSequences = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sequences");
      if (res.ok) setSequences(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSequences(); }, []);

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/sequences?id=${id}`, { method: "DELETE" });
    if (res.ok) setSequences(prev => prev.filter(s => s.id !== id));
  };

  const handleDuplicate = async (seq: Sequence) => {
    const fullRes = await fetch(`/api/sequences?id=${seq.id}`);
    if (!fullRes.ok) return;
    const full = await fullRes.json();

    const res = await fetch("/api/sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${full.name} (Copy)`,
        description: full.description,
        type: full.type,
        sharingScope: full.sharingScope,
        exitOnReply: full.exitOnReply,
        exitOnBounce: full.exitOnBounce,
        exitOnMeeting: full.exitOnMeeting,
        pauseOnOOO: full.pauseOnOOO,
        maxEmailsPer24h: full.maxEmailsPer24h,
        ccAddresses: full.ccAddresses,
        bccAddresses: full.bccAddresses,
        timezone: full.timezone,
      }),
    });
    if (!res.ok) return;
    const created = await res.json();

    if (full.steps?.length > 0) {
      const stepsToCreate = full.steps.map((s: SequenceStep, i: number) => ({
        id: `temp_${Date.now()}_${i}`,
        stepOrder: s.stepOrder,
        stepType: s.stepType,
        delayDays: s.delayDays,
        delayHours: s.delayHours,
        subject: s.subject,
        bodyHtml: s.bodyHtml,
        templateId: s.templateId,
        threading: s.threading,
        taskNotes: s.taskNotes,
        priority: s.priority,
        isActive: s.isActive,
      }));
      await fetch("/api/sequences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: created.id, steps: stepsToCreate }),
      });
    }

    fetchSequences();
  };

  // Detail view
  if (editing) {
    const seq = editing === "new" ? null : editing;
    return (
      <SequenceDetailView
        key={seq?.id || "new"}
        sequence={seq}
        onBack={() => setEditing(null)}
        onRefresh={fetchSequences}
      />
    );
  }

  const filtered = sequences.filter(s => {
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (search) return s.name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const STATUS_FILTERS = ["all", "active", "draft", "paused", "archived"];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f4f4]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-[#ddd] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[16px] font-semibold text-[#333] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#316ac5]" /> Email Sequences
            </h1>
            <p className="text-[11px] text-[#999] mt-0.5">Build automated email campaigns with timed follow-ups</p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#316ac5] text-white text-[12px] rounded hover:bg-[#2a5db0] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Sequence
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center bg-[#f5f5f5] border border-[#ddd] rounded px-2.5 py-1.5 flex-1 max-w-[300px]">
            <Search className="w-3.5 h-3.5 text-[#aaa] mr-2" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search sequences..."
              className="text-[12px] border-none outline-none bg-transparent w-full"
            />
            {search && <button onClick={() => setSearch("")} className="text-[#aaa] hover:text-[#666]"><X className="w-3 h-3" /></button>}
          </div>
          <div className="flex items-center gap-1">
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 text-[11px] rounded capitalize transition-colors ${filterStatus === s ? "bg-[#316ac5] text-white" : "bg-[#f0f0f0] text-[#666] hover:bg-[#e0e0e0]"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sequence grid */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="w-5 h-5 animate-spin text-[#888]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 rounded-full bg-[#e8f0fe] flex items-center justify-center mb-4">
              <Zap className="w-7 h-7 text-[#316ac5]" />
            </div>
            <p className="text-[14px] font-medium text-[#555] mb-1">
              {sequences.length === 0 ? "No sequences yet" : "No results"}
            </p>
            <p className="text-[12px] text-[#999] mb-4">
              {sequences.length === 0 ? "Create your first email sequence to automate follow-ups." : "Try a different search or filter."}
            </p>
            {sequences.length === 0 && (
              <button onClick={() => setEditing("new")} className="flex items-center gap-1.5 px-5 py-2 bg-[#316ac5] text-white text-[12px] rounded hover:bg-[#2a5db0] transition-colors">
                <Plus className="w-4 h-4" /> Create Sequence
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1100px]">
            {filtered.map(s => (
              <SequenceCard
                key={s.id}
                sequence={s}
                onClick={() => setEditing(s)}
                onDuplicate={() => handleDuplicate(s)}
                onDelete={() => handleDelete(s.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
