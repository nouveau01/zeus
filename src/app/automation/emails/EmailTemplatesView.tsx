"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Search, Trash2, Save, X, Eye, Copy,
  Mail, RefreshCw, ChevronDown, ChevronRight, FileText, ArrowLeft,
  Bold, Italic, Underline, Link as LinkIcon, Braces, Send, Code,
} from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  category: string;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Merge fields ────────────────────────────────────────────────
const MERGE_FIELDS: { group: string; fields: { token: string; label: string }[] }[] = [
  { group: "Account", fields: [
    { token: "accountName", label: "Account Name" }, { token: "accountId", label: "Account ID" },
    { token: "address", label: "Address" }, { token: "city", label: "City" },
    { token: "state", label: "State" }, { token: "zip", label: "Zip" },
  ]},
  { group: "Customer", fields: [
    { token: "customerName", label: "Customer Name" }, { token: "customerEmail", label: "Customer Email" },
    { token: "customerPhone", label: "Customer Phone" },
  ]},
  { group: "Contact", fields: [
    { token: "contactName", label: "Contact Name" }, { token: "contactTitle", label: "Title" },
    { token: "contactEmail", label: "Contact Email" }, { token: "contactPhone", label: "Contact Phone" },
  ]},
  { group: "Ticket", fields: [
    { token: "ticketNumber", label: "Ticket #" }, { token: "ticketType", label: "Type" },
    { token: "ticketStatus", label: "Status" }, { token: "ticketDescription", label: "Description" },
    { token: "worker", label: "Worker" },
  ]},
  { group: "Job", fields: [
    { token: "jobNumber", label: "Job #" }, { token: "jobTitle", label: "Job Title" },
    { token: "scheduledDate", label: "Scheduled Date" },
  ]},
  { group: "Invoice", fields: [
    { token: "invoiceNumber", label: "Invoice #" }, { token: "invoiceAmount", label: "Amount" },
    { token: "invoiceDate", label: "Invoice Date" }, { token: "dueDate", label: "Due Date" },
  ]},
  { group: "Sender", fields: [
    { token: "senderName", label: "Your Name" }, { token: "senderEmail", label: "Your Email" },
    { token: "companyName", label: "Company Name" },
  ]},
];

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "notification", label: "Notification" },
  { value: "sales", label: "Sales Outreach" },
  { value: "follow-up", label: "Follow-Up" },
  { value: "invoice", label: "Invoicing" },
];

const CATEGORY_COLORS: Record<string, string> = {
  general: "bg-[#e8e8e8] text-[#555]",
  notification: "bg-[#dbeafe] text-[#1e40af]",
  sales: "bg-[#dcfce7] text-[#166534]",
  "follow-up": "bg-[#fef9c3] text-[#854d0e]",
  invoice: "bg-[#f3e8ff] text-[#6b21a8]",
};

const STARTER_TEMPLATES = [
  {
    name: "Service Follow-Up",
    category: "follow-up",
    subject: "Service Complete - {{accountName}}",
    bodyHtml: `<p>Dear {{contactName}},</p><p>This is to confirm that service has been completed at <b>{{accountName}}</b> ({{address}}).</p><p><b>Ticket #:</b> {{ticketNumber}}<br><b>Technician:</b> {{worker}}</p><p>If you have any questions or need further assistance, please don't hesitate to reach out.</p><p>Best regards,<br>{{senderName}}<br>{{companyName}}</p>`,
  },
  {
    name: "Sales Introduction",
    category: "sales",
    subject: "Elevator Service - {{companyName}}",
    bodyHtml: `<p>Hi {{contactName}},</p><p>My name is {{senderName}} from {{companyName}}. I wanted to reach out to introduce our elevator maintenance and modernization services.</p><p>We specialize in providing reliable, high-quality elevator service and would love the opportunity to discuss how we can help with your building's needs.</p><p>Would you be available for a brief call this week?</p><p>Best,<br>{{senderName}}<br>{{senderEmail}}</p>`,
  },
  {
    name: "Invoice Notification",
    category: "invoice",
    subject: "Invoice #{{invoiceNumber}} - {{accountName}}",
    bodyHtml: `<p>Dear {{contactName}},</p><p>Please find below the details for your recent invoice:</p><p><b>Invoice #:</b> {{invoiceNumber}}<br><b>Account:</b> {{accountName}}<br><b>Amount:</b> {{invoiceAmount}}<br><b>Due Date:</b> {{dueDate}}</p><p>Please contact us if you have any questions.</p><p>Thank you,<br>{{companyName}}</p>`,
  },
];

