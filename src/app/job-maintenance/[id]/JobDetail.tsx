"use client";

import { useState, useEffect } from "react";
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

const TABS = ["TFM Custom", "Specifications", "Job Budgets", "Custom/Remarks", "Wage Categories", "Deduction Cat.", "Tech Alert"];

export default function JobDetail({ jobId, onClose }: JobDetailProps) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Specifications");
  const [formData, setFormData] = useState<Partial<Job>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
        setFormData(data);
      }
    } catch (error) {
      console.error("Error fetching job:", error);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const updated = await response.json();
        setJob(updated);
        setHasChanges(false);
      }
    } catch (error) {
      console.error("Error saving job:", error);
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
              <label className={labelClass}>Job #</label>
              <input
                type="text"
                value={formData.externalId || ""}
                onChange={(e) => onChange("externalId", e.target.value)}
                className={`${inputClass} w-[70px] bg-[#ffff00] font-bold`}
              />
              <label className={labelClass}>Template</label>
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
              <label className={labelClass}>Type</label>
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
              <label className={labelClass}>Status (S)</label>
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
              <label className={`${labelClass} text-[#0000ff] font-bold`}>Account</label>
              <input
                type="text"
                value={job.premises?.name || job.premises?.address || ""}
                readOnly
                className={`${inputClass} w-[220px] bg-[#f0f0f0]`}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} text-[#0000ff]`}>Unit</label>
              <select className={`${selectClass} w-[220px]`}>
                <option value="">Select Unit...</option>
                <option value="FLORINA 1">FLORINA 1</option>
                <option value="FLORINA 2">FLORINA 2</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className={labelClass}>Desc</label>
              <input
                type="text"
                value={formData.jobDescription || ""}
                onChange={(e) => onChange("jobDescription", e.target.value)}
                className={`${inputClass} w-[220px]`}
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
                  <label className={labelClass} style={{ width: "100px" }}>Contract Type</label>
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
                  <label className={labelClass} style={{ width: "100px" }}>Contract Date</label>
                  <input
                    type="date"
                    value={formatDate(formData.date as string)}
                    onChange={(e) => onChange("date", e.target.value)}
                    className={`${inputClass} w-[130px]`}
                  />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "100px" }}>Default Level</label>
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
                  <label className={labelClass} style={{ width: "100px" }}>Estimated Date</label>
                  <input
                    type="date"
                    value={formatDate(formData.scheduleDate as string)}
                    onChange={(e) => onChange("scheduleDate", e.target.value)}
                    className={`${inputClass} w-[130px]`}
                  />
                </div>
                <div className="flex items-center">
                  <label className={labelClass} style={{ width: "100px" }}>Due Date</label>
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
                <input type="text" defaultValue="$7,993.00" className={`${inputClass} w-[100px] text-right`} />
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
                <label className="text-[11px]">Chargeable</label>
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
          <div className="text-[11px] text-[#808080]">TFM Custom fields - Coming soon</div>
        )}

        {activeTab === "Job Budgets" && (
          <div className="text-[11px] text-[#808080]">Job Budgets - Coming soon</div>
        )}

        {activeTab === "Custom/Remarks" && (
          <div className="flex flex-col gap-4">
            <fieldset className={fieldsetClass}>
              <legend className={legendClass}>Remarks</legend>
              <textarea
                value={formData.sRemarks || ""}
                onChange={(e) => onChange("sRemarks", e.target.value)}
                className={`${inputClass} w-full h-24`}
                placeholder="Job remarks..."
              />
            </fieldset>
            <fieldset className={fieldsetClass}>
              <legend className={legendClass}>Customer Remarks</legend>
              <textarea
                value={formData.customerRemarks || ""}
                onChange={(e) => onChange("customerRemarks", e.target.value)}
                className={`${inputClass} w-full h-24`}
                placeholder="Customer remarks..."
              />
            </fieldset>
          </div>
        )}

        {activeTab === "Wage Categories" && (
          <div className="text-[11px] text-[#808080]">Wage Categories - Coming soon</div>
        )}

        {activeTab === "Deduction Cat." && (
          <div className="text-[11px] text-[#808080]">Deduction Categories - Coming soon</div>
        )}

        {activeTab === "Tech Alert" && (
          <div className="text-[11px] text-[#808080]">Tech Alert - Coming soon</div>
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="bg-[#f0f0f0] border-t border-[#808080] px-2 py-1">
        <div className="flex items-center justify-between">
          <div className="flex gap-0">
            <div className="border border-[#808080] px-3 py-1 bg-white text-center min-w-[90px]">
              <div className="text-[10px] font-bold text-[#000080]">Revenues</div>
              <div className="text-[11px]">$7,993.00</div>
            </div>
            <div className="border border-[#808080] border-l-0 px-3 py-1 bg-white text-center min-w-[90px]">
              <div className="text-[10px] font-bold text-[#000080]">Materials</div>
              <div className="text-[11px]">$7,993.00</div>
            </div>
            <div className="border border-[#808080] border-l-0 px-3 py-1 bg-white text-center min-w-[90px]">
              <div className="text-[10px] font-bold text-[#000080]">Labor</div>
              <div className="text-[11px]">$0.00</div>
            </div>
            <div className="border border-[#808080] border-l-0 px-3 py-1 bg-white text-center min-w-[100px]">
              <div className="text-[10px] font-bold text-[#000080]">Total Expenses</div>
              <div className="text-[11px]">$7,993.00</div>
            </div>
            <div className="border border-[#808080] border-l-0 px-3 py-1 bg-white text-center min-w-[100px]">
              <div className="text-[10px] font-bold text-[#000080]">Profit Amount</div>
              <div className="text-[11px]">$0.00</div>
            </div>
            <div className="border border-[#808080] border-l-0 px-3 py-1 bg-white text-center min-w-[80px]">
              <div className="text-[10px] font-bold text-[#000080]">Profit Ratio</div>
              <div className="text-[11px]">0.00</div>
            </div>
            <div className="border border-[#808080] border-l-0 px-3 py-1 bg-white text-center min-w-[100px]">
              <div className="text-[10px] font-bold text-[#000080]">Budgeted Hours</div>
              <div className="text-[11px]">0.0</div>
            </div>
          </div>
          <button className="text-[#0000ff] text-[11px] underline hover:text-[#ff0000]">
            Reset Column Width
          </button>
        </div>
      </div>
    </div>
  );
}
