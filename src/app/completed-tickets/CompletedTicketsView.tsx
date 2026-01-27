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

type SortField = "ticketNumber" | "workOrder" | "date" | "type" | "category" | "accountId" | "account" | "mechCrew" | "hours" | "invoice" | "job" | "unit";
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

interface CompletedTicketsViewProps {
  premisesId?: string | null;
}

export default function CompletedTicketsView({ premisesId }: CompletedTicketsViewProps) {
  const { openTab } = useTabs();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // Filters - default to wide date range to show all tickets
  const [catalogue, setCatalogue] = useState("None");
  const [mechanic, setMechanic] = useState("All");
  const [reviewed, setReviewed] = useState("All");
  const [billed, setBilled] = useState("All");
  const [payroll, setPayroll] = useState("All");
  const [supervisor, setSupervisor] = useState("All");
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState("2030-12-31");
  const [activeTab, setActiveTab] = useState("All");
  const [showTotals, setShowTotals] = useState(false);
  const [sortField, setSortField] = useState<SortField>("ticketNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: PageState = JSON.parse(saved);
        setActiveTab(state.activeTab || "All");
        setSortField(state.sortField || "ticketNumber");
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
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (activeTab !== "All") params.set("type", activeTab);
      params.set("status", "Completed");
      if (mechanic !== "All") params.set("mechanic", mechanic);
      if (supervisor !== "All") params.set("supervisor", supervisor);
      if (reviewed !== "All") params.set("reviewed", reviewed === "Yes" ? "true" : "false");
      if (billed !== "All") params.set("billed", billed === "Yes" ? "true" : "false");
      if (payroll !== "All") params.set("payroll", payroll === "Yes" ? "true" : "false");
      if (premisesId) params.set("premisesId", premisesId);

      const response = await fetch(`/api/tickets?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
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
      setSortDirection("asc");
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
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-gray-400" />;
    return sortDirection === "asc"
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
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
        start.setDate(today.getDate() - 1);
        break;
      case "Week":
        start.setDate(today.getDate() - 7);
        break;
      case "Month":
        start.setMonth(today.getMonth() - 1);
        break;
      case "Quarter":
        start.setMonth(today.getMonth() - 3);
        break;
      case "Year":
        start.setFullYear(today.getFullYear() - 1);
        break;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  // Calculate totals
  const totalTickets = sortedTickets.length;
  const totalHours = sortedTickets.reduce((sum, t) => sum + Number(t.hours), 0);

  // Don't render until hydrated to avoid flicker
  if (!isHydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f5]">
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

  return (
    <div
      className="h-full flex flex-col bg-[#f5f5f5]"
      style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}
    >
      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Pim</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        {toolbarIcons.map((item, i) => {
          const IconComponent = item.icon;
          return (
            <button
              key={i}
              className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
              title={item.title}
              onClick={async () => {
                if (item.action === "new") {
                  // Tickets should be created from dispatch or job context
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
      <div className="bg-[#f5f5f5] flex flex-wrap items-center gap-3 px-2 py-2 border-b border-[#d0d0d0]">
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
          <span className="text-[11px]">Start</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white"
          />
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

        <div className="flex items-center gap-1">
          <span className="text-[11px]">End</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white"
          />
        </div>

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
      <div className="bg-[#f5f5f5] flex items-end px-2 pt-1">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
              activeTab === tab
                ? "bg-white border-[#c0c0c0] border-b-white z-10 font-medium"
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
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-[#f0f0f0] text-[12px] text-left">
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "5%" }}
                onClick={() => handleSort("ticketNumber")}
              >
                <div className="flex items-center gap-1">
                  Tick #
                  <SortIcon field="ticketNumber" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "5%" }}
                onClick={() => handleSort("workOrder")}
              >
                <div className="flex items-center gap-1">
                  W/O#
                  <SortIcon field="workOrder" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "10%" }}
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-1">
                  Date
                  <SortIcon field="date" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "6%" }}
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center gap-1">
                  Type
                  <SortIcon field="type" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "6%" }}
                onClick={() => handleSort("category")}
              >
                <div className="flex items-center gap-1">
                  Category
                  <SortIcon field="category" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "7%" }}
                onClick={() => handleSort("accountId")}
              >
                <div className="flex items-center gap-1">
                  ID
                  <SortIcon field="accountId" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "12%" }}
                onClick={() => handleSort("account")}
              >
                <div className="flex items-center gap-1">
                  Account
                  <SortIcon field="account" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "10%" }}
                onClick={() => handleSort("mechCrew")}
              >
                <div className="flex items-center gap-1">
                  Mech/Crew
                  <SortIcon field="mechCrew" />
                </div>
              </th>
              <th className="px-2 py-1.5 font-medium text-[#333] select-none border border-[#c0c0c0] text-center" style={{ width: "3%" }}>Bill</th>
              <th className="px-2 py-1.5 font-medium text-[#333] select-none border border-[#c0c0c0] text-center" style={{ width: "3%" }}>Rw</th>
              <th className="px-2 py-1.5 font-medium text-[#333] select-none border border-[#c0c0c0] text-center" style={{ width: "3%" }}>PR</th>
              <th className="px-2 py-1.5 font-medium text-[#333] select-none border border-[#c0c0c0] text-center" style={{ width: "3%" }}>Vd</th>
              <th className="px-2 py-1.5 font-medium text-[#333] select-none border border-[#c0c0c0] text-center" style={{ width: "3%" }}>Inv</th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0] text-right"
                style={{ width: "5%" }}
                onClick={() => handleSort("hours")}
              >
                <div className="flex items-center justify-end gap-1">
                  Hours
                  <SortIcon field="hours" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "5%" }}
                onClick={() => handleSort("invoice")}
              >
                <div className="flex items-center gap-1">
                  Invoice
                  <SortIcon field="invoice" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "5%" }}
                onClick={() => handleSort("job")}
              >
                <div className="flex items-center gap-1">
                  Job
                  <SortIcon field="job" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "6%" }}
                onClick={() => handleSort("unit")}
              >
                <div className="flex items-center gap-1">
                  Unit
                  <SortIcon field="unit" />
                </div>
              </th>
              <th className="px-2 py-1.5 font-medium text-[#333] select-none border border-[#c0c0c0]">Email Status</th>
            </tr>
          </thead>
        </table>

        {/* Data Rows */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse table-fixed">
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={18} className="p-4 text-center text-[#808080] border border-[#d0d0d0]">Loading...</td>
                </tr>
              ) : sortedTickets.length === 0 ? (
                <tr>
                  <td colSpan={18} className="p-4 text-center text-[#808080] border border-[#d0d0d0]">No completed tickets found</td>
                </tr>
              ) : (
                sortedTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedRow(ticket.id)}
                    onDoubleClick={() => handleDoubleClick(ticket)}
                    className={`text-[12px] cursor-pointer ${
                      selectedRow === ticket.id
                        ? "bg-[#0078d4] text-white"
                        : "bg-white hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "5%" }}>{ticket.ticketNumber}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "5%" }}>{ticket.workOrderNumber || ticket.ticketNumber}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "10%" }}>{formatDate(ticket.date)}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "6%" }}>{ticket.type}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "6%" }}>{ticket.category || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "7%" }}>{ticket.accountId || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "12%" }}>{ticket.premises?.address || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "10%" }}>{ticket.mechCrew || ""}</td>
                    <td className="px-2 py-1 text-center border border-[#d0d0d0]" style={{ width: "3%" }}>
                      <input
                        type="checkbox"
                        checked={ticket.bill}
                        onChange={(e) => updateTicketCheckbox(ticket.id, "bill", e.target.checked)}
                        className="w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-1 text-center border border-[#d0d0d0]" style={{ width: "3%" }}>
                      <input
                        type="checkbox"
                        checked={ticket.reviewed}
                        onChange={(e) => updateTicketCheckbox(ticket.id, "reviewed", e.target.checked)}
                        className="w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-1 text-center border border-[#d0d0d0]" style={{ width: "3%" }}>
                      <input
                        type="checkbox"
                        checked={ticket.pr}
                        onChange={(e) => updateTicketCheckbox(ticket.id, "pr", e.target.checked)}
                        className="w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-1 text-center border border-[#d0d0d0]" style={{ width: "3%" }}>
                      <input
                        type="checkbox"
                        checked={ticket.vd}
                        onChange={(e) => updateTicketCheckbox(ticket.id, "vd", e.target.checked)}
                        className="w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-1 text-center border border-[#d0d0d0]" style={{ width: "3%" }}>
                      <input
                        type="checkbox"
                        checked={ticket.inv}
                        onChange={(e) => updateTicketCheckbox(ticket.id, "inv", e.target.checked)}
                        className="w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="px-2 py-1 text-right border border-[#d0d0d0]" style={{ width: "5%" }}>{Number(ticket.hours).toFixed(2)}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "5%" }}>{ticket.invoice?.invoiceNumber || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "5%" }}>{ticket.job?.externalId || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "6%" }}>{ticket.unitName || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{ticket.emailStatus || "No Email Sent"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Bar with Totals */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        {/* Totals Display */}
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

        {/* Toggle Button */}
        <button
          onClick={() => setShowTotals(!showTotals)}
          className={`px-4 py-1 border border-[#c0c0c0] rounded text-[11px] hover:bg-[#e8e8e8] ${
            showTotals ? "bg-[#d0e8ff]" : "bg-[#f0f0f0]"
          }`}
        >
          {showTotals ? "Totals On" : "Totals Off"}
        </button>
      </div>
    </div>
  );
}
