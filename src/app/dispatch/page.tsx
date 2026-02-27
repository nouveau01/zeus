"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTabs } from "@/context/TabContext";
import { AdminTools } from "@/components/AdminTools";
import { EditableColumnHeader } from "@/components/EditableColumnHeader";
import { usePageConfig, createDefaultFields } from "@/hooks/usePageConfig";
import { getTickets, getCallHistory } from "@/lib/actions/tickets";
import { getInvoices } from "@/lib/actions/invoices";
import { AutocompleteInput, AutocompleteResult } from "@/components/AutocompleteInput";
import { DynamicSelect } from "@/components/ui/DynamicSelect";
import { useOffices } from "@/context/OfficesContext";
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
  premisesInternalId: string; // internal Loc ID for navigation
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
  const { selectedOfficeIds, allSelected } = useOffices();
  const [viewMode, setViewMode] = useState<"grid" | "schedule">("grid");

  // Page configuration for admin customization
  const { fields, getLabel, isVisible, getVisibleFields, updateFields, updateFieldLabel } = usePageConfig("dispatch", DISPATCH_DEFAULT_FIELDS);
  const [isEditMode, setIsEditMode] = useState(false);

  // Filters
  const [scheme, setScheme] = useState("None");
  const [statusFilter, setStatusFilter] = useState("Open");
  const [workerFilter, setWorkerFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [zoneFilter, setZoneFilter] = useState("All");
  const [printOnSave, setPrintOnSave] = useState(false);

  // Date range helper
  const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

  // CRUD state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isNewTicket, setIsNewTicket] = useState(false);

  // Units and jobs for the selected account (for dropdowns)
  const [accountUnits, setAccountUnits] = useState<{ id: string; label: string }[]>([]);
  const [accountJobs, setAccountJobs] = useState<{ id: string; label: string }[]>([]);

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
  const prevGridHeightRef = useRef(45); // remember height before new ticket collapse
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
    const newPercent = Math.min(80, Math.max(10, startHeight.current + diffPercent));
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
  }, [statusFilter, typeFilter, startDate, endDate, selectedOfficeIds]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      // Build params for server action
      // Dispatch screen always queries open tickets table (TicketO) — completed live in Completed Tickets tab
      const status: "Open" | "Completed" | "All" = "Open";

      // type="date" inputs already give YYYY-MM-DD format
      const formattedStartDate = startDate || undefined;
      const formattedEndDate = endDate || undefined;

      // Use Server Action instead of API fetch - data is pulled from SQL Server and mirrored to PostgreSQL
      const data = await getTickets({
        status: status as "Open" | "Completed" | "All",
        type: typeFilter !== "All" ? typeFilter : undefined,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        officeIds: allSelected ? undefined : selectedOfficeIds,
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
          unitId: t.unitId?.toString() || "",
          description: t.description || "",
          status: t.status as "Open" | "Assigned" | "En Route" | "On Site" | "Completed" | "Closed",
          callDate: t.date ? new Date(t.date).toLocaleDateString() : "",
          callTime: t.date ? new Date(t.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : "",
          scheduled: t.dispatchDate ? `${new Date(t.dispatchDate).toLocaleDateString()}, ${new Date(t.dispatchDate).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : "",
          worker: t.mechCrew || "",
          city: t.premises?.city || "",
          state: t.premises?.state || "",
          premisesInternalId: t.premises?.id || t.premisesId || "",
          customerId: t.premises?.customer?.id || "",
          customerName: t.premises?.customer?.name || "",
          jobId: t.jobId?.toString() || "",
          jobNumber: t.jobId?.toString() || "",
        }));
        setTickets(mappedTickets);

        // Apply client-side filters for status, worker, and zone
        let filtered = mappedTickets;
        if (statusFilter !== "All") {
          filtered = filtered.filter(t => t.status === statusFilter);
        }
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

    // Fetch units and jobs for this account
    if (apiTicket?.premises?.id) {
      fetchAccountUnitsAndJobs(apiTicket.premises.id);
    } else {
      setAccountUnits([]);
      setAccountJobs([]);
    }

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
      const data = await getInvoices({ customerId, limit: 20, officeIds: allSelected ? undefined : selectedOfficeIds });

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

  // Fetch units and jobs for a given account (by internal Loc ID)
  const fetchAccountUnitsAndJobs = async (premisesInternalId: string) => {
    try {
      const [unitsRes, jobsRes] = await Promise.all([
        fetch(`/api/search?type=units&premisesId=${encodeURIComponent(premisesInternalId)}&q=`),
        fetch(`/api/search?type=jobs&premisesId=${encodeURIComponent(premisesInternalId)}&q=`),
      ]);

      if (unitsRes.ok) {
        const units = await unitsRes.json();
        setAccountUnits(units.map((u: any) => ({ id: u.id, label: u.label })));
      } else {
        setAccountUnits([]);
      }

      if (jobsRes.ok) {
        const jobs = await jobsRes.json();
        setAccountJobs(jobs.map((j: any) => ({ id: j.id, label: j.label })));
      } else {
        setAccountJobs([]);
      }
    } catch (error) {
      console.error("Error fetching account units/jobs:", error);
      setAccountUnits([]);
      setAccountJobs([]);
    }
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    loadTicketDetail(ticket);
  };

  // Navigation handlers
  const handleNavigateToAccount = () => {
    if (selectedTicket?.premisesInternalId) {
      openTab(ticketDetail?.accountTag || selectedTicket.accountId, `/accounts/${selectedTicket.premisesInternalId}`);
    }
  };

  const handleNavigateToUnit = () => {
    if (selectedTicket?.unitId) {
      openTab(`Unit ${ticketDetail?.unitNumber || selectedTicket.unit}`, `/units/${selectedTicket.unitId}`);
    }
  };

  const handleNavigateToJob = () => {
    if (selectedTicket?.jobId) {
      openTab(`Job ${selectedTicket.jobNumber}`, `/job-maintenance/${selectedTicket.jobId}`);
    }
  };

  const handleNavigateToCustomer = () => {
    if (selectedTicket?.customerId) {
      openTab(selectedTicket.customerName, `/customers/${selectedTicket.customerId}`);
    }
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  // Helper to update a single field in ticketDetail
  const updateDetail = (field: keyof TicketDetail, value: string | boolean) => {
    setTicketDetail(prev => prev ? { ...prev, [field]: value } : prev);
  };

  // Autocomplete selection handlers — populate related fields from selected record
  const handleAccountSelect = (result: AutocompleteResult) => {
    const a = result.data;
    const internalId = a.id || "";
    setTicketDetail(prev => prev ? {
      ...prev,
      accountTag: a.name || "",
      accountId: a.premisesId || a.id || "",
      accountAddress: a.address || "",
      accountCity: a.city || "",
      accountState: a.state || "",
      accountZip: a.zipCode || "",
      accountCountry: "United States",
      accountPhone: a.phone || "",
      accountContact: a.contact || "",
      accountEmail: a.email || "",
      route: a.route?.toString() || "",
      zone: a.zone?.toString() || "",
      territory: a.terr || "",
      // Clear unit/job since account changed
      unitNumber: "",
      unitId: undefined,
      jobId: "",
      jobNumber: "",
      // Also fill customer info from the account's owner
      customerName: a.customer?.name || prev.customerName,
    } : prev);

    // Also update the selected ticket's internal ID for navigation
    if (selectedTicket) {
      setSelectedTicket(prev => prev ? { ...prev, premisesInternalId: internalId, customerId: a.customerId || prev.customerId } : prev);
    }

    // Fetch units and jobs for this account
    if (internalId) {
      fetchAccountUnitsAndJobs(internalId);
    } else {
      setAccountUnits([]);
      setAccountJobs([]);
    }
  };

  const handleUnitSelect = (result: AutocompleteResult) => {
    const u = result.data;
    setTicketDetail(prev => prev ? {
      ...prev,
      unitNumber: u.unitNumber || "",
    } : prev);
  };

  const handleJobSelect = (result: AutocompleteResult) => {
    const j = result.data;
    setTicketDetail(prev => prev ? {
      ...prev,
      jobId: j.id || "",
      jobNumber: j.jobNumber || j.id || "",
    } : prev);
  };

  const handleCustomerSelect = (result: AutocompleteResult) => {
    const c = result.data;
    setTicketDetail(prev => prev ? {
      ...prev,
      customerName: c.name || "",
      customerId: c.id || "",
      customerAddress: c.address || "",
      customerCity: c.city || "",
      customerState: c.state || "",
      customerZip: c.zipCode || "",
      customerCountry: c.country || "United States",
      customerPhone: c.phone || "",
      customerMobile: c.mobile || "",
      customerContact: c.contact || "",
      customerEmail: c.email || "",
    } : prev);
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
    // Calculate next ticket number (max + 1)
    const maxTicketNum = tickets.reduce((max, t) => {
      const num = typeof t.ticketNumber === "number" ? t.ticketNumber : parseInt(String(t.ticketNumber)) || 0;
      return num > max ? num : max;
    }, 0);
    const nextNum = maxTicketNum + 1;
    const now = new Date();
    const dateStr = `${(now.getMonth() + 1).toString().padStart(2, "0")}/${now.getDate().toString().padStart(2, "0")}/${now.getFullYear()}`;
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    // Save current grid height and collapse grid to give more room for the form
    prevGridHeightRef.current = gridHeightPercent;
    setGridHeightPercent(10);

    setSelectedTicket(null);
    setIsNewTicket(true);
    setActiveTab("ticketInfo");
    setTicketDetail({
      ticketNumber: String(nextNum),
      woNumber: "",
      date: dateStr,
      time: timeStr,
      caller: "",
      phoneNumber: "",
      takenBy: "",
      source: "",
      accountId: "",
      accountTag: "",
      accountAddress: "",
      accountCity: "",
      accountState: "",
      accountZip: "",
      accountCountry: "",
      accountPhone: "",
      accountMobile: "",
      accountContact: "",
      accountEmail: "",
      category: "",
      level: "",
      unitNumber: "",
      nature: "",
      jobId: "",
      jobNumber: "",
      testMech: "",
      calledIn: false,
      highPriority: false,
      updateMechLocation: false,
      onServiceExp: "",
      scopeOfWork: "",
      maintenanceNotes: "",
      followUpNotes: "",
      codes: "",
      followUpNeeded: false,
      notes: "",
      schedDate: "",
      schedTime: "",
      schedMech: "",
      enRouteTime: "",
      onSiteTime: "",
      completedTime: "",
      witness: "",
      customerName: "",
      customerAddress: "",
      customerCity: "",
      customerState: "",
      customerZip: "",
      customerCountry: "",
      customerPhone: "",
      customerFax: "",
      customerMobile: "",
      customerContact: "",
      customerEmail: "",
      customerSince: "",
      customerType: "",
      accountType: "",
      zone: "",
      route: "",
      territory: "",
      locsUnits: "",
      acctBalance: "",
      currBalance: "",
      accountRemarks: "",
      customerRemarks: "",
      billingRemarks: "",
    });
  };

  const handleCancelNew = () => {
    setIsNewTicket(false);
    setTicketDetail(null);
    // Restore grid height to what it was before new ticket mode
    setGridHeightPercent(prevGridHeightRef.current);
  };

  const handleSave = async () => {
    if (!ticketDetail) return;

    // If editing an existing ticket, need a selected ticket
    if (!isNewTicket && !selectedTicket) return;

    setSaving(true);
    setSaveMessage(null);
    try {
      // Map ticketDetail state to the API's expected body format
      const body: Record<string, any> = {
        ticketNumber: parseInt(ticketDetail.ticketNumber) || undefined,
        workOrderNumber: parseInt(ticketDetail.woNumber) || parseInt(ticketDetail.ticketNumber) || undefined,
        date: ticketDetail.date,
        type: ticketDetail.nature === "New Job" ? "Other" : "Maintenance",
        category: ticketDetail.category || undefined,
        level: ticketDetail.level || undefined,
        status: isNewTicket ? "Open" : (selectedTicket?.status || "Open"),
        description: ticketDetail.scopeOfWork || undefined,
        scopeOfWork: ticketDetail.scopeOfWork || undefined,
        mechCrew: ticketDetail.schedMech || undefined,
        unitName: ticketDetail.unitNumber || undefined,
        enRouteTime: ticketDetail.enRouteTime || undefined,
        onSiteTime: ticketDetail.onSiteTime || undefined,
        completedTime: ticketDetail.completedTime || undefined,
        takenBy: ticketDetail.takenBy || undefined,
        resolution: ticketDetail.maintenanceNotes || undefined,
        calledInBy: ticketDetail.caller || undefined,
        internalComments: ticketDetail.notes || undefined,
        nameAddress: ticketDetail.accountAddress || undefined,
        accountId: ticketDetail.accountId || undefined,
        accountPremisesId: ticketDetail.accountId || undefined,
      };

      if (isNewTicket) {
        // CREATE new ticket
        const response = await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(err.error || "Failed to create ticket");
        }

        setIsNewTicket(false);
        setGridHeightPercent(prevGridHeightRef.current);
        setSaveMessage({ type: "success", text: `Ticket #${ticketDetail.ticketNumber} created successfully` });
        setTimeout(() => setSaveMessage(null), 2000);
        // Refresh ticket list using the same filters as the grid
        await fetchTickets();
        setSaving(false);
        return;
      }

      // UPDATE existing ticket
      const response = await fetch(`/api/tickets/${selectedTicket!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Failed to save ticket");
      }

      setSaveMessage({ type: "success", text: "Ticket saved successfully" });
      // Auto-hide success message after 2 seconds
      setTimeout(() => setSaveMessage(null), 2000);
      // Refresh the ticket list
      await fetchTickets();
    } catch (error: any) {
      setSaveMessage({ type: "error", text: error.message || "Failed to save ticket" });
      setTimeout(() => setSaveMessage(null), 4000);
    } finally {
      setSaving(false);
    }
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
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (!selectedTicket) return;
    setSaveMessage(null);
    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || "Failed to delete ticket");
      }

      setShowDeleteConfirm(false);
      // Remove from list and clear detail
      setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
      setFilteredTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
      setSelectedTicket(null);
      setTicketDetail(null);
      setSaveMessage({ type: "success", text: "Ticket deleted successfully" });
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error: any) {
      setShowDeleteConfirm(false);
      setSaveMessage({ type: "error", text: error.message || "Failed to delete ticket" });
      setTimeout(() => setSaveMessage(null), 4000);
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
  const statuses = ["All", "Open", "Assigned", "En Route", "On Site"];
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
          <DynamicSelect
            pageId="dispatch"
            fieldName="scheme"
            value={scheme}
            onChange={setScheme}
            fallbackOptions={schemes}
            includeEmpty={false}
            className="min-w-[70px]"
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Status:</label>
          <DynamicSelect
            pageId="dispatch"
            fieldName="status"
            value={statusFilter}
            onChange={setStatusFilter}
            includeAll
            includeEmpty={false}
            fallbackOptions={statuses.filter(s => s !== "All")}
            className="min-w-[60px]"
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Worker:</label>
          <DynamicSelect
            pageId="dispatch"
            fieldName="worker"
            value={workerFilter}
            onChange={setWorkerFilter}
            includeAll
            includeEmpty={false}
            fallbackOptions={workers.filter(w => w !== "All")}
            className="min-w-[60px]"
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Type:</label>
          <DynamicSelect
            pageId="dispatch"
            fieldName="type"
            value={typeFilter}
            onChange={setTypeFilter}
            includeAll
            includeEmpty={false}
            fallbackOptions={types.filter(t => t !== "All")}
            className="min-w-[60px]"
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Zone:</label>
          <DynamicSelect
            pageId="dispatch"
            fieldName="zone"
            value={zoneFilter}
            onChange={setZoneFilter}
            includeAll
            includeEmpty={false}
            fallbackOptions={zones.filter(z => z !== "All")}
            className="min-w-[60px]"
          />
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
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[120px]" />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">End</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[120px]" />
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
        <div className="overflow-auto bg-white border border-[#808080] m-1" style={{ height: `${gridHeightPercent}%`, minHeight: "40px" }}>
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
          {/* Save/Cancel bar for new ticket mode */}
          {isNewTicket && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#e8f5e9] border-b border-[#4caf50]">
              <div className="flex items-center gap-2 text-[12px] text-[#2e7d32] font-medium">
                <span>New Ticket #{ticketDetail?.ticketNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-1 text-[11px] bg-[#0078d4] text-white border border-[#005a9e] rounded hover:bg-[#106ebe] disabled:opacity-50 font-medium"
                >
                  {saving ? "Saving..." : "Save Ticket"}
                </button>
                <button
                  onClick={handleCancelNew}
                  className="px-4 py-1 text-[11px] bg-[#d4d0c8] text-[#333] border border-[#808080] rounded hover:bg-[#c0c0c0]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

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
            <button onClick={() => setActiveTab("ledger")} className={`px-3 py-1 text-[11px] border-r border-[#808080] ${activeTab === "ledger" ? "bg-white font-medium text-[#e74c3c]" : "bg-[#d4d0c8] text-[#e74c3c]"}`}>
              6 Ledger
            </button>
            <button onClick={() => setActiveTab("callRecording")} className={`px-3 py-1 text-[11px] ${activeTab === "callRecording" ? "bg-white font-medium" : "bg-[#d4d0c8]"}`}>
              7 Call Recording
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
                    <input type="text" value={ticketDetail.woNumber} onChange={(e) => updateDetail("woNumber", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Date</label>
                    <input type="text" value={ticketDetail.date} onChange={(e) => updateDetail("date", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Time</label>
                    <input type="text" value={ticketDetail.time} onChange={(e) => updateDetail("time", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Caller</label>
                    <DynamicSelect
                      pageId="dispatch"
                      fieldName="caller"
                      value={ticketDetail.caller}
                      onChange={(val) => updateDetail("caller", val)}
                      fallbackOptions={["New", "Who"]}
                      className="flex-1 w-[80px]"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Phone #</label>
                    <input type="text" value={ticketDetail.phoneNumber} onChange={(e) => updateDetail("phoneNumber", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Taken By</label>
                    <input type="text" value={ticketDetail.takenBy} onChange={(e) => updateDetail("takenBy", e.target.value)} readOnly={!isNewTicket} className={`flex-1 px-1 py-0.5 border border-[#808080] text-[11px] w-[80px] ${isNewTicket ? "bg-white" : "bg-[#f0f0f0]"}`} />
                  </div>
                  <button className="px-2 py-0.5 border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[11px] mt-1">
                    Called Again
                  </button>
                  <div className="flex items-center gap-1 mt-1">
                    <label className="w-14 text-[11px]">Source</label>
                    <DynamicSelect
                      pageId="dispatch"
                      fieldName="source"
                      value={ticketDetail.source}
                      onChange={(val) => updateDetail("source", val)}
                      fallbackOptions={sources}
                      className="flex-1 w-[80px]"
                    />
                  </div>
                </div>

                {/* Middle Column - Account Info */}
                <div className="flex flex-col gap-1 min-w-[220px]">
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Account</label>
                    {isNewTicket ? (
                      <AutocompleteInput
                        value={ticketDetail.accountTag}
                        onChange={(val) => updateDetail("accountTag", val)}
                        onSelect={handleAccountSelect}
                        searchType="accounts"
                        placeholder="Search accounts..."
                        className="bg-[#ffffcc]"
                      />
                    ) : (
                      <input
                        type="text"
                        value={ticketDetail.accountTag}
                        readOnly
                        onClick={handleNavigateToAccount}
                        className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white text-[#0000ff] cursor-pointer hover:underline"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">ID</label>
                    <input type="text" value={ticketDetail.accountId} onChange={(e) => updateDetail("accountId", e.target.value)} readOnly={!isNewTicket} className={`flex-1 px-1 py-0.5 border border-[#808080] text-[11px] ${isNewTicket ? "bg-white" : "bg-[#f0f0f0]"}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Address</label>
                    <input type="text" value={ticketDetail.accountAddress} onChange={(e) => updateDetail("accountAddress", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">City</label>
                    <input type="text" value={ticketDetail.accountCity} onChange={(e) => updateDetail("accountCity", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">State</label>
                    <DynamicSelect
                      pageId="_global"
                      fieldName="state"
                      value={ticketDetail.accountState}
                      onChange={(val) => updateDetail("accountState", val)}
                      fallbackOptions={["NY", "NJ", "CT"]}
                      className="w-[50px]"
                    />
                    <label className="text-[11px] ml-1">Zip</label>
                    <input type="text" value={ticketDetail.accountZip} onChange={(e) => updateDetail("accountZip", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[60px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Country</label>
                    <input type="text" value={ticketDetail.accountCountry} onChange={(e) => updateDetail("accountCountry", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Phone</label>
                    <input type="text" value={ticketDetail.accountPhone} onChange={(e) => updateDetail("accountPhone", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                    <label className="text-[11px]">Mobile</label>
                    <input type="text" value={ticketDetail.accountMobile} onChange={(e) => updateDetail("accountMobile", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Contact</label>
                    <input type="text" value={ticketDetail.accountContact} onChange={(e) => updateDetail("accountContact", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
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
                    <DynamicSelect
                      pageId="dispatch"
                      fieldName="category"
                      value={ticketDetail.category}
                      onChange={(val) => updateDetail("category", val)}
                      fallbackOptions={categories}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Level</label>
                    <DynamicSelect
                      pageId="dispatch"
                      fieldName="level"
                      value={ticketDetail.level}
                      onChange={(val) => updateDetail("level", val)}
                      fallbackOptions={levels}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Unit</label>
                    <select
                      value={ticketDetail.unitId || ""}
                      onChange={(e) => {
                        const unitId = e.target.value;
                        const unit = accountUnits.find(u => u.id === unitId);
                        setTicketDetail(prev => prev ? { ...prev, unitId: unitId || undefined, unitNumber: unit?.label || "" } : prev);
                        if (selectedTicket) {
                          setSelectedTicket(prev => prev ? { ...prev, unitId: unitId, unit: unit?.label || "" } : prev);
                        }
                      }}
                      className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white"
                    >
                      <option value=""></option>
                      {accountUnits.map(u => (
                        <option key={u.id} value={u.id}>{u.label}</option>
                      ))}
                    </select>
                    {ticketDetail.unitId && (
                      <span
                        onClick={handleNavigateToUnit}
                        className="text-[11px] text-[#0000ff] cursor-pointer hover:underline"
                        title="Open unit"
                      >
                        Go
                      </span>
                    )}
                    {ticketDetail.unitNumber && (
                      <span className="text-[11px] ml-1">Route: {ticketDetail.route || ""}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Nature</label>
                    <DynamicSelect
                      pageId="dispatch"
                      fieldName="nature"
                      value={ticketDetail.nature}
                      onChange={(val) => updateDetail("nature", val)}
                      fallbackOptions={natures}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Job</label>
                    <select
                      value={ticketDetail.jobId || ""}
                      onChange={(e) => {
                        const jobId = e.target.value;
                        const job = accountJobs.find(j => j.id === jobId);
                        setTicketDetail(prev => prev ? { ...prev, jobId: jobId, jobNumber: job?.label || "" } : prev);
                        if (selectedTicket) {
                          setSelectedTicket(prev => prev ? { ...prev, jobId: jobId, jobNumber: job?.label || "" } : prev);
                        }
                      }}
                      className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white"
                    >
                      <option value=""></option>
                      {accountJobs.map(j => (
                        <option key={j.id} value={j.id}>{j.label}</option>
                      ))}
                    </select>
                    {ticketDetail.jobId && (
                      <span
                        onClick={handleNavigateToJob}
                        className="text-[11px] text-[#0000ff] cursor-pointer hover:underline"
                        title="Open job"
                      >
                        Go
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" />
                      Test
                    </label>
                    <label className="text-[11px] ml-2">Mech</label>
                    <DynamicSelect
                      pageId="dispatch"
                      fieldName="worker"
                      value={ticketDetail.testMech}
                      onChange={(val) => updateDetail("testMech", val)}
                      fallbackOptions={workers.filter(w => w !== "All")}
                    />
                  </div>
                  <div className="flex flex-col gap-0.5 mt-1">
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={ticketDetail.calledIn} onChange={(e) => updateDetail("calledIn", e.target.checked)} />
                      Called In
                    </label>
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={ticketDetail.highPriority} onChange={(e) => updateDetail("highPriority", e.target.checked)} />
                      High Priority
                    </label>
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={ticketDetail.updateMechLocation} onChange={(e) => updateDetail("updateMechLocation", e.target.checked)} />
                      Update Mechanic Location
                    </label>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[11px] text-[#27ae60] font-bold">On Service</span>
                    <label className="text-[11px] ml-2">Exp</label>
                    <input type="text" value={ticketDetail.onServiceExp} onChange={(e) => updateDetail("onServiceExp", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
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
                    onChange={(e) => updateDetail("scopeOfWork", e.target.value)}
                    className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[60px]"
                  />
                  <label className="text-[11px] font-bold mt-2">MAINTENANCE</label>
                  <textarea
                    value={ticketDetail.maintenanceNotes}
                    onChange={(e) => updateDetail("maintenanceNotes", e.target.value)}
                    className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[80px]"
                  />
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[11px]">
                      <input type="checkbox" checked={ticketDetail.followUpNeeded} onChange={(e) => updateDetail("followUpNeeded", e.target.checked)} />
                      F/U - Follow Up Needed
                    </label>
                  </div>
                  <label className="text-[11px]">- Notes -</label>
                  <input type="text" value={ticketDetail.notes} onChange={(e) => updateDetail("notes", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                </div>

                {/* Right - Scheduling */}
                <div className="min-w-[250px] flex flex-col gap-1 border border-[#808080] p-2 bg-white">
                  <label className="text-[11px] font-bold">SCHEDULING</label>
                  <div className="flex items-center gap-1">
                    <label className="w-12 text-[11px]">Date</label>
                    <input type="text" value={ticketDetail.schedDate} onChange={(e) => updateDetail("schedDate", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
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
                    <DynamicSelect
                      pageId="dispatch"
                      fieldName="schedTimeStatus"
                      value={ticketDetail.schedTime || ""}
                      onChange={(val) => updateDetail("schedTime", val)}
                      fallbackOptions={["En Route", "On Site"]}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-12 text-[11px]">Mech</label>
                    <DynamicSelect
                      pageId="dispatch"
                      fieldName="worker"
                      value={ticketDetail.schedMech}
                      onChange={(val) => updateDetail("schedMech", val)}
                      fallbackOptions={workers.filter(w => w !== "All")}
                      className="flex-1"
                    />
                    <label className="text-[11px]">Completed</label>
                    <input type="text" value={ticketDetail.completedTime} onChange={(e) => updateDetail("completedTime", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[60px]" />
                  </div>
                  <div className="mt-2">
                    <label className="text-[11px] font-bold">WITNESS</label>
                    <input type="text" value={ticketDetail.witness} onChange={(e) => updateDetail("witness", e.target.value)} className="w-full px-1 py-0.5 border border-[#808080] text-[11px] bg-white mt-1" />
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
                    {isNewTicket ? (
                      <AutocompleteInput
                        value={ticketDetail.customerName}
                        onChange={(val) => updateDetail("customerName", val)}
                        onSelect={handleCustomerSelect}
                        searchType="customers"
                        placeholder="Search customers..."
                      />
                    ) : (
                      <input
                        type="text"
                        value={ticketDetail.customerName}
                        readOnly
                        onClick={handleNavigateToCustomer}
                        className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white text-[#0000ff] cursor-pointer hover:underline"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Address</label>
                    <input type="text" value={ticketDetail.customerAddress} onChange={(e) => updateDetail("customerAddress", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">City</label>
                    <input type="text" value={ticketDetail.customerCity} onChange={(e) => updateDetail("customerCity", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">State</label>
                    <DynamicSelect
                      pageId="_global"
                      fieldName="state"
                      value={ticketDetail.customerState}
                      onChange={(val) => updateDetail("customerState", val)}
                      fallbackOptions={["NY", "NJ", "CT"]}
                      className="w-[50px]"
                    />
                    <label className="text-[11px]">Zip</label>
                    <input type="text" value={ticketDetail.customerZip} onChange={(e) => updateDetail("customerZip", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[60px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Country</label>
                    <input type="text" value={ticketDetail.customerCountry} onChange={(e) => updateDetail("customerCountry", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Phone</label>
                    <input type="text" value={ticketDetail.customerPhone} onChange={(e) => updateDetail("customerPhone", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                    <label className="text-[11px]">Fax</label>
                    <input type="text" value={ticketDetail.customerFax} onChange={(e) => updateDetail("customerFax", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Mobile</label>
                    <input type="text" value={ticketDetail.customerMobile} onChange={(e) => updateDetail("customerMobile", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                    <label className="text-[11px]">Contact</label>
                    <input type="text" value={ticketDetail.customerContact} onChange={(e) => updateDetail("customerContact", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[90px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">E-Mail</label>
                    <span onClick={() => handleEmailClick(ticketDetail.customerEmail)} className="text-[11px] text-[#0000ff] cursor-pointer hover:underline">
                      {ticketDetail.customerEmail}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-14 text-[11px]">Since</label>
                    <input type="text" value={ticketDetail.customerSince} onChange={(e) => updateDetail("customerSince", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]" />
                  </div>
                </div>

                {/* Middle - Account Type Info */}
                <div className="flex flex-col gap-1 min-w-[150px]">
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Customer Type</label>
                    <DynamicSelect
                      pageId="customers"
                      fieldName="type"
                      value={ticketDetail.customerType}
                      onChange={(val) => updateDetail("customerType", val)}
                      fallbackOptions={["General"]}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Account Type</label>
                    <DynamicSelect
                      pageId="accounts"
                      fieldName="type"
                      value={ticketDetail.accountType}
                      onChange={(val) => updateDetail("accountType", val)}
                      fallbackOptions={["S", "H", "MOD", "Resident Mech.", "Non-Contract"]}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Zone</label>
                    <DynamicSelect
                      pageId="dispatch"
                      fieldName="zone"
                      value={ticketDetail.zone}
                      onChange={(val) => updateDetail("zone", val)}
                      fallbackOptions={zones.filter(z => z !== "All")}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Route</label>
                    <input type="text" value={ticketDetail.route} onChange={(e) => updateDetail("route", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Territory</label>
                    <DynamicSelect
                      pageId="dispatch"
                      fieldName="territory"
                      value={ticketDetail.territory}
                      onChange={(val) => updateDetail("territory", val)}
                      fallbackOptions={["RS"]}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]"># Locs/Units</label>
                    <input type="text" value={ticketDetail.locsUnits} onChange={(e) => updateDetail("locsUnits", e.target.value)} className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[40px]" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Acct Balance</label>
                    <input type="text" value={ticketDetail.acctBalance} onChange={(e) => updateDetail("acctBalance", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="w-20 text-[11px]">Curr Balance</label>
                    <input type="text" value={ticketDetail.currBalance} onChange={(e) => updateDetail("currBalance", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white" />
                  </div>
                </div>

                {/* Right - Remarks */}
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px]">Account Remarks</label>
                  <textarea value={ticketDetail.accountRemarks} onChange={(e) => updateDetail("accountRemarks", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[40px]" />
                  <label className="text-[11px]">Customer Remarks</label>
                  <textarea value={ticketDetail.customerRemarks} onChange={(e) => updateDetail("customerRemarks", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[40px]" />
                  <label className="text-[11px]">Billing Remarks</label>
                  <textarea value={ticketDetail.billingRemarks} onChange={(e) => updateDetail("billingRemarks", e.target.value)} className="flex-1 px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[40px]" />
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
                    <div className="flex items-center gap-1"><label className="w-16">Signature</label><input type="text" value={tfmCustom.signature1} className="w-[100px] px-1 py-0.5 border border-[#808080] bg-white" /><label className="flex items-center gap-1"><input type="checkbox" checked={tfmCustom.pt} onChange={(e) => setTfmCustom(prev => ({ ...prev, pt: e.target.checked }))} />P/T</label></div>
                    <div className="flex items-center gap-1"><label className="w-16">Signature</label><input type="text" value={tfmCustom.signature2} className="w-[100px] px-1 py-0.5 border border-[#808080] bg-white" /><label className="flex items-center gap-1"><input type="checkbox" checked={tfmCustom.lsd} onChange={(e) => setTfmCustom(prev => ({ ...prev, lsd: e.target.checked }))} />LSD</label></div>
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

            {/* Tab 7 - Call Recording */}
            {activeTab === "callRecording" && (
              <div className="flex flex-col h-full gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium">Call Recording</span>
                  <span className="text-[11px] text-[#666]">
                    {ticketDetail ? `Ticket #${ticketDetail.ticketNumber}` : "No ticket selected"}
                  </span>
                </div>
                <div className="flex-1 flex items-center justify-center border border-[#808080] bg-[#f9f9f9] rounded">
                  <div className="text-center">
                    <div className="text-[11px] text-[#999] mb-1">No recording available</div>
                    <div className="text-[10px] text-[#bbb]">Call recordings will appear here when available</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save/Delete feedback message */}
      {saveMessage && (
        <div
          className="fixed bottom-4 right-4 z-50 px-4 py-2 border text-[12px] shadow-lg"
          style={{
            fontFamily: "Segoe UI, Tahoma, sans-serif",
            backgroundColor: saveMessage.type === "success" ? "#e8f5e9" : "#fbe9e7",
            borderColor: saveMessage.type === "success" ? "#4caf50" : "#e53935",
            color: saveMessage.type === "success" ? "#2e7d32" : "#c62828",
          }}
        >
          {saveMessage.text}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#d4d0c8] border-2 border-[#808080] shadow-lg" style={{ minWidth: "320px", fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
            <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">Confirm Delete</span>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                x
              </button>
            </div>
            <div className="p-4">
              <p className="text-[12px] mb-4">
                Are you sure you want to delete ticket #{selectedTicket.ticketNumber}?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={confirmDelete}
                  className="px-4 py-1 bg-[#d4d0c8] border-2 hover:bg-[#e0e0e0] text-[12px]"
                  style={{ borderColor: "#808080" }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-1 bg-[#d4d0c8] border-2 hover:bg-[#e0e0e0] text-[12px]"
                  style={{ borderColor: "#808080" }}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
