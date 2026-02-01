"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  Sigma,
  RefreshCw,
  Filter,
  FilterX,
  Copy,
  Printer,
  Settings,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { FilterDialog, FilterField, FilterValue } from "@/components/FilterDialog";
import { AdminTools } from "@/components/AdminTools";
import { usePageConfig, createDefaultFields } from "@/hooks/usePageConfig";
import { getJobs } from "@/lib/actions/jobs";

// Default field configuration for Job Maintenance
const JOBS_DEFAULT_FIELDS = createDefaultFields({
  externalId: { label: "Job #", width: 80 },
  date: { label: "Date", width: 100 },
  template: { label: "Template", width: 150 },
  accountTag: { label: "Account Tag", width: 150 },
  description: { label: "Description", width: 250 },
  type: { label: "Type", width: 100 },
  status: { label: "Status", width: 80 },
});

// Toolbar icons matching Total Service Job Maintenance
const toolbarIcons = [
  { icon: FileText, color: "#4a7c59", title: "New", action: "new" },
  { icon: Pencil, color: "#d4a574", title: "Edit", action: "edit" },
  { icon: X, color: "#c45c5c", title: "Delete", action: "delete" },
  { icon: Copy, color: "#6b8cae", title: "Replicate Record", action: "replicate" },
  { type: "separator" },
  { icon: Filter, color: "#7c6b8e", title: "Set Filter and Sort", action: "filter" },
  { icon: FilterX, color: "#c45c5c", title: "Remove Filter and Sort", action: "clearFilter" },
  { type: "separator" },
  { icon: RefreshCw, color: "#e67e22", title: "Refresh Display", action: "refresh" },
  { type: "separator" },
  { icon: Sigma, color: "#2c3e50", title: "Totals", action: "totals" },
] as const;

interface Job {
  id: string | number;
  externalId: string | null;
  jobNumber: string;
  jobName: string;
  jobDescription: string | null;
  description: string;
  status: string;
  type: string | null;
  contractType: string | null;
  date: string | null;
  dueDate: string | null;
  template: string | null;
  premises: {
    id: string | number;
    premisesId: string | null;
    locId: string | null;
    name: string | null;
    address: string;
  } | null;
  customer: {
    id: string | number;
    name: string;
  } | null;
}

const TYPE_TABS = ["All", "Maintenance", "Modernization", "Repair", "Other", "NEW REPAIR"];

type SortField = "jobNumber" | "accountId" | "date" | "tag" | "description" | "type" | "status" | "template" | "dueDate";
type SortDirection = "asc" | "desc";

const STORAGE_KEY = "zeus-jobs-state";

interface PageState {
  activeTab: string;
  sortField: SortField;
  sortDirection: SortDirection;
  selectedRow: string | null;
  showTotals: boolean;
}

interface JobMaintenancePageProps {
  premisesId?: string | null;
}

