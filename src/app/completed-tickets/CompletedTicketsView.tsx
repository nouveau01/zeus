"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Pencil,
  ClipboardList,
  X,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Scissors,
  Check,
  DollarSign,
  BarChart3,
  FileEdit,
  Printer,
  Paperclip,
  Sigma,
  Lock,
  Plus,
  Home,
  HelpCircle,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { getTickets } from "@/lib/actions/tickets";

// Toolbar icons matching Accounts/Customers pattern
const toolbarIcons = [
  { icon: FileText, color: "#4a7c59", title: "Add New Record", action: "new" },
  { icon: Pencil, color: "#d4a574", title: "Edit", action: "edit" },
  { icon: ClipboardList, color: "#6b8cae", title: "View" },
  { icon: X, color: "#c45c5c", title: "Delete", action: "delete" },
  { icon: FolderOpen, color: "#d4c574", title: "Open" },
  { icon: ChevronDown, color: "#7c6b8e", title: "Expand" },
  { icon: Scissors, color: "#5c8c8c", title: "Cut" },
  { icon: Check, color: "#5cb85c", title: "Approve" },
  { icon: Check, color: "#5c5cb8", title: "Confirm" },
  { icon: DollarSign, color: "#5cb85c", title: "Billing" },
  { icon: BarChart3, color: "#e67e22", title: "Reports" },
  { icon: FileEdit, color: "#3498db", title: "Edit Document" },
  { icon: Printer, color: "#9b59b6", title: "Print" },
  { icon: Paperclip, color: "#7f8c8d", title: "Attach" },
  { icon: Paperclip, color: "#27ae60", title: "Link" },
  { icon: Sigma, color: "#2c3e50", title: "Sum" },
  { icon: Lock, color: "#f39c12", title: "Lock" },
  { icon: Plus, color: "#27ae60", title: "Add" },
  { icon: Home, color: "#e74c3c", title: "Home" },
  { icon: HelpCircle, color: "#3498db", title: "Help" },
  { icon: X, color: "#95a5a6", title: "Close" },
];

