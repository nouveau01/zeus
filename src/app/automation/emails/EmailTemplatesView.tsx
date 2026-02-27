"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Search, Trash2, Save, X, Eye, Code, Copy,
  Mail, RefreshCw, ChevronDown, FileText,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";

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

// ─── Merge field categories ──────────────────────────────────────
// These are the fields users can insert into templates
const MERGE_FIELDS: Record<string, { label: string; fields: { token: string; label: string }[] }> = {
  account: {
    label: "Account",
    fields: [
      { token: "accountName", label: "Account Name" },
      { token: "accountId", label: "Account ID" },
      { token: "address", label: "Address" },
      { token: "city", label: "City" },
      { token: "state", label: "State" },
      { token: "zip", label: "Zip" },
    ],
  },
  customer: {
    label: "Customer",
    fields: [
      { token: "customerName", label: "Customer Name" },
      { token: "customerEmail", label: "Customer Email" },
      { token: "customerPhone", label: "Customer Phone" },
    ],
  },
  contact: {
    label: "Contact",
    fields: [
      { token: "contactName", label: "Contact Name" },
      { token: "contactTitle", label: "Contact Title" },
      { token: "contactEmail", label: "Contact Email" },
      { token: "contactPhone", label: "Contact Phone" },
    ],
  },
  ticket: {
    label: "Ticket",
    fields: [
      { token: "ticketNumber", label: "Ticket #" },
      { token: "ticketType", label: "Type" },
      { token: "ticketStatus", label: "Status" },
      { token: "ticketDescription", label: "Description" },
      { token: "worker", label: "Worker" },
    ],
  },
  job: {
    label: "Job",
    fields: [
      { token: "jobNumber", label: "Job #" },
      { token: "jobTitle", label: "Job Title" },
      { token: "scheduledDate", label: "Scheduled Date" },
    ],
  },
  invoice: {
    label: "Invoice",
    fields: [
      { token: "invoiceNumber", label: "Invoice #" },
      { token: "invoiceAmount", label: "Amount" },
      { token: "invoiceDate", label: "Invoice Date" },
      { token: "dueDate", label: "Due Date" },
    ],
  },
  user: {
    label: "Sender",
    fields: [
      { token: "senderName", label: "Your Name" },
      { token: "senderEmail", label: "Your Email" },
      { token: "companyName", label: "Company Name" },
    ],
  },
};

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "notification", label: "Notification" },
  { value: "sales", label: "Sales Outreach" },
  { value: "follow-up", label: "Follow-Up" },
  { value: "invoice", label: "Invoicing" },
];

// ─── Starter templates for quick setup ───────────────────────────
const STARTER_TEMPLATES: { name: string; category: string; subject: string; bodyHtml: string }[] = [
  {
    name: "Service Follow-Up",
    category: "follow-up",
    subject: "Service Complete - {{accountName}}",
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1e3a5f;">Service Complete</h2>
  <p>Dear {{contactName}},</p>
  <p>This is to confirm that service has been completed at <strong>{{accountName}}</strong> ({{address}}).</p>
  <p><strong>Ticket #:</strong> {{ticketNumber}}<br/>
  <strong>Technician:</strong> {{worker}}</p>
  <p>If you have any questions or need further assistance, please don't hesitate to reach out.</p>
  <p>Best regards,<br/>{{senderName}}<br/>{{companyName}}</p>
</div>`,
  },
  {
    name: "Sales Introduction",
    category: "sales",
    subject: "Elevator Service - {{companyName}}",
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p>Hi {{contactName}},</p>
  <p>My name is {{senderName}} from {{companyName}}. I wanted to reach out to introduce our elevator maintenance and modernization services.</p>
  <p>We specialize in providing reliable, high-quality elevator service and would love the opportunity to discuss how we can help with your building's needs.</p>
  <p>Would you be available for a brief call this week?</p>
  <p>Best,<br/>{{senderName}}<br/>{{senderEmail}}</p>
</div>`,
  },
  {
    name: "Invoice Notification",
    category: "invoice",
    subject: "Invoice #{{invoiceNumber}} - {{accountName}}",
    bodyHtml: `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1e3a5f;">Invoice</h2>
  <p>Dear {{contactName}},</p>
  <p>Please find below the details for your recent invoice:</p>
  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Invoice #</td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">{{invoiceNumber}}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Account</td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">{{accountName}}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Amount</td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">{{invoiceAmount}}</td></tr>
    <tr><td style="padding: 8px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">Due Date</td><td style="padding: 8px; border-bottom: 1px solid #e0e0e0;">{{dueDate}}</td></tr>
  </table>
  <p>Please contact us if you have any questions.</p>
  <p>Thank you,<br/>{{companyName}}</p>
</div>`,
  },
];

