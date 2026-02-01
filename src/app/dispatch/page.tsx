"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTabs } from "@/context/TabContext";
import { AdminTools } from "@/components/AdminTools";
import { EditableColumnHeader } from "@/components/EditableColumnHeader";
import { usePageConfig, createDefaultFields } from "@/hooks/usePageConfig";
import { getTickets, getCallHistory } from "@/lib/actions/tickets";
import { getInvoices } from "@/lib/actions/invoices";
import {
  FileText,
  Save,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  MapPin,
  Building,
  Wrench,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Plus,
  Trash2,
} from "lucide-react";

// Default field configuration for Dispatch/Call Manager
const DISPATCH_DEFAULT_FIELDS = createDefaultFields({
  ticketNumber: { label: "Ticket #", width: 70 },
  woNumber: { label: "W/O #", width: 70 },
  type: { label: "Type", width: 100 },
  account: { label: "Account", width: 120 },
  address: { label: "Address", width: 180 },
  unit: { label: "Unit", width: 60 },
  description: { label: "Description", width: 200 },
  status: { label: "Status", width: 80 },
  callDate: { label: "Call Date", width: 100 },
  scheduled: { label: "Scheduled", width: 120 },
  worker: { label: "Worker", width: 120 },
  city: { label: "City", width: 100 },
  state: { label: "State", width: 60 },
});

interface Ticket {
  id: string;
  ticketNumber: string;
  woNumber: string;
  type: "Maintenance" | "Violation" | "Other" | "NEW REPAIR";
  accountId: string;
  accountTag: string;
  address: string;
  unit: string;
  unitId?: string;
  description: string;
  status: "Open" | "Assigned" | "En Route" | "On Site" | "Completed" | "Closed";
  callDate: string;
  callTime: string;
  scheduled: string;
  worker: string;
  city: string;
  state: string;
  customerId: string;
  customerName: string;
  jobId: string;
  jobNumber: string;
}

interface TicketDetail {
  // Ticket Info
  ticketNumber: string;
  woNumber: string;
  date: string;
  time: string;
  caller: string;
  phoneNumber: string;
  takenBy: string;
  source: string;
  // Account Info
  accountId: string;
  accountTag: string;
  accountAddress: string;
  accountCity: string;
  accountState: string;
  accountZip: string;
  accountCountry: string;
  accountPhone: string;
  accountMobile: string;
  accountContact: string;
  accountEmail: string;
  // Ticket Details
  category: string;
  level: string;
  unitId?: string;
  unitNumber: string;
  nature: string;
  jobId: string;
  jobNumber: string;
  testMech: string;
  calledIn: boolean;
  highPriority: boolean;
  updateMechLocation: boolean;
  onServiceExp: string;
  // Scope & Schedule
  scopeOfWork: string;
  maintenanceNotes: string;
  followUpNotes: string;
  codes: string;
  followUpNeeded: boolean;
  notes: string;
  schedDate: string;
  schedTime: string;
  schedMech: string;
  enRouteTime: string;
  onSiteTime: string;
  completedTime: string;
  witness: string;
  // Customer Info
  customerName: string;
  customerAddress: string;
  customerCity: string;
  customerState: string;
  customerZip: string;
  customerCountry: string;
  customerPhone: string;
  customerFax: string;
  customerMobile: string;
  customerContact: string;
  customerEmail: string;
  customerSince: string;
  customerType: string;
  accountType: string;
  zone: string;
  route: string;
  territory: string;
  locsUnits: string;
  acctBalance: string;
  currBalance: string;
  accountRemarks: string;
  customerRemarks: string;
  billingRemarks: string;
}

interface OtherWorker {
  ticketNumber: string;
  worker: string;
  scheduled: string;
}

interface CallHistoryItem {
  date: string;
  callId: string;
  type: string;
  category: string;
  location: string;
  description: string;
  resolution: string;
  worker: string;
  status: string;
  est: string;
  unit: string;
}

interface LedgerItem {
  date: string;
  ref: string;
  location: string;
  desc: string;
  amount: number;
  balance: number;
  days: number;
}