// ─── Sample data for preview ─────────────────────────────────────
const SAMPLE_DATA: Record<string, string> = {
  accountName: "100 BEEKMAN", accountId: "100BEK", address: "100 Beekman St, New York, NY",
  city: "New York", state: "NY", zip: "10038",
  customerName: "ACME PROPERTIES", customerEmail: "info@acme.com", customerPhone: "(212) 555-1234",
  contactName: "John Smith", contactTitle: "Property Manager", contactEmail: "jsmith@acme.com", contactPhone: "(212) 555-5678",
  ticketNumber: "10542", ticketType: "Callback", ticketStatus: "Completed", ticketDescription: "Elevator stuck on 3rd floor", worker: "Mike Johnson",
  jobNumber: "J-2026-0145", jobTitle: "Modernization", scheduledDate: "03/15/2026",
  invoiceNumber: "INV-8821", invoiceAmount: "$12,500.00", invoiceDate: "02/27/2026", dueDate: "03/27/2026",
  senderName: "Zach Schwartz", senderEmail: "zschwartz@nouveauelevator.com", companyName: "Nouveau Elevator",
};

const interpolate = (str: string) => str.replace(/\{\{(\w+)\}\}/g, (_, k) => SAMPLE_DATA[k] || `{{${k}}}`);

