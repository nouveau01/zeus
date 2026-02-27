"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Search, Trash2, Save, X, Eye, Copy, ArrowLeft,
  Mail, RefreshCw, ChevronDown, ChevronRight, Play, Pause, Settings,
  Clock, Zap, MoreVertical, GripVertical, Bold, Italic, Underline,
  Link as LinkIcon, Braces, Code, Send, Check, AlertCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────

interface SequenceStep {
  id: string;
  stepOrder: number;
  delayDays: number;
  subject: string;
  bodyHtml: string;
  templateId: string | null;
  isActive: boolean;
}

interface Sequence {
  id: string;
  name: string;
  description: string | null;
  status: string;
  type: string | null;
  exitOnReply: boolean;
  exitOnBounce: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  steps: SequenceStep[];
  _count: { enrollments: number; steps?: number };
}

// ─── Constants ───────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[#e8e8e8] text-[#555]",
  active: "bg-[#dcfce7] text-[#166534]",
  paused: "bg-[#fef9c3] text-[#854d0e]",
  archived: "bg-[#fee2e2] text-[#991b1b]",
};

const TYPE_OPTIONS = [
  { value: "", label: "None" },
  { value: "sales", label: "Sales" },
  { value: "service", label: "Service" },
  { value: "ar", label: "AR / Collections" },
  { value: "onboarding", label: "Onboarding" },
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

// ─── Merge Fields Popover ────────────────────────────────────────

function MergeFieldsPopover({ onSelect, onClose }: { onSelect: (token: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState(MERGE_FIELDS[0].group);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const fields = MERGE_FIELDS.find(g => g.group === activeGroup)?.fields || [];
  const filtered = search ? fields.filter(f => f.label.toLowerCase().includes(search.toLowerCase())) : fields;

  return (
    <div ref={ref} className="absolute bottom-full left-0 mb-2 bg-white border border-[#ddd] rounded-lg shadow-xl z-50 w-[300px]" onClick={e => e.stopPropagation()}>
      <div className="p-2 border-b border-[#eee]">
        <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full px-2.5 py-1.5 text-[12px] border border-[#ddd] rounded bg-[#fafafa] outline-none focus:border-[#316ac5]" />
      </div>
      <div className="flex border-b border-[#eee] px-1 overflow-x-auto">
        {MERGE_FIELDS.map(g => (
          <button key={g.group} onClick={() => { setActiveGroup(g.group); setSearch(""); }} className={`px-2 py-2 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${activeGroup === g.group ? "border-[#316ac5] text-[#316ac5]" : "border-transparent text-[#888] hover:text-[#555]"}`}>
            {g.group}
          </button>
        ))}
      </div>
      <div className="max-h-[200px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-[#999] p-4 text-center">No matching fields</p>
        ) : filtered.map(f => (
          <button key={f.token} onClick={() => onSelect(f.token)} className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-[#f5f8ff] transition-colors border-b border-[#f5f5f5] last:border-b-0">
            <span className="text-[12px] text-[#333]">{f.label}</span>
            <ChevronRight className="w-3 h-3 text-[#ccc]" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Step Editor (inline WYSIWYG) ────────────────────────────────

function StepEditor({
  step,
  stepIndex,
  onChange,
  onClose,
}: {
  step: SequenceStep;
  stepIndex: number;
  onChange: (updated: SequenceStep) => void;
  onClose: () => void;
}) {
  const [delayDays, setDelayDays] = useState(step.delayDays);
  const [subject, setSubject] = useState(step.subject);
  const [showMergeFields, setShowMergeFields] = useState(false);
  const [showHtml, setShowHtml] = useState(false);
  const [htmlSource, setHtmlSource] = useState(step.bodyHtml);
  const [bodyEmpty, setBodyEmpty] = useState(!step.bodyHtml);

  const bodyRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);

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
    if (savedSelection.current) { const sel = window.getSelection(); sel?.removeAllRanges(); sel?.addRange(savedSelection.current); }
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
    const bodyHtml = showHtml ? htmlSource : (bodyRef.current?.innerHTML || "");
    onChange({ ...step, delayDays, subject, bodyHtml });
    onClose();
  };

  return (
    <div className="bg-white border border-[#316ac5] rounded-lg shadow-lg overflow-hidden">
      {/* Step editor header */}
      <div className="bg-[#f0f5ff] px-4 py-2.5 border-b border-[#d0dff5] flex items-center justify-between">
        <span className="text-[13px] font-semibold text-[#1e3a5f]">Edit Step {stepIndex + 1}</span>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} className="flex items-center gap-1 px-3 py-1 bg-[#316ac5] text-white text-[11px] rounded hover:bg-[#2a5db0] transition-colors">
            <Check className="w-3 h-3" /> Done
          </button>
          <button onClick={onClose} className="text-[#888] hover:text-[#555]"><X className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="p-4">
        {/* Delay */}
        <div className="mb-4">
          <label className="text-[11px] font-medium text-[#555] block mb-1.5">
            {stepIndex === 0 ? "Send:" : "Wait:"}
          </label>
          {stepIndex === 0 ? (
            <span className="text-[12px] text-[#888]">Immediately after enrollment</span>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={delayDays}
                onChange={e => setDelayDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-[60px] px-2 py-1.5 border border-[#ddd] rounded text-[12px] text-center outline-none focus:border-[#316ac5]"
              />
              <span className="text-[12px] text-[#666]">days after previous step</span>
            </div>
          )}
        </div>

        {/* Subject */}
        <div className="mb-4">
          <label className="text-[11px] font-medium text-[#555] block mb-1.5">Subject:</label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder="Email subject line"
            className="w-full px-3 py-2 border border-[#ddd] rounded text-[13px] bg-white outline-none focus:border-[#316ac5] transition-colors"
          />
        </div>

        {/* Body — WYSIWYG */}
        <div>
          <label className="text-[11px] font-medium text-[#555] block mb-1.5">Body:</label>
          <div className="border border-[#ddd] rounded bg-white overflow-hidden focus-within:border-[#316ac5] transition-colors">
            {showHtml ? (
              <textarea
                value={htmlSource}
                onChange={e => setHtmlSource(e.target.value)}
                className="w-full min-h-[200px] px-3 py-2 text-[12px] font-mono outline-none resize-y border-none"
                spellCheck={false}
              />
            ) : (
              <div className="relative">
                {bodyEmpty && <div className="absolute top-2 left-3 text-[13px] text-[#bbb] pointer-events-none select-none">Write your email here...</div>}
                <div
                  ref={bodyRef}
                  contentEditable
                  onInput={handleBodyInput}
                  onMouseUp={saveSelState}
                  onKeyUp={saveSelState}
                  onFocus={saveSelState}
                  onPaste={handlePaste}
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
              <button onClick={toggleHtml} className={`p-1 rounded transition-colors ${showHtml ? "bg-[#316ac5] text-white" : "hover:bg-[#e0e0e0] text-[#555]"}`} title="HTML"><Code className="w-3.5 h-3.5" /></button>
              <div className="w-px h-4 bg-[#ddd] mx-0.5" />
              <div className="relative">
                <button onMouseDown={e => e.preventDefault()} onClick={() => { if (!showHtml) saveSelState(); setShowMergeFields(!showMergeFields); }} className={`p-1 rounded transition-colors ${showMergeFields ? "bg-[#e8f0fe] text-[#316ac5]" : "hover:bg-[#e0e0e0] text-[#555]"}`} title="Merge Fields"><Braces className="w-3.5 h-3.5" /></button>
                {showMergeFields && <MergeFieldsPopover onSelect={insertMergeField} onClose={() => setShowMergeFields(false)} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sequence Builder ────────────────────────────────────────────

function SequenceBuilder({
  sequence: initial,
  onBack,
  onRefresh,
}: {
  sequence: Sequence | null;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [seq, setSeq] = useState<Sequence | null>(initial);
  const [name, setName] = useState(initial?.name || "Untitled Sequence");
  const [description, setDescription] = useState(initial?.description || "");
  const [type, setType] = useState(initial?.type || "");
  const [exitOnReply, setExitOnReply] = useState(initial?.exitOnReply ?? true);
  const [exitOnBounce, setExitOnBounce] = useState(initial?.exitOnBounce ?? true);
  const [steps, setSteps] = useState<SequenceStep[]>(initial?.steps || []);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load full sequence if we only have summary data
  useEffect(() => {
    if (initial?.id && !initial.steps) {
      setLoading(true);
      fetch(`/api/sequences?id=${initial.id}`)
        .then(r => r.json())
        .then(data => {
          setSeq(data);
          setName(data.name);
          setDescription(data.description || "");
          setType(data.type || "");
          setExitOnReply(data.exitOnReply);
          setExitOnBounce(data.exitOnBounce);
          setSteps(data.steps || []);
        })
        .finally(() => setLoading(false));
    }
  }, [initial]);

  const addStep = () => {
    const newStep: SequenceStep = {
      id: `temp_${Date.now()}`,
      stepOrder: steps.length + 1,
      delayDays: steps.length === 0 ? 0 : 3,
      subject: "",
      bodyHtml: "",
      templateId: null,
      isActive: true,
    };
    setSteps([...steps, newStep]);
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
  };

  const handleSave = async () => {
    if (!name.trim()) { setSaveStatus("Enter a sequence name"); setTimeout(() => setSaveStatus(null), 3000); return; }
    setSaving(true);
    try {
      const orderedSteps = steps.map((s, i) => ({ ...s, stepOrder: i + 1 }));

      if (seq?.id) {
        // Update existing
        const res = await fetch("/api/sequences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: seq.id, name, description, type: type || null, exitOnReply, exitOnBounce, steps: orderedSteps }),
        });
        if (!res.ok) throw new Error("Failed");
        const updated = await res.json();
        setSeq(updated);
        setSteps(updated.steps || []);
      } else {
        // Create new, then save steps
        const res = await fetch("/api/sequences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description, type: type || null, exitOnReply, exitOnBounce }),
        });
        if (!res.ok) throw new Error("Failed");
        const created = await res.json();
        // Save steps
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
      setSaveStatus("Saved");
    } catch { setSaveStatus("Error saving"); }
    finally { setSaving(false); setTimeout(() => setSaveStatus(null), 3000); }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!seq?.id) return;
    // Validate: can't activate with 0 steps
    if (newStatus === "active" && steps.length === 0) {
      setSaveStatus("Add at least one step before activating");
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }
    // Validate: steps need subjects
    if (newStatus === "active") {
      const empty = steps.find(s => !s.subject.trim());
      if (empty) {
        setSaveStatus("All steps need a subject line");
        setTimeout(() => setSaveStatus(null), 3000);
        return;
      }
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
      }
    } catch { /* ignore */ }
  };

  const getAccumulatedDay = (index: number) => {
    let days = 0;
    for (let i = 0; i <= index; i++) days += steps[i]?.delayDays || 0;
    return days;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f4f4f4]">
        <RefreshCw className="w-5 h-5 animate-spin text-[#888]" />
      </div>
    );
  }

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
            className="text-[14px] font-semibold bg-transparent border-none outline-none w-[300px] placeholder:text-[#bbb] text-[#333]"
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
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded transition-colors ${showSettings ? "bg-[#e8f0fe] text-[#316ac5]" : "text-[#888] hover:text-[#555] hover:bg-[#f0f0f0]"}`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          {saveStatus && <span className={`text-[11px] ${saveStatus === "Saved" ? "text-green-600" : "text-red-500"}`}>{saveStatus}</span>}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#316ac5] text-white text-[12px] rounded hover:bg-[#2a5db0] disabled:opacity-50 transition-colors">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Settings panel (collapsible) */}
      {showSettings && (
        <div className="bg-white border-b border-[#ddd] px-6 py-4">
          <div className="max-w-[700px] mx-auto grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-[#555] block mb-1">Description:</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Optional description"
                className="w-full px-2.5 py-1.5 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5]"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[#555] block mb-1">Type:</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full px-2.5 py-1.5 border border-[#ddd] rounded text-[12px] outline-none focus:border-[#316ac5]">
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-[12px] text-[#555] cursor-pointer">
                <input type="checkbox" checked={exitOnReply} onChange={e => setExitOnReply(e.target.checked)} className="accent-[#316ac5]" />
                Stop on reply
              </label>
              <label className="flex items-center gap-2 text-[12px] text-[#555] cursor-pointer">
                <input type="checkbox" checked={exitOnBounce} onChange={e => setExitOnBounce(e.target.checked)} className="accent-[#316ac5]" />
                Stop on bounce
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step timeline */}
      <div className="flex-1 overflow-auto py-6">
        <div className="max-w-[650px] mx-auto px-4">
          {steps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-[#e8f0fe] flex items-center justify-center mb-4">
                <Mail className="w-7 h-7 text-[#316ac5]" />
              </div>
              <p className="text-[14px] font-medium text-[#555] mb-1">No steps yet</p>
              <p className="text-[12px] text-[#999] mb-5">Add your first email step to build this sequence.</p>
              <button onClick={addStep} className="flex items-center gap-1.5 px-5 py-2 bg-[#316ac5] text-white text-[12px] rounded hover:bg-[#2a5db0] transition-colors">
                <Plus className="w-4 h-4" /> Add First Step
              </button>
            </div>
          ) : (
            <>
              {steps.map((step, index) => (
                <div key={step.id}>
                  {/* Delay indicator (between steps) */}
                  {index > 0 && (
                    <div className="flex items-center justify-center py-2">
                      <div className="flex items-center gap-2 text-[11px] text-[#999]">
                        <div className="w-px h-4 bg-[#ddd]" />
                        <Clock className="w-3 h-3" />
                        <span>Wait {step.delayDays} day{step.delayDays !== 1 ? "s" : ""}</span>
                        <div className="w-px h-4 bg-[#ddd]" />
                      </div>
                    </div>
                  )}

                  {/* Step card or editor */}
                  {editingStep === index ? (
                    <StepEditor
                      step={step}
                      stepIndex={index}
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
                            {/* Step badge */}
                            <div className="w-7 h-7 rounded-full bg-[#316ac5] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[10px] text-[#999] uppercase font-medium">
                                  {index === 0 ? "Immediate" : `Day ${getAccumulatedDay(index)}`}
                                </span>
                                <span className="text-[10px] text-[#ccc]">&middot;</span>
                                <span className="text-[10px] text-[#999]">Auto Email</span>
                              </div>
                              <p className="text-[13px] font-medium text-[#333] truncate">
                                {step.subject || "(No subject)"}
                              </p>
                              <p className="text-[11px] text-[#888] mt-0.5 truncate">
                                {step.bodyHtml.replace(/<[^>]*>/g, "").slice(0, 80) || "(No content)"}
                              </p>
                            </div>
                          </div>
                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => removeStep(index)} className="p-1 text-[#bbb] hover:text-red-500 transition-colors" title="Remove step">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Add step button */}
              <div className="flex items-center justify-center py-4">
                <div className="flex flex-col items-center">
                  <div className="w-px h-4 bg-[#ddd]" />
                  <button
                    onClick={addStep}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-dashed border-[#ccc] text-[#666] text-[12px] rounded-lg hover:border-[#316ac5] hover:text-[#316ac5] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Step
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sequence Card ───────────────────────────────────────────────

function SequenceCard({ sequence, onClick, onDuplicate, onDelete }: {
  sequence: Sequence;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const statusColor = STATUS_COLORS[sequence.status] || STATUS_COLORS.draft;
  const stepCount = sequence._count?.steps ?? sequence.steps?.length ?? 0;
  const enrolledCount = sequence._count?.enrollments ?? 0;

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
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1 text-[11px] text-[#888]">
            <Mail className="w-3 h-3" /> {stepCount} step{stepCount !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#888]">
            <Zap className="w-3 h-3" /> {enrolledCount} enrolled
          </div>
          {sequence.type && (
            <div className="text-[10px] text-[#aaa] bg-[#f5f5f5] px-1.5 py-0.5 rounded capitalize">{sequence.type}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0]">
          <div className="text-[10px] text-[#aaa]">
            {sequence.createdBy && <span>{sequence.createdBy} &middot; </span>}
            {new Date(sequence.updatedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={onDuplicate} className="p-1 text-[#bbb] hover:text-[#316ac5] transition-colors" title="Duplicate">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="p-1 text-[#bbb] hover:text-red-500 transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────────

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
    if (!confirm("Delete this sequence?")) return;
    const res = await fetch(`/api/sequences?id=${id}`, { method: "DELETE" });
    if (res.ok) setSequences(prev => prev.filter(s => s.id !== id));
  };

  const handleDuplicate = async (seq: Sequence) => {
    // Load full sequence with steps first
    const fullRes = await fetch(`/api/sequences?id=${seq.id}`);
    if (!fullRes.ok) return;
    const full = await fullRes.json();

    const res = await fetch("/api/sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${full.name} (Copy)`, description: full.description, type: full.type, exitOnReply: full.exitOnReply, exitOnBounce: full.exitOnBounce }),
    });
    if (!res.ok) return;
    const created = await res.json();

    // Copy steps
    if (full.steps?.length > 0) {
      const stepsToCreate = full.steps.map((s: SequenceStep) => ({
        id: `temp_${Date.now()}_${s.stepOrder}`,
        stepOrder: s.stepOrder,
        delayDays: s.delayDays,
        subject: s.subject,
        bodyHtml: s.bodyHtml,
        templateId: s.templateId,
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

  // Builder view
  if (editing) {
    const seq = editing === "new" ? null : editing;
    return (
      <SequenceBuilder
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
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sequences..." className="text-[12px] border-none outline-none bg-transparent w-full" />
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