export default function DispatchPage() {
  const { openTab } = useTabs();
  const [viewMode, setViewMode] = useState<"grid" | "schedule">("grid");

  // Page configuration for admin customization
  const { fields, getLabel, isVisible, getVisibleFields, updateFields, updateFieldLabel } = usePageConfig("dispatch", DISPATCH_DEFAULT_FIELDS);
  const [isEditMode, setIsEditMode] = useState(false);

  // Filters
  const [scheme, setScheme] = useState("None");
  const [statusFilter, setStatusFilter] = useState("All");
  const [workerFilter, setWorkerFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [printOnSave, setPrintOnSave] = useState(false);

  // Date range helper
  const formatDate = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateMode, setDateMode] = useState<"All" | "Day" | "Week" | "Month" | "Quarter" | "Year">("All");
  const [superMode, setSuperMode] = useState(false);

  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Sorting
  const [sortColumn, setSortColumn] = useState<keyof Ticket | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Detail tabs
  const [activeTab, setActiveTab] = useState<"ticketInfo" | "scopeSched" | "customerInfo" | "customFields" | "callHistory" | "ledger">("ticketInfo");

  // Detail data
  const [ticketDetail, setTicketDetail] = useState<TicketDetail | null>(null);
  const [otherWorkers, setOtherWorkers] = useState<OtherWorker[]>([]);
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [ledgerItems, setLedgerItems] = useState<LedgerItem[]>([]);

  // Call History filters
  const [showTicketsFilter, setShowTicketsFilter] = useState("Pending");
  const [excludeTimeCard, setExcludeTimeCard] = useState(false);
  const [showAllUnits, setShowAllUnits] = useState(false);

  // Custom fields
  const [ticketCustom, setTicketCustom] = useState({
    nhJobb: "", pms: "", collector: "COLLECTOR 4", type: "", violationAp: "",
    comm300: "", bid: "", route: "", preTest: "", custom12: "",
    custom3: "", cancelledV: "", grouping: "", resident: "", custom13: "",
    custom4: "", rateChange: "", acctRep: "JL", grouping2: "", custom14: "",
    custom5: "", custom10: "", dws: "", proposal: "", supervisor: "",
  });
  const [tfmCustom, setTfmCustom] = useState({
    signature1: "", pt: false,
    signature2: "", lsd: false,
    custom3: "",
  });

  // Column widths for resizable grid
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    selector: 20,
    ticketNumber: 70,
    woNumber: 70,
    type: 80,
    account: 180,
    address: 180,
    unit: 60,
    description: 200,
    status: 70,
    callDate: 90,
    scheduled: 120,
    worker: 90,
    city: 100,
    state: 40,
  });

  // Splitter position (percentage of container height for grid)
  const [gridHeightPercent, setGridHeightPercent] = useState(45);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizingColumn = useRef<string | null>(null);
  const isResizingSplitter = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startWidth = useRef(0);
  const startHeight = useRef(0);

  // Column resize handlers
  const handleColumnResizeStart = useCallback((e: React.MouseEvent, columnKey: string) => {
    e.preventDefault();
    isResizingColumn.current = columnKey;
    startX.current = e.clientX;
    startWidth.current = columnWidths[columnKey];
    document.addEventListener("mousemove", handleColumnResizeMove);
    document.addEventListener("mouseup", handleColumnResizeEnd);
  }, [columnWidths]);

  const handleColumnResizeMove = useCallback((e: MouseEvent) => {
    if (!isResizingColumn.current) return;
    const diff = e.clientX - startX.current;
    const newWidth = Math.max(30, startWidth.current + diff);
    setColumnWidths(prev => ({
      ...prev,
      [isResizingColumn.current!]: newWidth,
    }));
  }, []);

  const handleColumnResizeEnd = useCallback(() => {
    isResizingColumn.current = null;
    document.removeEventListener("mousemove", handleColumnResizeMove);
    document.removeEventListener("mouseup", handleColumnResizeEnd);
  }, [handleColumnResizeMove]);

  // Splitter resize handlers
  const handleSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingSplitter.current = true;
    startY.current = e.clientY;
    startHeight.current = gridHeightPercent;
    document.addEventListener("mousemove", handleSplitterMouseMove);
    document.addEventListener("mouseup", handleSplitterMouseUp);
  }, [gridHeightPercent]);

  const handleSplitterMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizingSplitter.current || !containerRef.current) return;
    const containerHeight = containerRef.current.offsetHeight;
    const diff = e.clientY - startY.current;
    const diffPercent = (diff / containerHeight) * 100;
    const newPercent = Math.min(80, Math.max(20, startHeight.current + diffPercent));
    setGridHeightPercent(newPercent);
  }, []);

  const handleSplitterMouseUp = useCallback(() => {
    isResizingSplitter.current = false;
    document.removeEventListener("mousemove", handleSplitterMouseMove);
    document.removeEventListener("mouseup", handleSplitterMouseUp);
  }, [handleSplitterMouseMove]);

  // Fetch open tickets from SQL Server
  const [loading, setLoading] = useState(true);

  // Get status row background color
  const getStatusRowColor = (status: string, isSelected: boolean) => {
    if (isSelected) return "bg-[#316ac5] text-white";
    switch (status) {
      case "On Site":
        return "bg-[#90EE90]"; // Light green
      case "Open":
        return "bg-[#FFFF99]"; // Light yellow
      case "Assigned":
        return "bg-[#ADD8E6]"; // Light blue
      case "En Route":
        return "bg-[#FFB6C1]"; // Light pink
      case "Completed":
        return "bg-[#D3D3D3]"; // Light gray
      default:
        return "hover:bg-[#f0f8ff]";
    }
  };

  // Fetch tickets when filters change
  useEffect(() => {
    fetchTickets();
  }, [statusFilter, typeFilter, startDate, endDate]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Build params for server action
      const status = statusFilter === "All" ? "All" : (statusFilter === "Completed" || statusFilter === "Closed" ? "Completed" : "Open");

      let formattedStartDate: string | undefined;
      let formattedEndDate: string | undefined;

      if (startDate) {
        const [month, day, year] = startDate.split("/");
        formattedStartDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }
      if (endDate) {
        const [month, day, year] = endDate.split("/");
        formattedEndDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }

      // Use Server Action instead of API fetch - data is pulled from SQL Server and mirrored to PostgreSQL
      const data = await getTickets({
        status: status as "Open" | "Completed" | "All",
        type: typeFilter !== "All" ? typeFilter : undefined,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
      });

      if (data && data.length >= 0) {

        // Store full API data for detail view
        const fullDataMap = new Map<string, any>();
        data.forEach((t: any) => {
          fullDataMap.set(t.id, t);
        });
        setFullTicketData(fullDataMap);

        // Map API response to expected Ticket interface
        const mappedTickets: Ticket[] = data.map((t: any) => ({
          id: t.id,
          ticketNumber: String(t.ticketNumber),
          woNumber: String(t.workOrderNumber || t.ticketNumber),
          type: t.type as "Maintenance" | "Violation" | "Other" | "NEW REPAIR",
          accountId: t.accountId || t.premises?.premisesId || "",
          accountTag: `${t.premises?.tag || t.accountId || ""}~ - ${t.premises?.address || ""}`,
          address: t.premises?.address || "",
          unit: t.unitName || "",
          unitId: t.unitId || "",
          description: t.description || "",
          status: t.status as "Open" | "Assigned" | "En Route" | "On Site" | "Completed" | "Closed",
          callDate: t.date ? new Date(t.date).toLocaleDateString() : "",
          callTime: t.date ? new Date(t.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : "",
          scheduled: t.dispatchDate ? `${new Date(t.dispatchDate).toLocaleDateString()}, ${new Date(t.dispatchDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : "",
          worker: t.mechCrew || "",
          city: t.premises?.city || "",
          state: t.premises?.state || "",
          customerId: t.premises?.customer?.id || "",
          customerName: t.premises?.customer?.name || "",
          jobId: t.jobId?.toString() || "",
          jobNumber: t.jobId?.toString() || "",
        }));
        setTickets(mappedTickets);

        // Apply client-side filters for worker and zone
        let filtered = mappedTickets;
        if (workerFilter !== "All") {
          filtered = filtered.filter(t => t.worker === workerFilter);
        }
        // Zone filter would need zone data from premises

        setFilteredTickets(filtered);
        if (filtered.length > 0 && !selectedTicket) {
          setSelectedTicket(filtered[0]);
          loadTicketDetail(filtered[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle column sort
  const handleSort = (column: keyof Ticket) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New column, start with ascending
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Apply client-side filters and sorting when worker/zone/sort changes
  useEffect(() => {
    let filtered = [...tickets];

    // Apply filters
    if (workerFilter !== "All") {
      filtered = filtered.filter(t => t.worker === workerFilter);
    }
    if (zoneFilter !== "All") {
      // Would filter by zone if available
    }

    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn] ?? "";
        const bVal = b[sortColumn] ?? "";

        // Handle numeric sorting for ticket numbers
        if (sortColumn === "ticketNumber" || sortColumn === "woNumber") {
          const aNum = parseInt(String(aVal)) || 0;
          const bNum = parseInt(String(bVal)) || 0;
          return sortDirection === "asc" ? aNum - bNum : bNum - aNum;
        }

        // String comparison for other fields
        const comparison = String(aVal).localeCompare(String(bVal));
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    setFilteredTickets(filtered);
  }, [workerFilter, zoneFilter, tickets, sortColumn, sortDirection]);

  // Store full ticket data from API for detail view
  const [fullTicketData, setFullTicketData] = useState<Map<string, any>>(new Map());

  const loadTicketDetail = async (ticket: Ticket) => {
    // Get the full ticket data from our stored API response
    const apiTicket = fullTicketData.get(ticket.id);

    // Build detail from API data or ticket data
    const detail: TicketDetail = {
      ticketNumber: ticket.ticketNumber,
      woNumber: ticket.woNumber,
      date: apiTicket?.date ? new Date(apiTicket.date).toLocaleDateString() : ticket.callDate,
      time: apiTicket?.time || ticket.callTime,
      caller: apiTicket?.caller || apiTicket?.who || "",
      phoneNumber: apiTicket?.phone || "",
      takenBy: apiTicket?.takenBy || apiTicket?.createdBy || "",
      source: apiTicket?.source || "GENERAL",
      accountId: ticket.accountId,
      accountTag: ticket.accountTag.split("~")[0],
      accountAddress: apiTicket?.premises?.address || ticket.address,
      accountCity: apiTicket?.premises?.city || ticket.city,
      accountState: apiTicket?.premises?.state || ticket.state,
      accountZip: apiTicket?.premises?.zip || "",
      accountCountry: apiTicket?.premises?.country || "United States",
      accountPhone: apiTicket?.premises?.phone || "",
      accountMobile: apiTicket?.premises?.mobile || "",
      accountContact: apiTicket?.premises?.contact || "",
      accountEmail: apiTicket?.premises?.email || "",
      category: apiTicket?.category || "None",
      level: apiTicket?.level ? `${apiTicket.level}-Service Call` : "1-Service Call",
      unitId: ticket.unitId,
      unitNumber: ticket.unit,
      nature: apiTicket?.jobId ? "Existing Job" : "New Job",
      jobId: ticket.jobId,
      jobNumber: ticket.jobNumber,
      testMech: "Mechanic",
      calledIn: apiTicket?.calledIn || false,
      highPriority: apiTicket?.highPriority || false,
      updateMechLocation: false,
      onServiceExp: "",
      scopeOfWork: apiTicket?.scopeOfWork || apiTicket?.description || ticket.description,
      maintenanceNotes: apiTicket?.notes || "",
      followUpNotes: "",
      codes: "",
      followUpNeeded: apiTicket?.followUp || false,
      notes: apiTicket?.notes || "",
      schedDate: apiTicket?.scheduledDate ? new Date(apiTicket.scheduledDate).toLocaleDateString() : "",
      schedTime: apiTicket?.scheduledTime || "",
      schedMech: apiTicket?.scheduledMech || ticket.worker,
      enRouteTime: apiTicket?.enRouteTime || "",
      onSiteTime: apiTicket?.onSiteTime || "",
      completedTime: apiTicket?.completedTime || "",
      witness: apiTicket?.witness || "",
      customerName: apiTicket?.premises?.customer?.name || ticket.customerName,
      customerAddress: apiTicket?.premises?.customer?.address || "",
      customerCity: apiTicket?.premises?.customer?.city || "",
      customerState: apiTicket?.premises?.customer?.state || ticket.state,
      customerZip: apiTicket?.premises?.customer?.zip || "",
      customerCountry: apiTicket?.premises?.customer?.country || "United States",
      customerPhone: apiTicket?.premises?.customer?.phone || "",
      customerFax: apiTicket?.premises?.customer?.fax || "",
      customerMobile: apiTicket?.premises?.customer?.mobile || "",
      customerContact: apiTicket?.premises?.customer?.contact || "",
      customerEmail: apiTicket?.premises?.customer?.email || "",
      customerSince: "",
      customerType: "General",
      accountType: "S",
      zone: apiTicket?.premises?.zone || "",
      route: apiTicket?.premises?.route || "",
      territory: apiTicket?.premises?.territory || "",
      locsUnits: "",
      acctBalance: "",
      currBalance: "",
      accountRemarks: apiTicket?.premises?.remarks || "",
      customerRemarks: apiTicket?.premises?.customer?.remarks || "",
      billingRemarks: "",
    };
    setTicketDetail(detail);

    // Clear other workers for now (would need separate API)
    setOtherWorkers([]);

    // Fetch call history for this premises
    if (apiTicket?.premises?.id) {
      fetchCallHistory(apiTicket.premises.id);
    } else {
      setCallHistory([]);
    }

    // Fetch ledger for this customer
    if (apiTicket?.premises?.customer?.id) {
      fetchLedger(apiTicket.premises.customer.id);
    } else {
      setLedgerItems([]);
    }
  };

  // Fetch call history for a premises
  const fetchCallHistory = async (premisesId: string) => {
    try {
      // Use Server Action - pulls from SQL Server and mirrors to PostgreSQL
      const allTickets = await getCallHistory(premisesId);

      // Map to call history format
      const history: CallHistoryItem[] = allTickets.slice(0, 20).map((t: any) => ({
        date: t.date ? new Date(t.date).toLocaleDateString() : "",
        callId: t.id,
        type: t.type,
        category: t.category || "None",
        location: `${t.premises?.address || ""}\nCITY ID: ${t.unitName || ""}`,
        description: t.description || t.scopeOfWork || "",
        resolution: t.resolution || "",
        worker: t.mechCrew || "",
        status: t.status,
        est: t.estimate?.toString() || "0.00",
        unit: t.unitName || "",
      }));

      setCallHistory(history);
    } catch (error) {
      console.error("Error fetching call history:", error);
      setCallHistory([]);
    }
  };

  // Fetch ledger for a customer
  const fetchLedger = async (customerId: string) => {
    try {
      // Use Server Action - pulls from SQL Server and mirrors to PostgreSQL
      const data = await getInvoices({ customerId, limit: 20 });

      // Map to ledger format
      let runningBalance = 0;
      const ledger: LedgerItem[] = data.map((inv: any) => {
        const amount = parseFloat(inv.total || inv.amount || 0);
        runningBalance += amount;
        const invDate = new Date(inv.date || inv.invoiceDate);
        const daysDiff = Math.floor((Date.now() - invDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          date: invDate.toLocaleDateString(),
          ref: inv.invoiceNumber || inv.id,
          location: inv.premisesTag || inv.location || "",
          desc: inv.description || "",
          amount: amount,
          balance: amount, // Would need proper balance calculation
          days: daysDiff,
        };
      });

      setLedgerItems(ledger);
    } catch (error) {
      console.error("Error fetching ledger:", error);
      setLedgerItems([]);
    }
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    loadTicketDetail(ticket);
  };

  // Navigation handlers
  const handleNavigateToAccount = () => {
    if (ticketDetail) {
      openTab(ticketDetail.accountTag, `/accounts/${ticketDetail.accountId}`);
    }
  };

  const handleNavigateToUnit = () => {
    if (ticketDetail && ticketDetail.unitId) {
      openTab(`Unit ${ticketDetail.unitNumber}`, `/units/${ticketDetail.unitId}`);
    }
  };

  const handleNavigateToJob = () => {
    if (ticketDetail && ticketDetail.jobId) {
      openTab(`Job ${ticketDetail.jobNumber}`, `/job-maintenance/${ticketDetail.jobId}`);
    }
  };

  const handleNavigateToCustomer = () => {
    if (selectedTicket) {
      openTab(selectedTicket.customerName, `/customers/${selectedTicket.customerId}`);
    }
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  // Date quick buttons
  const handleDateMode = (mode: "All" | "Day" | "Week" | "Month" | "Quarter" | "Year") => {
    setDateMode(mode);
    const today = new Date();

    if (mode === "All") {
      setStartDate("");
      setEndDate("");
    } else if (mode === "Day") {
      setStartDate(formatDate(today));
      setEndDate(formatDate(today));
    } else if (mode === "Week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      setStartDate(formatDate(weekAgo));
      setEndDate(formatDate(today));
    } else if (mode === "Month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      setStartDate(formatDate(monthAgo));
      setEndDate(formatDate(today));
    } else if (mode === "Quarter") {
      const quarterAgo = new Date(today);
      quarterAgo.setMonth(today.getMonth() - 3);
      setStartDate(formatDate(quarterAgo));
      setEndDate(formatDate(today));
    } else if (mode === "Year") {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(today.getFullYear() - 1);
      setStartDate(formatDate(yearAgo));
      setEndDate(formatDate(today));
    }
  };

  // Toolbar handlers
  const handleNewTicket = () => {
    openTab("New Ticket", "/open-tickets/new");
  };

  const handleSave = () => {
    alert("Save functionality - This is a read-only view of SQL Server data.");
  };

  const handleRefresh = () => {
    fetchTickets();
  };

  const handleSearch = () => {
    const searchTerm = prompt("Search tickets by number, account, or address:");
    if (searchTerm) {
      const filtered = tickets.filter(t =>
        t.ticketNumber.includes(searchTerm) ||
        t.accountTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTickets(filtered);
    }
  };

  const handleDelete = () => {
    if (selectedTicket) {
      alert("Delete functionality - This is a read-only view of SQL Server data.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Navigation in list
  const handleFirst = () => {
    if (filteredTickets.length > 0) {
      setSelectedTicket(filteredTickets[0]);
      loadTicketDetail(filteredTickets[0]);
    }
  };

  const handlePrevious = () => {
    if (selectedTicket && filteredTickets.length > 0) {
      const currentIndex = filteredTickets.findIndex(t => t.id === selectedTicket.id);
      if (currentIndex > 0) {
        const prevTicket = filteredTickets[currentIndex - 1];
        setSelectedTicket(prevTicket);
        loadTicketDetail(prevTicket);
      }
    }
  };

  const handleNext = () => {
    if (selectedTicket && filteredTickets.length > 0) {
      const currentIndex = filteredTickets.findIndex(t => t.id === selectedTicket.id);
      if (currentIndex < filteredTickets.length - 1) {
        const nextTicket = filteredTickets[currentIndex + 1];
        setSelectedTicket(nextTicket);
        loadTicketDetail(nextTicket);
      }
    }
  };

  const handleLast = () => {
    if (filteredTickets.length > 0) {
      const lastTicket = filteredTickets[filteredTickets.length - 1];
      setSelectedTicket(lastTicket);
      loadTicketDetail(lastTicket);
    }
  };

  const workers = ["All", "MORRISON S", "ALMONTE E", "CANZONA C", "NGONZALEZ"];
  const types = ["All", "Maintenance", "Violation", "Other", "NEW REPAIR"];
  const statuses = ["All", "Open", "Assigned", "En Route", "On Site", "Completed", "Closed"];
  const zones = ["All", "DIVISION #1", "DIVISION #2", "DIVISION #3", "DIVISION #4", "DIVISION #5"];
  const schemes = ["None", "Priority", "Zone", "Worker", "Type"];
  const sources = ["GENERAL", "PHONE", "EMAIL", "WALK-IN", "WEB"];
  const levels = ["1-Service Call", "2-Emergency", "3-PM", "4-Annual Test", "5-Violation"];
  const natures = ["Existing Job", "New Job", "Callback", "Warranty"];
  const categories = ["None", "Maintenance", "Repair", "Installation", "Inspection"];

  return (
    <div className="h-full flex flex-col bg-[#c0c0c0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
        <span className="font-bold text-[13px]">Call Manager - Editing Existing Call</span>
        <div className="flex items-center gap-2">
          <AdminTools
            pageId="dispatch"
            fields={fields}
            onFieldsChange={updateFields}
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
          />
          <div className="flex items-center gap-1">
            <button className="hover:bg-[#ffffff30] px-1 rounded text-[11px]">_</button>
            <button className="hover:bg-[#ffffff30] px-1 rounded text-[11px]">□</button>
            <button className="hover:bg-[#ff0000] px-1 rounded text-[11px]">×</button>
          </div>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-white flex items-center px-1 py-0.5 border-b border-[#808080]">
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">File</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Records</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Tools</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Options</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">View</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#808080] gap-0.5 flex-wrap">
        <button onClick={handleNewTicket} title="New Ticket" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button onClick={handleSave} title="Save" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Save className="w-4 h-4" style={{ color: "#4a90d9" }} />
        </button>
        <button onClick={handleRefresh} title="Refresh" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <RotateCcw className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button onClick={handleSearch} title="Search" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Search className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button title="Mark Complete" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[12px] font-bold" style={{ color: "#e74c3c" }}>✓</span>
        </button>
        <button title="Approve" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[12px] font-bold" style={{ color: "#27ae60" }}>✓</span>
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button onClick={handleNewTicket} title="Add New" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Plus className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button onClick={handleDelete} title="Delete" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Trash2 className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button title="Filter" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Filter className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button onClick={handlePrint} title="Print" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Printer className="w-4 h-4" style={{ color: "#34495e" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button onClick={handleFirst} title="First" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronsLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button onClick={handlePrevious} title="Previous" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button onClick={handleNext} title="Next" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button onClick={handleLast} title="Last" className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronsRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#808080] gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Scheme</label>
          <select value={scheme} onChange={(e) => setScheme(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white min-w-[70px]">
            {schemes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white min-w-[60px]">
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Worker:</label>
          <select value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white min-w-[60px]">
            {workers.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Type:</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white min-w-[60px]">
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Zone:</label>
          <select value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white min-w-[60px]">
            {zones.map(z => <option key={z} value={z}>{z}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <label className="flex items-center gap-1 text-[11px]">
            <input type="checkbox" checked={printOnSave} onChange={(e) => setPrintOnSave(e.target.checked)} />
            Print On Save
          </label>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setViewMode(viewMode === "grid" ? "schedule" : "grid")}
          className="px-2 py-0.5 border border-[#808080] bg-white text-[11px] hover:bg-[#e0e0e0]"
        >
          {viewMode === "grid" ? "Schedule View" : "Grid View"}
        </button>
      </div>

      {/* Date Range Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#808080] gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Start</label>
          <input type="text" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">End</label>
          <input type="text" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
        </div>
        <div className="flex items-center gap-0.5">
          {(["All", "Day", "Week", "Month", "Quarter", "Year"] as const).map(mode => (
            <button
              key={mode}
              onClick={() => handleDateMode(mode)}
              className={`px-2 py-0.5 border text-[11px] ${dateMode === mode ? "bg-[#316ac5] text-white border-[#316ac5]" : "bg-white border-[#808080] hover:bg-[#e0e0e0]"}`}
            >
              {mode}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-[11px]">
          <input type="checkbox" checked={superMode} onChange={(e) => setSuperMode(e.target.checked)} />
          Super
        </label>
        <select className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
          <option>All</option>
        </select>
      </div>

      {/* Main Content - Grid + Detail Panel */}
      <div ref={containerRef} className="flex-1 flex flex-col overflow-hidden">
        {/* Ticket Grid */}
        <div className="overflow-auto bg-white border border-[#808080] m-1" style={{ height: `${gridHeightPercent}%`, minHeight: "100px" }}>
          <table className="border-collapse text-[11px]" style={{ minWidth: "max-content" }}>
            <thead className="bg-[#f0f0f0] sticky top-0">
              <tr>
                <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0] relative" style={{ width: columnWidths.selector, minWidth: columnWidths.selector }}>
                  <div
                    className="absolute right-[-4px] top-0 bottom-0 w-[9px] cursor-col-resize z-10 group"
                    onMouseDown={(e) => handleColumnResizeStart(e, "selector")}
                  >
                    <div className="absolute top-0 left-[4px] w-[1px] h-full bg-transparent group-hover:bg-[#316ac5]" />
                  </div>
                </th>
                <EditableColumnHeader
                  fieldName="ticketNumber"
                  label={getLabel("ticketNumber")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("ticketNumber")}
                  width={columnWidths.ticketNumber}
                  onResizeStart={(e) => handleColumnResizeStart(e, "ticketNumber")}
                />
                <EditableColumnHeader
                  fieldName="woNumber"
                  label={getLabel("woNumber")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("woNumber")}
                  width={columnWidths.woNumber}
                  onResizeStart={(e) => handleColumnResizeStart(e, "woNumber")}
                />
                <EditableColumnHeader
                  fieldName="type"
                  label={getLabel("type")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("type")}
                  width={columnWidths.type}
                  onResizeStart={(e) => handleColumnResizeStart(e, "type")}
                />
                <EditableColumnHeader
                  fieldName="account"
                  label={getLabel("account")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("accountTag")}
                  width={columnWidths.account}
                  onResizeStart={(e) => handleColumnResizeStart(e, "account")}
                />
                <EditableColumnHeader
                  fieldName="address"
                  label={getLabel("address")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("address")}
                  width={columnWidths.address}
                  onResizeStart={(e) => handleColumnResizeStart(e, "address")}
                />
                <EditableColumnHeader
                  fieldName="unit"
                  label={getLabel("unit")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("unit")}
                  width={columnWidths.unit}
                  onResizeStart={(e) => handleColumnResizeStart(e, "unit")}
                />
                <EditableColumnHeader
                  fieldName="description"
                  label={getLabel("description")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("description")}
                  width={columnWidths.description}
                  onResizeStart={(e) => handleColumnResizeStart(e, "description")}
                />
                <EditableColumnHeader
                  fieldName="status"
                  label={getLabel("status")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("status")}
                  width={columnWidths.status}
                  onResizeStart={(e) => handleColumnResizeStart(e, "status")}
                />
                <EditableColumnHeader
                  fieldName="callDate"
                  label={getLabel("callDate")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("callDate")}
                  width={columnWidths.callDate}
                  onResizeStart={(e) => handleColumnResizeStart(e, "callDate")}
                />
                <EditableColumnHeader
                  fieldName="scheduled"
                  label={getLabel("scheduled")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("scheduled")}
                  width={columnWidths.scheduled}
                  onResizeStart={(e) => handleColumnResizeStart(e, "scheduled")}
                />
                <EditableColumnHeader
                  fieldName="worker"
                  label={getLabel("worker")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("worker")}
                  width={columnWidths.worker}
                  onResizeStart={(e) => handleColumnResizeStart(e, "worker")}
                />
                <EditableColumnHeader
                  fieldName="city"
                  label={getLabel("city")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("city")}
                  width={columnWidths.city}
                  onResizeStart={(e) => handleColumnResizeStart(e, "city")}
                />
                <EditableColumnHeader
                  fieldName="state"
                  label={getLabel("state")}
                  isEditMode={isEditMode}
                  onLabelChange={updateFieldLabel}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={() => handleSort("state")}
                  width={columnWidths.state}
                  onResizeStart={(e) => handleColumnResizeStart(e, "state")}
                />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                    Loading tickets...
                  </td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                    No tickets found
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => handleTicketSelect(ticket)}
                    className={`cursor-pointer ${getStatusRowColor(ticket.status, selectedTicket?.id === ticket.id)}`}
                  >
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.selector, maxWidth: columnWidths.selector }}>{selectedTicket?.id === ticket.id && "▶"}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.ticketNumber, maxWidth: columnWidths.ticketNumber }}>{ticket.ticketNumber}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.woNumber, maxWidth: columnWidths.woNumber }}>{ticket.woNumber}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.type, maxWidth: columnWidths.type }}>{ticket.type}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.account, maxWidth: columnWidths.account }}>{ticket.accountTag}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.address, maxWidth: columnWidths.address }}>{ticket.address}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.unit, maxWidth: columnWidths.unit }}>{ticket.unit}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.description, maxWidth: columnWidths.description }}>{ticket.description}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.status, maxWidth: columnWidths.status }}>{ticket.status}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.callDate, maxWidth: columnWidths.callDate }}>{ticket.callDate}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.scheduled, maxWidth: columnWidths.scheduled }}>{ticket.scheduled}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.worker, maxWidth: columnWidths.worker }}>{ticket.worker}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.city, maxWidth: columnWidths.city }}>{ticket.city}</td>
                    <td className="px-1 py-0.5 border border-[#e0e0e0] overflow-hidden text-ellipsis whitespace-nowrap" style={{ width: columnWidths.state, maxWidth: columnWidths.state }}>{ticket.state}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resizable Splitter */}
        <div
          className="h-2 mx-1 bg-[#c0c0c0] cursor-row-resize hover:bg-[#316ac5] flex items-center justify-center"
          onMouseDown={handleSplitterMouseDown}
        >
          <div className="w-8 h-1 bg-[#808080] rounded" />
        </div>

        {/* Detail Panel */}
        <div className="flex-1 bg-white border border-[#808080] m-1 flex flex-col overflow-hidden" style={{ minHeight: "100px" }}>
          {/* Detail Tabs */}
          <div className="flex border-b border-[#808080]">
            <button onClick={() => setActiveTab("ticketInfo")} className={`px-3 py-1 text-[11px] border-r border-[#808080] ${activeTab === "ticketInfo" ? "bg-white font-medium" : "bg-[#d4d0c8]"}`}>
              1 Ticket Info
            </button>
            <button onClick={() => setActiveTab("scopeSched")} className={`px-3 py-1 text-[11px] border-r border-[#808080] ${activeTab === "scopeSched" ? "bg-white font-medium" : "bg-[#d4d0c8]"}`}>
              2 Scope & Sched
            </button>
            <button onClick={() => setActiveTab("customerInfo")} className={`px-3 py-1 text-[11px] border-r border-[#808080] ${activeTab === "customerInfo" ? "bg-white font-medium" : "bg-[#d4d0c8]"}`}>
              3 Customer Info
            </button>
            <button onClick={() => setActiveTab("customFields")} className={`px-3 py-1 text-[11px] border-r border-[#808080] ${activeTab === "customFields" ? "bg-white font-medium" : "bg-[#d4d0c8]"}`}>
              4 Custom Fields
            </button>
            <button onClick={() => setActiveTab("callHistory")} className={`px-3 py-1 text-[11px] border-r border-[#808080] ${activeTab === "callHistory" ? "bg-white font-medium" : "bg-[#d4d0c8]"}`}>
              5 Call History
            </button>
            <button onClick={() => setActiveTab("ledger")} className={`px-3 py-1 text-[11px] ${activeTab === "ledger" ? "bg-white font-medium text-[#e74c3c]" : "bg-[#d4d0c8] text-[#e74c3c]"}`}>
              6 Ledger
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-auto p-2">
            {/* Tab 1 - Ticket Info */}
            {activeTab === "ticketInfo" && ticketDetail && (
              <div className="flex gap-4">
                {/* Left Column */}
                <div className="flex flex-col gap-1 min-w-[180px]">
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Ticket #</label>
                    <input type="text" value={ticketDetail.ticketNumber} readOnly className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-[#f0f0f0] w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">W/O #</label>
                    <input type="text" value={ticketDetail.woNumber} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-[#ffffe1] w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Date</label>
                    <input type="text" value={ticketDetail.date} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Time</label>
                    <input type="text" value={ticketDetail.time} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Caller</label>
                    <select value={ticketDetail.caller} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]">
                      <option>New</option>
                      <option>Who</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Phone #</label>
                    <input type="text" value={ticketDetail.phoneNumber} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Taken By</label>
                    <input type="text" value={ticketDetail.takenBy} readOnly className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-[#f0f0f0] w-[80px]" />
                  </div>
                  <button className="px-2 py-0.5 border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[11px] mt-1">
                    Called Again
                  </button>
                  <div className="flex items-center gap-1 mt-1">
                    <label className="w-14 text-[11px]">Source</label>
                    <select value={ticketDetail.source} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]">
                      {sources.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Middle Column - Account Info */}
                <div className="flex flex-col gap-1 min-w-[220px]">
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px] text-[#ffcc00] bg-[#000080] px-1">Account</label>
                    <input
                      type="text"
                      value={ticketDetail.accountTag}
                      readOnly
                      onClick={handleNavigateToAccount}
                      className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white text-[#0000ff] cursor-pointer hover:underline"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">ID</label>
                    <input type="text" value={ticketDetail.accountId} readOnly className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-[#f0f0f0]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Address</label>
                    <input type="text" value={ticketDetail.accountAddress} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">City</label>
                    <input type="text" value={ticketDetail.accountCity} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">State</label>
                    <select value={ticketDetail.accountState} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[50px]">
                      <option>NY</option>
                      <option>NJ</option>
                      <option>CT</option>
                    </select>
                    <label className="text-[11px] ml-1">Zip</label>
                    <input type="text" value={ticketDetail.accountZip} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[60px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Country</label>
                    <input type="text" value={ticketDetail.accountCountry} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Phone</label>
                    <input type="text" value={ticketDetail.accountPhone} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                    <label className="text-[11px]">Mobile</label>
                    <input type="text" value={ticketDetail.accountMobile} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Contact</label>
                    <input type="text" value={ticketDetail.accountContact} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                    <label className="text-[11px]">E-Mail</label>
                    <span
                      onClick={() => handleEmailClick(ticketDetail.accountEmail)}
                      className="text-[11px] text-[#0000ff] cursor-pointer hover:underline"
                    >
                      {ticketDetail.accountEmail}
                    </span>
                  </div>
                </div>

                {/* Right Column - Ticket Details */}
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Category</label>
                    <select value={ticketDetail.category} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Level</label>
                    <select value={ticketDetail.level} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      {levels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px] text-[#0000ff]">Unit</label>
                    <span
                      onClick={handleNavigateToUnit}
                      className="text-[11px] text-[#0000ff] cursor-pointer hover:underline"
                    >
                      {ticketDetail.unitNumber}
                    </span>
                    <span className="text-[11px] ml-2">Route: 507, ALMONTE E</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Nature</label>
                    <select value={ticketDetail.nature} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      {natures.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px] text-[#0000ff]">Job</label>
                    <span
                      onClick={handleNavigateToJob}
                      className="text-[11px] text-[#0000ff] cursor-pointer hover:underline"
                    >
                      {ticketDetail.jobNumber}
                    </span>
                    <button className="px-1 border border-[#808080] bg-white text-[11px] ml-1">...</button>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" />
                      Test
                    </label>
                    <label className="text-[11px] ml-2">Mech</label>
                    <select value={ticketDetail.testMech} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      <option>Mechanic</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={ticketDetail.calledIn} onChange={() => {}} />
                      Called In
                    </label>
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={ticketDetail.highPriority} onChange={() => {}} />
                      High Priority
                    </label>
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={ticketDetail.updateMechLocation} onChange={() => {}} />
                      Update Mechanic Location
                    </label>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[11px] text-[#27ae60] font-bold">On Service</span>
                    <label className="text-[11px] ml-2">Exp</label>
                    <input type="text" value={ticketDetail.onServiceExp} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2 - Scope & Schedule */}
            {activeTab === "scopeSched" && ticketDetail && (
              <div className="flex gap-4">
                {/* Left - Scope of Work */}
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px] font-bold">SCOPE OF WORK</label>
                  <textarea
                    value={ticketDetail.scopeOfWork}
                    className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[60px]"
                  />
                  <label className="text-[11px] font-bold mt-2">MAINTENANCE</label>
                  <textarea
                    value={ticketDetail.maintenanceNotes}
                    className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[80px]"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={ticketDetail.followUpNeeded} onChange={() => {}} />
                      F/U - Follow Up Needed
                    </label>
                  </div>
                  <label className="text-[11px]">- Notes -</label>
                  <input type="text" value={ticketDetail.notes} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                </div>

                {/* Right - Scheduling */}
                <div className="min-w-[250px] flex flex-col gap-1 border border-[#808080] p-2 bg-white">
                  <label className="text-[11px] font-bold">SCHEDULING</label>
                  <div className="flex items-center gap-1">
                    <label className="w-12 text-[11px]">Date</label>
                    <input type="text" value={ticketDetail.schedDate} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="radio" name="timeType" />
                      S
                    </label>
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="radio" name="timeType" />
                      E
                    </label>
                    <label className="text-[11px]">Est Time</label>
                    <input type="text" value="0:0" className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[40px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-12 text-[11px]">Time</label>
                    <select className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      <option>En Route</option>
                      <option>On Site</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-12 text-[11px]">Mech</label>
                    <select value={ticketDetail.schedMech} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      {workers.filter(w => w !== "All").map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                    <label className="text-[11px]">Completed</label>
                    <input type="text" value={ticketDetail.completedTime} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[60px]" />
                  </div>
                  <div className="mt-2">
                    <label className="text-[11px] font-bold">WITNESS</label>
                    <input type="text" value={ticketDetail.witness} className="w-full px-1 py-0.5 border border-[#808080] text-[11px] bg-white mt-1" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold">OTHER WORKERS</label>
                      <label className="flex items-center gap-1 text-[11px]">
                        <input type="checkbox" />
                        On Hold
                      </label>
                    </div>
                    <table className="w-full border-collapse text-[11px] mt-1">
                      <thead className="bg-[#f0f0f0]">
                        <tr>
                          <th className="px-1 py-0.5 text-left border border-[#c0c0c0]">Ticket #</th>
                          <th className="px-1 py-0.5 text-left border border-[#c0c0c0]">Worker</th>
                          <th className="px-1 py-0.5 text-left border border-[#c0c0c0]">Scheduled</th>
                        </tr>
                      </thead>
                      <tbody>
                        {otherWorkers.map((w, i) => (
                          <tr key={i}>
                            <td className="px-1 py-0.5 border border-[#e0e0e0]">{w.ticketNumber}</td>
                            <td className="px-1 py-0.5 border border-[#e0e0e0]">{w.worker}</td>
                            <td className="px-1 py-0.5 border border-[#e0e0e0]">{w.scheduled}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3 - Customer Info */}
            {activeTab === "customerInfo" && ticketDetail && (
              <div className="flex gap-4">
                {/* Left - Customer Details */}
                <div className="flex flex-col gap-1 min-w-[200px]">
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Name</label>
                    <input
                      type="text"
                      value={ticketDetail.customerName}
                      onClick={handleNavigateToCustomer}
                      className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white text-[#0000ff] cursor-pointer hover:underline"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Address</label>
                    <input type="text" value={ticketDetail.customerAddress} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">City</label>
                    <input type="text" value={ticketDetail.customerCity} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">State</label>
                    <select value={ticketDetail.customerState} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[50px]">
                      <option>NY</option>
                      <option>NJ</option>
                    </select>
                    <label className="text-[11px]">Zip</label>
                    <input type="text" value={ticketDetail.customerZip} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[60px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Country</label>
                    <input type="text" value={ticketDetail.customerCountry} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Phone</label>
                    <input type="text" value={ticketDetail.customerPhone} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                    <label className="text-[11px]">Fax</label>
                    <input type="text" value={ticketDetail.customerFax} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Mobile</label>
                    <input type="text" value={ticketDetail.customerMobile} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                    <label className="text-[11px]">Contact</label>
                    <input type="text" value={ticketDetail.customerContact} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">E-Mail</label>
                    <span onClick={() => handleEmailClick(ticketDetail.customerEmail)} className="text-[11px] text-[#0000ff] cursor-pointer hover:underline">
                      {ticketDetail.customerEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Since</label>
                    <input type="text" value={ticketDetail.customerSince} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                </div>

                {/* Middle - Account Type Info */}
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Customer Type</label>
                    <select value={ticketDetail.customerType} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      <option>General</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Account Type</label>
                    <select value={ticketDetail.accountType} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      <option>S</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Zone</label>
                    <select value={ticketDetail.zone} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      {zones.filter(z => z !== "All").map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Route</label>
                    <input type="text" value={ticketDetail.route} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Territory</label>
                    <select value={ticketDetail.territory} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      <option>RS</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]"># Locs/Units</label>
                    <input type="text" value={ticketDetail.locsUnits} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[40px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Acct Balance</label>
                    <input type="text" value={ticketDetail.acctBalance} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Curr Balance</label>
                    <input type="text" value={ticketDetail.currBalance} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                </div>

                {/* Right - Remarks */}
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px]">Account Remarks</label>
                  <textarea value={ticketDetail.accountRemarks} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[40px]" />
                  <label className="text-[11px]">Customer Remarks</label>
                  <textarea value={ticketDetail.customerRemarks} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[40px]" />
                  <label className="text-[11px]">Billing Remarks</label>
                  <textarea value={ticketDetail.billingRemarks} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[40px]" />
                </div>
              </div>
            )}

            {/* Tab 4 - Custom Fields */}
            {activeTab === "customFields" && (
              <div className="flex flex-col gap-4">
                <div className="flex gap-8">
                  {/* Ticket Custom */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold">Ticket Custom</label>
                    <div className="grid grid-cols-5 gap-1 text-[11px]">
                      <div className="flex items-center gap-1"><label className="w-16">NH JOBB</label><input type="text" value={ticketCustom.nhJobb} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">PMS</label><input type="text" value={ticketCustom.pms} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">COLLECTOR</label><input type="text" value={ticketCustom.collector} className="w-[80px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Type</label><input type="text" value={ticketCustom.type} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">ViolationAp</label><input type="text" value={ticketCustom.violationAp} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>

                      <div className="flex items-center gap-1"><label className="w-16">300 COMM #</label><input type="text" value={ticketCustom.comm300} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">BID</label><input type="text" value={ticketCustom.bid} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">ROUTE</label><input type="text" value={ticketCustom.route} className="w-[80px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Pre Test</label><input type="text" value={ticketCustom.preTest} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">Custom 12</label><input type="text" value={ticketCustom.custom12} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>

                      <div className="flex items-center gap-1"><label className="w-16">Custom3</label><input type="text" value={ticketCustom.custom3} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Cancelled V</label><input type="text" value={ticketCustom.cancelledV} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">GROUPING</label><input type="text" value={ticketCustom.grouping} className="w-[80px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Resident</label><input type="text" value={ticketCustom.resident} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">Custom 13</label><input type="text" value={ticketCustom.custom13} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>

                      <div className="flex items-center gap-1"><label className="w-16">Custom4</label><input type="text" value={ticketCustom.custom4} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Rate Change</label><input type="text" value={ticketCustom.rateChange} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">Acct Rep</label><input type="text" value={ticketCustom.acctRep} className="w-[80px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Grouping 2</label><input type="text" value={ticketCustom.grouping2} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">Custom 14</label><input type="text" value={ticketCustom.custom14} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>

                      <div className="flex items-center gap-1"><label className="w-16">Custom5</label><input type="text" value={ticketCustom.custom5} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Custom10</label><input type="text" value={ticketCustom.custom10} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">DWS</label><input type="text" value={ticketCustom.dws} className="w-[80px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-10">Proposal</label><input type="text" value={ticketCustom.proposal} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                      <div className="flex items-center gap-1"><label className="w-16">Supervisor</label><input type="text" value={ticketCustom.supervisor} className="w-[60px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                    </div>
                  </div>

                  {/* Account Custom */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold">Account Custom</label>
                    {/* Would add account custom fields here */}
                  </div>
                </div>

                {/* TFM Ticket Custom */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold">TFM Ticket Custom</label>
                  <div className="flex gap-4 text-[11px]">
                    <div className="flex items-center gap-1"><label className="w-16">Signature</label><input type="text" value={tfmCustom.signature1} className="w-[100px] px-1 py-0.5 border border-[#808080] bg-white" /><label className="flex items-center gap-1"><input type="checkbox" checked={tfmCustom.pt} onChange={() => {}} />P/T</label></div>
                    <div className="flex items-center gap-1"><label className="w-16">Signature</label><input type="text" value={tfmCustom.signature2} className="w-[100px] px-1 py-0.5 border border-[#808080] bg-white" /><label className="flex items-center gap-1"><input type="checkbox" checked={tfmCustom.lsd} onChange={() => {}} />LSD</label></div>
                    <div className="flex items-center gap-1"><label className="w-16">Custom3</label><input type="text" value={tfmCustom.custom3} className="w-[100px] px-1 py-0.5 border border-[#808080] bg-white" /></div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5 - Call History */}
            {activeTab === "callHistory" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-auto bg-white border border-[#808080]">
                  <table className="w-full border-collapse text-[11px]">
                    <thead className="bg-[#f0f0f0] sticky top-0">
                      <tr>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Date</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Call ID</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Type</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Category</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Location</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Description</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Resolution</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Worker</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Status</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Est</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {callHistory.map((item, i) => (
                        <tr key={i} className="hover:bg-[#f0f8ff]">
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.date}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.callId}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.type}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.category}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] whitespace-pre-line">{item.location}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] max-w-[200px] truncate">{item.description}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.resolution}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.worker}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.status}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.est}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[11px]">{callHistory.length} call(s)</span>
                  <div className="flex items-center gap-1">
                    <label className="text-[11px]">Show Tickets</label>
                    <select value={showTicketsFilter} onChange={(e) => setShowTicketsFilter(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
                      <option>Pending</option>
                      <option>All</option>
                      <option>Completed</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-1 text-[11px]">
                    <input type="checkbox" checked={excludeTimeCard} onChange={(e) => setExcludeTimeCard(e.target.checked)} />
                    Exclude Time Card Tickets
                  </label>
                  <label className="flex items-center gap-1 text-[11px]">
                    <input type="checkbox" checked={showAllUnits} onChange={(e) => setShowAllUnits(e.target.checked)} />
                    Show Tickets for all Units
                  </label>
                </div>
              </div>
            )}

            {/* Tab 6 - Ledger */}
            {activeTab === "ledger" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-auto bg-white border border-[#808080]">
                  <table className="w-full border-collapse text-[11px]">
                    <thead className="bg-[#f0f0f0] sticky top-0">
                      <tr>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Date</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Ref</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Location</th>
                        <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">Desc</th>
                        <th className="px-1 py-0.5 text-right font-medium border border-[#c0c0c0]">Amount</th>
                        <th className="px-1 py-0.5 text-right font-medium border border-[#c0c0c0]">Balance</th>
                        <th className="px-1 py-0.5 text-right font-medium border border-[#c0c0c0]">Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerItems.map((item, i) => (
                        <tr key={i} className="hover:bg-[#f0f8ff]">
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.date}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.ref}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{item.location}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] max-w-[200px] truncate">{item.desc}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] text-right">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] text-right">${item.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] text-right">{item.days}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-2 border-t border-[#808080] pt-1">
                  <span className="text-[11px]">{ledgerItems.length} item(s)</span>
                  <span className="text-[11px] font-bold">
                    ${ledgerItems.reduce((sum, item) => sum + item.balance, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
