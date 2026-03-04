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
  Printer,
  MapPin,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { getTicketById } from "@/lib/actions/tickets";
import { useXPDialog } from "@/components/ui/XPDialog";

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
    type: string | null;
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
  const { openTab, tabs, activeTabId, updateTab } = useTabs();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<Partial<Ticket>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [printOnSave, setPrintOnSave] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [accountJobs, setAccountJobs] = useState<{ id: string; label: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; label: string; description: string }[]>([]);
  const [siblingIds, setSiblingIds] = useState<{ id: string; ticketNumber: number }[]>([]);

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

  // Fetch sibling ticket IDs for navigation
  useEffect(() => {
    const fetchSiblings = async () => {
      try {
        const res = await fetch("/api/tickets?status=Completed");
        if (res.ok) {
          const data = await res.json();
          setSiblingIds(data.map((t: any) => ({ id: t.id, ticketNumber: t.ticketNumber })));
        }
      } catch (e) {
        console.error("Error fetching sibling tickets:", e);
      }
    };
    fetchSiblings();
  }, []);

  const navigateTo = (targetId: string, targetNumber: number) => {
    if (!activeTabId) return;
    updateTab(activeTabId, `Ticket #${targetNumber}`, `/completed-tickets/${targetId}`);
  };

  const currentIndex = siblingIds.findIndex((s) => s.id === ticketId);

  const handleFirst = () => {
    if (siblingIds.length > 0) {
      const first = siblingIds[siblingIds.length - 1]; // oldest = last (sorted newest first)
      navigateTo(first.id, first.ticketNumber);
    }
  };
  const handlePrev = () => {
    if (currentIndex >= 0 && currentIndex < siblingIds.length - 1) {
      const prev = siblingIds[currentIndex + 1]; // prev = older = higher index (sorted newest first)
      navigateTo(prev.id, prev.ticketNumber);
    }
  };
  const handleNext = () => {
    if (currentIndex > 0) {
      const next = siblingIds[currentIndex - 1]; // next = newer = lower index (sorted newest first)
      navigateTo(next.id, next.ticketNumber);
    }
  };
  const handleLast = () => {
    if (siblingIds.length > 0) {
      const last = siblingIds[0]; // newest = first (sorted newest first)
      navigateTo(last.id, last.ticketNumber);
    }
  };

  const fetchJobsForAccount = async (premisesId: string) => {
    try {
      const res = await fetch(`/api/search?type=jobs&premisesId=${encodeURIComponent(premisesId)}&q=`);
      if (res.ok) {
        const jobs = await res.json();
        setAccountJobs(jobs.map((j: any) => ({ id: j.id, label: j.label })));
      }
    } catch (e) {
      console.error("Error fetching jobs:", e);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`/api/search?type=accounts&q=`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.map((a: any) => ({ id: a.id, label: a.label, description: a.description })));
      }
    } catch (e) {
      console.error("Error fetching accounts:", e);
    }
  };

  const fetchTicket = async () => {
    setLoading(true);
    try {
      // Use Server Action - pulls from SQL Server and mirrors to PostgreSQL
      const data = await getTicketById(ticketId);
      if (data) {
        setTicket(data);
        setFormData(data);
        // Fetch accounts list and jobs for this account
        fetchAccounts().then(() => {
          // Ensure current account is in the list (API returns max 20)
          if (data.premises?.id) {
            setAccounts((prev) => {
              const exists = prev.some((a) => a.id === data.premises!.id);
              if (!exists) {
                return [
                  {
                    id: data.premises!.id,
                    label: data.premises!.premisesId || data.premises!.address || "",
                    description: [data.premises!.address, data.premises!.city, data.premises!.state].filter(Boolean).join(", "),
                  },
                  ...prev,
                ];
              }
              return prev;
            });
          }
        });
        if (data.premises?.id) {
          fetchJobsForAccount(data.premises.id);
        }
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

  const handleJobChange = (jobId: string) => {
    setFormData((prev) => ({ ...prev, jobId: jobId || null } as any));
    setIsDirty(true);
  };

  const handleAccountChange = (premisesId: string) => {
    // Find the selected account to update the display info
    const selectedAccount = accounts.find((a) => a.id === premisesId);
    setFormData((prev) => ({
      ...prev,
      premisesId: premisesId || null,
      premises: premisesId && selectedAccount
        ? { ...prev.premises, id: premisesId, premisesId: selectedAccount.label } as any
        : null,
      // Clear job when account changes since jobs are account-scoped
      jobId: null,
    } as any));
    setIsDirty(true);
    // Re-fetch jobs for the new account
    if (premisesId) {
      fetchJobsForAccount(premisesId);
    } else {
      setAccountJobs([]);
    }
  };

  const handleSave = async () => {
    if (!ticket) return;
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
        await xpAlert("Ticket saved successfully");
      } else {
        const error = await response.json();
        await xpAlert(error.error || "Failed to save ticket");
      }
    } catch (error) {
      console.error("Error saving ticket:", error);
      await xpAlert("Failed to save ticket");
    }
  };

  const handleCreateInvoice = async () => {
    if (!ticket) return;
    setCreatingInvoice(true);
    try {
      // Create invoice pre-populated from ticket data
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          premisesId: ticket.premises?.id || null,
          jobId: ticket.job?.id || null,
          date: new Date().toISOString(),
          postingDate: new Date().toISOString(),
          description: ticket.scopeOfWork || ticket.resolution || ticket.description || "",
          type: ticket.type || "Other",
          status: "Open",
          terms: "Net 30 Days",
          items: ticket.totalHours > 0 ? [{
            name: "Labor",
            quantity: ticket.totalHours,
            description: ticket.scopeOfWork || ticket.resolution || "Service work",
            tax: false,
            price: 0,
            markupPercent: 0,
            amount: 0,
            measure: "Hours",
            phase: 0,
          }] : [],
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Failed to create invoice" }));
        throw new Error(err.error || "Failed to create invoice");
      }

      const newInvoice = await response.json();

      // Link invoice to ticket
      await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: newInvoice.id, inv: true }),
      });

      // Update local state
      setTicket((prev) => prev ? { ...prev, invoice: { id: newInvoice.id, invoiceNumber: newInvoice.invoiceNumber }, inv: true } : prev);
      setFormData((prev) => ({ ...prev, invoice: { id: newInvoice.id, invoiceNumber: newInvoice.invoiceNumber }, inv: true }));

      // Open the invoice in a new tab
      openTab(`Invoice #${newInvoice.invoiceNumber}`, `/invoices/${newInvoice.id}`);

      await xpAlert(`Invoice #${newInvoice.invoiceNumber} created successfully`);
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      await xpAlert(error.message || "Failed to create invoice");
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleViewInvoice = () => {
    if (ticket?.invoice) {
      openTab(`Invoice #${ticket.invoice.invoiceNumber}`, `/invoices/${ticket.invoice.id}`);
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
      <div className="bg-white flex items-center px-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer">PIM</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer">Move</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
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
        <button onClick={handleFirst} disabled={currentIndex < 0 || currentIndex >= siblingIds.length - 1} className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-30" title="First (oldest)">
          <ChevronLeft className="w-4 h-4" style={{ color: "#333" }} />
        </button>
        <button onClick={handlePrev} disabled={currentIndex < 0 || currentIndex >= siblingIds.length - 1} className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-30" title="Previous">
          <ChevronLeft className="w-4 h-4" style={{ color: "#0066cc" }} />
        </button>
        <button onClick={handleNext} disabled={currentIndex <= 0} className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-30" title="Next">
          <ChevronRight className="w-4 h-4" style={{ color: "#0066cc" }} />
        </button>
        <button onClick={handleLast} disabled={currentIndex <= 0} className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-30" title="Last (newest)">
          <ChevronRight className="w-4 h-4" style={{ color: "#333" }} />
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
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        {ticket?.invoice ? (
          <button
            onClick={handleViewInvoice}
            className="ml-2 px-3 py-1 border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[11px] rounded flex items-center gap-1"
            title={`View Invoice #${ticket.invoice.invoiceNumber}`}
          >
            <ExternalLink className="w-3 h-3" style={{ color: "#0066cc" }} />
            Invoice #{ticket.invoice.invoiceNumber}
          </button>
        ) : (
          <button
            onClick={handleCreateInvoice}
            disabled={creatingInvoice}
            className="ml-2 px-3 py-1 border border-[#a0a0a0] bg-[#e8f5e9] hover:bg-[#c8e6c9] text-[11px] rounded flex items-center gap-1 disabled:opacity-50"
            title="Create Invoice from this ticket"
          >
            <Receipt className="w-3 h-3" style={{ color: "#2e7d32" }} />
            {creatingInvoice ? "Creating..." : "Create Invoice"}
          </button>
        )}
      </div>

      {/* Tab Headers */}
      <div className="bg-white flex items-end px-2 pt-1 border-b border-[#a0a0a0]">
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
              activeTab === i
                ? "bg-white border-[#a0a0a0] border-b-white z-10 font-medium"
                : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-white p-2">
        {activeTab === 0 && (
          <TicketInfoTab
            formData={formData}
            ticket={ticket}
            onChange={handleChange}
            onOpenAccount={openAccount}
            onOpenJob={openJob}
            getNameAddress={getNameAddress}
            accounts={accounts}
            onAccountChange={handleAccountChange}
            accountJobs={accountJobs}
            onJobChange={handleJobChange}
          />
        )}
        {activeTab === 1 && <MaterialsCustomTab />}
        {activeTab === 2 && <WorkersSignaturesTab />}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#a0a0a0] px-2 py-1 flex items-center justify-between text-[11px]">
        <span className="text-[#333]">{formatStatusBar()}</span>
      </div>

      {/* Bottom Info Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1 flex items-center gap-4 text-[11px]">
        <button className="px-3 py-0.5 border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
          EDIT
        </button>
        <span className="flex-1 text-center">
          {ticket.accountId || ticket.premises?.premisesId} - {ticket.premises?.address} - {ticket.ticketNumber}
        </span>
      </div>

      {/* XP Alert/Confirm Dialog */}
      <XPDialogComponent />
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
  accounts: { id: string; label: string; description: string }[];
  onAccountChange: (premisesId: string) => void;
  accountJobs: { id: string; label: string }[];
  onJobChange: (jobId: string) => void;
}

// Parse time strings like "02:45 PM", "1:45pm", "14:45" into "HH:mm" format for <input type="time">
function parseTimeToInput(timeStr: string | null | undefined): string {
  if (!timeStr) return "";
  // Already in HH:mm format
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  // Parse "HH:MM AM/PM" or "H:MMam/pm" variations
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i);
  if (!match) return "";
  let hours = parseInt(match[1]);
  const minutes = match[2];
  const ampm = match[3]?.toUpperCase();
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

// Format "HH:mm" to "hh:mm AM/PM" for display/storage
function formatTimeForStorage(timeVal: string): string {
  if (!timeVal) return "";
  const [h, m] = timeVal.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function TicketInfoTab({
  formData,
  ticket,
  onChange,
  onOpenAccount,
  onOpenJob,
  getNameAddress,
  accounts,
  onAccountChange,
  accountJobs,
  onJobChange,
}: TicketInfoTabProps) {
  const inputClass = "px-1 py-0.5 border border-[#a0a0a0] bg-white text-[11px]";
  const selectClass = "px-1 py-0.5 border border-[#a0a0a0] bg-white text-[11px]";
  const labelClass = "text-[11px] text-[#333]";
  const fieldsetClass = "border border-[#808080] p-2 bg-white";
  const legendClass = "text-[11px] px-1 bg-white";

  return (
    <div className="h-full overflow-auto p-1">
      <div className="flex gap-4">
        {/* Left Column - Basic Info */}
        <div className="flex flex-col gap-2 w-[240px]">
        {/* Ticket # and W/O# */}
        <div className="flex items-center gap-1">
          <label className={`${labelClass} w-[50px]`}>Ticket #</label>
          <input
            type="text"
            value={formData.ticketNumber || ""}
            className={`${inputClass} w-[70px] bg-[#c0e0ff]`}
            readOnly
          />
          <label className={`${labelClass} w-[30px]`}>W/O#</label>
          <input
            type="text"
            value={formData.workOrderNumber || formData.ticketNumber || ""}
            onChange={(e) => onChange("workOrderNumber", parseInt(e.target.value) || null)}
            className={`${inputClass} w-[70px]`}
          />
        </div>

        {/* Category */}
        <div className="flex items-center gap-1">
          <label className={`${labelClass} w-[50px]`}>Category</label>
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

        {/* Level */}
        <div className="flex items-center gap-1">
          <label className={`${labelClass} w-[50px]`}>Level</label>
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

        {/* Account */}
        <div className="flex items-center gap-1">
          <label
            className={`${labelClass} w-[50px] text-blue-600 cursor-pointer hover:underline`}
            onClick={onOpenAccount}
          >
            Account
          </label>
          <select
            value={formData.premises?.id || ""}
            onChange={(e) => onAccountChange(e.target.value)}
            className={`${selectClass} flex-1`}
          >
            <option value="">Select...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} title={a.description}>{a.label}</option>
            ))}
          </select>
        </div>

        {/* Job and Phase */}
        <div className="flex items-center gap-1">
          <label
            className={`${labelClass} w-[50px] text-blue-600 cursor-pointer hover:underline`}
            onClick={onOpenJob}
          >
            Job
          </label>
          <select
            value={(formData as any).jobId || ticket.job?.id || ""}
            onChange={(e) => onJobChange(e.target.value)}
            className={`${selectClass} w-[70px]`}
          >
            <option value="">Select...</option>
            {accountJobs.map((j) => (
              <option key={j.id} value={j.id}>{j.label}</option>
            ))}
          </select>
          <label className={`${labelClass} w-[35px]`}>Phase</label>
          <input
            type="number"
            value={formData.phase || 1}
            onChange={(e) => onChange("phase", parseInt(e.target.value) || 1)}
            className={`${inputClass} w-[40px]`}
          />
        </div>

        {/* Unit */}
        <div className="flex items-center gap-1">
          <label className={`${labelClass} w-[50px] text-blue-600`}>Unit</label>
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
            className="cursor-pointer hover:bg-[#ffffd8] whitespace-pre-wrap text-[11px] min-h-[70px] leading-tight"
          >
            {getNameAddress()}
          </div>
        </fieldset>

        {/* Scope of Work */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Scope of Work</legend>
          <textarea
            value={formData.scopeOfWork || ""}
            onChange={(e) => onChange("scopeOfWork", e.target.value)}
            className="w-full h-[60px] border border-[#a0a0a0] bg-white text-[11px] p-1 resize-none"
          />
        </fieldset>

        {/* Resolution */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Resolution</legend>
          <textarea
            value={formData.resolution || ""}
            onChange={(e) => onChange("resolution", e.target.value)}
            className="w-full h-[50px] border border-[#a0a0a0] bg-white text-[11px] p-1 resize-none"
          />
        </fieldset>
      </div>

      {/* Middle Column - Work Performed, Time Frame, Mileage, Parts Used */}
      <div className="flex flex-col gap-2 w-[200px]">
        {/* Work Performed */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Work Performed</legend>
          <div className="flex flex-col gap-1">
            <div className="flex items-center">
              <label className={`${labelClass} w-[45px]`}>Date</label>
              <input
                type="date"
                value={formData.date ? new Date(formData.date).toISOString().split("T")[0] : ""}
                onChange={(e) => onChange("date", e.target.value)}
                className={`${inputClass} flex-1`}
              />
            </div>
            <div className="flex items-center">
              <label className={`${labelClass} w-[45px]`}>Time</label>
              <input
                type="time"
                value={parseTimeToInput(formData.workTime)}
                onChange={(e) => onChange("workTime", formatTimeForStorage(e.target.value))}
                className={`${inputClass} flex-1`}
              />
            </div>
            <div className="flex items-center">
              <label className={`${labelClass} w-[45px]`}>Mech</label>
              <select
                value={formData.mechCrew || ""}
                onChange={(e) => onChange("mechCrew", e.target.value)}
                className={`${selectClass} flex-1 text-[10px]`}
              >
                <option value="">Select...</option>
                <option value={formData.mechCrew || ""}>{formData.mechCrew || "No Mechanic"}</option>
              </select>
            </div>
            <div className="flex items-center">
              <label className={`${labelClass} w-[45px]`}>Wage</label>
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
            <div className="flex items-center">
              <label className={`${labelClass} w-[60px]`}>En Route</label>
              <input
                type="time"
                value={parseTimeToInput(formData.enRouteTime)}
                onChange={(e) => onChange("enRouteTime", formatTimeForStorage(e.target.value))}
                className={`${inputClass} flex-1`}
              />
            </div>
            <div className="flex items-center">
              <label className={`${labelClass} w-[60px]`}>On Site</label>
              <input
                type="time"
                value={parseTimeToInput(formData.onSiteTime)}
                onChange={(e) => onChange("onSiteTime", formatTimeForStorage(e.target.value))}
                className={`${inputClass} flex-1`}
              />
            </div>
            <div className="flex items-center">
              <label className={`${labelClass} w-[60px]`}>Completed</label>
              <input
                type="time"
                value={parseTimeToInput(formData.completedTime)}
                onChange={(e) => onChange("completedTime", formatTimeForStorage(e.target.value))}
                className={`${inputClass} flex-1`}
              />
            </div>
          </div>
        </fieldset>

        {/* Mileage */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Mileage</legend>
          <div className="flex flex-col gap-1">
            <div className="flex items-center">
              <label className={`${labelClass} w-[55px]`}>Starting</label>
              <input
                type="number"
                value={formData.mileageStarting || 0}
                onChange={(e) => onChange("mileageStarting", parseInt(e.target.value) || 0)}
                className={`${inputClass} flex-1 text-right`}
              />
            </div>
            <div className="flex items-center">
              <label className={`${labelClass} w-[55px]`}>Ending</label>
              <input
                type="number"
                value={formData.mileageEnding || 0}
                onChange={(e) => onChange("mileageEnding", parseInt(e.target.value) || 0)}
                className={`${inputClass} flex-1 text-right`}
              />
            </div>
            <div className="flex items-center">
              <label className={`${labelClass} w-[55px]`}>Traveled</label>
              <input
                type="number"
                value={formData.mileageTraveled || 0}
                onChange={(e) => onChange("mileageTraveled", parseInt(e.target.value) || 0)}
                className={`${inputClass} flex-1 text-right`}
              />
            </div>
          </div>
        </fieldset>

        {/* Parts Used */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Parts Used</legend>
          <textarea
            value={formData.partsUsed || ""}
            onChange={(e) => onChange("partsUsed", e.target.value)}
            className="w-full h-[40px] border border-[#a0a0a0] bg-white text-[11px] p-1 resize-none"
          />
        </fieldset>
      </div>

      {/* Right Section - Time Spent, Checkboxes, Expenses */}
      <div className="flex flex-col gap-2 w-[420px]">
        {/* Top Row: Time Spent + Checkboxes side by side */}
        <div className="flex gap-3">
          {/* Time Spent */}
          <fieldset className={`${fieldsetClass} w-[130px] flex-shrink-0`}>
            <legend className={legendClass}>Time Spent</legend>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center">
                <label className={`${labelClass} w-[60px]`}>Regular</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.hours) || 0}
                  onChange={(e) => onChange("hours", parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-[50px] text-right`}
                />
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[60px]`}>Overtime</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.overtimeHours) || 0}
                  onChange={(e) => onChange("overtimeHours", parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-[50px] text-right`}
                />
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[60px]`}>1.7 Time</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.oneSevenHours) || 0}
                  onChange={(e) => onChange("oneSevenHours", parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-[50px] text-right`}
                />
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[60px]`}>DoubleTime</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.doubleTimeHours) || 0}
                  onChange={(e) => onChange("doubleTimeHours", parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-[50px] text-right`}
                />
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[45px]`}>Travel</label>
                <input
                  type="checkbox"
                  checked={Number(formData.travelHours) > 0}
                  className="w-3 h-3 mx-1"
                  readOnly
                />
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.travelHours) || 0}
                  onChange={(e) => onChange("travelHours", parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-[35px] text-right`}
                />
              </div>
              <div className="border-t border-[#a0a0a0] my-0.5" />
              <div className="flex items-center">
                <label className={`${labelClass} w-[60px]`}>Total</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.totalHours) || 0}
                  className={`${inputClass} w-[50px] text-right bg-[#f0f0f0]`}
                  readOnly
                />
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[60px]`}>Est Time</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.estTime) || 0}
                  onChange={(e) => onChange("estTime", parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-[50px] text-right`}
                />
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[60px]`}>Difference</label>
                <input
                  type="number"
                  step="0.01"
                  value={Number(formData.difference) || 0}
                  className={`${inputClass} w-[50px] text-right bg-[#f0f0f0]`}
                  readOnly
                />
              </div>
            </div>
          </fieldset>

          {/* Checkboxes Column */}
          <div className="flex flex-col gap-0.5">
            <label className="flex items-center gap-1 text-[11px]">
              <input
                type="checkbox"
                checked={formData.workCompleted || false}
                onChange={(e) => onChange("workCompleted", e.target.checked)}
                className="w-3 h-3"
              />
              Work Completed
            </label>
            <label className="flex items-center gap-1 text-[11px]">
              <input
                type="checkbox"
                checked={formData.chargeable || false}
                onChange={(e) => onChange("chargeable", e.target.checked)}
                className="w-3 h-3"
              />
              Chargeable
            </label>
            <label className="flex items-center gap-1 text-[11px]">
              <input
                type="checkbox"
                checked={formData.inv || false}
                onChange={(e) => onChange("inv", e.target.checked)}
                className="w-3 h-3"
              />
              Invoice
            </label>
            <label className="flex items-center gap-1 text-[11px]">
              <input
                type="checkbox"
                checked={formData.emailOnSave || false}
                onChange={(e) => onChange("emailOnSave", e.target.checked)}
                className="w-3 h-3"
              />
              Email on Save
            </label>
            <label className="flex items-center gap-1 text-[11px]">
              <input
                type="checkbox"
                checked={formData.updateLocation || false}
                onChange={(e) => onChange("updateLocation", e.target.checked)}
                className="w-3 h-3"
              />
              Update Location
            </label>
            <label className="flex items-center gap-1 text-[11px]">
              <input
                type="checkbox"
                checked={formData.internetAccess || false}
                onChange={(e) => onChange("internetAccess", e.target.checked)}
                className="w-3 h-3"
              />
              Internet Access
            </label>
            <div className="mt-1">
              <label className={`${labelClass} text-[10px]`}>Review Status</label>
              <select
                value={formData.reviewStatus || "Dispatch Review"}
                onChange={(e) => onChange("reviewStatus", e.target.value)}
                className={`${selectClass} w-[120px]`}
              >
                <option value="Dispatch Review">Dispatch Review</option>
                <option value="Supervisor Review">Supervisor Review</option>
                <option value="Billing Review">Billing Review</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expenses Row */}
        <fieldset className={fieldsetClass}>
          <legend className={legendClass}>Expenses</legend>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <label className={labelClass}>Phase</label>
              <input
                type="number"
                value={formData.expensePhase || 1}
                onChange={(e) => onChange("expensePhase", parseInt(e.target.value) || 1)}
                className={`${inputClass} w-[35px]`}
              />
              <button className="px-1 border border-[#a0a0a0] bg-[#f0f0f0] text-[10px]">...</button>
            </div>
            <div className="flex items-center gap-1">
              <label className={labelClass}>Mileage</label>
              <input
                type="text"
                value={`$${Number(formData.expenseMileage || 0).toFixed(2)}`}
                className={`${inputClass} w-[55px] text-right bg-[#f0f0f0]`}
                readOnly
              />
            </div>
            <div className="flex items-center gap-1">
              <label className={labelClass}>Zone</label>
              <input
                type="text"
                value={`$${Number(formData.expenseZone || 0).toFixed(2)}`}
                className={`${inputClass} w-[55px] text-right bg-[#f0f0f0]`}
                readOnly
              />
            </div>
            <div className="flex items-center gap-1">
              <label className={labelClass}>Tolls</label>
              <input
                type="text"
                value={`$${Number(formData.expenseTolls || 0).toFixed(2)}`}
                className={`${inputClass} w-[55px] text-right bg-[#f0f0f0]`}
                readOnly
              />
            </div>
            <div className="flex items-center gap-1">
              <label className={labelClass}>Misc Exp</label>
              <input
                type="text"
                value={`$${Number(formData.expenseMisc || 0).toFixed(2)}`}
                className={`${inputClass} w-[55px] text-right bg-[#f0f0f0]`}
                readOnly
              />
            </div>
            <div className="flex items-center gap-1">
              <label className={labelClass}>Total</label>
              <input
                type="text"
                value={`$${Number(formData.expenseTotal || 0).toFixed(2)}`}
                className={`${inputClass} w-[55px] text-right bg-[#f0f0f0]`}
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
            className={`${inputClass} w-[100px]`}
          />
        </div>

        {/* Internal Comments Only */}
        <fieldset className={`${fieldsetClass}`}>
          <legend className={legendClass}>Internal Comments Only</legend>
          <textarea
            value={formData.internalComments || ""}
            onChange={(e) => onChange("internalComments", e.target.value)}
            className="w-full h-[60px] border border-[#a0a0a0] bg-white text-[11px] p-1 resize-none"
          />
        </fieldset>
      </div>
      </div>
    </div>
  );
}

