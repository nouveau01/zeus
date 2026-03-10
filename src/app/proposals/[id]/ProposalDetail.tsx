"use client";

import { useState, useEffect } from "react";
import { Save, Undo2, Eye, ArrowLeft } from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { useXPDialog } from "@/components/ui/XPDialog";

interface ProposalData {
  id: string;
  proposalNumber: number;
  title: string | null;
  type: string | null;
  status: string;
  workDescription: string | null;
  laborHours: number | null;
  laborRate: number | null;
  laborTotal: number | null;
  amount: number | null;
  taxNote: string | null;
  validDays: number | null;
  paymentTerms: string | null;
  attn: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  fromName: string | null;
  sentDate: string | null;
  createdAt: string;
  opportunityId: string;
  opportunity: {
    id: string;
    opportunityNumber: number;
    name: string;
    customer: { id: string; name: string } | null;
    premises: { id: string; premisesId: string | null; address: string | null; city: string | null; state: string | null; zipCode: string | null; name: string | null } | null;
    contact: { id: string; name: string; email: string | null; phone: string | null; fax: string | null; title: string | null } | null;
  };
}

interface ProposalDetailProps {
  proposalId: string;
  onClose: () => void;
}

export default function ProposalDetail({ proposalId, onClose }: ProposalDetailProps) {
  const { openTab } = useTabs();
  const { alert: xpAlert, DialogComponent: XPDialogComponent } = useXPDialog();

  const [data, setData] = useState<ProposalData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [original, setOriginal] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/proposals/${proposalId}`);
        if (!res.ok) throw new Error("Not found");
        const p: ProposalData = await res.json();
        setData(p);
        const f: Record<string, any> = {
          title: p.title || "",
          type: p.type || "",
          status: p.status || "Draft",
          workDescription: p.workDescription || "",
          laborHours: p.laborHours != null ? String(p.laborHours) : "",
          laborRate: p.laborRate != null ? String(p.laborRate) : "",
          laborTotal: p.laborTotal != null ? String(p.laborTotal) : "",
          amount: p.amount != null ? String(p.amount) : "",
          taxNote: p.taxNote || "",
          validDays: p.validDays != null ? String(p.validDays) : "30",
          paymentTerms: p.paymentTerms || "",
          attn: p.attn || "",
          phone: p.phone || "",
          fax: p.fax || "",
          email: p.email || "",
          fromName: p.fromName || "",
        };
        setForm(f);
        setOriginal(f);
      } catch {
        await xpAlert("Proposal not found.");
        onClose();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [proposalId]);

  // Auto-calculate labor total
  useEffect(() => {
    const hours = parseFloat(form.laborHours) || 0;
    const rate = parseFloat(form.laborRate) || 0;
    if (hours > 0 && rate > 0) {
      setForm((f) => ({ ...f, laborTotal: String((hours * rate).toFixed(2)) }));
    }
  }, [form.laborHours, form.laborRate]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(original);

  const setField = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const saved = await res.json();
      await xpAlert(`Proposal #${data?.proposalNumber} saved successfully.`);
      // Reload
      const reloaded = await fetch(`/api/proposals/${proposalId}`);
      if (reloaded.ok) {
        const p: ProposalData = await reloaded.json();
        setData(p);
        const f: Record<string, any> = {
          title: p.title || "",
          type: p.type || "",
          status: p.status || "Draft",
          workDescription: p.workDescription || "",
          laborHours: p.laborHours != null ? String(p.laborHours) : "",
          laborRate: p.laborRate != null ? String(p.laborRate) : "",
          laborTotal: p.laborTotal != null ? String(p.laborTotal) : "",
          amount: p.amount != null ? String(p.amount) : "",
          taxNote: p.taxNote || "",
          validDays: p.validDays != null ? String(p.validDays) : "30",
          paymentTerms: p.paymentTerms || "",
          attn: p.attn || "",
          phone: p.phone || "",
          fax: p.fax || "",
          email: p.email || "",
          fromName: p.fromName || "",
        };
        setForm(f);
        setOriginal(f);
      }
    } catch {
      await xpAlert("Failed to save proposal.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => setForm({ ...original });

  const handlePreviewPDF = () => {
    openTab(`Preview: Proposal #${data?.proposalNumber}`, `/proposal-preview/${proposalId}`);
  };

  const handleGoToOpportunity = () => {
    if (data) {
      openTab(`Opp: ${data.opportunity.opportunityNumber}`, `/opportunities/${data.opportunityId}`);
    }
  };

  const formatCurrency = (amount: number | string | null) => {
    const n = typeof amount === "string" ? parseFloat(amount) : amount;
    return n != null && !isNaN(n)
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)
      : "";
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center bg-[#c0c0c0] text-[#606060] text-sm">Loading...</div>;
  }

  if (!data) return null;

  const labelStyle = "text-[11px] text-[#333] font-medium whitespace-nowrap";
  const inputStyle = "border border-[#c0c0c0] px-2 py-1 text-[12px] rounded w-full bg-white";
  const readonlyStyle = "px-2 py-1 text-[12px] bg-[#f0f0f0] border border-[#c0c0c0] rounded w-full text-[#606060]";

  const premiseDisplay = data.opportunity.premises
    ? `${data.opportunity.premises.address || ""}${data.opportunity.premises.city ? `, ${data.opportunity.premises.city}` : ""}${data.opportunity.premises.state ? ` ${data.opportunity.premises.state}` : ""}`
    : "";

  return (
    <div className="h-full flex flex-col bg-[#c0c0c0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Toolbar */}
      <div className="bg-white flex items-center px-3 py-1.5 border-b border-[#d0d0d0] gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className={`flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] ${
            saving || !isDirty ? "bg-[#e0e0e0] text-[#999]" : "bg-[#4a7c59] text-white hover:bg-[#3d6b4a]"
          }`}
        >
          <Save className="w-3.5 h-3.5" /> Save
        </button>
        <button
          onClick={handleDiscard}
          disabled={!isDirty}
          className={`flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] ${
            !isDirty ? "bg-[#e0e0e0] text-[#999]" : "bg-[#f0f0f0] hover:bg-[#e0e0e0]"
          }`}
        >
          <Undo2 className="w-3.5 h-3.5" /> Discard
        </button>
        <button
          onClick={handlePreviewPDF}
          className="flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] bg-[#9b59b6] text-white hover:bg-[#8e44ad]"
        >
          <Eye className="w-3.5 h-3.5" /> Preview PDF
        </button>
        <button
          onClick={handleGoToOpportunity}
          className="flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Opportunity #{data.opportunity.opportunityNumber}
        </button>
        <div className="flex-1" />
        {/* Status selector */}
        <select
          value={form.status}
          onChange={(e) => setField("status", e.target.value)}
          className="border border-[#c0c0c0] px-2 py-1 text-[11px] rounded"
        >
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Accepted">Accepted</option>
          <option value="Rejected">Rejected</option>
        </select>
        <span className="text-[12px] font-semibold text-[#333]">
          Proposal #{data.proposalNumber}
        </span>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-3">
        <div className="bg-white border border-[#c0c0c0] rounded p-4 max-w-4xl mx-auto">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={labelStyle} style={{ width: 80 }}>ATTN</label>
                <input className={inputStyle} value={form.attn} onChange={(e) => setField("attn", e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <label className={labelStyle} style={{ width: 80 }}>Phone</label>
                <input className={inputStyle} value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <label className={labelStyle} style={{ width: 80 }}>Fax</label>
                <input className={inputStyle} value={form.fax} onChange={(e) => setField("fax", e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <label className={labelStyle} style={{ width: 80 }}>Email</label>
                <input className={inputStyle} value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={labelStyle} style={{ width: 80 }}>From</label>
                <input className={inputStyle} value={form.fromName} onChange={(e) => setField("fromName", e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <label className={labelStyle} style={{ width: 80 }}>Premise</label>
                <div className={readonlyStyle}>{premiseDisplay || "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                <label className={labelStyle} style={{ width: 80 }}>Customer</label>
                <div className={readonlyStyle}>{data.opportunity.customer?.name || "—"}</div>
              </div>
              <div className="flex items-center gap-2">
                <label className={labelStyle} style={{ width: 80 }}>Proposal #</label>
                <div className={readonlyStyle}>{data.proposalNumber}</div>
              </div>
            </div>
          </div>

          {/* RE: line + Type */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
            <div className="flex items-center gap-2">
              <label className={labelStyle} style={{ width: 80 }}>RE:</label>
              <input className={inputStyle} value={form.title} onChange={(e) => setField("title", e.target.value)} placeholder="Subject / title of proposal" />
            </div>
            <div className="flex items-center gap-2">
              <label className={labelStyle} style={{ width: 80 }}>Type</label>
              <div className={readonlyStyle}>{form.type || "—"}</div>
            </div>
          </div>

          {/* Work Description */}
          <div className="mb-4">
            <label className={`${labelStyle} block mb-1`}>Work Description</label>
            <textarea
              className={`${inputStyle} h-[200px]`}
              value={form.workDescription}
              onChange={(e) => setField("workDescription", e.target.value)}
              placeholder="Describe the scope of work, materials, and approach..."
            />
          </div>

          {/* Labor + Pricing */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className={`${labelStyle} block mb-1`}>Approx. Labor Hours</label>
              <input className={inputStyle} type="number" step="0.5" value={form.laborHours} onChange={(e) => setField("laborHours", e.target.value)} />
            </div>
            <div>
              <label className={`${labelStyle} block mb-1`}>Approx. Labor Rate ($/hr)</label>
              <input className={inputStyle} type="number" step="0.01" value={form.laborRate} onChange={(e) => setField("laborRate", e.target.value)} />
            </div>
            <div>
              <label className={`${labelStyle} block mb-1`}>Labor Total</label>
              <div className={readonlyStyle}>{formatCurrency(form.laborTotal)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
            <div className="flex items-center gap-2">
              <label className={labelStyle} style={{ width: 120 }}>Total Amount</label>
              <input
                className={inputStyle}
                value={form.amount ? `$${Number(form.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, "");
                  setField("amount", raw);
                }}
                placeholder="$0.00"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={labelStyle} style={{ width: 120 }}>Tax Note</label>
              <input className={inputStyle} value={form.taxNote} onChange={(e) => setField("taxNote", e.target.value)} placeholder="e.g. Tax not included" />
            </div>
            <div className="flex items-center gap-2">
              <label className={labelStyle} style={{ width: 120 }}>Valid (days)</label>
              <input className={inputStyle} type="number" value={form.validDays} onChange={(e) => setField("validDays", e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <label className={labelStyle} style={{ width: 120 }}>Payment Terms</label>
              <input className={inputStyle} value={form.paymentTerms} onChange={(e) => setField("paymentTerms", e.target.value)} placeholder="e.g. Net 30 Days" />
            </div>
          </div>
        </div>
      </div>
      <XPDialogComponent />
    </div>
  );
}
