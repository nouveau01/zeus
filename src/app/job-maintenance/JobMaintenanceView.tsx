"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Printer,
  Sigma,
  Lock,
  Home,
  HelpCircle,
  RefreshCw,
  Filter,
  FilterX,
  Settings,
  Copy,
  Building,
  Building2,
  Save,
  Trash2,
  Eraser,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";

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
  { icon: Check, color: "#5cb85c", title: "Approve", action: "approve" },
  { type: "separator" },
  { icon: Building2, color: "#5c8c8c", title: "Accounts", action: "accounts" },
  { icon: Building, color: "#5c8c8c", title: "Buildings", action: "buildings" },
  { type: "separator" },
  { icon: Sigma, color: "#2c3e50", title: "Totals", action: "totals" },
  { icon: Lock, color: "#f39c12", title: "Lock", action: "lock" },
  { type: "separator" },
  { icon: Home, color: "#e74c3c", title: "Home", action: "home" },
  { icon: HelpCircle, color: "#3498db", title: "Help", action: "help" },
  { icon: X, color: "#95a5a6", title: "Close", action: "close" },
] as const;

interface Job {
  id: string;
  externalId: string | null;
  jobName: string;
  jobDescription: string | null;
  status: string;
  type: string | null;
  contractType: string | null;
  date: string | null;
  dueDate: string | null;
  template: string | null;
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