// ============================================
// Tab 2: Materials/Custom
// ============================================
function MaterialsCustomTab() {
  const inputClass = "px-1 py-0.5 border border-[#a0a0a0] bg-white text-[11px]";
  const selectClass = "px-1 py-0.5 border border-[#a0a0a0] bg-white text-[11px]";
  const labelClass = "text-[11px] text-[#333]";
  const fieldsetClass = "border border-[#808080] p-2 bg-white";
  const legendClass = "text-[11px] px-1 bg-white font-bold";
  const thClass = "px-2 py-1 text-left font-normal border border-[#a0a0a0] bg-[#f0f0f0] text-[11px]";
  const tdClass = "px-2 py-1 border border-[#d0d0d0] text-[11px]";

  return (
    <div className="h-full overflow-auto p-1">
      <div className="flex gap-4">
        {/* Left Side - Tables */}
        <div className="flex flex-col gap-3 w-[500px]">
          {/* MATERIALS USED */}
          <div>
            <div className="font-bold text-[11px] mb-1">MATERIALS USED</div>
            <div className="border border-[#a0a0a0] bg-white h-[120px] overflow-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0">
                  <tr>
                    <th className={thClass} style={{ width: "25%" }}>Name</th>
                    <th className={thClass} style={{ width: "10%" }}>Quan</th>
                    <th className={thClass} style={{ width: "40%" }}>Desc</th>
                    <th className={thClass} style={{ width: "10%" }}>Bill</th>
                    <th className={thClass} style={{ width: "15%" }}>Phase</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={tdClass}>&nbsp;</td>
                    <td className={tdClass}>&nbsp;</td>
                    <td className={tdClass}>&nbsp;</td>
                    <td className={tdClass}>&nbsp;</td>
                    <td className={tdClass}>&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FLAT RATES */}
          <div>
            <div className="font-bold text-[11px] mb-1">FLAT RATES</div>
            <div className="border border-[#a0a0a0] bg-white h-[100px] overflow-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0">
                  <tr>
                    <th className={thClass} style={{ width: "25%" }}>Name</th>
                    <th className={thClass} style={{ width: "50%" }}>Description</th>
                    <th className={thClass} style={{ width: "25%" }}>Price Level</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={tdClass}>&nbsp;</td>
                    <td className={tdClass}>&nbsp;</td>
                    <td className={tdClass}>&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* PURCHASE ORDERS */}
          <div>
            <div className="font-bold text-[11px] mb-1">PURCHASE ORDERS</div>
            <div className="border border-[#a0a0a0] bg-white h-[100px] overflow-auto">
              <table className="w-full border-collapse">
                <thead className="sticky top-0">
                  <tr>
                    <th className={thClass} style={{ width: "15%" }}>PO #</th>
                    <th className={thClass} style={{ width: "25%" }}>Vendor</th>
                    <th className={thClass} style={{ width: "45%" }}>Description</th>
                    <th className={thClass} style={{ width: "15%" }}>Received</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={tdClass}>&nbsp;</td>
                    <td className={tdClass}>&nbsp;</td>
                    <td className={tdClass}>&nbsp;</td>
                    <td className={tdClass}>&nbsp;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Side - Custom Fields */}
        <div className="flex flex-col gap-3 w-[320px]">
          {/* Ticket Custom */}
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>Ticket Custom</legend>
            <div className="flex flex-col gap-1">
              <div className="flex items-center">
                <label className={`${labelClass} w-[90px]`}>NII JOB#</label>
                <input type="text" className={`${inputClass} flex-1`} />
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[90px]`}>300 COMM #</label>
                <input type="text" className={`${inputClass} flex-1`} />
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[90px]`}>Custom3</label>
                <input type="text" className={`${inputClass} flex-1`} />
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[90px]`}>Custom4</label>
                <input type="text" className={`${inputClass} flex-1`} />
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[90px]`}>Custom5</label>
                <input type="text" className={`${inputClass} flex-1`} />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-[11px]">
                  <span className="w-[80px]">RMS Reviewed</span>
                  <input type="checkbox" className="w-3 h-3" />
                </label>
                <label className="flex items-center gap-1 text-[11px]">
                  <span>Rate Change</span>
                  <input type="checkbox" className="w-3 h-3" />
                </label>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1 text-[11px]">
                  <span className="w-[80px]">BIO</span>
                  <input type="checkbox" className="w-3 h-3" />
                </label>
                <label className="flex items-center gap-1 text-[11px]">
                  <span>Custom10</span>
                  <input type="checkbox" className="w-3 h-3" />
                </label>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-1 text-[11px]">
                  <span className="w-[80px]">Cancelled / Dup</span>
                  <input type="checkbox" className="w-3 h-3" />
                </label>
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[90px]`}>Source</label>
                <select className={`${selectClass} flex-1`}>
                  <option value="Reference">Reference</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[90px] text-blue-600`}>WITNESS</label>
                <select className={`${selectClass} flex-1`}>
                  <option value=""></option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* TFM Ticket Custom */}
          <fieldset className={fieldsetClass}>
            <legend className={legendClass}>TFM Ticket Custom</legend>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className={`${labelClass} w-[90px]`}>Signature Name</label>
                <input type="text" className={`${inputClass} flex-1`} />
                <label className="flex items-center gap-1 text-[11px]">
                  <span>P/T</span>
                  <input type="checkbox" className="w-3 h-3" />
                </label>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${labelClass} w-[90px]`}>Signature Email</label>
                <input type="text" className={`${inputClass} flex-1`} />
                <label className="flex items-center gap-1 text-[11px]">
                  <span>LSD</span>
                  <input type="checkbox" className="w-3 h-3" />
                </label>
              </div>
              <div className="flex items-center">
                <label className={`${labelClass} w-[90px]`}>Custom3</label>
                <input type="text" className={`${inputClass} flex-1`} />
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Tab 3: Workers/Signatures
// ============================================
function WorkersSignaturesTab() {
  const thClass = "px-2 py-1 text-left font-normal border border-[#a0a0a0] bg-[#f0f0f0] text-[11px]";
  const tdClass = "px-2 py-1 border border-[#d0d0d0] text-[11px]";
  const fieldsetClass = "border border-[#808080] p-2 bg-white";
  const legendClass = "text-[11px] px-1 bg-white";

  return (
    <div className="h-full overflow-auto p-1 flex flex-col gap-3">
      {/* Top Section */}
      <div className="flex gap-4">
        {/* Left - Other Workers Table */}
        <div className="w-[380px]">
          <div className="font-bold text-[11px] mb-1">OTHER WORKERS</div>
          <div className="border border-[#a0a0a0] bg-white h-[200px] overflow-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0">
                <tr>
                  <th className={thClass} style={{ width: "25%" }}>Ticket #</th>
                  <th className={thClass} style={{ width: "45%" }}>Worker</th>
                  <th className={thClass} style={{ width: "30%" }}>Scheduled</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tdClass}>&nbsp;</td>
                  <td className={tdClass}>&nbsp;</td>
                  <td className={tdClass}>&nbsp;</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right - Signature Areas */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Customer Signature */}
          <div>
            <div className="text-[11px] mb-1">Customer</div>
            <div className="border border-[#a0a0a0] bg-white h-[80px]">
              {/* Signature canvas placeholder */}
            </div>
          </div>

          {/* Technician Signature */}
          <div>
            <div className="text-[11px] mb-1">Technician</div>
            <div className="border border-[#a0a0a0] bg-white h-[80px]">
              {/* Signature canvas placeholder */}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom - Recommendations */}
      <fieldset className={`${fieldsetClass} flex-1`}>
        <legend className={legendClass}>Recommendations</legend>
        <div className="flex h-full">
          <textarea
            className="flex-1 h-full min-h-[100px] border border-[#a0a0a0] bg-white text-[11px] p-1 resize-none"
          />
          <div className="flex flex-col items-end justify-start ml-2">
            <span className="text-blue-600 text-[12px] font-bold cursor-pointer hover:underline">
              Job Results
            </span>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