export default function JobMaintenanceView({ premisesId }: JobMaintenancePageProps) {
  const { openTab, closeTab, activeTabId } = useTabs();

  // Page configuration for admin customization
  const { fields, getLabel, isVisible, getVisibleFields, updateFields } = usePageConfig("jobs", JOBS_DEFAULT_FIELDS);
  const [isEditMode, setIsEditMode] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // Filters
  const [catalogue, setCatalogue] = useState("None");
  const [activeTab, setActiveTab] = useState("All");
  const [showTotals, setShowTotals] = useState(false);
  const [sortField, setSortField] = useState<SortField>("jobNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isHydrated, setIsHydrated] = useState(false);

  // Menu state
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter dialog state
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  // Column resize state
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([80, 100, 100, 150, 250, 80, 90, 130, 100]);
  const [resizing, setResizing] = useState<{ index: number; startX: number; startWidth: number } | null>(null);

  // Filter fields for Job Maintenance
  const filterFields: FilterField[] = [
    { key: "accountId", label: "Account ID*", hasLookup: true },
    { key: "accountTag", label: "Account Tag*", hasLookup: true },
    { key: "account", label: "Account*", hasLookup: true },
    { key: "contractType", label: "Contract Type*", hasLookup: true },
    { key: "customer", label: "Customer*", hasLookup: true },
    { key: "date", label: "Date", hasLookup: false },
    { key: "description", label: "Description", hasLookup: false },
    { key: "dueDate", label: "Due Date", hasLookup: false },
    { key: "jobNumber", label: "Job #", hasLookup: false },
    { key: "status", label: "Status*", hasLookup: true },
    { key: "template", label: "Template*", hasLookup: true },
    { key: "type", label: "Type*", hasLookup: true },
  ];

  // Active filters that are currently applied
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue>>({});

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({});
  };

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
      const newWidth = Math.max(50, resizing.startWidth + diff); // Min width 50px
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: PageState = JSON.parse(saved);
        setActiveTab(state.activeTab || "All");
        setSortField(state.sortField || "jobNumber");
        setSortDirection(state.sortDirection || "asc");
        setSelectedRow(state.selectedRow || null);
        setShowTotals(state.showTotals || false);
      }
    } catch (error) {
      console.error("Error loading jobs state:", error);
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
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Error saving jobs state:", error);
      }
    }
  }, [activeTab, sortField, sortDirection, selectedRow, showTotals, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      fetchJobs();
    }
  }, [activeTab, premisesId, isHydrated]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // Use Server Action - pulls from SQL Server and mirrors to PostgreSQL
      const result = await getJobs({
        type: activeTab !== "All" ? activeTab : undefined,
        premisesId: premisesId || undefined,
        limit: 500,
      });

      // Map response to Job interface
      const mappedJobs: Job[] = result.map((job: any) => ({
        id: job.id,
        externalId: job.externalId,
        jobNumber: job.externalId,
        jobName: job.jobName || "",
        jobDescription: job.description,
        description: job.description || "",
        status: job.status || "Open",
        type: job.type || null,
        contractType: null,
        date: job.jobDate,
        dueDate: job.closedDate,
        template: null,
        premises: job.premisesId ? {
          id: job.premisesId,
          premisesId: job.premisesId,
          locId: job.premisesId,
          name: job.premisesTag,
          address: job.premisesAddress || "",
        } : null,
        customer: job.customerId ? {
          id: job.customerId,
          name: job.customerName,
        } : null,
      }));

      setJobs(mappedJobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleClick = (job: Job) => {
    openTab(`Job ${job.externalId || job.id}`, `/job-maintenance/${job.id}`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Helper to get job field value by filter key
  const getJobFieldValue = (job: Job, fieldKey: string): string => {
    switch (fieldKey) {
      case "jobNumber": return job.externalId || "";
      case "accountId": return job.premises?.premisesId || "";
      case "accountTag": return job.premises?.name || job.premises?.address || "";
      case "account": return job.premises?.premisesId || "";
      case "contractType": return job.contractType || "";
      case "customer": return job.customer?.name || "";
      case "date": return job.date || "";
      case "description": return job.jobDescription || job.jobName || "";
      case "dueDate": return job.dueDate || "";
      case "status": return job.status || "";
      case "template": return job.template || "";
      case "type": return job.type || "";
      default: return "";
    }
  };

  // Filter jobs based on activeFilters
  const filteredJobs = jobs.filter((job) => {
    for (const [fieldKey, filter] of Object.entries(activeFilters)) {
      if (!filter.value.trim()) continue;

      const jobValue = getJobFieldValue(job, fieldKey).toLowerCase();
      const filterValue = filter.value.toLowerCase();

      switch (filter.operator) {
        case "=":
          if (jobValue !== filterValue) return false;
          break;
        case "contains":
          if (!jobValue.includes(filterValue)) return false;
          break;
        case "startsWith":
          if (!jobValue.startsWith(filterValue)) return false;
          break;
        case "endsWith":
          if (!jobValue.endsWith(filterValue)) return false;
          break;
        case ">":
          if (jobValue <= filterValue) return false;
          break;
        case ">=":
          if (jobValue < filterValue) return false;
          break;
        case "<":
          if (jobValue >= filterValue) return false;
          break;
        case "<=":
          if (jobValue > filterValue) return false;
          break;
        case "<>":
          if (jobValue === filterValue) return false;
          break;
      }
    }
    return true;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortField) {
      case "jobNumber":
        aVal = (a.externalId || "").toLowerCase();
        bVal = (b.externalId || "").toLowerCase();
        break;
      case "accountId":
        aVal = (a.premises?.premisesId || "").toLowerCase();
        bVal = (b.premises?.premisesId || "").toLowerCase();
        break;
      case "date":
        aVal = a.date || "";
        bVal = b.date || "";
        break;
      case "tag":
        aVal = (a.premises?.name || a.premises?.address || "").toLowerCase();
        bVal = (b.premises?.name || b.premises?.address || "").toLowerCase();
        break;
      case "description":
        aVal = (a.jobDescription || a.jobName || "").toLowerCase();
        bVal = (b.jobDescription || b.jobName || "").toLowerCase();
        break;
      case "type":
        aVal = (a.type || "").toLowerCase();
        bVal = (b.type || "").toLowerCase();
        break;
      case "status":
        aVal = a.status.toLowerCase();
        bVal = b.status.toLowerCase();
        break;
      case "template":
        aVal = (a.template || "").toLowerCase();
        bVal = (b.template || "").toLowerCase();
        break;
      case "dueDate":
        aVal = a.dueDate || "";
        bVal = b.dueDate || "";
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

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate totals
  const totalJobs = sortedJobs.length;

  // Menu actions
  const handleRefreshDisplay = () => {
    fetchJobs();
    setOpenMenu(null);
  };

  const handleSetFilterSort = () => {
    setShowFilterDialog(true);
    setOpenMenu(null);
  };

  const handleNoFilterSort = () => {
    setActiveTab("All");
    setSortField("jobNumber");
    setSortDirection("asc");
    setCatalogue("None");
    setOpenMenu(null);
  };

  const handlePrint = () => {
    window.print();
    setOpenMenu(null);
  };

  const handleSettings = () => {
    // TODO: Open settings dialog
    alert("Settings - Coming soon");
    setOpenMenu(null);
  };

  const handleExit = () => {
    if (activeTabId) {
      closeTab(activeTabId);
    }
    setOpenMenu(null);
  };

  // Edit menu actions
  const handleNewRecord = () => {
    handleToolbarClick("new");
  };

  const handleEditRecord = () => {
    handleToolbarClick("edit");
  };

  const handleDeleteRecord = () => {
    handleToolbarClick("delete");
  };

  const handleReplicateRecord = () => {
    handleToolbarClick("replicate");
  };

  // Toolbar click handler
  const handleToolbarClick = async (action: string) => {
    switch (action) {
      case "new":
        alert("To create a new job, open an Account and use the Jobs link.\nJobs must be associated with an account.");
        break;
      case "edit":
        if (selectedRow) {
          const job = jobs.find(j => String(j.id) === selectedRow);
          if (job) openTab(`Job ${job.externalId || job.id}`, `/job-maintenance/${job.id}`);
        } else {
          alert("Please select a job to edit");
        }
        break;
      case "delete":
        if (selectedRow) {
          const job = jobs.find(j => String(j.id) === selectedRow);
          if (job && confirm(`Delete job "${job.externalId || job.jobName}"?`)) {
            try {
              const res = await fetch(`/api/jobs/${selectedRow}`, { method: "DELETE" });
              if (res.ok) { setSelectedRow(null); fetchJobs(); }
            } catch (e) { console.error(e); }
          }
        } else {
          alert("Please select a job to delete");
        }
        break;
      case "replicate":
        if (selectedRow) {
          const job = jobs.find(j => String(j.id) === selectedRow);
          if (job && confirm(`Create a copy of job "${job.externalId || job.jobName}"?`)) {
            try {
              const res = await fetch(`/api/jobs/${selectedRow}/replicate`, { method: "POST" });
              if (res.ok) {
                const newJob = await res.json();
                fetchJobs();
                setSelectedRow(newJob.id);
                alert(`Job duplicated. New job ID: ${newJob.externalId || newJob.id}`);
              } else {
                const error = await res.json();
                alert(`Failed to replicate job: ${error.error || "Unknown error"}`);
              }
            } catch (e) {
              console.error(e);
              alert("Failed to replicate job");
            }
          }
        } else {
          alert("Please select a job to replicate");
        }
        break;
      case "approve":
        if (selectedRow) {
          const job = jobs.find(j => String(j.id) === selectedRow);
          if (job) {
            if (job.status === "Approved") {
              alert("This job is already approved.");
            } else if (confirm(`Approve job "${job.externalId || job.jobName}"?`)) {
              try {
                const res = await fetch(`/api/jobs/${selectedRow}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "Approved" })
                });
                if (res.ok) {
                  fetchJobs();
                  alert("Job approved successfully.");
                } else {
                  alert("Failed to approve job.");
                }
              } catch (e) {
                console.error(e);
                alert("Failed to approve job.");
              }
            }
          }
        } else {
          alert("Please select a job to approve");
        }
        break;
      case "accounts":
        if (selectedRow) {
          const job = jobs.find(j => String(j.id) === selectedRow);
          if (job?.premises) {
            openTab(`Account ${job.premises.premisesId || job.premises.id}`, `/accounts/${job.premises.id}`);
          } else {
            alert("This job has no associated account.");
          }
        } else {
          // Open accounts list
          openTab("Accounts", "/accounts");
        }
        break;
      case "buildings":
        if (selectedRow) {
          const job = jobs.find(j => String(j.id) === selectedRow);
          if (job?.premises) {
            openTab(`Building ${job.premises.premisesId || job.premises.id}`, `/accounts/${job.premises.id}`);
          } else {
            alert("This job has no associated building.");
          }
        } else {
          // Open accounts list (buildings are premises)
          openTab("Accounts", "/accounts");
        }
        break;
      case "lock":
        if (selectedRow) {
          const job = jobs.find(j => String(j.id) === selectedRow);
          if (job) {
            const isLocked = job.status === "Locked";
            const action = isLocked ? "unlock" : "lock";
            if (confirm(`${isLocked ? "Unlock" : "Lock"} job "${job.externalId || job.jobName}"?`)) {
              try {
                const res = await fetch(`/api/jobs/${selectedRow}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: isLocked ? "Active" : "Locked" })
                });
                if (res.ok) {
                  fetchJobs();
                  alert(`Job ${action}ed successfully.`);
                } else {
                  alert(`Failed to ${action} job.`);
                }
              } catch (e) {
                console.error(e);
                alert(`Failed to ${action} job.`);
              }
            }
          }
        } else {
          alert("Please select a job to lock/unlock");
        }
        break;
      case "home":
        openTab("Home", "/");
        break;
      case "help":
        alert("Job Maintenance Help\n\n" +
          "• Double-click a job to open it\n" +
          "• Use Filter & Sort to find specific jobs\n" +
          "• Press F3 in filter fields with * to see available values\n" +
          "• Use tabs to filter by job type\n" +
          "• Click column headers to sort\n\n" +
          "Keyboard Shortcuts:\n" +
          "• F3 - Open lookup in filter dialog\n" +
          "• Enter - Select item in lookup\n" +
          "• Escape - Close dialogs");
        break;
      case "filter":
        setShowFilterDialog(true);
        break;
      case "clearFilter":
        clearFilters();
        handleNoFilterSort();
        break;
      case "refresh":
        fetchJobs();
        break;
      case "totals":
        setShowTotals(!showTotals);
        break;
      case "close":
        handleExit();
        break;
    }
  };

  // Don't render until hydrated to avoid flicker
  if (!isHydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col bg-white"
      style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}
    >
      {/* Menu Bar */}
      <div ref={menuRef} className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] relative">
        {/* File Menu */}
        <div className="relative">
          <span
            className={`px-3 py-1 cursor-pointer rounded ${openMenu === "file" ? "bg-[#e5e5e5]" : "hover:bg-[#e5e5e5]"}`}
            onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}
          >
            File
          </span>
          {openMenu === "file" && (
            <div className="absolute top-full left-0 mt-0 bg-white border border-[#c0c0c0] shadow-md z-50 min-w-[180px]">
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={handleRefreshDisplay}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Display
              </button>
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={handleSetFilterSort}
              >
                <Filter className="w-4 h-4" />
                Set Filter & Sort
              </button>
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={handleNoFilterSort}
              >
                <FilterX className="w-4 h-4" />
                No Filter & Sort
              </button>
              <div className="border-t border-[#d0d0d0] my-1" />
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <div className="border-t border-[#d0d0d0] my-1" />
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={handleSettings}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <div className="border-t border-[#d0d0d0] my-1" />
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={handleExit}
              >
                <X className="w-4 h-4" />
                Exit
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <span
            className={`px-3 py-1 cursor-pointer rounded ${openMenu === "edit" ? "bg-[#e5e5e5]" : "hover:bg-[#e5e5e5]"}`}
            onClick={() => setOpenMenu(openMenu === "edit" ? null : "edit")}
          >
            Edit
          </span>
          {openMenu === "edit" && (
            <div className="absolute top-full left-0 mt-0 bg-white border border-[#c0c0c0] shadow-md z-50 min-w-[180px]">
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={() => { handleNewRecord(); setOpenMenu(null); }}
              >
                <FileText className="w-4 h-4 text-[#4a7c59]" />
                Add New Record
              </button>
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={() => { handleEditRecord(); setOpenMenu(null); }}
              >
                <Pencil className="w-4 h-4 text-[#d4a574]" />
                Edit Existing Record
              </button>
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={() => { handleDeleteRecord(); setOpenMenu(null); }}
              >
                <X className="w-4 h-4 text-[#c45c5c]" />
                Delete Existing Record
              </button>
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={() => { handleReplicateRecord(); setOpenMenu(null); }}
              >
                <Copy className="w-4 h-4 text-[#6b8cae]" />
                Replicate Record
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        {toolbarIcons.map((item, i) => {
          // Handle separator
          if ("type" in item && item.type === "separator") {
            return <div key={i} className="w-px h-5 bg-[#c0c0c0] mx-1" />;
          }

          // Handle icon button
          if ("icon" in item) {
            const IconComponent = item.icon;
            return (
              <button
                key={i}
                className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
                title={item.title}
                onClick={() => handleToolbarClick(item.action)}
              >
                <IconComponent className="w-4 h-4" style={{ color: item.color }} />
              </button>
            );
          }

          return null;
        })}
        <div className="flex-1" />
        <AdminTools
          pageId="jobs"
          fields={fields}
          onFieldsChange={updateFields}
          isEditMode={isEditMode}
          onEditModeChange={setIsEditMode}
        />
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
      </div>

      {/* Tabs */}
      <div className="bg-white flex items-end px-2 pt-1">
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
      <div ref={tableContainerRef} className="flex-1 bg-white border border-[#a0a0a0] mx-2 mb-2 flex flex-col overflow-hidden">
        {/* Column Headers */}
        <div className="bg-[#f0f0f0] border-b border-[#c0c0c0] flex-shrink-0">
          <div className="flex text-[12px]">
            {[
              { field: "jobNumber" as SortField, label: "Job #" },
              { field: "accountId" as SortField, label: "Account ID" },
              { field: "date" as SortField, label: "Contract Date" },
              { field: "tag" as SortField, label: "Account Tag" },
              { field: "description" as SortField, label: "Description" },
              { field: "type" as SortField, label: "Type" },
              { field: "status" as SortField, label: "Status" },
              { field: "template" as SortField, label: "Template" },
              { field: "dueDate" as SortField, label: "Due Date" },
            ].map((col, index) => (
              <div
                key={col.field}
                className="relative flex-shrink-0 border-r border-[#c0c0c0] last:border-r-0"
                style={{ width: columnWidths[index] }}
              >
                <div
                  className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none text-center truncate"
                  onClick={() => handleSort(col.field)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="truncate">{col.label}</span>
                    <SortIcon field={col.field} />
                  </div>
                </div>
                {/* Resize handle - wider clickable area with thin visual indicator */}
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
          ) : sortedJobs.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">No jobs found</div>
          ) : (
            sortedJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedRow(String(job.id))}
                onDoubleClick={() => handleDoubleClick(job)}
                className={`flex text-[12px] cursor-pointer border-b border-[#d0d0d0] ${
                  selectedRow === String(job.id)
                    ? "bg-[#0078d4] text-white"
                    : "bg-white hover:bg-[#f0f8ff]"
                }`}
              >
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[0] }}>{job.externalId || ""}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[1] }}>{job.premises?.premisesId || ""}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[2] }}>{formatDate(job.date)}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[3] }}>{job.premises?.name || job.premises?.address || ""}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[4] }}>{job.jobDescription || job.jobName}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[5] }}>{job.type || ""}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[6] }}>{job.status}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[7] }}>{job.template || ""}</div>
                <div className="px-2 py-1 truncate flex-shrink-0" style={{ width: columnWidths[8] }}>{formatDate(job.dueDate)}</div>
              </div>
            ))
          )}
        </div>

        {/* Totals Row - only shows when toggled on */}
        {showTotals && (
          <div className="flex text-[12px] font-semibold bg-[#f5f5f5] border-t-2 border-[#0078d4] flex-shrink-0">
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[0] }}>TOTALS</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[1] }}>{totalJobs} jobs</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[2] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[3] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[4] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[5] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[6] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[7] }}></div>
            <div className="px-2 py-1 truncate flex-shrink-0" style={{ width: columnWidths[8] }}></div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px]">
          {Object.keys(activeFilters).length > 0 && (
            <span className="text-[#0066cc] flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <strong>Filtered</strong>
              <button
                onClick={clearFilters}
                className="ml-1 text-[#c00] hover:underline"
                title="Clear filters"
              >
                (clear)
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>{totalJobs} jobs</span>
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

      {/* Filter & Sort Dialog - Using shared component */}
      <FilterDialog
        isOpen={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        onApply={(filters) => setActiveFilters(filters)}
        title="Jobs"
        fields={filterFields}
        initialFilters={activeFilters}
      />
    </div>
  );
}