// ─── Template Editor ─────────────────────────────────────────────
function TemplateEditor({
  template,
  onSave,
  onCancel,
  onDelete,
}: {
  template: EmailTemplate | null; // null = new template
  onSave: (data: Partial<EmailTemplate>) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [bodyHtml, setBodyHtml] = useState(template?.bodyHtml || "");
  const [category, setCategory] = useState(template?.category || "general");
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<"subject" | "body">("body");
  const [mergeFieldOpen, setMergeFieldOpen] = useState<string | null>(null);

  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const cursorRef = useRef<{ field: "subject" | "body"; start: number; end: number }>({
    field: "body", start: 0, end: 0,
  });

  const updateCursor = useCallback((field: "subject" | "body") => {
    const el = field === "subject" ? subjectRef.current : bodyRef.current;
    if (el) {
      cursorRef.current = { field, start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
      setActiveField(field);
    }
  }, []);

  const insertMergeField = useCallback((token: string) => {
    const tag = `{{${token}}}`;
    const { field, start, end } = cursorRef.current;

    if (field === "subject") {
      const val = subject.slice(0, start) + tag + subject.slice(end);
      setSubject(val);
      setTimeout(() => {
        if (subjectRef.current) {
          const pos = start + tag.length;
          subjectRef.current.focus();
          subjectRef.current.setSelectionRange(pos, pos);
          cursorRef.current = { field: "subject", start: pos, end: pos };
        }
      }, 0);
    } else {
      const val = bodyHtml.slice(0, start) + tag + bodyHtml.slice(end);
      setBodyHtml(val);
      setTimeout(() => {
        if (bodyRef.current) {
          const pos = start + tag.length;
          bodyRef.current.focus();
          bodyRef.current.setSelectionRange(pos, pos);
          cursorRef.current = { field: "body", start: pos, end: pos };
        }
      }, 0);
    }
    setMergeFieldOpen(null);
  }, [subject, bodyHtml]);

  const handleSave = async () => {
    if (!name.trim() || !subject.trim()) {
      setSaveStatus("Name and subject are required");
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }
    setSaving(true);
    setSaveStatus(null);
    try {
      await onSave({ id: template?.id, name, subject, bodyHtml, category });
      setSaveStatus("Saved");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus("Error saving");
    } finally {
      setSaving(false);
    }
  };

  // Sample data for preview
  const sampleData: Record<string, string> = {
    accountName: "100 BEEKMAN", accountId: "100BEK", address: "100 Beekman St, New York, NY",
    city: "New York", state: "NY", zip: "10038",
    customerName: "ACME PROPERTIES", customerEmail: "info@acme.com", customerPhone: "(212) 555-1234",
    contactName: "John Smith", contactTitle: "Property Manager", contactEmail: "jsmith@acme.com", contactPhone: "(212) 555-5678",
    ticketNumber: "10542", ticketType: "Callback", ticketStatus: "Completed", ticketDescription: "Elevator stuck on 3rd floor", worker: "Mike Johnson",
    jobNumber: "J-2026-0145", jobTitle: "Modernization", scheduledDate: "03/15/2026",
    invoiceNumber: "INV-8821", invoiceAmount: "$12,500.00", invoiceDate: "02/27/2026", dueDate: "03/27/2026",
    senderName: "Zach Schwartz", senderEmail: "zschwartz@nouveauelevator.com", companyName: "Nouveau Elevator",
  };
  const interpolate = (str: string) => str.replace(/\{\{(\w+)\}\}/g, (_, k) => sampleData[k] || `{{${k}}}`);

  return (
    <div className="flex-1 flex flex-col h-full bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between bg-[#ece9d8] px-4 py-2 border-b border-[#aca899]">
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-[#316ac5]" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name..."
            className="text-[14px] font-semibold bg-transparent border-none outline-none w-[280px] placeholder:text-[#999]"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-2 py-0.5 border border-[#808080] bg-white text-[11px]"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus && (
            <span className={`text-[11px] ${saveStatus === "Saved" ? "text-green-700" : "text-red-600"}`}>
              {saveStatus}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1 bg-[#316ac5] text-white text-[11px] border border-[#003c74] hover:bg-[#4a8ae6] disabled:opacity-50"
          >
            <Save className="w-3 h-3" /> {saving ? "Saving..." : "Save"}
          </button>
          {onDelete && template && (
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-[#666] hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-2 py-1 bg-white text-[11px] border border-[#808080] hover:bg-[#f0f0f0]"
          >
            <X className="w-3 h-3" /> Close
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Edit / Preview toggle */}
          <div className="flex items-center gap-1 px-4 pt-3 pb-2">
            <button
              onClick={() => setShowPreview(false)}
              className={`flex items-center gap-1 px-3 py-1 text-[11px] border ${!showPreview ? "bg-white border-[#808080] font-semibold shadow-sm" : "bg-transparent border-transparent hover:bg-[#f0f0f0]"}`}
            >
              <Code className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={() => setShowPreview(true)}
              className={`flex items-center gap-1 px-3 py-1 text-[11px] border ${showPreview ? "bg-white border-[#808080] font-semibold shadow-sm" : "bg-transparent border-transparent hover:bg-[#f0f0f0]"}`}
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
          </div>

          {showPreview ? (
            <div className="flex-1 overflow-auto p-4">
              <div className="border border-[#ccc] rounded max-w-[650px] mx-auto shadow-sm">
                <div className="bg-[#f6f6f6] border-b border-[#ddd] px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-[#888] w-[50px]">Subject:</span>
                    <span className="text-[12px] font-semibold">{interpolate(subject)}</span>
                  </div>
                </div>
                <div className="p-4 bg-white text-[13px]" dangerouslySetInnerHTML={{ __html: interpolate(bodyHtml) }} />
              </div>
              <p className="text-[10px] text-[#999] text-center mt-2">
                Preview with sample data. Merge fields will be replaced with real values when sent.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-auto px-4 pb-4">
              {/* Subject */}
              <div className="mb-3">
                <label className="text-[11px] font-semibold text-[#333] block mb-1">Subject Line</label>
                <input
                  ref={subjectRef}
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onFocus={() => updateCursor("subject")}
                  onClick={() => updateCursor("subject")}
                  onKeyUp={() => updateCursor("subject")}
                  placeholder="e.g. Service Complete - {{accountName}}"
                  className={`w-full px-3 py-2 border text-[12px] bg-white ${activeField === "subject" ? "border-[#316ac5] ring-1 ring-[#316ac5]/20" : "border-[#ccc]"}`}
                />
              </div>

              {/* Body */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="text-[11px] font-semibold text-[#333] block mb-1">Email Body (HTML)</label>
                <textarea
                  ref={bodyRef}
                  value={bodyHtml}
                  onChange={(e) => setBodyHtml(e.target.value)}
                  onFocus={() => updateCursor("body")}
                  onClick={() => updateCursor("body")}
                  onKeyUp={() => updateCursor("body")}
                  className={`flex-1 w-full px-3 py-2 border text-[11px] bg-white font-mono leading-relaxed resize-none ${activeField === "body" ? "border-[#316ac5] ring-1 ring-[#316ac5]/20" : "border-[#ccc]"}`}
                  spellCheck={false}
                  placeholder="Write your email HTML here..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Right: Merge Fields sidebar */}
        {!showPreview && (
          <div className="w-[220px] border-l border-[#ddd] bg-[#fafafa] overflow-y-auto flex-shrink-0">
            <div className="px-3 py-2 bg-[#f0f0f0] border-b border-[#ddd]">
              <h3 className="text-[11px] font-semibold text-[#333]">Merge Fields</h3>
              <p className="text-[9px] text-[#888] mt-0.5">Click to insert at cursor</p>
            </div>
            {Object.entries(MERGE_FIELDS).map(([key, group]) => (
              <div key={key} className="border-b border-[#eee]">
                <button
                  onClick={() => setMergeFieldOpen(mergeFieldOpen === key ? null : key)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-medium text-[#444] hover:bg-[#e8e8e8]"
                >
                  {group.label}
                  <ChevronDown className={`w-3 h-3 transition-transform ${mergeFieldOpen === key ? "rotate-180" : ""}`} />
                </button>
                {mergeFieldOpen === key && (
                  <div className="pb-1">
                    {group.fields.map(f => (
                      <button
                        key={f.token}
                        onClick={() => insertMergeField(f.token)}
                        className="w-full flex items-center gap-2 px-4 py-1 text-left text-[10px] hover:bg-[#e0ecf9] group"
                      >
                        <span className="text-[#666] group-hover:text-[#333]">{f.label}</span>
                        <span className="ml-auto font-mono text-[9px] text-[#aaa] group-hover:text-[#316ac5]">{`{{${f.token}}}`}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Email Templates List View ──────────────────────────────
export default function EmailTemplatesView() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null | "new">(null);
  const [showStarterMenu, setShowStarterMenu] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email-templates");
      if (res.ok) setTemplates(await res.json());
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleSave = async (data: Partial<EmailTemplate>) => {
    const method = data.id ? "PUT" : "POST";
    const res = await fetch("/api/email-templates", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save");
    const saved = await res.json();
    if (data.id) {
      setTemplates(prev => prev.map(t => t.id === saved.id ? saved : t));
    } else {
      setTemplates(prev => [saved, ...prev]);
    }
    setEditingTemplate(saved);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const res = await fetch(`/api/email-templates?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setTemplates(prev => prev.filter(t => t.id !== id));
      setEditingTemplate(null);
    }
  };

  const handleCreateFromStarter = async (starter: typeof STARTER_TEMPLATES[0]) => {
    setShowStarterMenu(false);
    const res = await fetch("/api/email-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(starter),
    });
    if (res.ok) {
      const saved = await res.json();
      setTemplates(prev => [saved, ...prev]);
      setEditingTemplate(saved);
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    const res = await fetch("/api/email-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${template.name} (Copy)`,
        subject: template.subject,
        bodyHtml: template.bodyHtml,
        category: template.category,
      }),
    });
    if (res.ok) {
      const saved = await res.json();
      setTemplates(prev => [saved, ...prev]);
      setEditingTemplate(saved);
    }
  };

  // If editing a template, show the editor full-screen
  if (editingTemplate) {
    const tmpl = editingTemplate === "new" ? null : editingTemplate;
    return (
      <TemplateEditor
        key={tmpl?.id || "new"}
        template={tmpl}
        onSave={handleSave}
        onCancel={() => { setEditingTemplate(null); fetchTemplates(); }}
        onDelete={tmpl ? () => handleDelete(tmpl.id) : undefined}
      />
    );
  }

  // Filter templates
  const filtered = templates.filter(t => {
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#c0c0c0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-[#ece9d8] px-3 py-2 border-b border-[#aca899]">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#316ac5]" />
          <h1 className="text-[14px] font-semibold">Email Templates</h1>
          <span className="text-[11px] text-[#666] ml-1">({templates.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center border border-[#808080] bg-white px-2 py-0.5">
            <Search className="w-3 h-3 text-[#888] mr-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="text-[11px] border-none outline-none bg-transparent w-[140px]"
            />
          </div>
          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2 py-0.5 border border-[#808080] bg-white text-[11px]"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {/* New template button with starter dropdown */}
          <div className="relative">
            <div className="flex">
              <button
                onClick={() => setEditingTemplate("new")}
                className="flex items-center gap-1 px-3 py-1 bg-[#316ac5] text-white text-[11px] border border-[#003c74] hover:bg-[#4a8ae6] border-r-0"
              >
                <Plus className="w-3 h-3" /> New Template
              </button>
              <button
                onClick={() => setShowStarterMenu(!showStarterMenu)}
                className="flex items-center px-1 py-1 bg-[#316ac5] text-white text-[11px] border border-[#003c74] hover:bg-[#4a8ae6] border-l border-l-[#4a8ae6]"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {showStarterMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#808080] shadow-lg z-20 min-w-[200px]">
                <div className="px-3 py-1.5 bg-[#f0f0f0] border-b border-[#ddd] text-[10px] font-semibold text-[#666]">
                  START FROM TEMPLATE
                </div>
                {STARTER_TEMPLATES.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleCreateFromStarter(s)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-[#316ac5] hover:text-white"
                  >
                    <FileText className="w-3 h-3 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{s.name}</div>
                      <div className="text-[9px] opacity-70">{CATEGORIES.find(c => c.value === s.category)?.label}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-auto bg-white m-2 border border-[#808080]">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-5 h-5 animate-spin text-[#666]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#666]">
            <Mail className="w-10 h-10 mb-3 text-[#ccc]" />
            <p className="text-[13px] font-medium mb-1">
              {templates.length === 0 ? "No email templates yet" : "No templates match your search"}
            </p>
            <p className="text-[11px] text-[#999] mb-3">
              {templates.length === 0 ? "Create your first template or start from a pre-built one." : "Try a different search or category."}
            </p>
            {templates.length === 0 && (
              <button
                onClick={() => setEditingTemplate("new")}
                className="flex items-center gap-1 px-4 py-1.5 bg-[#316ac5] text-white text-[12px] border border-[#003c74] hover:bg-[#4a8ae6]"
              >
                <Plus className="w-3.5 h-3.5" /> Create Template
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex bg-[#f0f0f0] border-b border-[#999] text-[10px] font-semibold text-[#333] sticky top-0">
              <div className="flex-1 px-3 py-1.5 min-w-[200px]">Template Name</div>
              <div className="w-[120px] px-3 py-1.5">Category</div>
              <div className="w-[250px] px-3 py-1.5">Subject</div>
              <div className="w-[100px] px-3 py-1.5">Created By</div>
              <div className="w-[120px] px-3 py-1.5">Last Modified</div>
              <div className="w-[80px] px-3 py-1.5 text-center">Actions</div>
            </div>
            {/* Rows */}
            {filtered.map((t) => (
              <div
                key={t.id}
                className="flex items-center border-b border-[#eee] hover:bg-[#e8f4fc] cursor-pointer text-[11px]"
                onClick={() => setEditingTemplate(t)}
              >
                <div className="flex-1 px-3 py-2 min-w-[200px] flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#316ac5] flex-shrink-0" />
                  <span className="font-medium text-[#333] truncate">{t.name}</span>
                  {!t.isActive && (
                    <span className="text-[9px] bg-[#f0f0f0] text-[#888] px-1 border border-[#ccc]">Inactive</span>
                  )}
                </div>
                <div className="w-[120px] px-3 py-2">
                  <span className="text-[10px] bg-[#f0f0f0] text-[#555] px-1.5 py-0.5 border border-[#ddd]">
                    {CATEGORIES.find(c => c.value === t.category)?.label || t.category}
                  </span>
                </div>
                <div className="w-[250px] px-3 py-2 text-[#666] truncate font-mono text-[10px]">{t.subject}</div>
                <div className="w-[100px] px-3 py-2 text-[#666] truncate">{t.createdBy || "—"}</div>
                <div className="w-[120px] px-3 py-2 text-[#666]">
                  {new Date(t.updatedAt).toLocaleDateString()}
                </div>
                <div className="w-[80px] px-3 py-2 flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleDuplicate(t)}
                    className="p-1 text-[#888] hover:text-[#316ac5]"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1 text-[#888] hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
