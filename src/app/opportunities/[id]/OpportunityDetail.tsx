"use client";

import { useState, useEffect } from "react";
import { Save, Undo2, FileText, Pencil, Briefcase } from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { useXPDialog } from "@/components/ui/XPDialog";
import { StatusPath } from "@/components/layout/StatusPath";
import { DynamicSelect } from "@/components/ui/DynamicSelect";
import { AutocompleteInput, AutocompleteResult } from "@/components/AutocompleteInput";
import { usePicklistValues } from "@/hooks/usePicklistValues";
import { useSession } from "next-auth/react";
import { usePermissions } from "@/context/PermissionsContext";
import { useRequiredFields } from "@/hooks/useRequiredFields";
import { validateRequiredFields } from "@/lib/detail-registry/validation";

interface OpportunityData {
  id: string;
  opportunityNumber: number;
  name: string;
  type: string | null;
  stage: string;
  probability: number | null;
  estimatedValue: number | null;
  expectedCloseDate: string | null;
  closedDate: string | null;
  lostReason: string | null;
  owner: string | null;
  description: string | null;
  nextStep: string | null;
  remarks: string | null;
  customerId: string | null;
  premisesId: string | null;
  contactId: string | null;
  customer: { id: string; name: string } | null;
  premises: { id: string; premisesId: string | null; address: string | null; name: string | null; phone: string | null; fax: string | null; email: string | null } | null;
  contact: { id: string; name: string; email: string | null; phone: string | null; fax: string | null; title: string | null } | null;
  proposals: ProposalRow[];
  jobs: JobRow[];
  units: { id: string; unitNumber: string; unitType: string | null; description: string | null }[];
}

interface ProposalRow {
  id: string;
  proposalNumber: number;
  title: string | null;
  status: string;
  amount: number | null;
  createdAt: string;
  sentDate: string | null;
}

interface JobRow {
  id: string;
  externalId: string | null;
  jobName: string;
  status: string;
  type: string | null;
  date: string | null;
}

const STAGES = ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

interface OpportunityDetailProps {
  opportunityId: string;
  onClose: () => void;
}

