"use client";

import { useState, useEffect, useCallback } from "react";
import { ActivityHistory } from "@/components/ActivityHistory";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/UnsavedChangesDialog";
import { useXPDialog } from "@/components/ui/XPDialog";
import {
  FileText,
  Save,
  Pencil,
  Printer,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  RotateCcw,
  Scissors,
  Copy,
  ClipboardPaste,
} from "lucide-react";
import { getJobById } from "@/lib/actions/jobs";
import { useTabs } from "@/context/TabContext";
import { validateRequiredFields } from "@/lib/detail-registry/validation";
import { useRequiredFields } from "@/hooks/useRequiredFields";

interface Job {
  id: string;
  externalId: string | null;
  jobName: string;
  jobDescription: string | null;
  status: string;
  type: string | null;
  contractType: string | null;
  template: string | null;
  date: string | null;
  dueDate: string | null;
  scheduleDate: string | null;
  compDate: string | null;
  level: string | null;
  supervisor: string | null;
  projectManager: string | null;
  billingTerms: string | null;
  chargeable: boolean;
  sRemarks: string | null;
  customerRemarks: string | null;
  comments: string | null;
  reg: number | null;
  ot: number | null;
  ot17: number | null;
  dt: number | null;
  tt: number | null;
  totalHours: number | null;
  premises: {
    id: string;
    premisesId: string | null;
    name: string | null;
    address: string;
  } | null;
  customer: {
    id: string;
    name: string;
  } | null;
}

interface JobDetailProps {
  jobId: string;
  onClose: () => void;
}

// Toolbar icons
const toolbarIcons = [
  { icon: FileText, color: "#4a7c59", title: "New" },
  { icon: Save, color: "#4a90d9", title: "Save" },
  { icon: Pencil, color: "#d4a574", title: "Edit" },
  { icon: Printer, color: "#9b59b6", title: "Print" },
  { icon: Check, color: "#5cb85c", title: "Approve" },
  { icon: X, color: "#c45c5c", title: "Cancel" },
  { icon: Scissors, color: "#e67e22", title: "Cut" },
  { icon: Copy, color: "#6b8cae", title: "Copy" },
  { icon: ClipboardPaste, color: "#5c8c8c", title: "Paste" },
  { icon: RotateCcw, color: "#95a5a6", title: "Undo" },
  { icon: ChevronLeft, color: "#333", title: "Previous" },
  { icon: ChevronRight, color: "#333", title: "Next" },
  { icon: Play, color: "#27ae60", title: "Run" },
  { icon: Square, color: "#e74c3c", title: "Stop" },
];

const TABS = ["TFM Custom", "Specifications", "Job Budgets", "Custom/Remarks", "Wage Categories", "Deduction Cat.", "Tech Alert", "Field History"];

