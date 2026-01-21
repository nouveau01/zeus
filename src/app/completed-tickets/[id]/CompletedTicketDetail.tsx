"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Save,
  Check,
  X,
  Scissors,
  Copy,
  ClipboardPaste,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  Printer,
  MapPin,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";

interface Ticket {
  id: string;
  ticketNumber: number;
  workOrderNumber: number | null;
  date: string;
  completedDate: string | null;
  type: string;
  category: string | null;
  level: string | null;
  status: string;
  accountId: string | null;
  mechCrew: string | null;
  supervisor: string | null;
  wage: string | null;
  phase: number | null;
  unitName: string | null;
  nameAddress: string | null;
  scopeOfWork: string | null;
  resolution: string | null;
  partsUsed: string | null;
  workTime: string | null;
  enRouteTime: string | null;
  onSiteTime: string | null;
  completedTime: string | null;
  mileageStarting: number | null;
  mileageEnding: number | null;
  mileageTraveled: number | null;
  hours: number;
  overtimeHours: number;
  oneSevenHours: number;
  doubleTimeHours: number;
  travelHours: number;
  totalHours: number;
  estTime: number;
  difference: number;
  expensePhase: number | null;
  expenseMileage: number;
  expenseZone: number;
  expenseTolls: number;
  expenseMisc: number;
  expenseTotal: number;
  bill: boolean;
  reviewed: boolean;
  pr: boolean;
  vd: boolean;
  inv: boolean;
  workCompleted: boolean;
  chargeable: boolean;
  emailOnSave: boolean;
  updateLocation: boolean;
  internetAccess: boolean;
  reviewStatus: string | null;
  contractType: string | null;
  internalComments: string | null;
  calledInBy: string | null;
  calledInDate: string | null;
  takenBy: string | null;
  resolvedBy: string | null;
  emailStatus: string | null;
  description: string | null;
  premises: {
    id: string;
    premisesId: string | null;
    address: string;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    phone: string | null;
    contact: string | null;
  } | null;
  job: {
    id: string;
    externalId: string | null;
    jobName: string;
  } | null;
  invoice: {
    id: string;
    invoiceNumber: number;
  } | null;
}

interface Props {
  ticketId: string;
  onClose: () => void;
}

const TABS = ["1 Ticket Info", "2 Materials/Custom", "3 Workers/Signatures"];