  // Filter & Sort dialog state
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterDialogTab, setFilterDialogTab] = useState<"filtering" | "sorting">("filtering");
  const [savedSettings, setSavedSettings] = useState<string[]>(["-blank"]);
  const [selectedSavedSetting, setSelectedSavedSetting] = useState<string | null>(null);
  const [newSettingName, setNewSettingName] = useState("");
  const [showNewSettingDialog, setShowNewSettingDialog] = useState(false);

  // Clear all filter fields in the dialog (not applied filters)
  const clearFilterFields = () => {
    const reset: Record<string, { operator: string; value: string }> = {};
    filterFields.forEach(f => { reset[f.key] = { operator: "=", value: "" }; });
    setFilterValues(reset);
    // Also reset sort values
    const sortReset: Record<string, "asc" | "desc" | ""> = {};
    sortFields.forEach(f => { sortReset[f.key] = ""; });
    setSortValues(sortReset);
  };

  // Save current filter settings
  const saveFilterSettings = () => {
    if (selectedSavedSetting && selectedSavedSetting !== "-blank") {
      // Update existing setting - in a real app this would save to localStorage or API
      alert(`Settings "${selectedSavedSetting}" saved.`);
    } else {
      // Need to create new setting
      setShowNewSettingDialog(true);
    }
  };

  // Create new saved setting
  const createNewSetting = () => {
    if (newSettingName.trim()) {
      setSavedSettings(prev => [...prev, newSettingName.trim()]);
      setSelectedSavedSetting(newSettingName.trim());
      setNewSettingName("");
      setShowNewSettingDialog(false);
    }
  };

  // Delete selected saved setting
  const deleteSelectedSetting = () => {
    if (selectedSavedSetting && selectedSavedSetting !== "-blank") {
      if (confirm(`Delete saved setting "${selectedSavedSetting}"?`)) {
        setSavedSettings(prev => prev.filter(s => s !== selectedSavedSetting));
        setSelectedSavedSetting(null);
      }
    } else {
      alert("Please select a saved setting to delete (not -blank).");
    }
  };

  // All filter fields - matching Total Service layout
  const filterFields = [
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

  // Filter values state - operator and value for each field
  const [filterValues, setFilterValues] = useState<Record<string, { operator: string; value: string }>>(() => {
    const initial: Record<string, { operator: string; value: string }> = {};
    filterFields.forEach(f => { initial[f.key] = { operator: "=", value: "" }; });
    return initial;
  });

  // Sort fields state
  const sortFields = [
    { key: "jobNumber", label: "Job #" },
    { key: "accountId", label: "Account ID" },
    { key: "date", label: "Contract Date" },
    { key: "accountTag", label: "Account Tag" },
    { key: "description", label: "Description" },
    { key: "type", label: "Type" },
    { key: "status", label: "Status" },
    { key: "template", label: "Template" },
    { key: "dueDate", label: "Due Date" },
  ];

  const [sortValues, setSortValues] = useState<Record<string, "asc" | "desc" | "">>(() => {
    const initial: Record<string, "asc" | "desc" | ""> = {};
    sortFields.forEach(f => { initial[f.key] = ""; });
    return initial;
  });

  // F3 Lookup popup state
  const [showLookup, setShowLookup] = useState(false);
  const [lookupField, setLookupField] = useState<string | null>(null);
  const [lookupValues, setLookupValues] = useState<Array<{ id: string; label: string; description?: string }>>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupSearch, setLookupSearch] = useState("");
  const [selectedLookupIndex, setSelectedLookupIndex] = useState(0);

  // Open F3 lookup for a field
  const openLookup = async (fieldKey: string) => {
    const field = filterFields.find(f => f.key === fieldKey);
    if (!field?.hasLookup) return;

    setLookupField(fieldKey);
    setShowLookup(true);
    setLookupLoading(true);
    setLookupSearch("");
    setSelectedLookupIndex(0);

    try {
      const response = await fetch(`/api/lookups/${fieldKey}`);
      if (response.ok) {
        const data = await response.json();
        setLookupValues(data);
      }
    } catch (error) {
      console.error("Error fetching lookup values:", error);
    } finally {
      setLookupLoading(false);
    }
  };

  // Select a lookup value
  const selectLookupValue = (value: string) => {
    if (lookupField) {
      setFilterValues(prev => ({
        ...prev,
        [lookupField]: { ...prev[lookupField], value }
      }));
    }
    setShowLookup(false);
    setLookupField(null);
  };

  // Filter lookup values based on search
  const filteredLookupValues = lookupValues.filter(v =>
    v.label.toLowerCase().includes(lookupSearch.toLowerCase()) ||
    (v.description?.toLowerCase().includes(lookupSearch.toLowerCase()))
  );

  // Active filters that are currently applied (separate from dialog state)
  const [activeFilters, setActiveFilters] = useState<Record<string, { operator: string; value: string }>>({});

  // Apply filters from dialog
  const applyFilters = () => {
    // Copy current filter values to active filters (only those with values)
    const newActiveFilters: Record<string, { operator: string; value: string }> = {};
    Object.entries(filterValues).forEach(([key, val]) => {
      if (val.value.trim() !== "") {
        newActiveFilters[key] = { ...val };
      }
    });
    setActiveFilters(newActiveFilters);
    setShowFilterDialog(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({});
    // Reset filter values in dialog
    const reset: Record<string, { operator: string; value: string }> = {};
    filterFields.forEach(f => { reset[f.key] = { operator: "=", value: "" }; });
    setFilterValues(reset);
  };

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
      const params = new URLSearchParams();
      if (activeTab !== "All") {
        params.set("type", activeTab);
      }
      if (premisesId) {
        params.set("premisesId", premisesId);
      }

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
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

  // Toolbar click handler
  const handleToolbarClick = async (action: string) => {
    switch (action) {
      case "new":
        alert("To create a new job, open an Account and use the Jobs link.\nJobs must be associated with an account.");
        break;
      case "edit":
        if (selectedRow) {
          const job = jobs.find(j => j.id === selectedRow);
          if (job) openTab(`Job ${job.externalId || job.id}`, `/job-maintenance/${job.id}`);
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
      case "approve":
        if (selectedRow) {
          const job = jobs.find(j => j.id === selectedRow);
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
          const job = jobs.find(j => j.id === selectedRow);
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
          const job = jobs.find(j => j.id === selectedRow);
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
          const job = jobs.find(j => j.id === selectedRow);
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
            <div className="absolute top-full left-0 mt-0 bg-white border border-[#c0c0c0] shadow-md z-50 min-w-[150px]">
              <button className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] text-[12px] text-gray-400" disabled>
                Cut
              </button>
              <button className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] text-[12px] text-gray-400" disabled>
                Copy
              </button>
              <button className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] text-[12px] text-gray-400" disabled>
                Paste
              </button>
            </div>
          )}
        </div>

        {/* Pim Menu */}
        <div className="relative">
          <span
            className={`px-3 py-1 cursor-pointer rounded ${openMenu === "pim" ? "bg-[#e5e5e5]" : "hover:bg-[#e5e5e5]"}`}
            onClick={() => setOpenMenu(openMenu === "pim" ? null : "pim")}
          >
            Pim
          </span>
          {openMenu === "pim" && (
            <div className="absolute top-full left-0 mt-0 bg-white border border-[#c0c0c0] shadow-md z-50 min-w-[150px]">
              <button className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] text-[12px] text-gray-400" disabled>
                Coming soon
              </button>
            </div>
          )}
        </div>

        {/* Tools Menu */}
        <div className="relative">
          <span
            className={`px-3 py-1 cursor-pointer rounded ${openMenu === "tools" ? "bg-[#e5e5e5]" : "hover:bg-[#e5e5e5]"}`}
            onClick={() => setOpenMenu(openMenu === "tools" ? null : "tools")}
          >
            Tools
          </span>
          {openMenu === "tools" && (
            <div className="absolute top-full left-0 mt-0 bg-white border border-[#c0c0c0] shadow-md z-50 min-w-[150px]">
              <button className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] text-[12px] text-gray-400" disabled>
                Coming soon
              </button>
            </div>
          )}
        </div>

        {/* Help Menu */}
        <div className="relative">
          <span
            className={`px-3 py-1 cursor-pointer rounded ${openMenu === "help" ? "bg-[#e5e5e5]" : "hover:bg-[#e5e5e5]"}`}
            onClick={() => setOpenMenu(openMenu === "help" ? null : "help")}
          >
            Help
          </span>
          {openMenu === "help" && (
            <div className="absolute top-full left-0 mt-0 bg-white border border-[#c0c0c0] shadow-md z-50 min-w-[150px]">
              <button className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] text-[12px] text-gray-400" disabled>
                About
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
      <div className="flex-1 bg-white border border-[#a0a0a0] mx-2 mb-2 flex flex-col overflow-hidden">
        {/* Column Headers */}
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-[#f0f0f0] text-[12px] text-left">
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "8%" }}
                onClick={() => handleSort("jobNumber")}
              >
                <div className="flex items-center gap-1">
                  Job #
                  <SortIcon field="jobNumber" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "8%" }}
                onClick={() => handleSort("accountId")}
              >
                <div className="flex items-center gap-1">
                  Account ID
                  <SortIcon field="accountId" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "10%" }}
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center gap-1">
                  Contract Date
                  <SortIcon field="date" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "12%" }}
                onClick={() => handleSort("tag")}
              >
                <div className="flex items-center gap-1">
                  Account Tag
                  <SortIcon field="tag" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "25%" }}
                onClick={() => handleSort("description")}
              >
                <div className="flex items-center gap-1">
                  Description
                  <SortIcon field="description" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "10%" }}
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center gap-1">
                  Type
                  <SortIcon field="type" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "8%" }}
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "10%" }}
                onClick={() => handleSort("template")}
              >
                <div className="flex items-center gap-1">
                  Template
                  <SortIcon field="template" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "9%" }}
                onClick={() => handleSort("dueDate")}
              >
                <div className="flex items-center gap-1">
                  Due Date
                  <SortIcon field="dueDate" />
                </div>
              </th>
            </tr>
          </thead>
        </table>

        {/* Data Rows */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse table-fixed">
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-[#808080] border border-[#d0d0d0]">Loading...</td>
                </tr>
              ) : sortedJobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-[#808080] border border-[#d0d0d0]">No jobs found</td>
                </tr>
              ) : (
                sortedJobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedRow(job.id)}
                    onDoubleClick={() => handleDoubleClick(job)}
                    className={`text-[12px] cursor-pointer ${
                      selectedRow === job.id
                        ? "bg-[#0078d4] text-white"
                        : "bg-white hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "8%" }}>{job.externalId || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "8%" }}>{job.premises?.premisesId || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "10%" }}>{formatDate(job.date)}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "12%" }}>{job.premises?.name || job.premises?.address || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "25%" }}>{job.jobDescription || job.jobName}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "10%" }}>{job.type || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "8%" }}>{job.status}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "10%" }}>{job.template || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "9%" }}>{formatDate(job.dueDate)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Bar with Totals */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        {/* Filter indicator and Totals Display */}
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
          {showTotals && (
            <span className="text-[#333]">
              <strong>Rows:</strong> {totalJobs}
            </span>
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

      {/* Filter & Sort Dialog - Matching Total Service Layout */}
      {showFilterDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div
            className="bg-[#ece9d8] border border-[#808080] shadow-lg flex flex-col"
            style={{ width: "700px", height: "500px", fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "11px" }}
          >
            {/* Dialog Title Bar */}
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center gap-2">
              <Filter className="w-4 h-4 text-white" />
              <span className="text-white font-bold text-[12px] flex-1">Filter & Sort Jobs</span>
              <button
                onClick={() => setShowFilterDialog(false)}
                className="text-white hover:bg-[#c45c5c] px-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Bar */}
            <div className="bg-[#ece9d8] flex items-center px-1 py-0.5 border-b border-[#808080]">
              <span className="px-2 py-0.5 hover:bg-[#c0c0c0] cursor-pointer">File</span>
              <span className="px-2 py-0.5 hover:bg-[#c0c0c0] cursor-pointer">Edit</span>
              <span className="px-2 py-0.5 hover:bg-[#c0c0c0] cursor-pointer">Help</span>
            </div>

            {/* Toolbar */}
            <div className="bg-[#ece9d8] flex items-center px-1 py-1 gap-0.5 border-b border-[#808080]">
              <button
                onClick={applyFilters}
                className="w-6 h-6 flex items-center justify-center hover:bg-[#c0c0c0] rounded"
                title="Apply Filter"
              >
                <Filter className="w-4 h-4 text-[#7c6b8e]" />
              </button>
              <button
                onClick={clearFilterFields}
                className="w-6 h-6 flex items-center justify-center hover:bg-[#c0c0c0] rounded"
                title="Clear Fields"
              >
                <FileText className="w-4 h-4 text-[#4a7c59]" />
              </button>
              <button
                onClick={deleteSelectedSetting}
                className="w-6 h-6 flex items-center justify-center hover:bg-[#c0c0c0] rounded"
                title="Delete Existing Record"
              >
                <X className="w-4 h-4 text-[#c45c5c]" />
              </button>
              <div className="w-px h-5 bg-[#808080] mx-1" />
              <button
                className="w-6 h-6 flex items-center justify-center rounded opacity-50 cursor-not-allowed"
                title="Save (Coming Soon)"
                disabled
              >
                <Save className="w-4 h-4 text-[#2980b9]" />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left Panel - Filters */}
              <div className="w-[140px] bg-[#ece9d8] border-r border-[#808080] flex flex-col">
                <div className="px-2 py-1 text-[11px] font-bold border-b border-[#808080]">Filters</div>
                <div className="flex-1 bg-white overflow-y-auto">
                  <div className="px-2 py-2 text-[11px] text-[#808080] italic">
                    Coming soon
                  </div>
                </div>
              </div>

              {/* Right Panel - Tabs */}
              <div className="flex-1 flex flex-col bg-[#ece9d8]">
                {/* Tab Headers */}
                <div className="flex px-2 pt-1">
                  <button
                    onClick={() => setFilterDialogTab("filtering")}
                    className={`px-3 py-1 text-[11px] border border-[#808080] rounded-t -mb-px ${
                      filterDialogTab === "filtering"
                        ? "bg-white border-b-white font-bold"
                        : "bg-[#d4d0c8]"
                    }`}
                  >
                    1 Filtering
                  </button>
                  <button
                    onClick={() => setFilterDialogTab("sorting")}
                    className={`px-3 py-1 text-[11px] border border-[#808080] border-l-0 rounded-t -mb-px ${
                      filterDialogTab === "sorting"
                        ? "bg-white border-b-white font-bold"
                        : "bg-[#d4d0c8]"
                    }`}
                  >
                    2 Sorting
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-1 mx-2 mb-2 border border-[#808080] bg-white overflow-hidden flex flex-col">
                  {filterDialogTab === "filtering" ? (
                    <>
                      {/* Filter Table Header */}
                      <div className="flex bg-[#f0f0f0] border-b border-[#808080] text-[11px] font-bold">
                        <div className="w-[140px] px-2 py-1 border-r border-[#808080]">Field</div>
                        <div className="w-[80px] px-2 py-1 border-r border-[#808080]">Operator</div>
                        <div className="flex-1 px-2 py-1">Value</div>
                      </div>
                      {/* Filter Table Body */}
                      <div className="flex-1 overflow-y-auto">
                        {filterFields.map((field) => (
                          <div key={field.key} className="flex border-b border-[#e0e0e0] text-[11px]">
                            <div className="w-[140px] px-2 py-0.5 border-r border-[#e0e0e0] bg-[#f9f9f9]">
                              {field.label}
                            </div>
                            <div className="w-[80px] px-1 py-0.5 border-r border-[#e0e0e0]">
                              <select
                                value={filterValues[field.key]?.operator || "="}
                                onChange={(e) => {
                                  setFilterValues(prev => ({
                                    ...prev,
                                    [field.key]: { ...prev[field.key], operator: e.target.value }
                                  }));
                                }}
                                className="w-full text-[11px] border-0 bg-transparent focus:outline-none cursor-pointer"
                              >
                                <option value="=">Equals</option>
                                <option value="contains">Contains</option>
                                <option value="startsWith">Starts With</option>
                                <option value="endsWith">Ends With</option>
                                <option value=">">Greater Than</option>
                                <option value=">=">Greater or Equal</option>
                                <option value="<">Less Than</option>
                                <option value="<=">Less or Equal</option>
                                <option value="<>">Not Equal</option>
                              </select>
                            </div>
                            <div className="flex-1 px-1 py-0.5">
                              <input
                                type="text"
                                value={filterValues[field.key]?.value || ""}
                                onChange={(e) => {
                                  setFilterValues(prev => ({
                                    ...prev,
                                    [field.key]: { ...prev[field.key], value: e.target.value }
                                  }));
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "F3" && field.hasLookup) {
                                    e.preventDefault();
                                    openLookup(field.key);
                                  }
                                }}
                                className="w-full text-[11px] border-0 bg-transparent focus:outline-none"
                                placeholder={field.hasLookup ? "Press F3 for list" : ""}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Sort Table Header */}
                      <div className="flex bg-[#f0f0f0] border-b border-[#808080] text-[11px] font-bold">
                        <div className="w-[180px] px-2 py-1 border-r border-[#808080]">Field</div>
                        <div className="flex-1 px-2 py-1">Direction</div>
                      </div>
                      {/* Sort Table Body */}
                      <div className="flex-1 overflow-y-auto">
                        {sortFields.map((field) => (
                          <div key={field.key} className="flex border-b border-[#e0e0e0] text-[11px]">
                            <div className="w-[180px] px-2 py-0.5 border-r border-[#e0e0e0] bg-[#f9f9f9]">
                              {field.label}
                            </div>
                            <div className="flex-1 px-1 py-0.5">
                              <select
                                value={sortValues[field.key] || ""}
                                onChange={(e) => {
                                  setSortValues(prev => ({
                                    ...prev,
                                    [field.key]: e.target.value as "asc" | "desc" | ""
                                  }));
                                }}
                                className="w-full text-[11px] border-0 bg-transparent focus:outline-none cursor-pointer"
                              >
                                <option value=""></option>
                                <option value="asc">Ascending</option>
                                <option value="desc">Descending</option>
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Setting Name Dialog */}
      {showNewSettingDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[55]">
          <div
            className="bg-[#ece9d8] border border-[#808080] shadow-lg"
            style={{ width: "300px", fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "11px" }}
          >
            {/* Title Bar */}
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center justify-between">
              <span className="text-white font-bold text-[12px]">New Saved Setting</span>
              <button
                onClick={() => setShowNewSettingDialog(false)}
                className="text-white hover:bg-[#c45c5c] px-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              <label className="block text-[11px] mb-1">Setting Name:</label>
              <input
                type="text"
                value={newSettingName}
                onChange={(e) => setNewSettingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") createNewSetting();
                  if (e.key === "Escape") setShowNewSettingDialog(false);
                }}
                className="w-full px-2 py-1 border border-[#808080] text-[11px]"
                placeholder="Enter setting name..."
                autoFocus
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 px-4 pb-4">
              <button
                onClick={createNewSetting}
                className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
              >
                OK
              </button>
              <button
                onClick={() => setShowNewSettingDialog(false)}
                className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F3 Lookup Popup */}
      {showLookup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
          <div
            className="bg-[#ece9d8] border border-[#808080] shadow-lg flex flex-col"
            style={{ width: "400px", height: "350px", fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "11px" }}
          >
            {/* Title Bar */}
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center justify-between">
              <span className="text-white font-bold text-[12px]">
                Select {filterFields.find(f => f.key === lookupField)?.label.replace("*", "")}
              </span>
              <button
                onClick={() => setShowLookup(false)}
                className="text-white hover:bg-[#c45c5c] px-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Box */}
            <div className="p-2 border-b border-[#808080]">
              <input
                type="text"
                value={lookupSearch}
                onChange={(e) => {
                  setLookupSearch(e.target.value);
                  setSelectedLookupIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedLookupIndex(prev => Math.min(prev + 1, filteredLookupValues.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedLookupIndex(prev => Math.max(prev - 1, 0));
                  } else if (e.key === "Enter" && filteredLookupValues[selectedLookupIndex]) {
                    selectLookupValue(filteredLookupValues[selectedLookupIndex].id);
                  } else if (e.key === "Escape") {
                    setShowLookup(false);
                  }
                }}
                className="w-full px-2 py-1 border border-[#808080] text-[11px]"
                placeholder="Type to search..."
                autoFocus
              />
            </div>

            {/* Results Table */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex bg-[#f0f0f0] border-b border-[#808080] text-[11px] font-bold">
                <div className="w-[140px] px-2 py-1 border-r border-[#808080]">Value</div>
                <div className="flex-1 px-2 py-1">Description</div>
              </div>
              {/* Body */}
              <div className="flex-1 overflow-y-auto bg-white">
                {lookupLoading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : filteredLookupValues.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No results found</div>
                ) : (
                  filteredLookupValues.map((item, idx) => (
                    <div
                      key={item.id}
                      onDoubleClick={() => selectLookupValue(item.id)}
                      onClick={() => setSelectedLookupIndex(idx)}
                      className={`flex border-b border-[#e0e0e0] text-[11px] cursor-pointer ${
                        idx === selectedLookupIndex ? "bg-[#316ac5] text-white" : "hover:bg-[#e8e8e8]"
                      }`}
                    >
                      <div className="w-[140px] px-2 py-1 border-r border-[#e0e0e0] truncate">
                        {item.label}
                      </div>
                      <div className="flex-1 px-2 py-1 truncate">
                        {item.description || ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 p-2 border-t border-[#808080]">
              <button
                onClick={() => {
                  if (filteredLookupValues[selectedLookupIndex]) {
                    selectLookupValue(filteredLookupValues[selectedLookupIndex].id);
                  }
                }}
                className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
              >
                OK
              </button>
              <button
                onClick={() => setShowLookup(false)}
                className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
