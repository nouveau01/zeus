"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Pencil,
  X,
  Copy,
  ClipboardPaste,
  Filter,
  Check,
  DollarSign,
  BarChart3,
  Calendar,
  Printer,
  Upload,
  Download,
  Sigma,
  Lock,
  Home,
  HelpCircle,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";

// Toolbar icons matching Total Service Completed Tickets
const toolbarIcons = [
  { icon: FileText, color: "#4a7c59", title: "New" },
  { icon: Pencil, color: "#d4a574", title: "Edit" },
  { icon: X, color: "#c45c5c", title: "Delete" },
  { icon: Copy, color: "#6b8cae", title: "Copy" },
  { icon: ClipboardPaste, color: "#5c8c8c", title: "Paste" },
  { icon: Filter, color: "#d4c574", title: "Filter" },
  { icon: X, color: "#c45c5c", title: "Void" },
  { icon: Check, color: "#5cb85c", title: "Review" },
  { icon: DollarSign, color: "#5cb85c", title: "Bill" },
  { icon: BarChart3, color: "#e67e22", title: "Statistics" },
  { icon: Calendar, color: "#3498db", title: "Calendar" },
  { icon: Printer, color: "#9b59b6", title: "Print" },
  { icon: Upload, color: "#27ae60", title: "Export" },
  { icon: Download, color: "#27ae60", title: "Import" },
  { icon: Sigma, color: "#2c3e50", title: "Sum" },
  { icon: Lock, color: "#f39c12", title: "Lock" },
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

interface CompletedTicketsViewProps {
  premisesId?: string | null;
}

export default function CompletedTicketsView({ premisesId }: CompletedTicketsViewProps) {
  const { openTab } = useTabs();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters - default to wide date range to show all tickets
  const [catalogue, setCatalogue] = useState("None");
  const [mechanic, setMechanic] = useState("All");
  const [reviewed, setReviewed] = useState("All");
  const [billed, setBilled] = useState("All");
  const [payroll, setPayroll] = useState("All");
  const [supervisor, setSupervisor] = useState("All");
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState("2030-12-31");
  const [activeType, setActiveType] = useState("All");
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [showTotals, setShowTotals] = useState(false);

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("completedTicketsPageState");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        if (state.activeType) setActiveType(state.activeType);
        if (state.catalogue) setCatalogue(state.catalogue);
        if (state.mechanic) setMechanic(state.mechanic);
        if (state.supervisor) setSupervisor(state.supervisor);
      } catch (e) {
        console.error("Error loading saved state:", e);
      }
    }
    setFiltersLoaded(true);
  }, []);

  // Save state to localStorage (but NOT date range - always default wide)
  useEffect(() => {
    if (filtersLoaded) {
      localStorage.setItem(
        "completedTicketsPageState",
        JSON.stringify({ activeType, catalogue, mechanic, supervisor })
      );
    }
  }, [activeType, catalogue, mechanic, supervisor, filtersLoaded]);

  useEffect(() => {
    if (filtersLoaded) {
      fetchTickets();
    }
  }, [startDate, endDate, activeType, mechanic, supervisor, reviewed, billed, payroll, filtersLoaded, premisesId]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (activeType !== "All") params.set("type", activeType);
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

  const handleNewTicket = () => {
    // Tickets should be created from dispatch or job context
    alert("To create a new ticket, use the Dispatch module or create from a Job.");
  };

  const handleEditTicket = () => {
    if (!selectedId) {
      alert("Please select a ticket to edit");
      return;
    }
    const ticket = tickets.find(t => t.id === selectedId);
    if (ticket) {
      openTab(`Ticket #${ticket.ticketNumber}`, `/completed-tickets/${ticket.id}`);
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedId) {
      alert("Please select a ticket to delete");
      return;
    }
    const ticket = tickets.find(t => t.id === selectedId);
    if (!confirm(`Delete ticket #${ticket?.ticketNumber}?`)) return;

    try {
      const response = await fetch(`/api/tickets/${selectedId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchTickets();
        setSelectedId(null);
      }
    } catch (error) {
      console.error("Error deleting ticket:", error);
    }
  };

  const getToolbarAction = (title: string) => {
    switch (title) {
      case "New": return handleNewTicket;
      case "Edit": return handleEditTicket;
      case "Delete": return handleDeleteTicket;
      default: return undefined;
    }
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
  const totalTickets = tickets.length;
  const totalHours = tickets.reduce((sum, t) => sum + Number(t.hours), 0);

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

      {/* Toolbar - Clean lucide icons matching ZEUS style */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        {toolbarIcons.map((item, i) => {
          const IconComponent = item.icon;
          return (
            <button
              key={i}
              className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
              title={item.title}
              onClick={getToolbarAction(item.title)}
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

      {/* Type Tabs */}
      <div className="bg-[#f5f5f5] flex items-end px-2 pt-1 border-b border-[#d0d0d0]">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveType(tab)}
            className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
              activeType === tab
                ? "bg-white border-[#a0a0a0] border-b-white z-10 font-medium"
                : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-auto border border-[#a0a0a0] m-2 bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500">Loading...</span>
          </div>
        ) : (
          <table className="w-full border-collapse text-[11px]">
            <thead className="bg-[#f0f0f0] sticky top-0">
              <tr>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "5%" }}>Tick #</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "5%" }}>W/O#</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Date</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>Type</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>Category</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "7%" }}>ID</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Account</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Mech/Crew</th>
                <th className="px-1 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "3%" }}>Bill</th>
                <th className="px-1 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "3%" }}>Rw</th>
                <th className="px-1 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "3%" }}>PR</th>
                <th className="px-1 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "3%" }}>Vd</th>
                <th className="px-1 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "3%" }}>Inv</th>
                <th className="px-1 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "5%" }}>Hours</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "5%" }}>Invoice</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "5%" }}>Job</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>Unit</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]">Email Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={18} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                    No completed tickets found
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedId(ticket.id)}
                    onDoubleClick={() => handleDoubleClick(ticket)}
                    className={`cursor-pointer ${
                      selectedId === ticket.id
                        ? "bg-[#0078d4] text-white"
                        : "hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{ticket.ticketNumber}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{ticket.workOrderNumber || ticket.ticketNumber}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{formatDate(ticket.date)}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{ticket.type}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{ticket.category || ""}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{ticket.accountId || ""}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{ticket.premises?.address || ""}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{ticket.mechCrew || ""}</td>
                    <td className="px-1 py-0.5 text-center border border-[#d0d0d0]">
                      <input
                        type="checkbox"
                        checked={ticket.bill}
                        onChange={(e) => updateTicketCheckbox(ticket.id, "bill", e.target.checked)}
                        className="w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-0.5 text-center border border-[#d0d0d0]">
                      <input
                        type="checkbox"
                        checked={ticket.reviewed}
                        onChange={(e) => updateTicketCheckbox(ticket.id, "reviewed", e.target.checked)}
                        className="w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-0.5 text-center border border-[#d0d0d0]">
                      <input
                        type="checkbox"
                        checked={ticket.pr}
                        onChange={(e) => updateTicketCheckbox(ticket.id, "pr", e.target.checked)}
                        className="w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-0.5 text-center border border-[#d0d0d0]">
                      <input
                        type="checkbox"
                        checked={ticket.vd}
                        onChange={(e) => updateTicketCheckbox(ticket.id, "vd", e.target.checked)}
                        className="w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-0.5 text-center border border-[#d0d0d0]">
                      <input
                        type="checkbox"
                        checked={ticket.inv}
                        onChange={(e) => updateTicketCheckbox(ticket.id, "inv", e.target.checked)}
                        className="w-3 h-3 cursor-pointer"
                      />
                    </td>
                    <td className="px-1 py-0.5 text-right border border-[#d0d0d0]">{Number(ticket.hours).toFixed(2)}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{ticket.invoice?.invoiceNumber || ""}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{ticket.job?.externalId || ""}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{ticket.unitName || ""}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{ticket.emailStatus || "No Email Sent"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
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