export default function CompletedTicketDetail({ ticketId, onClose }: Props) {
  const { openTab } = useTabs();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Partial<Ticket>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [printOnSave, setPrintOnSave] = useState(false);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  const fetchTicket = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data);
        setFormData(data);
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Ticket, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const updated = await response.json();
        setTicket(updated);
        setFormData(updated);
        setIsDirty(false);
      }
    } catch (error) {
      console.error("Error saving ticket:", error);
    }
  };

  const openAccount = () => {
    if (ticket?.premises) {
      openTab(
        ticket.premises.premisesId || ticket.premises.address,
        `/accounts/${ticket.premises.id}`
      );
    }
  };

  const openJob = () => {
    if (ticket?.job) {
      openTab(
        ticket.job.externalId || ticket.job.jobName,
        `/jobs/${ticket.job.id}`
      );
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatStatusBar = () => {
    if (!ticket) return "";
    const calledDate = ticket.calledInDate
      ? new Date(ticket.calledInDate).toLocaleDateString("en-US", {
          weekday: "short",
          month: "numeric",
          day: "numeric",
          year: "numeric",
        }) +
        " at " +
        new Date(ticket.calledInDate).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : formatDate(ticket.date) + " at " + (ticket.workTime || formatTime(ticket.date));
    return `Called in by ${ticket.calledInBy || "Who"} on ${calledDate}, Taken By ${ticket.takenBy || "tBy"}, Resolved By ${ticket.resolvedBy || "Unknown"}, ${ticket.emailStatus || "No Email Sent"}`;
  };

  // Build name & address display from premises
  const getNameAddress = () => {
    if (formData.nameAddress) return formData.nameAddress;
    if (!ticket?.premises) return "";
    const p = ticket.premises;
    const lines = [
      ticket.accountId || p.premisesId || "",
      `${p.address}${p.phone ? ` - ${p.phone}` : ""}`,
      p.contact ? `${p.contact}` : "",
      p.address,
      `${p.city || ""}, ${p.state || ""} ${p.zipCode || ""}`.trim(),
    ].filter(Boolean);
    return lines.join("\n");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f0f0f0]">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f0f0f0]">
        <span className="text-red-500">Ticket not found</span>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col bg-[#f0f0f0]"
      style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}
    >
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] text-white px-2 py-1 flex items-center justify-between">
        <span className="font-semibold text-[13px]">
          Editing Completed Ticket #{ticket.ticketNumber}
        </span>
        <button onClick={onClose} className="hover:bg-red-500 px-2 rounded">
          X
        </button>
      </div>

      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer">PIM</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer">Move</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="New">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button onClick={handleSave} className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Save">
          <Save className="w-4 h-4" style={{ color: "#0066cc" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Accept">
          <Check className="w-4 h-4" style={{ color: "#5cb85c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Void">
          <X className="w-4 h-4" style={{ color: "#c45c5c" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Cut">
          <Scissors className="w-4 h-4" style={{ color: "#666" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Copy">
          <Copy className="w-4 h-4" style={{ color: "#6b8cae" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Paste">
          <ClipboardPaste className="w-4 h-4" style={{ color: "#5c8c8c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Undo">
          <RotateCcw className="w-4 h-4" style={{ color: "#d4a574" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="First">
          <ChevronLeft className="w-4 h-4" style={{ color: "#333" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Previous">
          <ChevronLeft className="w-4 h-4" style={{ color: "#0066cc" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Play">
          <Play className="w-4 h-4" style={{ color: "#5cb85c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Next">
          <ChevronRight className="w-4 h-4" style={{ color: "#0066cc" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Last">
          <ChevronRight className="w-4 h-4" style={{ color: "#333" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Stop">
          <Square className="w-4 h-4" style={{ color: "#c45c5c" }} />
        </button>
        <button onClick={onClose} className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Close">
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <div className="flex items-center gap-1 ml-2">
          <input
            type="checkbox"
            checked={printOnSave}
            onChange={(e) => setPrintOnSave(e.target.checked)}
            className="w-3 h-3"
          />
          <span className="text-[11px]">Print on Save</span>
        </div>
        <button className="ml-4 px-3 py-1 border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[11px] rounded flex items-center gap-1">
          <MapPin className="w-3 h-3" style={{ color: "#e74c3c" }} />
          GPS
        </button>
      </div>

      {/* Tab Headers */}
      <div className="bg-[#f5f5f5] flex items-end px-2 pt-1 border-b border-[#a0a0a0]">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
              activeTab === i
                ? "bg-[#ffffcc] border-[#a0a0a0] border-b-[#ffffcc] z-10 font-medium"
                : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-[#ffffcc] p-2">
        {activeTab === 0 && (
          <TicketInfoTab
            formData={formData}
            ticket={ticket}
            onChange={handleChange}
            onOpenAccount={openAccount}
            onOpenJob={openJob}
            getNameAddress={getNameAddress}
          />
        )}
        {activeTab === 1 && <MaterialsCustomTab />}
        {activeTab === 2 && <WorkersSignaturesTab />}
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#a0a0a0] px-2 py-1 flex items-center justify-between text-[11px]">
        <span className="text-[#333]">{formatStatusBar()}</span>
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center gap-4 text-[11px]">
        <button className="px-3 py-0.5 border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
          EDIT
        </button>
        <span className="flex-1 text-center">
          {ticket.accountId || ticket.premises?.premisesId} - {ticket.premises?.address} - {ticket.ticketNumber}
        </span>
      </div>
    </div>
  );
}

// ============================================
// Tab 1: Ticket Info
// ============================================
interface TicketInfoTabProps {
  formData: Partial<Ticket>;
  ticket: Ticket;
  onChange: (field: keyof Ticket, value: any) => void;
  onOpenAccount: () => void;
  onOpenJob: () => void;
  getNameAddress: () => string;
}

function TicketInfoTab({
  formData,
  ticket,
  onChange,
  onOpenAccount,
  onOpenJob,
  getNameAddress,
}: TicketInfoTabProps) {
  const inputClass = "px-1 py-0.5 border border-[#a0a0a0] bg-white text-[11px]";
  const selectClass = "px-1 py-0.5 border border-[#a0a0a0] bg-white text-[11px]";
  const labelClass = "text-[11px] text-[#333]";
  const fieldsetClass = "border border-[#808080] p-2 bg-[#ffffcc]";
  const legendClass = "text-[11px] px-1";

  return (
    <div className="flex gap-4 h-full overflow-auto">
      {/* Left Column */}
      <div className="flex flex-col gap-2 w-[280px] flex-shrink-0">
        {/* Top Fields */}
        <div className="flex items-center gap-2">
          <label className={labelClass}>Ticket #</label>
          <input
            type="text"
            value={formData.ticketNumber || ""}
            className={`${inputClass} w-20 bg-[#c0e0ff]`}
            readOnly
          />
          <label className={labelClass}>W/O#</label>
          <input
            type="text"
            value={formData.workOrderNumber || formData.ticketNumber || ""}
            onChange={(e) => onChange("workOrderNumber", parseInt(e.target.value) || null)}
            className={`${inputClass} w-20`}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className={labelClass}>Category</label>
          <select
            value={formData.category || "None"}
            onChange={(e) => onChange("category", e.target.value)}
            className={`${selectClass} flex-1`}
          >
            <option value="None">None</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Repair">Repair</option>
            <option value="Callback">Callback</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className={labelClass}>Level</label>
          <select
            value={formData.level || ""}
            onChange={(e) => onChange("level", e.target.value)}
            className={`${selectClass} flex-1`}
          >
            <option value="">Select...</option>
            <option value="1-Emergency">1-Emergency</option>
            <option value="2-Urgent">2-Urgent</option>
            <option value="3-Normal">3-Normal</option>
            <option value="4-Violations">4-Violations</option>
            <option value="5-Low">5-Low</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className={`${labelClass} text-blue-600 cursor-pointer hover:underline`} onClick={onOpenJob}>
            Job
          </label>
          <input
            type="text"
            value={ticket.job?.externalId || ""}
            className={`${inputClass} w-20`}
            readOnly
          />
          <label className={labelClass}>Phase</label>
          <input
            type="number"
            value={formData.phase || 1}
            onChange={(e) => onChange("phase", parseInt(e.target.value) || 1)}
            className={`${inputClass} w-12`}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className={`${labelClass} text-blue-600 cursor-pointer hover:underline`}>
            Unit
          </label>
          <select
            value={formData.unitName || ""}
            onChange={(e) => onChange("unitName", e.target.value)}
            className={`${selectClass} flex-1`}
          >
            <option value="">Select...</option>
            <option value={formData.unitName || ""}>{formData.unitName || "No Unit"}</option>
          </select>
        </div>

        {/* Name & Address */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Name & Address</legend>
          <div
            onClick={onOpenAccount}
            className="cursor-pointer hover:bg-[#ffffd8] whitespace-pre-wrap text-[11px] min-h-[60px]"
          >
            {getNameAddress()}
          </div>
        </fieldset>

        {/* Scope of Work */}
        <fieldset className={`${fieldsetClass} flex-1`}>
          <legend className={legendClass}>Scope of Work</legend>
          <textarea
            value={formData.scopeOfWork || ""}
            onChange={(e) => onChange("scopeOfWork", e.target.value)}
            className="w-full h-full min-h-[60px] border border-[#a0a0a0] bg-white text-[11px] p-1 resize-none"
          />
        </fieldset>

        {/* Resolution */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Resolution</legend>
          <textarea
            value={formData.resolution || ""}
            onChange={(e) => onChange("resolution", e.target.value)}
            className="w-full min-h-[60px] border border-[#a0a0a0] bg-white text-[11px] p-1 resize-none"
          />
        </fieldset>

        {/* Parts Used */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Parts Used</legend>
          <textarea
            value={formData.partsUsed || ""}
            onChange={(e) => onChange("partsUsed", e.target.value)}
            className="w-full min-h-[40px] border border-[#a0a0a0] bg-white text-[11px] p-1 resize-none"
          />
        </fieldset>
      </div>

      {/* Middle Column */}
      <div className="flex flex-col gap-2 w-[200px] flex-shrink-0">
        {/* Work Performed */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Work Performed</legend>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-12`}>Date</label>
              <input
                type="date"
                value={formData.date ? new Date(formData.date).toISOString().split("T")[0] : ""}
                onChange={(e) => onChange("date", e.target.value)}
                className={`${inputClass} flex-1`}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-12`}>Time</label>
              <input
                type="text"
                value={formData.workTime || ""}
                onChange={(e) => onChange("workTime", e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="03:42 PM"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-12`}>Mech</label>
              <select
                value={formData.mechCrew || ""}
                onChange={(e) => onChange("mechCrew", e.target.value)}
                className={`${selectClass} flex-1`}
              >
                <option value="">Select...</option>
                <option value={formData.mechCrew || ""}>{formData.mechCrew || "No Mechanic"}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-12`}>Wage</label>
              <select
                value={formData.wage || ""}
                onChange={(e) => onChange("wage", e.target.value)}
                className={`${selectClass} flex-1`}
              >
                <option value="">Select...</option>
                <option value={formData.wage || ""}>{formData.wage || "No Wage"}</option>
              </select>
            </div>
          </div>
        </fieldset>

        {/* Time Frame */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Time Frame</legend>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-16`}>En Route</label>
              <input
                type="text"
                value={formData.enRouteTime || ""}
                onChange={(e) => onChange("enRouteTime", e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="02:45 PM"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-16`}>On Site</label>
              <input
                type="text"
                value={formData.onSiteTime || ""}
                onChange={(e) => onChange("onSiteTime", e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="02:45 PM"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-16`}>Completed</label>
              <input
                type="text"
                value={formData.completedTime || ""}
                onChange={(e) => onChange("completedTime", e.target.value)}
                className={`${inputClass} flex-1`}
                placeholder="03:30 PM"
              />
            </div>
          </div>
        </fieldset>

        {/* Mileage */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Mileage</legend>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-16`}>Starting</label>
              <input
                type="number"
                value={formData.mileageStarting || 0}
                onChange={(e) => onChange("mileageStarting", parseInt(e.target.value) || 0)}
                className={`${inputClass} flex-1 text-right`}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-16`}>Ending</label>
              <input
                type="number"
                value={formData.mileageEnding || 0}
                onChange={(e) => onChange("mileageEnding", parseInt(e.target.value) || 0)}
                className={`${inputClass} flex-1 text-right`}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-16`}>Traveled</label>
              <input
                type="number"
                value={formData.mileageTraveled || 0}
                onChange={(e) => onChange("mileageTraveled", parseInt(e.target.value) || 0)}
                className={`${inputClass} flex-1 text-right`}
              />
            </div>
          </div>
        </fieldset>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex gap-4">
          {/* Time Spent */}
          <fieldset className={`${fieldsetClass} w-[140px]`}>
            <legend className={legendClass}>Time Spent</legend>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className={`${labelClass} w-16`}>Regular</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.hours) || 0}
                  onChange={(e) => onChange("hours", parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-14 text-right`}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${labelClass} w-16`}>Overtime</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.overtimeHours) || 0}
                  onChange={(e) => onChange("overtimeHours", parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-14 text-right`}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${labelClass} w-16`}>1.7 Time</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.oneSevenHours) || 0}
                  onChange={(e) => onChange("oneSevenHours", parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-14 text-right`}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${labelClass} w-16`}>DoubleTime</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.doubleTimeHours) || 0}
                  onChange={(e) => onChange("doubleTimeHours", parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-14 text-right`}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${labelClass} w-16`}>Travel</label>
                <input
                  type="checkbox"
                  checked={Number(formData.travelHours) > 0}
                  className="w-3 h-3"
                  readOnly
                />
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.travelHours) || 0}
                  onChange={(e) => onChange("travelHours", parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-10 text-right`}
                />
              </div>
              <div className="border-t border-[#a0a0a0] my-1" />
              <div className="flex items-center gap-2">
                <label className={`${labelClass} w-16 font-medium`}>Total</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.totalHours) || 0}
                  className={`${inputClass} w-14 text-right bg-[#f0f0f0]`}
                  readOnly
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${labelClass} w-16`}>Est Time</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.estTime) || 0}
                  onChange={(e) => onChange("estTime", parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-14 text-right`}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${labelClass} w-16`}>Difference</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.difference) || 0}
                  className={`${inputClass} w-14 text-right bg-[#f0f0f0]`}
                  readOnly
                />
              </div>
            </div>
          </fieldset>

          {/* Checkboxes */}
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={formData.workCompleted || false}
                onChange={(e) => onChange("workCompleted", e.target.checked)}
                className="w-3 h-3"
              />
              Work Completed
            </label>
            <label className="flex items-center gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={formData.chargeable || false}
                onChange={(e) => onChange("chargeable", e.target.checked)}
                className="w-3 h-3"
              />
              Chargeable
            </label>
            <label className="flex items-center gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={formData.inv || false}
                onChange={(e) => onChange("inv", e.target.checked)}
                className="w-3 h-3"
              />
              Invoice
            </label>
            <label className="flex items-center gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={formData.emailOnSave || false}
                onChange={(e) => onChange("emailOnSave", e.target.checked)}
                className="w-3 h-3"
              />
              Email on Save
            </label>
            <label className="flex items-center gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={formData.updateLocation || false}
                onChange={(e) => onChange("updateLocation", e.target.checked)}
                className="w-3 h-3"
              />
              Update Location
            </label>
            <label className="flex items-center gap-2 text-[11px]">
              <input
                type="checkbox"
                checked={formData.internetAccess || false}
                onChange={(e) => onChange("internetAccess", e.target.checked)}
                className="w-3 h-3"
              />
              Internet Access
            </label>

            <div className="mt-2">
              <label className={`${labelClass} block mb-1`}>Review Status</label>
              <select
                value={formData.reviewStatus || "Dispatch Review"}
                onChange={(e) => onChange("reviewStatus", e.target.value)}
                className={`${selectClass} w-full`}
              >
                <option value="Dispatch Review">Dispatch Review</option>
                <option value="Supervisor Review">Supervisor Review</option>
                <option value="Billing Review">Billing Review</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Expenses</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-12`}>Phase</label>
              <input
                type="number"
                value={formData.expensePhase || 1}
                onChange={(e) => onChange("expensePhase", parseInt(e.target.value) || 1)}
                className={`${inputClass} w-10`}
              />
              <button className="px-1 border border-[#a0a0a0] bg-[#f0f0f0] text-[10px]">...</button>
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-12`}>Mileage</label>
              <input
                type="text"
                value={`$${Number(formData.expenseMileage || 0).toFixed(2)}`}
                className={`${inputClass} w-16 text-right bg-[#f0f0f0]`}
                readOnly
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-12`}>Zone</label>
              <input
                type="text"
                value={`$${Number(formData.expenseZone || 0).toFixed(2)}`}
                className={`${inputClass} w-16 text-right bg-[#f0f0f0]`}
                readOnly
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-12`}>Tolls</label>
              <input
                type="text"
                value={`$${Number(formData.expenseTolls || 0).toFixed(2)}`}
                className={`${inputClass} w-16 text-right bg-[#f0f0f0]`}
                readOnly
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-12`}>Misc Exp</label>
              <input
                type="text"
                value={`$${Number(formData.expenseMisc || 0).toFixed(2)}`}
                className={`${inputClass} w-16 text-right bg-[#f0f0f0]`}
                readOnly
              />
            </div>
            <div className="flex items-center gap-2">
              <label className={`${labelClass} w-12 font-medium`}>Total</label>
              <input
                type="text"
                value={`$${Number(formData.expenseTotal || 0).toFixed(2)}`}
                className={`${inputClass} w-16 text-right bg-[#f0f0f0]`}
                readOnly
              />
            </div>
          </div>
        </fieldset>

        {/* Contract Type */}
        <div className="flex items-center gap-2">
          <label className={labelClass}>Contract Type</label>
          <input
            type="text"
            value={formData.contractType || ticket.premises?.type || ""}
            onChange={(e) => onChange("contractType", e.target.value)}
            className={`${inputClass} w-24`}
          />
        </div>

        {/* Internal Comments Only */}
        <fieldset className={`${fieldsetClass} flex-1`}>
          <legend className={legendClass}>Internal Comments Only</legend>
          <textarea
            value={formData.internalComments || ""}
            onChange={(e) => onChange("internalComments", e.target.value)}
            className="w-full h-full min-h-[60px] border border-[#a0a0a0] bg-white text-[11px] p-1 resize-none"
          />
        </fieldset>
      </div>
    </div>
  );
}

// ============================================
// Tab 2: Materials/Custom (Placeholder)
// ============================================
function MaterialsCustomTab() {
  return (
    <div className="flex items-center justify-center h-full">
      <span className="text-[#808080] text-[14px]">
        Materials/Custom tab - Coming soon
      </span>
    </div>
  );
}

// ============================================
// Tab 3: Workers/Signatures (Placeholder)
// ============================================
function WorkersSignaturesTab() {
  return (
    <div className="flex items-center justify-center h-full">
      <span className="text-[#808080] text-[14px]">
        Workers/Signatures tab - Coming soon
      </span>
    </div>
  );
}
