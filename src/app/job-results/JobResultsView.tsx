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

// Toolbar icons matching Job Maintenance
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

interface JobResult {
  id: string;
  externalId: string | null;
  jobName: string;
  jobDescription: string | null;
  status: string;
  type: string | null;
  template: string | null;
  revenueBilled: number;
  materials: number;
  labor: number;
  committed: number;
  totalCost: number;
  profit: number;
  ratio: number;
  budget: number;
  toBeBilled: number;
  billedPercent: number;
  premises: {
    id: string;
    premisesId: string | null;
    name: string | null;
    address: string;
  } | null;
}

const TYPE_TABS = ["All", "Maintenance", "Modernization", "Repair", "Other", "NEW REPAIR"];

type SortField = "jobNumber" | "accountId" | "tag" | "description" | "type" | "revenueBilled" | "materials" | "labor" | "committed" | "totalCost" | "profit" | "ratio" | "budget" | "toBeBilled" | "billedPercent" | "address";
type SortDirection = "asc" | "desc";

interface JobResultsPageProps {
  premisesId?: string | null;
}

export default function JobResultsView({ premisesId }: JobResultsPageProps) {
  const { openTab, closeTab, activeTabId } = useTabs();
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // Filters
  const [catalogue, setCatalogue] = useState("None");
  const [activeTab, setActiveTab] = useState("All");
  const [showTotals, setShowTotals] = useState(false);
  const [sortField, setSortField] = useState<SortField>("jobNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Menu state
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter dialog state
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  // Column resize state
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([70, 90, 120, 180, 60, 90, 80, 70, 70, 80, 70, 60, 80, 80, 60, 150]);
  const [resizing, setResizing] = useState<{ index: number; startX: number; startWidth: number } | null>(null);

  // Filter fields for Job Results
  const filterFields: FilterField[] = [
    { key: "accountId", label: "Account ID*", hasLookup: true },
    { key: "accountTag", label: "Account Tag*", hasLookup: true },
    { key: "account", label: "Account*", hasLookup: true },
    { key: "description", label: "Description", hasLookup: false },
    { key: "jobNumber", label: "Job #", hasLookup: false },
    { key: "status", label: "Status*", hasLookup: true },
    { key: "template", label: "Template*", hasLookup: true },
    { key: "type", label: "Type*", hasLookup: true },
  ];

  // Active filters
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
      const newWidth = Math.max(50, resizing.startWidth + diff);
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

  useEffect(() => {
    fetchJobs();
  }, [activeTab, premisesId]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== "All") {
        params.set("type", activeTab);
      }
      if (premisesId) {
        params.set("premisesId", premisesId);
      }

      // Use SQL Server direct connection
      const response = await fetch(`/api/sqlserver/jobs?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        const jobResults: JobResult[] = (result.data || []).map((job: any) => ({
          id: job.id,
          externalId: job.jobNumber,
          jobNumber: job.jobNumber,
          jobName: job.description || "",
          jobDescription: job.description,
          status: job.status,
          type: job.type,
          date: job.date,
          premises: job.premises,
          customer: job.customer,
          // Use real financial data from SQL Server
          revenueBilled: job.revenue || 0,
          materials: job.materials || 0,
          labor: job.labor || 0,
          committed: 0,
          totalCost: job.cost || 0,
          profit: job.profit || 0,
          ratio: job.revenue ? ((job.profit || 0) / job.revenue * 100) : 0,
          budget: job.budgetRevenue || 0,
          toBeBilled: (job.budgetRevenue || 0) - (job.revenue || 0),
          billedPercent: job.budgetRevenue ? ((job.revenue || 0) / job.budgetRevenue * 100) : 0,
          // Hours
          regularHours: job.regularHours || 0,
          overtimeHours: job.overtimeHours || 0,
          doubleTimeHours: job.doubleTimeHours || 0,
          travelHours: job.travelHours || 0,
          totalHours: job.totalHours || 0,
        }));
        setJobs(jobResults);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleClick = (job: JobResult) => {
    openTab(`Job Results ${job.externalId || job.id}`, `/job-results/${job.id}`);
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
  const getJobFieldValue = (job: JobResult, fieldKey: string): string => {
    switch (fieldKey) {
      case "jobNumber": return job.externalId || "";
      case "accountId": return job.premises?.premisesId || "";
      case "accountTag": return job.premises?.name || job.premises?.address || "";
      case "account": return job.premises?.premisesId || "";
      case "description": return job.jobDescription || job.jobName || "";
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
    let aVal: any, bVal: any;
    switch (sortField) {
      case "jobNumber":
        aVal = a.externalId || "";
        bVal = b.externalId || "";
        break;
      case "accountId":
        aVal = a.premises?.premisesId || "";
        bVal = b.premises?.premisesId || "";
        break;
      case "tag":
        aVal = a.premises?.name || "";
        bVal = b.premises?.name || "";
        break;
      case "description":
        aVal = a.jobDescription || a.jobName || "";
        bVal = b.jobDescription || b.jobName || "";
        break;
      case "type":
        aVal = a.type || "";
        bVal = b.type || "";
        break;
      case "address":
        aVal = a.premises?.address || "";
        bVal = b.premises?.address || "";
        break;
      default:
        aVal = (a as any)[sortField] || 0;
        bVal = (b as any)[sortField] || 0;
    }
    if (typeof aVal === "string") {
      return sortDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
  });

  const formatCurrency = (amount: number) => {
    const value = Number(amount);
    if (value < 0) {
      return `($${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Calculate totals from filtered jobs
  const totals = {
    revenueBilled: filteredJobs.reduce((sum, j) => sum + j.revenueBilled, 0),
    materials: filteredJobs.reduce((sum, j) => sum + j.materials, 0),
    labor: filteredJobs.reduce((sum, j) => sum + j.labor, 0),
    committed: filteredJobs.reduce((sum, j) => sum + j.committed, 0),
    totalCost: filteredJobs.reduce((sum, j) => sum + j.totalCost, 0),
    profit: filteredJobs.reduce((sum, j) => sum + j.profit, 0),
    budget: filteredJobs.reduce((sum, j) => sum + j.budget, 0),
    toBeBilled: filteredJobs.reduce((sum, j) => sum + j.toBeBilled, 0),
  };

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
    clearFilters();
    setOpenMenu(null);
  };

  const handlePrint = () => {
    window.print();
    setOpenMenu(null);
  };

  const handleSettings = () => {
    alert("Settings - Coming soon");
    setOpenMenu(null);
  };

  const handleExit = () => {
    if (activeTabId) {
      closeTab(activeTabId);
    }
    setOpenMenu(null);
  };

  // Toolbar click handler
  const handleToolbarClick = async (action: string) => {
    switch (action) {
      case "new":
        alert("To create a new job, open an Account and use the Jobs link.\nJobs must be associated with an account.");
        break;
      case "edit":
        if (selectedRow) {
          const job = jobs.find(j => j.id === selectedRow);
          if (job) openTab(`Job Results ${job.externalId || job.id}`, `/job-results/${job.id}`);
        } else {
          alert("Please select a job to edit");
        }
        break;
      case "delete":
        if (selectedRow) {
          const job = jobs.find(j => j.id === selectedRow);
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
          const job = jobs.find(j => j.id === selectedRow);
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
      case "filter":
        setShowFilterDialog(true);
        break;
      case "clearFilter":
        handleNoFilterSort();
        break;
      case "refresh":
        fetchJobs();
        break;
      case "totals":
        setShowTotals(!showTotals);
        break;
    }
  };

  // Edit menu actions
  const handleNewRecord = () => handleToolbarClick("new");
  const handleEditRecord = () => handleToolbarClick("edit");
  const handleDeleteRecord = () => handleToolbarClick("delete");
  const handleReplicateRecord = () => handleToolbarClick("replicate");

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  const columns = [
    { field: "jobNumber" as SortField, label: "Job #" },
    { field: "accountId" as SortField, label: "Account" },
    { field: "tag" as SortField, label: "Tag" },
    { field: "description" as SortField, label: "Description" },
    { field: "type" as SortField, label: "Type" },
    { field: "revenueBilled" as SortField, label: "Revenue Billed" },
    { field: "materials" as SortField, label: "Materials" },
    { field: "labor" as SortField, label: "Labor" },
    { field: "committed" as SortField, label: "Committed" },
    { field: "totalCost" as SortField, label: "Total Cost" },
    { field: "profit" as SortField, label: "Profit" },
    { field: "ratio" as SortField, label: "Ratio" },
    { field: "budget" as SortField, label: "Budget" },
    { field: "toBeBilled" as SortField, label: "To Be Billed" },
    { field: "billedPercent" as SortField, label: "Billed %" },
    { field: "address" as SortField, label: "Address" },
  ];

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
          if ("type" in item && item.type === "separator") {
            return <div key={i} className="w-px h-5 bg-[#c0c0c0] mx-1" />;
          }

          if ("icon" in item) {
            const IconComponent = item.icon;
            const isActive = item.action === "totals" && showTotals;
            return (
              <button
                key={i}
                className={`w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border ${
                  isActive
                    ? "border-[#0078d4] bg-[#cce4f7]"
                    : "border-transparent hover:border-[#c0c0c0]"
                }`}
                title={item.title}
                onClick={() => handleToolbarClick(item.action)}
              >
                <IconComponent className="w-4 h-4" style={{ color: item.color }} />
              </button>
            );
          }
          return null;
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
      </div>

      {/* Type Tabs */}
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
      <div ref={tableContainerRef} className="flex-1 bg-white border border-[#a0a0a0] mx-2 mb-2 flex flex-col overflow-hidden">
        {/* Column Headers */}
        <div className="bg-[#f0f0f0] border-b border-[#c0c0c0] flex-shrink-0">
          <div className="flex text-[12px]">
            {columns.map((col, index) => (
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
                {/* Resize handle */}
                <div
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#0078d4] z-10"
                  onMouseDown={(e) => handleResizeStart(index, e)}
                  style={{ cursor: "col-resize" }}
                />
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
                onClick={() => setSelectedRow(job.id)}
                onDoubleClick={() => handleDoubleClick(job)}
                className={`flex text-[12px] cursor-pointer border-b border-[#d0d0d0] ${
                  selectedRow === job.id
                    ? "bg-[#0078d4] text-white"
                    : "bg-white hover:bg-[#f0f8ff]"
                }`}
              >
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[0] }}>{job.externalId || ""}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[1] }}>{job.premises?.premisesId || ""}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[2] }}>{job.premises?.name || ""}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[3] }}>{job.jobDescription || job.jobName}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[4] }}>{job.type || ""}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[5] }}>{formatCurrency(job.revenueBilled)}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[6] }}>{formatCurrency(job.materials)}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[7] }}>{formatCurrency(job.labor)}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[8] }}>{formatCurrency(job.committed)}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[9] }}>{formatCurrency(job.totalCost)}</div>
                <div className={`px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right ${job.profit < 0 && selectedRow !== job.id ? "text-red-600" : ""}`} style={{ width: columnWidths[10] }}>{formatCurrency(job.profit)}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[11] }}>{formatPercent(job.ratio)}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[12] }}>{formatCurrency(job.budget)}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[13] }}>{formatCurrency(job.toBeBilled)}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[14] }}>{formatPercent(job.billedPercent)}</div>
                <div className="px-2 py-1 truncate flex-shrink-0" style={{ width: columnWidths[15] }}>{job.premises?.address || ""}</div>
              </div>
            ))
          )}
        </div>

        {/* Totals Row - only shows when toggled on */}
        {showTotals && (
          <div className="flex text-[12px] font-semibold bg-[#f5f5f5] border-t-2 border-[#0078d4] flex-shrink-0">
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[0] }}>TOTALS</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[1] }}>{sortedJobs.length} jobs</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[2] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[3] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[4] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[5] }}>{formatCurrency(totals.revenueBilled)}</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[6] }}>{formatCurrency(totals.materials)}</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[7] }}>{formatCurrency(totals.labor)}</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[8] }}>{formatCurrency(totals.committed)}</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[9] }}>{formatCurrency(totals.totalCost)}</div>
            <div className={`px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right ${totals.profit < 0 ? "text-red-600" : ""}`} style={{ width: columnWidths[10] }}>{formatCurrency(totals.profit)}</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[11] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[12] }}>{formatCurrency(totals.budget)}</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[13] }}>{formatCurrency(totals.toBeBilled)}</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[14] }}></div>
            <div className="px-2 py-1 truncate flex-shrink-0" style={{ width: columnWidths[15] }}></div>
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
          <span>{sortedJobs.length} jobs</span>
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

      {/* Filter Dialog */}
      <FilterDialog
        isOpen={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        onApply={(filters) => setActiveFilters(filters)}
        title="Job Results"
        fields={filterFields}
        initialFilters={activeFilters}
      />
    </div>
  );
}