interface Ticket {
  id: string;
  ticketNumber: number;
  workOrderNumber: number | null;
  date: string;
  type: string;
  category: string | null;
  status: string;
  accountId: string | null;
  mechCrew: string | null;
  supervisor: string | null;
  bill: boolean;
  reviewed: boolean;
  pr: boolean;
  vd: boolean;
  inv: boolean;
  hours: number;
  emailStatus: string | null;
  unitName: string | null;
  premises: {
    id: string;
    premisesId: string | null;
    address: string;
    city: string | null;
    customer: {
      id: string;
      name: string;
    } | null;
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

const TYPE_TABS = ["All", "Maintenance", "Modernization", "Repair", "Other", "NEW REPAIR"];

type SortField = "ticketNumber" | "workOrder" | "date" | "type" | "category" | "accountId" | "account" | "mechCrew" | "bill" | "reviewed" | "pr" | "vd" | "inv" | "hours" | "invoice" | "job" | "unit" | "emailStatus";
type SortDirection = "asc" | "desc";

const STORAGE_KEY = "zeus-tickets-state";

interface PageState {
  activeTab: string;
  sortField: SortField;
  sortDirection: SortDirection;
  selectedRow: string | null;
  showTotals: boolean;
  catalogue: string;
  mechanic: string;
  supervisor: string;
}

// Column definitions with default widths - ALL columns are sortable
const columns: { field: SortField; label: string; width: number }[] = [
  { field: "ticketNumber", label: "Tick #", width: 70 },
  { field: "workOrder", label: "W/O#", width: 70 },
  { field: "date", label: "Date", width: 130 },
  { field: "type", label: "Type", width: 90 },
  { field: "category", label: "Category", width: 70 },
  { field: "accountId", label: "ID", width: 80 },
  { field: "account", label: "Account", width: 180 },
  { field: "mechCrew", label: "Mech/Crew", width: 80 },
  { field: "bill", label: "Bill", width: 35 },
  { field: "reviewed", label: "Rw", width: 35 },
  { field: "pr", label: "PR", width: 35 },
  { field: "vd", label: "Vd", width: 35 },
  { field: "inv", label: "Inv", width: 35 },
  { field: "hours", label: "Hours", width: 60 },
  { field: "invoice", label: "Invoice", width: 60 },
  { field: "job", label: "Job", width: 60 },
  { field: "unit", label: "Unit", width: 70 },
  { field: "emailStatus", label: "Email Status", width: 90 },
];

interface CompletedTicketsViewProps {
  premisesId?: string | null;
}

export default function CompletedTicketsView({ premisesId }: CompletedTicketsViewProps) {
  const { openTab } = useTabs();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // Filters - default to last 30 days
  const [catalogue, setCatalogue] = useState("None");
  const [mechanic, setMechanic] = useState("All");
  const [reviewed, setReviewed] = useState("All");
  const [billed, setBilled] = useState("All");
  const [payroll, setPayroll] = useState("All");
  const [supervisor, setSupervisor] = useState("All");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [activeTab, setActiveTab] = useState("All");
  const [showTotals, setShowTotals] = useState(false);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isHydrated, setIsHydrated] = useState(false);

  // Column resize state
  const [columnWidths, setColumnWidths] = useState<number[]>(columns.map(c => c.width));
  const [resizing, setResizing] = useState<{ index: number; startX: number; startWidth: number } | null>(null);

  // Column resize handlers
  const handleResizeStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ index, startX: e.clientX, startWidth: columnWidths[index] });
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(30, resizing.startWidth + diff);
      setColumnWidths(prev => {
        const updated = [...prev];
        updated[resizing.index] = newWidth;
        return updated;
      });
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: PageState = JSON.parse(saved);
        setActiveTab(state.activeTab || "All");
        setSortField(state.sortField || "date");
        setSortDirection(state.sortDirection || "desc");
        setSelectedRow(state.selectedRow || null);
        setShowTotals(state.showTotals || false);
        setCatalogue(state.catalogue || "None");
        setMechanic(state.mechanic || "All");
        setSupervisor(state.supervisor || "All");
      }
    } catch (error) {
      console.error("Error loading tickets state:", error);
    }
    setIsHydrated(true);
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      try {
        const state: PageState = {
          activeTab,
          sortField,
          sortDirection,
          selectedRow,
          showTotals,
          catalogue,
          mechanic,
          supervisor,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Error saving tickets state:", error);
      }
    }
  }, [activeTab, sortField, sortDirection, selectedRow, showTotals, catalogue, mechanic, supervisor, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      fetchTickets();
    }
  }, [startDate, endDate, activeTab, mechanic, supervisor, reviewed, billed, payroll, isHydrated, premisesId]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await getTickets({
        status: "Completed",
        type: activeTab !== "All" ? activeTab : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        premisesId: premisesId || undefined,
      });
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleClick = (ticket: Ticket) => {
    openTab(`Ticket #${ticket.ticketNumber}`, `/completed-tickets/${ticket.id}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "date" ? "desc" : "asc");
    }
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortField) {
      case "ticketNumber":
        aVal = a.ticketNumber;
        bVal = b.ticketNumber;
        break;
      case "workOrder":
        aVal = a.workOrderNumber || a.ticketNumber;
        bVal = b.workOrderNumber || b.ticketNumber;
        break;
      case "date":
        aVal = a.date;
        bVal = b.date;
        break;
      case "type":
        aVal = a.type.toLowerCase();
        bVal = b.type.toLowerCase();
        break;
      case "category":
        aVal = (a.category || "").toLowerCase();
        bVal = (b.category || "").toLowerCase();
        break;
      case "accountId":
        aVal = (a.accountId || "").toLowerCase();
        bVal = (b.accountId || "").toLowerCase();
        break;
      case "account":
        aVal = (a.premises?.address || "").toLowerCase();
        bVal = (b.premises?.address || "").toLowerCase();
        break;
      case "mechCrew":
        aVal = (a.mechCrew || "").toLowerCase();
        bVal = (b.mechCrew || "").toLowerCase();
        break;
      case "hours":
        aVal = Number(a.hours);
        bVal = Number(b.hours);
        break;
      case "invoice":
        aVal = a.invoice?.invoiceNumber || 0;
        bVal = b.invoice?.invoiceNumber || 0;
        break;
      case "job":
        aVal = (a.job?.externalId || "").toLowerCase();
        bVal = (b.job?.externalId || "").toLowerCase();
        break;
      case "unit":
        aVal = (a.unitName || "").toLowerCase();
        bVal = (b.unitName || "").toLowerCase();
        break;
      case "bill":
        aVal = a.bill ? 1 : 0;
        bVal = b.bill ? 1 : 0;
        break;
      case "reviewed":
        aVal = a.reviewed ? 1 : 0;
        bVal = b.reviewed ? 1 : 0;
        break;
      case "pr":
        aVal = a.pr ? 1 : 0;
        bVal = b.pr ? 1 : 0;
        break;
      case "vd":
        aVal = a.vd ? 1 : 0;
        bVal = b.vd ? 1 : 0;
        break;
      case "inv":
        aVal = a.inv ? 1 : 0;
        bVal = b.inv ? 1 : 0;
        break;
      case "emailStatus":
        aVal = (a.emailStatus || "").toLowerCase();
        bVal = (b.emailStatus || "").toLowerCase();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    // Parse date without timezone conversion - treat as local time from SQL Server
    const date = new Date(dateStr);
    // Check if the date string has timezone info - if not, adjust for UTC offset
    // SQL Server dates come without timezone, JS interprets as UTC
    // We need to display as-is (EST) without conversion
    const hasTimezone = dateStr.includes('Z') || dateStr.includes('+') || dateStr.includes('-', 10);

    if (!hasTimezone) {
      // No timezone in source - parse components directly to avoid conversion
      const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})T?(\d{2})?:?(\d{2})?/);
      if (parts) {
        const [, year, month, day, hour = "0", minute = "0"] = parts;
        const h = parseInt(hour);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${parseInt(month)}/${parseInt(day)}/${year} ${h12}:${minute.padStart(2, '0')} ${ampm}`;
      }
    }

    // Fallback to standard formatting
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    }) + " " + date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const setDateRange = (range: string) => {
    const today = new Date();
    const start = new Date();

    switch (range) {
      case "Day":
        break;
      case "Week":
        start.setDate(today.getDate() - 6);
        break;
      case "Month":
        start.setDate(today.getDate() - 29);
        break;
      case "Quarter":
        start.setDate(today.getDate() - 89);
        break;
      case "Year":
        start.setDate(today.getDate() - 364);
        break;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  const totalTickets = sortedTickets.length;
  const totalHours = sortedTickets.reduce((sum, t) => sum + Number(t.hours), 0);

  if (!isHydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  const updateTicketCheckbox = async (ticketId: string, field: string, value: boolean) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (response.ok) {
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, [field]: value } : t))
        );
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
    }
  };

  // Get cell value for a ticket by column index
  const getCellValue = (ticket: Ticket, colIndex: number) => {
    switch (colIndex) {
      case 0: return ticket.ticketNumber;
      case 1: return ticket.workOrderNumber || ticket.ticketNumber;
      case 2: return formatDate(ticket.date);
      case 3: return ticket.type;
      case 4: return ticket.category || "";
      case 5: return ticket.accountId || "";
      case 6: return ticket.premises?.address || "";
      case 7: return ticket.mechCrew || "";
      case 8: return { type: "checkbox", field: "bill", value: ticket.bill };
      case 9: return { type: "checkbox", field: "reviewed", value: ticket.reviewed };
      case 10: return { type: "checkbox", field: "pr", value: ticket.pr };
      case 11: return { type: "checkbox", field: "vd", value: ticket.vd };
      case 12: return { type: "checkbox", field: "inv", value: ticket.inv };
      case 13: return Number(ticket.hours).toFixed(2);
      case 14: return ticket.invoice?.invoiceNumber || "";
      case 15: return ticket.job?.externalId || "";
      case 16: return ticket.unitName || "";
      case 17: return ticket.emailStatus || "No Email Sent";
      default: return "";
    }
  };

  return (
    <div
      className="h-full flex flex-col bg-white"
      style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}
    >
      {/* Menu Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Pim</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        {toolbarIcons.map((item, i) => {
          const IconComponent = item.icon;
          return (
            <button
              key={i}
              className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
              title={item.title}
              onClick={async () => {
                if (item.action === "new") {
                  alert("To create a new ticket, use the Dispatch module or create from a Job.");
                } else if (item.action === "edit" && selectedRow) {
                  const ticket = tickets.find(t => t.id === selectedRow);
                  if (ticket) openTab(`Ticket #${ticket.ticketNumber}`, `/completed-tickets/${ticket.id}`);
                } else if (item.action === "delete" && selectedRow) {
                  const ticket = tickets.find(t => t.id === selectedRow);
                  if (ticket && confirm(`Delete ticket #${ticket.ticketNumber}?`)) {
                    try {
                      const res = await fetch(`/api/tickets/${selectedRow}`, { method: "DELETE" });
                      if (res.ok) { setSelectedRow(null); fetchTickets(); }
                    } catch (e) { console.error(e); }
                  }
                }
              }}
            >
              <IconComponent className="w-4 h-4" style={{ color: item.color }} />
            </button>
          );
        })}
      </div>

      {/* Filter Row */}
      <div className="bg-white flex flex-wrap items-center gap-3 px-2 py-2 border-b border-[#d0d0d0]">
        <div className="flex items-center gap-1">
          <span className="text-[11px]">F&S Catalogue</span>
          <select
            value={catalogue}
            onChange={(e) => setCatalogue(e.target.value)}
            className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white min-w-[60px]"
          >
            <option value="None">None</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px]">Mechanic</span>
          <select
            value={mechanic}
            onChange={(e) => setMechanic(e.target.value)}
            className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white min-w-[50px]"
          >
            <option value="All">All</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px]">Supervisor</span>
          <select
            value={supervisor}
            onChange={(e) => setSupervisor(e.target.value)}
            className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white min-w-[50px]"
          >
            <option value="All">All</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px]">Reviewed</span>
          <select
            value={reviewed}
            onChange={(e) => setReviewed(e.target.value)}
            className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white min-w-[40px]"
          >
            <option value="All">All</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px]">Billed</span>
          <select
            value={billed}
            onChange={(e) => setBilled(e.target.value)}
            className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white min-w-[40px]"
          >
            <option value="All">All</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px]">Payroll</span>
          <select
            value={payroll}
            onChange={(e) => setPayroll(e.target.value)}
            className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white min-w-[40px]"
          >
            <option value="All">All</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        {/* Start and End date pickers together */}
        <div className="flex items-center gap-1">
          <span className="text-[11px]">Start</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white"
          />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-[11px]">End</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white"
          />
        </div>

        {/* Quick date range buttons */}
        <div className="flex items-center gap-1">
          {["Day", "Week", "Month", "Quarter", "Year"].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className="px-2 py-0.5 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white flex items-end px-2 pt-1 border-b border-[#d0d0d0]">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
              activeTab === tab
                ? "bg-white border-[#a0a0a0] border-b-white z-10 font-medium"
                : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid Container */}
      <div className="flex-1 bg-white border border-[#a0a0a0] mx-2 mb-2 flex flex-col overflow-hidden">
        {/* Column Headers */}
        <div className="bg-[#f0f0f0] border-b border-[#c0c0c0] flex-shrink-0 overflow-x-auto">
          <div className="flex text-[12px]" style={{ minWidth: "max-content" }}>
            {columns.map((col, index) => (
              <div
                key={index}
                className="relative flex-shrink-0 border-r border-[#c0c0c0] last:border-r-0 overflow-hidden"
                style={{ width: columnWidths[index], maxWidth: columnWidths[index] }}
              >
                <div
                  className={`px-2 py-1.5 font-medium text-[#333] select-none overflow-hidden whitespace-nowrap cursor-pointer hover:bg-[#e0e0e0] ${index >= 8 && index <= 12 ? "text-center" : ""} ${index === 13 ? "text-right" : ""}`}
                  onClick={() => handleSort(col.field)}
                >
                  <div className={`flex items-center gap-1 ${index >= 8 && index <= 12 ? "justify-center" : ""} ${index === 13 ? "justify-end" : ""}`}>
                    <span className="overflow-hidden text-ellipsis">{col.label}</span>
                    <SortIcon field={col.field} />
                  </div>
                </div>
                {/* Resize handle */}
                <div
                  className="absolute top-0 right-[-4px] w-[9px] h-full cursor-col-resize z-10 group"
                  onMouseDown={(e) => handleResizeStart(index, e)}
                >
                  <div className="absolute top-0 left-[4px] w-[1px] h-full bg-transparent group-hover:bg-[#0078d4]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Rows */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-[#808080]">Loading...</div>
          ) : sortedTickets.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">No completed tickets found</div>
          ) : (
            <div style={{ minWidth: "max-content" }}>
              {sortedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedRow(ticket.id)}
                  onDoubleClick={() => handleDoubleClick(ticket)}
                  className={`flex text-[12px] cursor-pointer border-b border-[#d0d0d0] ${
                    selectedRow === ticket.id
                      ? "bg-[#0078d4] text-white"
                      : "bg-white hover:bg-[#f0f8ff]"
                  }`}
                >
                  {columns.map((col, colIndex) => {
                    const cellValue = getCellValue(ticket, colIndex);

                    // Checkbox columns
                    if (typeof cellValue === "object" && cellValue.type === "checkbox") {
                      return (
                        <div
                          key={colIndex}
                          className="px-2 py-1 border-r border-[#d0d0d0] flex-shrink-0 text-center overflow-hidden"
                          style={{ width: columnWidths[colIndex], maxWidth: columnWidths[colIndex] }}
                        >
                          <input
                            type="checkbox"
                            checked={cellValue.value}
                            onChange={(e) => updateTicketCheckbox(ticket.id, cellValue.field, e.target.checked)}
                            className="w-3 h-3 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      );
                    }

                    // Regular columns
                    return (
                      <div
                        key={colIndex}
                        className={`px-2 py-1 border-r border-[#d0d0d0] flex-shrink-0 overflow-hidden whitespace-nowrap text-ellipsis ${colIndex === 13 ? "text-right" : ""}`}
                        style={{ width: columnWidths[colIndex], maxWidth: columnWidths[colIndex] }}
                      >
                        {cellValue as string | number}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals Row */}
        {showTotals && (
          <div className="flex text-[12px] font-semibold bg-[#f5f5f5] border-t-2 border-[#0078d4] flex-shrink-0" style={{ minWidth: "max-content" }}>
            <div className="px-2 py-1 border-r border-[#d0d0d0] flex-shrink-0 overflow-hidden whitespace-nowrap" style={{ width: columnWidths[0], maxWidth: columnWidths[0] }}>TOTALS</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] flex-shrink-0 overflow-hidden whitespace-nowrap" style={{ width: columnWidths[1], maxWidth: columnWidths[1] }}>{totalTickets} tickets</div>
            {columns.slice(2, 13).map((_, i) => (
              <div key={i + 2} className="px-2 py-1 border-r border-[#d0d0d0] flex-shrink-0 overflow-hidden" style={{ width: columnWidths[i + 2], maxWidth: columnWidths[i + 2] }}></div>
            ))}
            <div className="px-2 py-1 border-r border-[#d0d0d0] flex-shrink-0 text-right overflow-hidden whitespace-nowrap" style={{ width: columnWidths[13], maxWidth: columnWidths[13] }}>{totalHours.toFixed(2)}</div>
            {columns.slice(14).map((_, i) => (
              <div key={i + 14} className="px-2 py-1 border-r border-[#d0d0d0] flex-shrink-0 overflow-hidden" style={{ width: columnWidths[i + 14], maxWidth: columnWidths[i + 14] }}></div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px]">
          {showTotals && (
            <>
              <span className="text-[#333]">
                <strong>Rows:</strong> {totalTickets}
              </span>
              <span className="text-[#333]">
                <strong>Hours:</strong> {totalHours.toFixed(2)}
              </span>
            </>
          )}
        </div>
        <button
          onClick={() => setShowTotals(!showTotals)}
          className={`px-2 py-0.5 text-[10px] border rounded ${
            showTotals ? "bg-[#0078d4] text-white border-[#0078d4]" : "bg-white border-[#a0a0a0] hover:bg-[#f0f0f0]"
          }`}
        >
          Totals {showTotals ? "On" : "Off"}
        </button>
      </div>
    </div>
  );
}