// ─── Merge Fields Popover ────────────────────────────────────────
function MergeFieldsPopover({
  onSelect,
  onClose,
}: {
  onSelect: (token: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState(MERGE_FIELDS[0].group);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const currentFields = MERGE_FIELDS.find(g => g.group === activeGroup)?.fields || [];
  const filtered = search
    ? currentFields.filter(f => f.label.toLowerCase().includes(search.toLowerCase()) || f.token.toLowerCase().includes(search.toLowerCase()))
    : currentFields;

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-0 mb-2 bg-white border border-[#ddd] rounded-lg shadow-xl z-50 w-[320px]"
      onClick={e => e.stopPropagation()}
    >
      {/* Search */}
      <div className="p-2 border-b border-[#eee]">
        <input
          autoFocus
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full px-2.5 py-1.5 text-[12px] border border-[#ddd] rounded bg-[#fafafa] outline-none focus:border-[#316ac5]"
        />
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-[#eee] px-1 overflow-x-auto">
        {MERGE_FIELDS.map(g => (
          <button
            key={g.group}
            onClick={() => { setActiveGroup(g.group); setSearch(""); }}
            className={`px-2 py-2 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeGroup === g.group ? "border-[#316ac5] text-[#316ac5]" : "border-transparent text-[#888] hover:text-[#555]"
            }`}
          >
            {g.group}
          </button>
        ))}
      </div>

      {/* Fields list */}
      <div className="max-h-[220px] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-[11px] text-[#999] p-4 text-center">No matching fields</p>
        ) : (
          filtered.map(f => (
            <button
              key={f.token}
              onClick={() => onSelect(f.token)}
              className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-[#f5f8ff] transition-colors border-b border-[#f5f5f5] last:border-b-0"
            >
              <span className="text-[12px] text-[#333]">{f.label}</span>
              <ChevronRight className="w-3 h-3 text-[#ccc]" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Link Input Popover ──────────────────────────────────────────
function LinkPopover({
  onApply,
  onClose,
}: {
  onApply: (url: string) => void;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("https://");
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-full left-0 mb-2 bg-white border border-[#ddd] rounded-lg shadow-xl z-50 w-[280px] p-3"
      onClick={e => e.stopPropagation()}
    >
      <label className="text-[11px] font-medium text-[#555] block mb-1">URL:</label>
      <div className="flex gap-1.5">
        <input
          ref={inputRef}
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { onApply(url); } }}
          className="flex-1 px-2 py-1.5 text-[12px] border border-[#ddd] rounded outline-none focus:border-[#316ac5]"
        />
        <button
          onClick={() => onApply(url)}
          className="px-3 py-1.5 bg-[#316ac5] text-white text-[11px] rounded hover:bg-[#2a5db0] transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}

// ─── Template Editor (Apollo-style two-column layout) ────────────
function TemplateEditor({
  template,
  onSave,
  onBack,
  onDelete,
}: {
  template: EmailTemplate | null;
  onSave: (data: Partial<EmailTemplate>) => Promise<void>;
  onBack: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [category, setCategory] = useState(template?.category || "general");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [showMergeFields, setShowMergeFields] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [htmlSource, setHtmlSource] = useState(template?.bodyHtml || "");
  const [previewHtml, setPreviewHtml] = useState(template?.bodyHtml || "");
  const [bodyEmpty, setBodyEmpty] = useState(!template?.bodyHtml);
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);

  // Initialize body content
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.innerHTML = template?.bodyHtml || "";
      setPreviewHtml(template?.bodyHtml || "");
      checkEmpty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkEmpty = () => {
    const html = bodyRef.current?.innerHTML || "";
    setBodyEmpty(!html || html === "<br>" || html === "<div><br></div>" || html.trim() === "");
  };

  // Save cursor position before opening popovers
  const saveSelectionState = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && bodyRef.current?.contains(sel.anchorNode)) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  // Restore cursor and insert merge field as text
  const insertMergeField = useCallback((token: string) => {
    if (!bodyRef.current) return;
    bodyRef.current.focus();

    if (savedSelection.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection.current);
    }

    document.execCommand("insertText", false, `{{${token}}}`);
    setPreviewHtml(bodyRef.current.innerHTML);
    setHtmlSource(bodyRef.current.innerHTML);
    checkEmpty();
    setShowMergeFields(false);
  }, []);

  // Formatting commands
  const execFormat = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value);
    bodyRef.current?.focus();
    if (bodyRef.current) {
      setPreviewHtml(bodyRef.current.innerHTML);
      setHtmlSource(bodyRef.current.innerHTML);
    }
  }, []);

  // Link insertion
  const handleAddLink = useCallback((url: string) => {
    if (!bodyRef.current) return;
    bodyRef.current.focus();
    if (savedSelection.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection.current);
    }
    document.execCommand("createLink", false, url);
    setPreviewHtml(bodyRef.current.innerHTML);
    setHtmlSource(bodyRef.current.innerHTML);
    setShowLinkInput(false);
  }, []);

  // Body input handler
  const handleBodyInput = useCallback(() => {
    if (bodyRef.current) {
      setPreviewHtml(bodyRef.current.innerHTML);
      setHtmlSource(bodyRef.current.innerHTML);
      checkEmpty();
    }
  }, []);

  // Toggle HTML source view
  const toggleHtmlSource = useCallback(() => {
    if (showHtmlSource) {
      // Switching back to WYSIWYG — apply HTML
      if (bodyRef.current) {
        bodyRef.current.innerHTML = htmlSource;
        setPreviewHtml(htmlSource);
        checkEmpty();
      }
    } else {
      // Switching to source — grab current
      if (bodyRef.current) {
        setHtmlSource(bodyRef.current.innerHTML);
      }
    }
    setShowHtmlSource(!showHtmlSource);
  }, [showHtmlSource, htmlSource]);

  // Strip formatting on paste
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  // Save
  const handleSave = async () => {
    if (!name.trim()) { setSaveStatus("Enter a template name"); setTimeout(() => setSaveStatus(null), 3000); return; }
    if (!subject.trim()) { setSaveStatus("Enter a subject line"); setTimeout(() => setSaveStatus(null), 3000); return; }
    setSaving(true);
    try {
      const bodyHtml = showHtmlSource ? htmlSource : (bodyRef.current?.innerHTML || "");
      await onSave({ id: template?.id, name, subject, bodyHtml, category });
      setSaveStatus("Saved");
    } catch { setSaveStatus("Error saving"); }
    finally { setSaving(false); setTimeout(() => setSaveStatus(null), 3000); }
  };

  // Send test email
  const handleTestEmail = async () => {
    setTestSending(true);
    setTestStatus(null);
    try {
      const bodyHtml = showHtmlSource ? htmlSource : (bodyRef.current?.innerHTML || "");
      const res = await fetch("/api/email-triggers/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: interpolate(subject),
          html: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">${interpolate(bodyHtml)}</div>`,
        }),
      });
      const data = await res.json();
      setTestStatus(res.ok ? data.message || "Sent!" : data.error || "Failed to send");
    } catch { setTestStatus("Failed to send"); }
    finally { setTestSending(false); setTimeout(() => setTestStatus(null), 5000); }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f4f4]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-[#ddd] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1 text-[12px] text-[#316ac5] hover:text-[#1a4a8a] font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Templates
          </button>
          <div className="w-px h-5 bg-[#ddd]" />
          <span className="text-[14px] font-semibold text-[#333]">{name || "New Template"}</span>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className={`text-[11px] ${saveStatus === "Saved" ? "text-green-600" : "text-red-500"}`}>{saveStatus}</span>
          )}
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#316ac5] text-white text-[12px] rounded hover:bg-[#2a5db0] disabled:opacity-50 transition-colors">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
          </button>
          {onDelete && template && (
            <button onClick={onDelete} className="p-1.5 text-[#999] hover:text-red-500 transition-colors" title="Delete template">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Editor form */}
        <div className="flex-1 flex flex-col overflow-auto">
          <div className="max-w-[700px] w-full mx-auto px-8 py-6">
            {/* Name */}
            <div className="mb-5">
              <label className="text-[12px] font-medium text-[#555] block mb-1.5">Name:</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Template name"
                className="w-full px-3 py-2 border border-[#ddd] rounded text-[13px] bg-white outline-none focus:border-[#316ac5] transition-colors"
              />
            </div>

            {/* Category */}
            <div className="mb-5">
              <label className="text-[12px] font-medium text-[#555] block mb-1.5">Category:</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="px-3 py-2 border border-[#ddd] rounded text-[13px] bg-white outline-none focus:border-[#316ac5] w-full max-w-[250px]"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            {/* Subject */}
            <div className="mb-5">
              <label className="text-[12px] font-medium text-[#555] block mb-1.5">Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject line"
                className="w-full px-3 py-2 border border-[#ddd] rounded text-[13px] bg-white outline-none focus:border-[#316ac5] transition-colors"
              />
            </div>

            {/* Body — WYSIWYG editor */}
            <div className="mb-4">
              <label className="text-[12px] font-medium text-[#555] block mb-1.5">Body:</label>
              <div className="border border-[#ddd] rounded bg-white overflow-hidden focus-within:border-[#316ac5] transition-colors">
                {showHtmlSource ? (
                  <textarea
                    value={htmlSource}
                    onChange={e => { setHtmlSource(e.target.value); setPreviewHtml(e.target.value); }}
                    className="w-full min-h-[350px] px-4 py-3 text-[12px] font-mono outline-none resize-y border-none"
                    spellCheck={false}
                  />
                ) : (
                  <div className="relative">
                    {/* Placeholder */}
                    {bodyEmpty && (
                      <div className="absolute top-3 left-4 text-[13px] text-[#bbb] pointer-events-none select-none">
                        Write your email here...
                      </div>
                    )}
                    <div
                      ref={bodyRef}
                      contentEditable
                      onInput={handleBodyInput}
                      onMouseUp={saveSelectionState}
                      onKeyUp={saveSelectionState}
                      onFocus={saveSelectionState}
                      onPaste={handlePaste}
                      className="min-h-[350px] px-4 py-3 text-[13px] outline-none leading-relaxed"
                      suppressContentEditableWarning
                    />
                  </div>
                )}

                {/* Formatting toolbar */}
                <div className="flex items-center gap-0.5 px-2 py-1.5 border-t border-[#eee] bg-[#fafafa]">
                  <button
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat("bold")}
                    className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#555] transition-colors"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat("italic")}
                    className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#555] transition-colors"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => execFormat("underline")}
                    className="p-1.5 rounded hover:bg-[#e0e0e0] text-[#555] transition-colors"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>

                  {/* Link */}
                  <div className="relative">
                    <button
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { saveSelectionState(); setShowLinkInput(!showLinkInput); setShowMergeFields(false); }}
                      className={`p-1.5 rounded transition-colors ${showLinkInput ? "bg-[#e8f0fe] text-[#316ac5]" : "hover:bg-[#e0e0e0] text-[#555]"}`}
                      title="Insert Link"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    {showLinkInput && (
                      <LinkPopover
                        onApply={handleAddLink}
                        onClose={() => setShowLinkInput(false)}
                      />
                    )}
                  </div>

                  <div className="w-px h-5 bg-[#ddd] mx-1" />

                  {/* HTML source toggle */}
                  <button
                    onClick={toggleHtmlSource}
                    className={`p-1.5 rounded transition-colors ${showHtmlSource ? "bg-[#316ac5] text-white" : "hover:bg-[#e0e0e0] text-[#555]"}`}
                    title={showHtmlSource ? "Visual Editor" : "HTML Source"}
                  >
                    <Code className="w-4 h-4" />
                  </button>

                  <div className="w-px h-5 bg-[#ddd] mx-1" />

                  {/* Merge fields */}
                  <div className="relative">
                    <button
                      onMouseDown={e => e.preventDefault()}
                      onClick={() => { if (!showHtmlSource) saveSelectionState(); setShowMergeFields(!showMergeFields); setShowLinkInput(false); }}
                      className={`p-1.5 rounded transition-colors ${showMergeFields ? "bg-[#e8f0fe] text-[#316ac5]" : "hover:bg-[#e0e0e0] text-[#555]"}`}
                      title="Insert Merge Field"
                    >
                      <Braces className="w-4 h-4" />
                    </button>
                    {showMergeFields && (
                      <MergeFieldsPopover
                        onSelect={insertMergeField}
                        onClose={() => setShowMergeFields(false)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Live Preview */}
        <div className="w-[400px] bg-white border-l border-[#ddd] flex flex-col flex-shrink-0">
          {/* Preview header */}
          <div className="px-5 py-4 border-b border-[#eee]">
            <h3 className="text-[14px] font-semibold text-[#333] flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#888]" /> Template Preview
            </h3>
            <p className="text-[11px] text-[#999] mt-1">
              Preview with sample data. Merge fields are replaced with example values.
            </p>
          </div>

          {/* Preview content */}
          <div className="flex-1 overflow-auto px-5 py-4">
            <div className="border border-[#e0e0e0] rounded bg-white overflow-hidden">
              {/* Email header */}
              <div className="px-4 py-2.5 border-b border-[#eee] bg-[#fafafa]">
                <div className="text-[11px] text-[#888]">
                  <span className="font-semibold text-[#666]">To:</span> Example Contact &lt;example@email.com&gt;
                </div>
                <div className="text-[11px] text-[#888] mt-0.5">
                  <span className="font-semibold text-[#666]">Subject:</span> {interpolate(subject) || "(No subject)"}
                </div>
              </div>
              {/* Email body */}
              <div
                className="px-4 py-4 text-[13px] leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: interpolate(previewHtml) || '<p style="color: #bbb;">Start typing to see a preview...</p>',
                }}
              />
            </div>
          </div>

          {/* Send test email */}
          <div className="px-5 py-4 border-t border-[#eee]">
            <button
              onClick={handleTestEmail}
              disabled={testSending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#fef9c3] text-[#854d0e] text-[12px] font-medium rounded border border-[#fde68a] hover:bg-[#fde68a] disabled:opacity-50 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> {testSending ? "Sending..." : "Send Test Email to Me"}
            </button>
            {testStatus && (
              <p className={`text-[10px] mt-2 text-center ${testStatus.toLowerCase().includes("sent") ? "text-green-600" : "text-red-500"}`}>
                {testStatus}
              </p>
            )}
            <p className="text-[10px] text-[#aaa] mt-2 text-center">
              Tests will deliver from your configured SMTP settings
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template Card ───────────────────────────────────────────────
function TemplateCard({ template, onClick, onDuplicate, onDelete }: {
  template: EmailTemplate;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const catLabel = CATEGORIES.find(c => c.value === template.category)?.label || template.category;
  const catColor = CATEGORY_COLORS[template.category] || CATEGORY_COLORS.general;

  return (
    <div
      onClick={onClick}
      className="bg-white border border-[#ddd] rounded hover:border-[#316ac5] hover:shadow-md transition-all cursor-pointer group"
    >
      {/* Card header - color accent */}
      <div className="h-1 bg-[#316ac5] rounded-t opacity-40 group-hover:opacity-100 transition-opacity" />
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] font-semibold text-[#333] truncate">{template.name}</h3>
            <p className="text-[11px] text-[#999] font-mono truncate mt-0.5">{template.subject}</p>
          </div>
          <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ml-2 whitespace-nowrap ${catColor}`}>
            {catLabel}
          </span>
        </div>

        {/* Preview snippet */}
        <div className="text-[10px] text-[#888] line-clamp-2 mb-3 leading-relaxed" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {template.bodyHtml.replace(/<[^>]*>/g, "").slice(0, 120) || "No content"}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0]">
          <div className="text-[10px] text-[#aaa]">
            {template.createdBy && <span>{template.createdBy} &middot; </span>}
            {new Date(template.updatedAt).toLocaleDateString()}
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
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
export default function EmailTemplatesView() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [editing, setEditing] = useState<EmailTemplate | null | "new">(null);
  const [showStarters, setShowStarters] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email-templates");
      if (res.ok) setTemplates(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleSave = async (data: Partial<EmailTemplate>) => {
    const method = data.id ? "PUT" : "POST";
    const res = await fetch("/api/email-templates", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Failed");
    const saved = await res.json();
    if (data.id) setTemplates(prev => prev.map(t => t.id === saved.id ? saved : t));
    else setTemplates(prev => [saved, ...prev]);
    setEditing(saved);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const res = await fetch(`/api/email-templates?id=${id}`, { method: "DELETE" });
    if (res.ok) { setTemplates(prev => prev.filter(t => t.id !== id)); setEditing(null); }
  };

  const handleDuplicate = async (t: EmailTemplate) => {
    const res = await fetch("/api/email-templates", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${t.name} (Copy)`, subject: t.subject, bodyHtml: t.bodyHtml, category: t.category }),
    });
    if (res.ok) { const saved = await res.json(); setTemplates(prev => [saved, ...prev]); setEditing(saved); }
  };

  const handleStarter = async (s: typeof STARTER_TEMPLATES[0]) => {
    setShowStarters(false);
    const res = await fetch("/api/email-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    if (res.ok) { const saved = await res.json(); setTemplates(prev => [saved, ...prev]); setEditing(saved); }
  };

  // Editor view
  if (editing) {
    const tmpl = editing === "new" ? null : editing;
    return (
      <TemplateEditor
        key={tmpl?.id || "new"}
        template={tmpl}
        onSave={handleSave}
        onBack={() => { setEditing(null); fetchTemplates(); }}
        onDelete={tmpl ? () => handleDelete(tmpl.id) : undefined}
      />
    );
  }

  const filtered = templates.filter(t => {
    if (filterCat !== "all" && t.category !== filterCat) return false;
    if (search) { const q = search.toLowerCase(); return t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q); }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f4f4f4]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
      {/* Header */}
      <div className="bg-white border-b border-[#ddd] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[16px] font-semibold text-[#333] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#316ac5]" /> Email Templates
            </h1>
            <p className="text-[11px] text-[#999] mt-0.5">Create and manage reusable email templates</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="flex">
                <button
                  onClick={() => setEditing("new")}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#316ac5] text-white text-[12px] rounded-l hover:bg-[#2a5db0] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New Template
                </button>
                <button
                  onClick={() => setShowStarters(!showStarters)}
                  className="flex items-center px-2 py-1.5 bg-[#316ac5] text-white text-[12px] rounded-r hover:bg-[#2a5db0] border-l border-[#4a8ae6] transition-colors"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              {showStarters && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowStarters(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-[#ddd] rounded shadow-lg z-20 w-[240px]">
                    <div className="px-3 py-2 border-b border-[#eee] text-[10px] font-semibold text-[#888] uppercase tracking-wide">
                      Start from template
                    </div>
                    {STARTER_TEMPLATES.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleStarter(s)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f5f8ff] transition-colors border-b border-[#f5f5f5] last:border-b-0"
                      >
                        <FileText className="w-4 h-4 text-[#316ac5] flex-shrink-0" />
                        <div>
                          <div className="text-[12px] font-medium text-[#333]">{s.name}</div>
                          <div className="text-[10px] text-[#999]">{CATEGORIES.find(c => c.value === s.category)?.label}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center bg-[#f5f5f5] border border-[#ddd] rounded px-2.5 py-1.5 flex-1 max-w-[300px]">
            <Search className="w-3.5 h-3.5 text-[#aaa] mr-2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="text-[12px] border-none outline-none bg-transparent w-full"
            />
            {search && <button onClick={() => setSearch("")} className="text-[#aaa] hover:text-[#666]"><X className="w-3 h-3" /></button>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterCat("all")}
              className={`px-2.5 py-1 text-[11px] rounded transition-colors ${filterCat === "all" ? "bg-[#316ac5] text-white" : "bg-[#f0f0f0] text-[#666] hover:bg-[#e0e0e0]"}`}
            >
              All
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setFilterCat(filterCat === c.value ? "all" : c.value)}
                className={`px-2.5 py-1 text-[11px] rounded transition-colors ${filterCat === c.value ? "bg-[#316ac5] text-white" : "bg-[#f0f0f0] text-[#666] hover:bg-[#e0e0e0]"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Template grid */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <RefreshCw className="w-5 h-5 animate-spin text-[#888]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-16 h-16 rounded-full bg-[#e8f0fe] flex items-center justify-center mb-4">
              <Mail className="w-7 h-7 text-[#316ac5]" />
            </div>
            <p className="text-[14px] font-medium text-[#555] mb-1">
              {templates.length === 0 ? "No templates yet" : "No results"}
            </p>
            <p className="text-[12px] text-[#999] mb-4">
              {templates.length === 0 ? "Create your first email template to get started." : "Try a different search or category."}
            </p>
            {templates.length === 0 && (
              <button onClick={() => setEditing("new")} className="flex items-center gap-1.5 px-5 py-2 bg-[#316ac5] text-white text-[12px] rounded hover:bg-[#2a5db0] transition-colors">
                <Plus className="w-4 h-4" /> Create Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1100px]">
            {filtered.map(t => (
              <TemplateCard
                key={t.id}
                template={t}
                onClick={() => setEditing(t)}
                onDuplicate={() => handleDuplicate(t)}
                onDelete={() => handleDelete(t.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