export default function JobDetail({ jobId, onClose }: JobDetailProps) {
  const { openTab } = useTabs();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const { layout: jobLayout, fieldDefs: jobFieldDefs, reqMark } = useRequiredFields("jobs-detail");
  const isNew = jobId === "new";
  const [job, setJob] = useState<Job | null>(isNew ? {
    id: "",
    externalId: null,
    jobName: "",
    jobDescription: null,
    status: "Open",
    type: null,
    contractType: null,
    template: null,
    date: new Date().toISOString(),
    dueDate: null,
    scheduleDate: null,
    compDate: null,
    level: null,
    supervisor: null,
    projectManager: null,
    billingTerms: null,
    chargeable: true,
    sRemarks: null,
    customerRemarks: null,
    comments: null,
    reg: null,
    ot: null,
    ot17: null,
    dt: null,
    tt: null,
    totalHours: null,
    premises: null,
    customer: null,
  } : null);
  const [loading, setLoading] = useState(!isNew);
  const [activeTab, setActiveTab] = useState("Specifications");
  const [formData, setFormData] = useState<Partial<Job>>(isNew ? { status: "Open", chargeable: true } : {});
  const [savingFromHook, setSavingFromHook] = useState(false);
  const [accounts, setAccounts] = useState<Array<{ id: string; name: string | null; address: string; customerId: string; customer?: { name: string } }>>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [accountUnits, setAccountUnits] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");

  useEffect(() => {
    if (!isNew) {
      fetchJob();
    } else {
      fetchAccounts();
    }
  }, [jobId, isNew]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch("/api/premises");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
    }
  };

  const fetchUnitsForAccount = async (premisesInternalId: string) => {
    if (!premisesInternalId) {
      setAccountUnits([]);
      setSelectedUnitId("");
      return;
    }
    try {
      const res = await fetch(`/api/search?type=units&premisesId=${encodeURIComponent(premisesInternalId)}&q=`);
      if (res.ok) {
        const units = await res.json();
        setAccountUnits(units.map((u: any) => ({ id: u.id, label: u.label })));
      } else {
        setAccountUnits([]);
      }
    } catch (error) {
      console.error("Error fetching units for account:", error);
      setAccountUnits([]);
    }
    setSelectedUnitId("");
  };

  const fetchJob = async () => {
    setLoading(true);
    try {
      // Use Server Action - pulls from SQL Server and mirrors to PostgreSQL
      const data = await getJobById(jobId);
      if (data) {
        setJob(data);
        setFormData(data);
      }
    } catch (error) {
      console.error("Error fetching job:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save callback for the unsaved changes hook
  const handleSaveForHook = useCallback(async () => {
    const missing = jobLayout ? validateRequiredFields(jobLayout, jobFieldDefs, formData) : [];
    if (missing.length > 0) {
      throw new Error(`Please fill in required fields: ${missing.join(", ")}`);
    }
    if (isNew) {
      if (!selectedAccountId) {
        throw new Error("Please select an account");
      }
      if (!formData.jobName?.trim()) {
        throw new Error("Job name is required");
      }
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, premisesId: selectedAccountId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create job");
      }
      const created = await response.json();
      if (onClose) onClose();
      openTab(`Job #${created.externalId || created.jobName}`, `/job-maintenance/${created.id}`);
    } else {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save job");
      }
      const updated = await response.json();
      setJob(updated);
      setFormData(updated);
    }
  }, [formData, jobId, isNew, selectedAccountId, onClose, openTab, jobLayout, jobFieldDefs]);

  // Unsaved changes hook
  const {
    isDirty: hasChanges,
    setIsDirty: setHasChanges,
    markDirty,
    confirmNavigation,
    showDialog,
    handleDialogSave,
    handleDialogDiscard,
    handleDialogCancel,
  } = useUnsavedChanges({ onSave: handleSaveForHook });

  const onChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const missing = jobLayout ? validateRequiredFields(jobLayout, jobFieldDefs, formData) : [];
      if (missing.length > 0) {
        await xpAlert(`Please fill in required fields: ${missing.join(", ")}`);
        return;
      }
      if (isNew) {
        if (!selectedAccountId) {
          await xpAlert("Please select an account");
          return;
        }
        if (!formData.jobName?.trim()) {
          await xpAlert("Job name is required");
          return;
        }
        const response = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, premisesId: selectedAccountId }),
        });
        if (response.ok) {
          const created = await response.json();
          setHasChanges(false);
          await xpAlert(`Job #${created.externalId} created successfully`);
          if (onClose) onClose();
          openTab(`Job #${created.externalId || created.jobName}`, `/job-maintenance/${created.id}`);
        } else {
          const error = await response.json();
          await xpAlert(error.error || "Failed to create job");
        }
      } else {
        const response = await fetch(`/api/jobs/${jobId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const updated = await response.json();
          setJob(updated);
          setFormData(updated);
          setHasChanges(false);
          await xpAlert("Job saved successfully");
        } else {
          const error = await response.json();
          await xpAlert(error.error || "Failed to save job");
        }
      }
    } catch (error) {
      console.error("Error saving job:", error);
      await xpAlert("Failed to save job");
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#c0c0c0]">
        <span className="text-[#606060]">Loading...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="h-full flex items-center justify-center bg-[#c0c0c0]">
        <span className="text-[#606060]">Job not found</span>
      </div>
    );
  }

  const inputClass = "px-1 py-0.5 border border-[#808080] text-[11px] bg-white";
  const selectClass = "px-1 py-0.5 border border-[#808080] text-[11px] bg-white";
  const labelClass = "text-[11px] text-right pr-2 whitespace-nowrap";
  const fieldsetClass = "border border-[#808080] p-2 bg-white";
  const legendClass = "text-[11px] font-bold px-1 bg-white text-[#000080]";

  return (
    <div
      className="h-full flex flex-col bg-[#c0c0c0]"
      style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}
    >
      {/* Menu Bar */}
      <div className="bg-[#f0f0f0] flex items-center px-2 py-1 border-b border-[#808080]">
        <span className="px-3 py-0.5 hover:bg-[#e0e0e0] cursor-pointer">File</span>
        <span className="px-3 py-0.5 hover:bg-[#e0e0e0] cursor-pointer">Tools</span>
        <span className="px-3 py-0.5 hover:bg-[#e0e0e0] cursor-pointer">PIM</span>
        <span className="px-3 py-0.5 hover:bg-[#e0e0e0] cursor-pointer">Move</span>
        <span className="px-3 py-0.5 hover:bg-[#e0e0e0] cursor-pointer">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f0f0f0] flex items-center px-2 py-1 border-b border-[#808080] gap-0.5">
        {toolbarIcons.map((item, i) => {
          const IconComponent = item.icon;
          return (
            <button
              key={i}
              className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#a0a0a0]"
              title={item.title}
              onClick={item.title === "Save" ? handleSave : undefined}
            >
              <IconComponent className="w-4 h-4" style={{ color: item.color }} />
            </button>
          );
        })}
      </div>

      {/* Header Section */}
      <div className="bg-[#f0f0f0] px-3 py-2 border-b border-[#808080]">
        <div className="flex gap-6">
          {/* Left - Job Info */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className={labelClass}>Job #{reqMark("externalId")}</label>
              <input
                type="text"
                value={formData.externalId || ""}
                onChange={(e) => onChange("externalId", e.target.value)}
                className={`${inputClass} w-[70px] bg-[#ffff00] font-bold`}
              />
              <label className={labelClass}>Template{reqMark("template")}</label>
              <select
                value={formData.template || ""}
                onChange={(e) => onChange("template", e.target.value)}
                className={`${selectClass} w-[140px]`}
              >
                <option value="">Select...</option>
                <option value="NEW REPAIRS">NEW REPAIRS</option>
                <option value="Inspection / Correction">Inspection / Correction</option>
                <option value="Annual 2026 Billable">Annual 2026 Billable</option>
                <option value="Annual 2026 Non-Billable">Annual 2026 Non-Billable</option>
                <option value="Filing Fee">Filing Fee</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className={labelClass} style={{ width: "35px" }}></label>
              <div style={{ width: "70px" }}></div>
              <label className={labelClass}>Type{reqMark("type")}</label>
              <select
                value={formData.type || ""}
                onChange={(e) => onChange("type", e.target.value)}
                className={`${selectClass} w-[140px]`}
              >
                <option value="">Select...</option>
                <option value="NEW REPAIR">NEW REPAIR</option>
                <option value="Other">Other</option>
                <option value="Annual">Annual</option>
                <option value="Violations">Violations</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Modernization">Modernization</option>
                <option value="Repair">Repair</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className={labelClass} style={{ width: "35px" }}></label>
              <div style={{ width: "70px" }}></div>
              <label className={labelClass}>Status (S){reqMark("status")}</label>
              <select
                value={formData.status || "Open"}
                onChange={(e) => onChange("status", e.target.value)}
                className={`${selectClass} w-[140px]`}
              >
                <option value="Open">Open</option>
                <option value="Hold">Hold</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Middle - Account/Unit/Desc */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className={`${labelClass} text-[#0000ff] font-bold`}>Account{isNew && " *"}</label>
              {isNew ? (
                <select
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    fetchUnitsForAccount(e.target.value);
                  }}
                  className={`${selectClass} w-[220px] ${!selectedAccountId ? "border-red-500" : ""}`}
                  required
                >
                  <option value="">Select Account...</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name || acc.address} {acc.customer?.name ? `(${acc.customer.name})` : ""}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={job.premises?.name || job.premises?.address || ""}
                  readOnly
                  className={`${inputClass} w-[220px] bg-[#f0f0f0]`}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} text-[#0000ff]`}>Unit</label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className={`${selectClass} w-[220px]`}
                disabled={!selectedAccountId && isNew}
              >
                <option value="">Select Unit...</option>
                {accountUnits.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className={labelClass}>Name {isNew && "*"}</label>
              <input
                type="text"
                value={formData.jobName || ""}
                onChange={(e) => onChange("jobName", e.target.value)}
                className={`${inputClass} w-[220px] ${isNew && !formData.jobName ? "border-red-500" : ""}`}
                placeholder="Enter job name..."
              />
            </div>
          </div>

          {/* Right - Links */}
          <div className="flex flex-col gap-1 ml-4">
            <button className="text-[#0000ff] text-[11px] underline text-left hover:text-[#ff0000]">
              Job Results
            </button>
            <button className="text-[#0000ff] text-[11px] underline text-left hover:text-[#ff0000]">
              Estimate
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#c0c0c0] flex items-end px-2 pt-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 text-[11px] border-t border-l border-r rounded-t -mb-px ${
              activeTab === tab
                ? "bg-white border-[#808080] border-b-white z-10"
                : "bg-[#d4d0c8] border-[#808080] text-[#000]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 bg-white border border-[#808080] mx-2 mb-2 p-3 overflow-auto">
        {activeTab === "Specifications" && (
          <div className="flex gap-6">
            {/* GENERAL Column */}
            <fieldset className={fieldsetClass} style={{ minWidth: "260px" }}>
              <legend className={legendClass}>GENERAL</legend>
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "100px" }}>Contract Type{reqMark("contractType")}</label>
                  <select
                    value={formData.contractType || ""}
                    onChange={(e) => onChange("contractType", e.target.value)}
                    className={`${selectClass} w-[130px]`}
                  >
                    <option value="">Select...</option>
                    <option value="REPAIR">REPAIR</option>
                    <option value="SERVICE">SERVICE</option>
                    <option value="MODERNIZATION">MODERNIZATION</option>
                    <option value="INSPECTION">INSPECTION</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "100px" }}>Prevailing Wage</label>
                  <select className={`${selectClass} w-[130px]`}>
                    <option value="">Select...</option>
                    <option value="460 - A MECH MAINT">460 - A MECH MAINT</option>
                    <option value="461 - B MECH">461 - B MECH</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "100px" }}>Attached PO #</label>
                  <input type="text" className={`${inputClass} w-[130px]`} />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "100px" }}>Is Job Certified ?</label>
                  <select className={`${selectClass} w-[130px]`}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "100px" }}>Inv Exp GL</label>
                  <select className={`${selectClass} w-[130px]`}>
                    <option value="">Select...</option>
                    <option value="PURCHASES-MATERIALS">PURCHASES-MATERIALS</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "100px" }}>Inv Service</label>
                  <select className={`${selectClass} w-[130px]`}>
                    <option value="">Select...</option>
                    <option value="Billing for material">Billing for material</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "100px" }}>Contract Date{reqMark("date")}</label>
                  <input
                    type="date"
                    value={formatDate(formData.date as string)}
                    onChange={(e) => onChange("date", e.target.value)}
                    className={`${inputClass} w-[130px]`}
                  />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "100px" }}>Default Level{reqMark("level")}</label>
                  <select
                    value={formData.level || ""}
                    onChange={(e) => onChange("level", e.target.value)}
                    className={`${selectClass} w-[130px]`}
                  >
                    <option value="">Select...</option>
                    <option value="6-Repairs">6-Repairs</option>
                    <option value="5-Service">5-Service</option>
                    <option value="4-Violations">4-Violations</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "100px" }}>Estimated Date{reqMark("scheduleDate")}</label>
                  <input
                    type="date"
                    value={formatDate(formData.scheduleDate as string)}
                    onChange={(e) => onChange("scheduleDate", e.target.value)}
                    className={`${inputClass} w-[130px]`}
                  />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "100px" }}>Due Date{reqMark("dueDate")}</label>
                  <input
                    type="date"
                    value={formatDate(formData.dueDate as string)}
                    onChange={(e) => onChange("dueDate", e.target.value)}
                    className={`${inputClass} w-[130px]`}
                  />
                </div>
              </div>
            </fieldset>

            {/* BILLING Column */}
            <fieldset className={fieldsetClass} style={{ minWidth: "180px" }}>
              <legend className={legendClass}>BILLING</legend>
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "80px" }}>Billing Rate</label>
                  <input type="text" defaultValue="$0.00" className={`${inputClass} w-[80px] text-right`} />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "80px" }}>OT Rate</label>
                  <input type="text" defaultValue="$0.00" className={`${inputClass} w-[80px] text-right`} />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "80px" }}>1.7 Rate</label>
                  <input type="text" defaultValue="$0.00" className={`${inputClass} w-[80px] text-right`} />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "80px" }}>DT Rate</label>
                  <input type="text" defaultValue="$0.00" className={`${inputClass} w-[80px] text-right`} />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "80px" }}>Travel Rate</label>
                  <input type="text" defaultValue="$0.00" className={`${inputClass} w-[80px] text-right`} />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "80px" }}>Mileage</label>
                  <input type="text" className={`${inputClass} w-[80px] text-right`} />
                </div>
              </div>
            </fieldset>

            {/* Right Column - Posting/Ceiling/Checkboxes */}
            <div className="flex flex-col gap-2" style={{ minWidth: "200px" }}>
              <div className="flex items-center">
                <label className={labelClass} style={{ width: "100px" }}>Posting Method</label>
                <select className={`${selectClass} w-[100px]`}>
                  <option value="Real Time">Real Time</option>
                  <option value="Batch">Batch</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className={labelClass} style={{ width: "100px" }}>Markup %</label>
                <input type="text" defaultValue="0.00" className={`${inputClass} w-[100px] text-right`} />
              </div>
              <div className="flex items-center">
                <label className={labelClass} style={{ width: "100px" }}>Ceiling Type</label>
                <select className={`${selectClass} w-[100px]`}>
                  <option value="Quoted Price">Quoted Price</option>
                  <option value="Time & Material">Time & Material</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className={labelClass} style={{ width: "100px" }}>Ceiling Amount</label>
                <input type="text" value={formData.amount != null ? `$${Number(formData.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00"} readOnly className={`${inputClass} w-[100px] text-right bg-[#f0f0f0]`} />
              </div>
              <div className="flex items-center">
                <label className={labelClass} style={{ width: "100px" }}>Sales Source</label>
                <select className={`${selectClass} w-[100px]`}>
                  <option value="None">None</option>
                </select>
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={formData.chargeable || false}
                  onChange={(e) => onChange("chargeable", e.target.checked)}
                  className="mr-2"
                />
                <label className="text-[11px]">Chargeable{reqMark("chargeable")}</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <label className="text-[11px]">Charge Interest</label>
              </div>
              <div className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <label className="text-[11px]">On Service (Maintenance) (S)</label>
              </div>
            </div>
          </div>
        )}

        {activeTab === "TFM Custom" && (
          <fieldset className={fieldsetClass} style={{ maxWidth: "400px" }}>
            <legend className={legendClass}>TFM Custom</legend>
            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center">
                <label className={labelClass} style={{ width: "80px" }}>Custom 1</label>
                <input type="text" className={`${inputClass} w-[200px]`} />
              </div>
              <div className="flex items-center">
                <label className={labelClass} style={{ width: "80px" }}>Custom 2</label>
                <input type="text" className={`${inputClass} w-[200px]`} />
              </div>
              <div className="flex items-center">
                <label className={labelClass} style={{ width: "80px" }}>Custom 3</label>
                <input type="text" className={`${inputClass} w-[200px]`} />
              </div>
              <div className="flex items-center">
                <label className={labelClass} style={{ width: "80px" }}>Custom 4</label>
                <input type="checkbox" className="ml-0" />
              </div>
              <div className="flex items-center">
                <label className={labelClass} style={{ width: "80px" }}>Resident</label>
                <input type="checkbox" className="ml-0" />
              </div>
            </div>
          </fieldset>
        )}

        {activeTab === "Job Budgets" && (
          <div className="flex gap-4">
            {/* Revenue Items Table */}
            <div className="flex-1">
              <div className="text-[11px] font-bold text-[#000080] mb-1">Revenue Items ($)</div>
              <div className="border border-[#808080] bg-white">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="bg-[#f0f0f0]">
                    <tr>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium">Description</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium w-[60px]">Code</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium w-[80px]">Budget</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium w-[60px]">Percent</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-2 py-1 border border-[#d0d0d0]">Revenue</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]"></td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right">$7,993.00</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right">0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expense Items Table */}
            <div className="flex-1">
              <div className="text-[11px] font-bold text-[#000080] mb-1">Expense Items</div>
              <div className="border border-[#808080] bg-white overflow-x-auto">
                <table className="w-full text-[11px] border-collapse">
                  <thead className="bg-[#f0f0f0]">
                    <tr>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium">Description</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium w-[50px]">Code</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium w-[70px]">Materials</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium w-[60px]">Mat Mod</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium w-[50px]">Hours</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium w-[60px]">Labor</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium w-[60px]">Lab Mod</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-2 py-1 border border-[#d0d0d0]">Labor</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">0</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right"></td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right">$0.00</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right">0.00</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right">$0.00</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right">$0.00</td>
                    </tr>
                    <tr>
                      <td className="px-2 py-1 border border-[#d0d0d0]">Materials</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">0</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right">$7,993.00</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right">$0.00</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right">0.00</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right">$0.00</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right">$0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Custom/Remarks" && (
          <div className="flex gap-4">
            {/* Custom fieldset */}
            <fieldset className={fieldsetClass} style={{ minWidth: "280px" }}>
              <legend className={legendClass}>Custom</legend>
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "70px" }}>Custom 1</label>
                  <input type="text" className={`${inputClass} w-[180px]`} />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "70px" }}>Custom 2</label>
                  <input type="text" className={`${inputClass} w-[180px]`} />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "70px" }}>Custom 3</label>
                  <input type="text" className={`${inputClass} w-[180px]`} />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "70px" }}>Custom 4</label>
                  <input type="text" className={`${inputClass} w-[180px]`} />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "70px" }}>Custom 5</label>
                  <input type="text" className={`${inputClass} w-[180px]`} />
                </div>
              </div>
            </fieldset>

            {/* Remarks fieldset */}
            <fieldset className={`${fieldsetClass} flex-1`}>
              <legend className={legendClass}>Remarks{reqMark("sRemarks")}</legend>
              <textarea
                value={formData.sRemarks || ""}
                onChange={(e) => onChange("sRemarks", e.target.value)}
                className={`${inputClass} w-full h-[140px]`}
                placeholder=""
              />
            </fieldset>
          </div>
        )}

        {activeTab === "Wage Categories" && (
          <div className="flex flex-col gap-2">
            {/* Header row with dropdown and buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[11px]">Multiple Wage Categories</label>
                <select className={`${selectClass} w-[100px]`}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-[11px] border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
                  Add Wage Category
                </button>
                <button className="px-3 py-1 text-[11px] border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
                  Remove Wage Category
                </button>
              </div>
            </div>

            {/* Wage Categories Table */}
            <div className="border border-[#808080] bg-white flex-1">
              <table className="w-full text-[11px] border-collapse">
                <thead className="bg-[#f0f0f0]">
                  <tr>
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium">Wage Category</th>
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium">GL Expense</th>
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium">Type</th>
                    <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium">Pay Rate</th>
                    <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium">Cost Burden</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-1 border border-[#d0d0d0] h-[200px]" colSpan={5}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Deduction Cat." && (
          <div className="flex flex-col gap-2">
            {/* Header row with dropdown and buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-[11px]">Multiple Deduction Categories</label>
                <select className={`${selectClass} w-[100px]`}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-[11px] border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
                  Add Deduction Category
                </button>
                <button className="px-3 py-1 text-[11px] border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
                  Remove Deduction Category
                </button>
              </div>
            </div>

            {/* Deduction Categories Table */}
            <div className="border border-[#808080] bg-white flex-1 overflow-x-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead className="bg-[#f0f0f0]">
                  <tr>
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium">Deduction</th>
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium">Based On</th>
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium">Accrued On</th>
                    <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium">Employee Rate</th>
                    <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium">Employee Ceiling</th>
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium">GL Account</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-2 py-1 border border-[#d0d0d0] h-[200px]" colSpan={6}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "Tech Alert" && (
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-bold">Tech Alert</label>
            <textarea
              className={`${inputClass} w-[400px] h-[250px]`}
              placeholder=""
            />
          </div>
        )}

        {activeTab === "Field History" && (
          <div className="flex flex-col gap-2">
            {job && <ActivityHistory entityType="Job" entityId={job.id} />}
          </div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="bg-[#f0f0f0] border-t border-[#808080] px-2 py-1">
        <div className="flex items-center justify-between">
          <div className="flex gap-0">
            <div className="border border-[#808080] px-3 py-1 bg-white text-center min-w-[90px]">
              <div className="text-[10px] font-bold text-[#000080]">Revenues</div>
              <div className="text-[11px]">${Number(formData.rev || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="border border-[#808080] border-l-0 px-3 py-1 bg-white text-center min-w-[90px]">
              <div className="text-[10px] font-bold text-[#000080]">Materials</div>
              <div className="text-[11px]">${Number(formData.mat || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="border border-[#808080] border-l-0 px-3 py-1 bg-white text-center min-w-[90px]">
              <div className="text-[10px] font-bold text-[#000080]">Labor</div>
              <div className="text-[11px]">${Number(formData.labor || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="border border-[#808080] border-l-0 px-3 py-1 bg-white text-center min-w-[100px]">
              <div className="text-[10px] font-bold text-[#000080]">Total Expenses</div>
              <div className="text-[11px]">${Number(formData.cost || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="border border-[#808080] border-l-0 px-3 py-1 bg-white text-center min-w-[100px]">
              <div className="text-[10px] font-bold text-[#000080]">Profit Amount</div>
              <div className="text-[11px]">${Number(formData.profit || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="border border-[#808080] border-l-0 px-3 py-1 bg-white text-center min-w-[80px]">
              <div className="text-[10px] font-bold text-[#000080]">Profit Ratio</div>
              <div className="text-[11px]">{Number(formData.ratio || 0).toFixed(2)}</div>
            </div>
            <div className="border border-[#808080] border-l-0 px-3 py-1 bg-white text-center min-w-[100px]">
              <div className="text-[10px] font-bold text-[#000080]">Budgeted Hours</div>
              <div className="text-[11px]">{Number(formData.bHour || 0).toFixed(1)}</div>
            </div>
          </div>
          <button className="text-[#0000ff] text-[11px] underline hover:text-[#ff0000]">
            Reset Column Width
          </button>
        </div>
      </div>


      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showDialog}
        onSave={handleDialogSave}
        onDiscard={handleDialogDiscard}
        onCancel={handleDialogCancel}
        saving={savingFromHook}
      />
      <XPDialogComponent />
    </div>
  );
}