export default function OpportunityDetail({ opportunityId, onClose }: OpportunityDetailProps) {
  const { openTab } = useTabs();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const [showProposalTypeDialog, setShowProposalTypeDialog] = useState(false);
  const [proposalType, setProposalType] = useState("");
  const { data: session } = useSession();
  const { isUnrestricted } = usePermissions();
  const { options: stageOptions } = usePicklistValues("opportunities", "stage");
  const { layout: oppLayout, fieldDefs: oppFieldDefs, reqMark } = useRequiredFields("opportunities-detail");

  // Current user info for ownership
  const currentUserName = (session?.user as any)?.name || (session?.user as any)?.email || "";
  const currentUserRole = (session?.user as any)?.role || "";
  const isAdminUser = isUnrestricted || currentUserRole === "Admin" || currentUserRole === "GodAdmin";

  const [data, setData] = useState<OpportunityData | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [original, setOriginal] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [availableUnits, setAvailableUnits] = useState<{ id: string; unitNumber: string; unitType: string | null; description: string | null }[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<{ id: string; unitNumber: string; unitType: string | null; description: string | null }[]>([]);
  const isNew = opportunityId.startsWith("new");
  const urlParams = isNew ? new URLSearchParams(opportunityId.replace("new?", "").replace("new", "")) : null;

  // View/Edit mode — new records start in edit mode, existing start in view mode
  const [isEditing, setIsEditing] = useState(isNew);

  // Inline edit — double-click any field in view mode to edit just that field
  const [inlineEditField, setInlineEditField] = useState<string | null>(null);
  const isFieldEditing = (field: string) => isEditing || inlineEditField === field;

  const cancelInlineEdit = () => {
    if (!inlineEditField) return;
    const f = inlineEditField;
    setForm((prev) => {
      const reverted = { ...prev };
      if (f === "customer") { reverted.customerId = original.customerId; reverted.customerName = original.customerName; }
      else if (f === "account") { reverted.premisesId = original.premisesId; reverted.accountName = original.accountName; }
      else if (f === "contact") { reverted.contactId = original.contactId; reverted.contactName = original.contactName; }
      else if (f in original) { (reverted as any)[f] = (original as any)[f]; }
      return reverted;
    });
    setInlineEditField(null);
  };

  // Save a single field via API (for inline edits)
  const saveInlineField = async (payload: Record<string, any>) => {
    if (isNew) { setInlineEditField(null); return; }
    setInlineEditField(null);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        // Only sync the saved field(s) to original, not all form changes
        setOriginal((prev) => ({ ...prev, ...payload }));
        setForm((prev) => ({ ...prev, ...payload }));
      } else {
        setForm((prev) => {
          const reverted = { ...prev };
          for (const key of Object.keys(payload)) (reverted as any)[key] = (original as any)[key];
          return reverted;
        });
      }
    } catch {
      setForm((prev) => {
        const reverted = { ...prev };
        for (const key of Object.keys(payload)) (reverted as any)[key] = (original as any)[key];
        return reverted;
      });
    }
  };

  // Helpers for inline edit blur/keydown on text/number inputs
  const inlineBlur = (field: string, payload: Record<string, any>) => {
    if (inlineEditField === field) saveInlineField(payload);
  };
  const inlineKeyDown = (field: string, payload: Record<string, any>, e: React.KeyboardEvent) => {
    if (inlineEditField !== field) return;
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); saveInlineField(payload); }
    if (e.key === "Escape") cancelInlineEdit();
  };

  // Wrap a view-mode value with double-click-to-edit and pencil indicator
  const viewWrap = (field: string, children: React.ReactNode) => (
    <div
      className={`${viewValueStyle} flex-1 group/f flex items-center min-h-[20px] ${!isNew ? "cursor-pointer" : ""}`}
      onDoubleClick={() => { if (!isNew) setInlineEditField(field); }}
    >
      <span className="flex-1">{children}</span>
      {!isNew && <Pencil className="w-3 h-3 text-[#c0c0c0] opacity-0 group-hover/f:opacity-60 ml-1 flex-shrink-0" />}
    </div>
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
  };

  const formatCurrency = (amount: number | null) =>
    amount != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount)
      : "";

  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}`;
  };

  useEffect(() => {
    if (isNew) {
      const defaults: Record<string, any> = {
        name: "",
        type: "",
        stage: "Prospecting",
        probability: 0,
        estimatedValue: "",
        expectedCloseDate: "",
        owner: currentUserName,
        description: "",
        nextStep: "",
        lostReason: "",
        remarks: "",
        customerId: urlParams?.get("customerId") || null,
        premisesId: urlParams?.get("premisesId") || null,
        contactId: urlParams?.get("contactId") || null,
        customerName: "",
        accountName: "",
        contactName: "",
      };

      // Pre-fill account/customer/contact names if IDs provided via URL params
      const prefill = async () => {
        if (defaults.premisesId) {
          try {
            const res = await fetch(`/api/accounts/${defaults.premisesId}`);
            if (res.ok) {
              const acct = await res.json();
              defaults.accountName = acct.premisesId || acct.name || "";
              if (acct.customer) {
                defaults.customerId = acct.customer.id;
                defaults.customerName = acct.customer.name || "";
              }
            }
          } catch {}
        } else if (defaults.customerId) {
          try {
            const res = await fetch(`/api/customers/${defaults.customerId}`);
            if (res.ok) {
              const cust = await res.json();
              defaults.customerName = cust.name || "";
            }
          } catch {}
        }
        if (defaults.contactId) {
          try {
            const res = await fetch(`/api/contacts/${defaults.contactId}`);
            if (res.ok) {
              const ct = await res.json();
              defaults.contactName = ct.name || "";
            }
          } catch {}
        }
        setForm({ ...defaults });
        setOriginal({ ...defaults });
        setLoading(false);
      };

      if (defaults.premisesId || defaults.customerId || defaults.contactId) {
        prefill();
      } else {
        setForm(defaults);
        setOriginal(defaults);
        setLoading(false);
      }
      return;
    }

    async function load() {
      try {
        const res = await fetch(`/api/opportunities/${opportunityId}`);
        if (!res.ok) throw new Error("Not found");
        const opp = await res.json();
        setData(opp);
        const f: Record<string, any> = {
          name: opp.name || "",
          type: opp.type || "",
          stage: opp.stage || "Prospecting",
          probability: opp.probability ?? 0,
          estimatedValue: opp.estimatedValue != null ? String(opp.estimatedValue) : "",
          expectedCloseDate: formatDate(opp.expectedCloseDate),
          owner: opp.owner || "",
          description: opp.description || "",
          nextStep: opp.nextStep || "",
          lostReason: opp.lostReason || "",
          remarks: opp.remarks || "",
          customerId: opp.customerId,
          premisesId: opp.premisesId,
          contactId: opp.contactId,
          customerName: opp.customer?.name || "",
          accountName: opp.premises?.premisesId || opp.premises?.name || "",
          contactName: opp.contact?.name || "",
        };
        setForm(f);
        setOriginal(f);
      } catch {
        await xpAlert("Opportunity not found.");
        onClose();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [opportunityId]);

  // Fetch available units when account changes
  // Set default probability from stage metadata once picklist options load (for new opps)
  useEffect(() => {
    if (isNew && stageOptions.length > 0 && form.stage && form.probability === 0) {
      const opt = stageOptions.find((o) => o.value === form.stage);
      if (opt?.metadata?.probability !== undefined && opt.metadata.probability !== 0) {
        setForm((f) => ({ ...f, probability: opt.metadata!.probability }));
        setOriginal((f) => ({ ...f, probability: opt.metadata!.probability }));
      }
    }
  }, [stageOptions, isNew]);

  useEffect(() => {
    if (form.premisesId) {
      fetch(`/api/search?type=units&premisesId=${form.premisesId}`)
        .then((res) => res.ok ? res.json() : [])
        .then((results) => {
          const units = results.map((r: any) => ({
            id: r.id,
            unitNumber: r.label || r.data?.unitNumber || "",
            unitType: r.data?.unitType || null,
            description: r.description || r.data?.description || null,
          }));
          setAvailableUnits(units);
        })
        .catch(() => setAvailableUnits([]));
    } else {
      setAvailableUnits([]);
    }
  }, [form.premisesId]);

  // Load selected units from data on initial load
  useEffect(() => {
    if (data?.units) {
      setSelectedUnits(data.units);
    }
  }, [data?.units]);

  // Get default probability for a stage from picklist metadata
  const getStageProbability = (stage: string): number | null => {
    const opt = stageOptions.find((o) => o.value === stage);
    if (opt?.metadata?.probability !== undefined) return opt.metadata.probability;
    return null;
  };

  // Autocomplete selection handlers
  const handleCustomerSelect = (result: AutocompleteResult) => {
    setField("customerId", result.id);
    setField("customerName", result.label || result.data?.name || "");
    // Clear account/contact/units when customer changes
    setField("premisesId", null);
    setField("accountName", "");
    setField("contactId", null);
    setField("contactName", "");
    setSelectedUnits([]);
  };

  const handleAccountSelect = (result: AutocompleteResult) => {
    setField("premisesId", result.id);
    setField("accountName", result.label || result.data?.name || "");
    // Auto-fill customer from account (accounts always belong to one customer)
    if (result.data?.customer) {
      setField("customerId", result.data.customer.id);
      setField("customerName", result.data.customer.name || "");
    }
    // Clear units when account changes (units are scoped to account)
    setSelectedUnits([]);
  };

  const handleContactSelect = (result: AutocompleteResult) => {
    setField("contactId", result.id);
    setField("contactName", result.label || result.data?.name || "");
  };

  const originalUnitIds = (data?.units || []).map((u: any) => u.id).sort().join(",");
  const currentUnitIds = selectedUnits.map((u) => u.id).sort().join(",");
  const isDirty = JSON.stringify(form) !== JSON.stringify(original) || originalUnitIds !== currentUnitIds;

  const handleSave = async () => {
    // Validate admin-configured required fields
    const missing = oppLayout ? validateRequiredFields(oppLayout, oppFieldDefs, form) : [];
    if (missing.length > 0) {
      await xpAlert(`Please fill in required fields: ${missing.join(", ")}`);
      return;
    }
    if (!form.name.trim()) {
      await xpAlert("Opportunity Name is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type || null,
        stage: form.stage,
        probability: form.probability != null ? Number(form.probability) : 0,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : null,
        expectedCloseDate: form.expectedCloseDate || null,
        owner: form.owner || null,
        description: form.description || null,
        nextStep: form.nextStep || null,
        lostReason: form.lostReason || null,
        remarks: form.remarks || null,
        customerId: form.customerId || null,
        premisesId: form.premisesId || null,
        contactId: form.contactId || null,
        unitIds: selectedUnits.map((u) => u.id),
      };

      const url = isNew ? "/api/opportunities" : `/api/opportunities/${opportunityId}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });

      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();

      if (isNew) {
        await xpAlert(`Opportunity #${saved.opportunityNumber} created successfully.`);
        onClose();
        openTab(`Opp: ${saved.opportunityNumber}`, `/opportunities/${saved.id}`);
      } else {
        await xpAlert(`Opportunity #${saved.opportunityNumber || data?.opportunityNumber} saved successfully.`);
        setIsEditing(false);
        // Reload to sync with server
        const reloaded = await fetch(`/api/opportunities/${opportunityId}`);
        if (reloaded.ok) {
          const opp = await reloaded.json();
          setData(opp);
          const f: Record<string, any> = {
            name: opp.name || "",
            type: opp.type || "",
            stage: opp.stage || "Prospecting",
            probability: opp.probability ?? 0,
            estimatedValue: opp.estimatedValue != null ? String(opp.estimatedValue) : "",
            expectedCloseDate: formatDate(opp.expectedCloseDate),
            owner: opp.owner || "",
            description: opp.description || "",
            nextStep: opp.nextStep || "",
            lostReason: opp.lostReason || "",
            remarks: opp.remarks || "",
            customerId: opp.customerId,
            premisesId: opp.premisesId,
            contactId: opp.contactId,
            customerName: opp.customer?.name || "",
            accountName: opp.premises?.premisesId || opp.premises?.name || "",
            contactName: opp.contact?.name || "",
          };
          setForm(f);
          setOriginal(f);
        }
      }
    } catch {
      await xpAlert("Failed to save opportunity.");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setForm({ ...original });
    setSelectedUnits(data?.units || []);
    setInlineEditField(null);
    if (!isNew) setIsEditing(false);
  };

  const handleStageChange = async (newStage: string) => {
    const prob = getStageProbability(newStage);
    if (isNew) {
      setForm((f) => ({ ...f, stage: newStage, ...(prob !== null ? { probability: prob } : {}) }));
      return;
    }
    setUpdatingStage(true);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: newStage, ...(prob !== null ? { probability: prob } : {}) }),
      });
      if (res.ok) {
        setForm((f) => ({ ...f, stage: newStage, ...(prob !== null ? { probability: prob } : {}) }));
        setOriginal((f) => ({ ...f, stage: newStage, ...(prob !== null ? { probability: prob } : {}) }));
        if (data) setData({ ...data, stage: newStage });
      }
    } catch {} finally {
      setUpdatingStage(false);
    }
  };

  const handleCreateProposal = () => {
    if (isNew) {
      xpAlert("Save the opportunity first before creating a proposal.");
      return;
    }
    setProposalType("");
    setShowProposalTypeDialog(true);
  };

  const handleConfirmCreateProposal = async () => {
    if (!proposalType) {
      await xpAlert("Please select a proposal type.");
      return;
    }
    setShowProposalTypeDialog(false);
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: proposalType }),
      });
      if (!res.ok) throw new Error("Failed");
      const proposal = await res.json();
      await xpAlert(`${proposalType} Proposal #${proposal.proposalNumber} created successfully.`);
      openTab(`Proposal: ${proposal.proposalNumber}`, `/proposals/${proposal.id}`);
      // Reload to update proposals tab
      const reloaded = await fetch(`/api/opportunities/${opportunityId}`);
      if (reloaded.ok) {
        const opp = await reloaded.json();
        setData(opp);
      }
    } catch {
      await xpAlert("Failed to create proposal.");
    }
  };

  const handleCreateJob = async () => {
    if (isNew) {
      await xpAlert("Save the opportunity first before creating a job.");
      return;
    }
    const ok = await xpConfirm(`Create a new Job from Opportunity #${data?.opportunityNumber}?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/opportunities/${opportunityId}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      const job = await res.json();
      await xpAlert(`Job #${job.externalId || job.jobName} created successfully.`);
      openTab(`Job #${job.externalId || job.jobName}`, `/job-maintenance/${job.id}`);
      // Reload to update jobs tab
      const reloaded = await fetch(`/api/opportunities/${opportunityId}`);
      if (reloaded.ok) {
        const opp = await reloaded.json();
        setData(opp);
      }
    } catch {
      await xpAlert("Failed to create job.");
    }
  };

  const setField = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  // Hyperlink helper — opens entity in a new tab
  const entityLink = (label: string, route: string, id: string | null) => {
    if (!id || !label) return <span className="text-[12px] text-[#999]">—</span>;
    return (
      <button
        onClick={() => openTab(label, `${route}/${id}`)}
        className="text-[12px] text-[#0176d3] hover:underline hover:text-[#014486] text-left truncate"
        title={`Open ${label}`}
      >
        {label}
      </button>
    );
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center bg-[#c0c0c0] text-[#606060] text-sm">Loading...</div>;
  }

  const labelStyle = "text-[11px] text-[#333] font-medium whitespace-nowrap";
  const inputStyle = "border border-[#c0c0c0] px-2 py-1 text-[12px] rounded w-full bg-white";
  const viewValueStyle = "text-[12px] text-[#333] py-1 truncate";

  return (
    <div className="h-full flex flex-col bg-[#c0c0c0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Header bar */}
      <div className="bg-white flex items-center px-3 py-1.5 border-b border-[#d0d0d0]">
        <span className="text-[12px] font-semibold text-[#333]">
          {isNew ? "New Opportunity" : `Opportunity #${data?.opportunityNumber}`}
        </span>
      </div>

      {/* Status Path */}
      {!isNew && (
        <div className="px-3 py-2 bg-white border-b border-[#d0d0d0]">
          <StatusPath
            statuses={STAGES}
            currentStatus={form.stage}
            onStatusChange={handleStageChange}
            isUpdating={updatingStage}
          />
        </div>
      )}

      {/* Tabs + Action Buttons */}
      <div className="bg-white flex items-end px-3 pt-1 border-b border-[#c0c0c0]">
        {["details", "proposals", "jobs", "activity"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px capitalize ${
              activeTab === tab
                ? "bg-white border-[#c0c0c0] border-b-white z-10 font-medium"
                : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
            }`}
          >
            {tab}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-2 pb-1">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving || (!isNew && !isDirty)}
                className={`flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] ${
                  saving || (!isNew && !isDirty) ? "bg-[#e0e0e0] text-[#999]" : "bg-[#4a7c59] text-white hover:bg-[#3d6b4a]"
                }`}
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={handleDiscard}
                className="flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
              >
                <Undo2 className="w-3.5 h-3.5" /> {isNew ? "Discard" : "Cancel"}
              </button>
            </>
          ) : (
            <button
              onClick={() => { setInlineEditField(null); setIsEditing(true); }}
              className="flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
          )}
          {!isNew && (
            <button
              onClick={handleCreateProposal}
              className="flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] bg-[#0176d3] text-white hover:bg-[#014486]"
            >
              <FileText className="w-3.5 h-3.5" /> Create Proposal
            </button>
          )}
          {!isNew && form.stage === "Closed Won" && (
            <button
              onClick={handleCreateJob}
              className="flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] bg-[#4a7c59] text-white hover:bg-[#3d6b4a]"
            >
              <Briefcase className="w-3.5 h-3.5" /> Create Job
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === "details" && (
          <div className="bg-white border border-[#c0c0c0] rounded max-w-4xl">
            {/* Section header */}
            <div className="px-4 py-2 bg-[#f5f5f5] border-b border-[#d8d8d8]">
              <span className="text-[12px] font-semibold text-[#333]">Opportunity Information</span>
            </div>
            <div className="grid grid-cols-2">
              {/* Row 1: Opp Name / Type */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8e8e8]">
                <label className={labelStyle} style={{ width: 110 }}>Opp Name{reqMark("name")}</label>
                {isFieldEditing("name") ? (
                  <input className={inputStyle} value={form.name} onChange={(e) => setField("name", e.target.value)}
                    autoFocus={inlineEditField === "name"}
                    onBlur={() => inlineBlur("name", { name: form.name })}
                    onKeyDown={(e) => inlineKeyDown("name", { name: form.name }, e)} />
                ) : (
                  viewWrap("name", form.name || "—")
                )}
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8e8e8] border-l border-l-[#e8e8e8]">
                <label className={labelStyle} style={{ width: 100 }}>Type{reqMark("type")}</label>
                {isFieldEditing("type") ? (
                  <DynamicSelect
                    pageId="opportunities"
                    fieldName="type"
                    value={form.type}
                    onChange={(val) => {
                      setField("type", val);
                      if (inlineEditField === "type") saveInlineField({ type: val || null });
                    }}
                    applyDefault={isNew}
                    fallbackOptions={["New Client", "Service Request", "Modernization", "New Installation", "Repair", "Other"]}
                    className={inputStyle}
                  />
                ) : (
                  viewWrap("type", form.type || "—")
                )}
              </div>
              {/* Row 2: Customer / Stage */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8e8e8]">
                <label className={labelStyle} style={{ width: 110 }}>Customer{reqMark("customerId")}</label>
                {isFieldEditing("customer") ? (
                  <AutocompleteInput
                    value={form.customerName}
                    onChange={(val) => setField("customerName", val)}
                    onSelect={(result) => {
                      handleCustomerSelect(result);
                      if (inlineEditField === "customer") saveInlineField({ customerId: result.id });
                    }}
                    searchType="customers"
                    placeholder="Search customers..."
                    className="flex-1 px-2 py-1 border border-[#c0c0c0] text-[12px] rounded bg-white"
                  />
                ) : (
                  <div className={`flex-1 group/f flex items-center min-h-[20px] ${!isNew ? "cursor-pointer" : ""}`}
                    onDoubleClick={() => { if (!isNew) setInlineEditField("customer"); }}>
                    <span className="flex-1">{entityLink(form.customerName, "/customers", form.customerId)}</span>
                    {!isNew && <Pencil className="w-3 h-3 text-[#c0c0c0] opacity-0 group-hover/f:opacity-60 ml-1 flex-shrink-0" />}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8e8e8] border-l border-l-[#e8e8e8]">
                <label className={labelStyle} style={{ width: 100 }}>Stage{reqMark("stage")}</label>
                {isFieldEditing("stage") ? (
                  <DynamicSelect
                    pageId="opportunities"
                    fieldName="stage"
                    value={form.stage}
                    onChange={(val) => {
                      setField("stage", val);
                      const prob = getStageProbability(val);
                      if (prob !== null) setField("probability", prob);
                      if (inlineEditField === "stage") {
                        const payload: Record<string, any> = { stage: val };
                        if (prob !== null) payload.probability = prob;
                        saveInlineField(payload);
                      }
                    }}
                    fallbackOptions={STAGES}
                    className={inputStyle}
                  />
                ) : (
                  viewWrap("stage", form.stage || "—")
                )}
              </div>
              {/* Row 3: Account / Probability */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8e8e8]">
                <label className={labelStyle} style={{ width: 110 }}>Account{reqMark("premisesId")}</label>
                {isFieldEditing("account") ? (
                  <AutocompleteInput
                    value={form.accountName}
                    onChange={(val) => setField("accountName", val)}
                    onSelect={(result) => {
                      handleAccountSelect(result);
                      if (inlineEditField === "account") saveInlineField({ premisesId: result.id });
                    }}
                    searchType="accounts"
                    filterParams={form.customerId ? { customerId: form.customerId } : undefined}
                    placeholder="Search accounts..."
                    className="flex-1 px-2 py-1 border border-[#c0c0c0] text-[12px] rounded bg-white"
                  />
                ) : (
                  <div className={`flex-1 group/f flex items-center min-h-[20px] ${!isNew ? "cursor-pointer" : ""}`}
                    onDoubleClick={() => { if (!isNew) setInlineEditField("account"); }}>
                    <span className="flex-1">{entityLink(form.accountName, "/accounts", form.premisesId)}</span>
                    {!isNew && <Pencil className="w-3 h-3 text-[#c0c0c0] opacity-0 group-hover/f:opacity-60 ml-1 flex-shrink-0" />}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8e8e8] border-l border-l-[#e8e8e8]">
                <label className={labelStyle} style={{ width: 100 }}>Probability{reqMark("probability")}</label>
                {isFieldEditing("probability") ? (
                  <div className="flex items-center gap-1 w-full">
                    <input className={inputStyle} type="number" min="0" max="100" value={form.probability}
                      onChange={(e) => setField("probability", e.target.value)}
                      autoFocus={inlineEditField === "probability"}
                      onBlur={() => inlineBlur("probability", { probability: Number(form.probability) })}
                      onKeyDown={(e) => inlineKeyDown("probability", { probability: Number(form.probability) }, e)} />
                    <span className="text-[11px]">%</span>
                  </div>
                ) : (
                  viewWrap("probability", `${form.probability ?? 0}%`)
                )}
              </div>
              {/* Row 4: Contact / Owner */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8e8e8]">
                <label className={labelStyle} style={{ width: 110 }}>Contact{reqMark("contactId")}</label>
                {isFieldEditing("contact") ? (
                  <AutocompleteInput
                    value={form.contactName}
                    onChange={(val) => setField("contactName", val)}
                    onSelect={(result) => {
                      handleContactSelect(result);
                      if (inlineEditField === "contact") saveInlineField({ contactId: result.id });
                    }}
                    searchType="contacts"
                    filterParams={form.customerId ? { customerId: form.customerId } : undefined}
                    placeholder="Search contacts..."
                    className="flex-1 px-2 py-1 border border-[#c0c0c0] text-[12px] rounded bg-white"
                  />
                ) : (
                  <div className={`flex-1 group/f flex items-center min-h-[20px] ${!isNew ? "cursor-pointer" : ""}`}
                    onDoubleClick={() => { if (!isNew) setInlineEditField("contact"); }}>
                    <span className="flex-1">{entityLink(form.contactName, "/contacts", form.contactId)}</span>
                    {!isNew && <Pencil className="w-3 h-3 text-[#c0c0c0] opacity-0 group-hover/f:opacity-60 ml-1 flex-shrink-0" />}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8e8e8] border-l border-l-[#e8e8e8]">
                <label className={labelStyle} style={{ width: 100 }}>Owner{reqMark("owner")}</label>
                {isFieldEditing("owner") ? (
                  <input
                    className={`${inputStyle} ${!isNew && !isAdminUser && form.owner !== currentUserName ? "bg-[#f0f0f0] text-[#666]" : ""}`}
                    value={form.owner}
                    onChange={(e) => setField("owner", e.target.value)}
                    readOnly={!isNew && !isAdminUser && form.owner !== currentUserName}
                    autoFocus={inlineEditField === "owner"}
                    onBlur={() => inlineBlur("owner", { owner: form.owner || null })}
                    onKeyDown={(e) => inlineKeyDown("owner", { owner: form.owner || null }, e)}
                  />
                ) : (
                  viewWrap("owner", form.owner || "—")
                )}
              </div>
              {/* Row 5: Unit(s) / Lost Reason (conditional) */}
              <div className="flex items-start gap-2 px-4 py-2.5 border-b border-[#e8e8e8]">
                <label className={labelStyle} style={{ width: 110, paddingTop: 4 }}>Unit(s)</label>
                {isEditing ? (
                  <div className="flex-1">
                    {!form.premisesId ? (
                      <div className="text-[11px] text-[#999] italic py-1">Select an account first</div>
                    ) : availableUnits.length === 0 ? (
                      <div className="text-[11px] text-[#999] italic py-1">No units found for this account</div>
                    ) : (
                      <div className="border border-[#c0c0c0] rounded bg-white max-h-[120px] overflow-y-auto">
                        {availableUnits.map((unit) => {
                          const isChecked = selectedUnits.some((su) => su.id === unit.id);
                          return (
                            <label
                              key={unit.id}
                              className={`flex items-center gap-2 px-2 py-1 cursor-pointer text-[11px] border-b border-[#f0f0f0] last:border-b-0 hover:bg-[#e8f4fc] ${
                                isChecked ? "bg-[#f0f8ff]" : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedUnits((prev) => prev.filter((su) => su.id !== unit.id));
                                  } else {
                                    setSelectedUnits((prev) => [...prev, unit]);
                                  }
                                }}
                                className="w-3 h-3"
                              />
                              <span className="font-medium">{unit.unitNumber}</span>
                              {unit.unitType && <span className="text-[#808080]">({unit.unitType})</span>}
                              {unit.description && <span className="text-[#808080] truncate">- {unit.description}</span>}
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {selectedUnits.length > 0 && (
                      <div className="text-[10px] text-[#666] mt-0.5">{selectedUnits.length} unit{selectedUnits.length > 1 ? "s" : ""} selected</div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1">
                    {selectedUnits.length === 0 ? (
                      <span className="text-[12px] text-[#999]">—</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {selectedUnits.map((unit) => (
                          <button
                            key={unit.id}
                            onClick={() => openTab(`Unit: ${unit.unitNumber}`, `/units/${unit.id}`)}
                            className="text-[12px] text-[#0176d3] hover:underline hover:text-[#014486] text-left"
                            title={`Open Unit ${unit.unitNumber}`}
                          >
                            {unit.unitNumber}
                            {unit.unitType ? ` (${unit.unitType})` : ""}
                            {unit.description ? ` - ${unit.description}` : ""}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {form.stage === "Closed Lost" ? (
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8e8e8] border-l border-l-[#e8e8e8]">
                  <label className={labelStyle} style={{ width: 100 }}>Lost Reason{reqMark("lostReason")}</label>
                  {isFieldEditing("lostReason") ? (
                    <input className={inputStyle} value={form.lostReason} onChange={(e) => setField("lostReason", e.target.value)}
                      autoFocus={inlineEditField === "lostReason"}
                      onBlur={() => inlineBlur("lostReason", { lostReason: form.lostReason || null })}
                      onKeyDown={(e) => inlineKeyDown("lostReason", { lostReason: form.lostReason || null }, e)} />
                  ) : (
                    viewWrap("lostReason", form.lostReason || "—")
                  )}
                </div>
              ) : (
                <div className="border-b border-[#e8e8e8] border-l border-l-[#e8e8e8]" />
              )}
              {/* Row 6: Est. Value / (empty) */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8e8e8]">
                <label className={labelStyle} style={{ width: 110 }}>Est. Value{reqMark("estimatedValue")}</label>
                {isFieldEditing("estimatedValue") ? (
                  <input
                    className={inputStyle}
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.estimatedValue}
                    onChange={(e) => setField("estimatedValue", e.target.value)}
                    placeholder="0.00"
                    autoFocus={inlineEditField === "estimatedValue"}
                    onBlur={() => inlineBlur("estimatedValue", { estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : null })}
                    onKeyDown={(e) => inlineKeyDown("estimatedValue", { estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : null }, e)}
                  />
                ) : (
                  viewWrap("estimatedValue", form.estimatedValue ? formatCurrency(Number(form.estimatedValue)) : "—")
                )}
              </div>
              <div className="border-b border-[#e8e8e8] border-l border-l-[#e8e8e8]" />
              {/* Row 7: Close Date / (empty) */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#e8e8e8]">
                <label className={labelStyle} style={{ width: 110 }}>Close Date{reqMark("expectedCloseDate")}</label>
                {isFieldEditing("expectedCloseDate") ? (
                  <input className={inputStyle} type="date" value={form.expectedCloseDate}
                    onChange={(e) => {
                      setField("expectedCloseDate", e.target.value);
                      if (inlineEditField === "expectedCloseDate") saveInlineField({ expectedCloseDate: e.target.value || null });
                    }}
                    autoFocus={inlineEditField === "expectedCloseDate"} />
                ) : (
                  viewWrap("expectedCloseDate", form.expectedCloseDate ? formatDisplayDate(form.expectedCloseDate) : "—")
                )}
              </div>
              <div className="border-b border-[#e8e8e8] border-l border-l-[#e8e8e8]" />
            </div>
            {/* Additional Details section */}
            <div className="px-4 py-2 bg-[#f5f5f5] border-b border-[#d8d8d8] border-t border-t-[#d8d8d8]">
              <span className="text-[12px] font-semibold text-[#333]">Additional Details</span>
            </div>
            <div>
              <div className="px-4 py-2.5 border-b border-[#e8e8e8]">
                <label className={`${labelStyle} block mb-1`}>Description{reqMark("description")}</label>
                {isFieldEditing("description") ? (
                  <textarea className={`${inputStyle} h-[60px]`} value={form.description} onChange={(e) => setField("description", e.target.value)}
                    autoFocus={inlineEditField === "description"}
                    onBlur={() => inlineBlur("description", { description: form.description || null })}
                    onKeyDown={(e) => { if (e.key === "Escape") cancelInlineEdit(); }} />
                ) : (
                  <div className={`text-[12px] text-[#333] whitespace-pre-wrap min-h-[20px] group/f ${!isNew ? "cursor-pointer" : ""}`}
                    onDoubleClick={() => { if (!isNew) setInlineEditField("description"); }}>
                    {form.description || "—"}
                    {!isNew && <Pencil className="w-3 h-3 text-[#c0c0c0] opacity-0 group-hover/f:opacity-60 inline-block ml-1" />}
                  </div>
                )}
              </div>
              <div className="px-4 py-2.5 border-b border-[#e8e8e8]">
                <label className={`${labelStyle} block mb-1`}>Next Step{reqMark("nextStep")}</label>
                {isFieldEditing("nextStep") ? (
                  <textarea className={`${inputStyle} h-[40px]`} value={form.nextStep} onChange={(e) => setField("nextStep", e.target.value)}
                    autoFocus={inlineEditField === "nextStep"}
                    onBlur={() => inlineBlur("nextStep", { nextStep: form.nextStep || null })}
                    onKeyDown={(e) => { if (e.key === "Escape") cancelInlineEdit(); }} />
                ) : (
                  <div className={`text-[12px] text-[#333] whitespace-pre-wrap min-h-[20px] group/f ${!isNew ? "cursor-pointer" : ""}`}
                    onDoubleClick={() => { if (!isNew) setInlineEditField("nextStep"); }}>
                    {form.nextStep || "—"}
                    {!isNew && <Pencil className="w-3 h-3 text-[#c0c0c0] opacity-0 group-hover/f:opacity-60 inline-block ml-1" />}
                  </div>
                )}
              </div>
              <div className="px-4 py-2.5">
                <label className={`${labelStyle} block mb-1`}>Remarks{reqMark("remarks")}</label>
                {isFieldEditing("remarks") ? (
                  <textarea className={`${inputStyle} h-[40px]`} value={form.remarks} onChange={(e) => setField("remarks", e.target.value)}
                    autoFocus={inlineEditField === "remarks"}
                    onBlur={() => inlineBlur("remarks", { remarks: form.remarks || null })}
                    onKeyDown={(e) => { if (e.key === "Escape") cancelInlineEdit(); }} />
                ) : (
                  <div className={`text-[12px] text-[#333] whitespace-pre-wrap min-h-[20px] group/f ${!isNew ? "cursor-pointer" : ""}`}
                    onDoubleClick={() => { if (!isNew) setInlineEditField("remarks"); }}>
                    {form.remarks || "—"}
                    {!isNew && <Pencil className="w-3 h-3 text-[#c0c0c0] opacity-0 group-hover/f:opacity-60 inline-block ml-1" />}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "proposals" && (
          <div className="bg-white border border-[#c0c0c0] rounded">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#c0c0c0]">
              <span className="text-[12px] font-semibold">Proposals</span>
              <button
                onClick={handleCreateProposal}
                className="flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] bg-[#0176d3] text-white hover:bg-[#014486]"
              >
                <FileText className="w-3.5 h-3.5" /> Create Proposal
              </button>
            </div>
            {/* Proposals grid */}
            <div className="flex bg-[#f0f0f0] border-b border-[#999] text-[11px] font-medium">
              <div className="px-2 py-1 border-r border-[#c0c0c0]" style={{ width: 100 }}>Proposal #</div>
              <div className="px-2 py-1 border-r border-[#c0c0c0] flex-1">Title</div>
              <div className="px-2 py-1 border-r border-[#c0c0c0]" style={{ width: 90 }}>Status</div>
              <div className="px-2 py-1 border-r border-[#c0c0c0] text-right" style={{ width: 110 }}>Amount</div>
              <div className="px-2 py-1 border-r border-[#c0c0c0]" style={{ width: 100 }}>Created</div>
              <div className="px-2 py-1" style={{ width: 100 }}>Sent</div>
            </div>
            {(!data?.proposals || data.proposals.length === 0) ? (
              <div className="p-4 text-center text-[#808080] text-[11px]">No proposals yet. Click "Create Proposal" to generate one.</div>
            ) : (
              data.proposals.map((p) => (
                <div
                  key={p.id}
                  className="flex text-[11px] border-b border-[#e0e0e0] hover:bg-[#f0f8ff] cursor-pointer"
                  onDoubleClick={() => openTab(`Proposal: ${p.proposalNumber}`, `/proposals/${p.id}`)}
                >
                  <div className="px-2 py-1 border-r border-[#e0e0e0] font-medium" style={{ width: 100 }}>{p.proposalNumber}</div>
                  <div className="px-2 py-1 border-r border-[#e0e0e0] flex-1 truncate">{p.title || ""}</div>
                  <div className="px-2 py-1 border-r border-[#e0e0e0] text-center" style={{ width: 90 }}>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      p.status === "Draft" ? "bg-[#f0f0f0] text-[#606060]" :
                      p.status === "Sent" ? "bg-[#fff3cd] text-[#856404]" :
                      p.status === "Accepted" ? "bg-[#d4edda] text-[#155724]" :
                      p.status === "Rejected" ? "bg-[#f8d7da] text-[#721c24]" :
                      "bg-[#f0f0f0] text-[#606060]"
                    }`}>{p.status}</span>
                  </div>
                  <div className="px-2 py-1 border-r border-[#e0e0e0] text-right" style={{ width: 110 }}>{formatCurrency(p.amount)}</div>
                  <div className="px-2 py-1 border-r border-[#e0e0e0]" style={{ width: 100 }}>{formatDisplayDate(p.createdAt)}</div>
                  <div className="px-2 py-1" style={{ width: 100 }}>{formatDisplayDate(p.sentDate)}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="bg-white border border-[#c0c0c0] rounded">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#c0c0c0]">
              <span className="text-[12px] font-semibold">Jobs</span>
              {form.stage === "Closed Won" && (
                <button
                  onClick={handleCreateJob}
                  className="flex items-center gap-1 px-3 py-1 border border-[#c0c0c0] rounded text-[11px] bg-[#4a7c59] text-white hover:bg-[#3d6b4a]"
                >
                  <Briefcase className="w-3.5 h-3.5" /> Create Job
                </button>
              )}
            </div>
            {/* Jobs grid */}
            <div className="flex bg-[#f0f0f0] border-b border-[#999] text-[11px] font-medium">
              <div className="px-2 py-1 border-r border-[#c0c0c0]" style={{ width: 80 }}>Job #</div>
              <div className="px-2 py-1 border-r border-[#c0c0c0] flex-1">Name</div>
              <div className="px-2 py-1 border-r border-[#c0c0c0]" style={{ width: 90 }}>Status</div>
              <div className="px-2 py-1 border-r border-[#c0c0c0]" style={{ width: 110 }}>Type</div>
              <div className="px-2 py-1" style={{ width: 100 }}>Date</div>
            </div>
            {(!data?.jobs || data.jobs.length === 0) ? (
              <div className="p-4 text-center text-[#808080] text-[11px]">
                No jobs yet.{form.stage === "Closed Won" ? ' Click "Create Job" to generate one from this opportunity.' : " Jobs can be created when the opportunity reaches Closed Won."}
              </div>
            ) : (
              data.jobs.map((j) => (
                <div
                  key={j.id}
                  className="flex text-[11px] border-b border-[#e0e0e0] hover:bg-[#f0f8ff] cursor-pointer"
                  onDoubleClick={() => openTab(`Job #${j.externalId || j.jobName}`, `/job-maintenance/${j.id}`)}
                >
                  <div className="px-2 py-1 border-r border-[#e0e0e0] font-medium" style={{ width: 80 }}>{j.externalId || ""}</div>
                  <div className="px-2 py-1 border-r border-[#e0e0e0] flex-1 truncate">{j.jobName || ""}</div>
                  <div className="px-2 py-1 border-r border-[#e0e0e0] text-center" style={{ width: 90 }}>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      j.status === "Open" ? "bg-[#d4edda] text-[#155724]" :
                      j.status === "Hold" ? "bg-[#fff3cd] text-[#856404]" :
                      j.status === "Completed" ? "bg-[#cce5ff] text-[#004085]" :
                      j.status === "Closed" ? "bg-[#f0f0f0] text-[#606060]" :
                      "bg-[#f0f0f0] text-[#606060]"
                    }`}>{j.status}</span>
                  </div>
                  <div className="px-2 py-1 border-r border-[#e0e0e0] truncate" style={{ width: 110 }}>{j.type || ""}</div>
                  <div className="px-2 py-1" style={{ width: 100 }}>{formatDisplayDate(j.date)}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="bg-white border border-[#c0c0c0] rounded p-4 text-center text-[#808080] text-[12px]">
            Activity log coming soon.
          </div>
        )}
      </div>
      {/* Proposal Type Selection Dialog */}
      {showProposalTypeDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif" }}>
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowProposalTypeDialog(false)} />
          <div className="relative bg-[#ece9d8] border border-[#0054e3] shadow-lg w-[380px] flex flex-col">
            <div className="flex items-center justify-between px-2 py-1 bg-gradient-to-r from-[#0054e3] to-[#2990ea] text-white text-[12px] font-semibold">
              <span>Create Proposal</span>
              <button onClick={() => setShowProposalTypeDialog(false)} className="w-[18px] h-[18px] flex items-center justify-center bg-[#c45c5c] hover:bg-[#d46e6e] text-white text-[12px] leading-none border border-[#fff]/30 rounded-sm">&times;</button>
            </div>
            <div className="p-4">
              <label className="block text-[12px] font-medium text-[#333] mb-2">Select Proposal Type:</label>
              <DynamicSelect
                pageId="proposals"
                fieldName="type"
                value={proposalType}
                onChange={setProposalType}
                includeEmpty={true}
                fallbackOptions={[
                  "Maintenance Agreement",
                  "Water Damage",
                  "Modernization",
                  "New Installation",
                  "Repair",
                  "Annual Inspection",
                  "Safety Test",
                  "Violation Correction",
                  "Consultation",
                  "Other",
                ]}
                className="w-full px-2 py-1 border border-[#808080] text-[12px] bg-white"
              />
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-[#aca899]">
              <button onClick={() => setShowProposalTypeDialog(false)} className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[11px]">Cancel</button>
              <button onClick={handleConfirmCreateProposal} disabled={!proposalType} className="px-4 py-1 bg-[#0176d3] text-white border border-[#015bb5] hover:bg-[#014486] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed">Create</button>
            </div>
          </div>
        </div>
      )}
      <XPDialogComponent />
    </div>
  );
}
