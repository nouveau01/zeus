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
  const { openTab } = useTabs();
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

  const sortedJobs = [...jobs].sort((a, b) => {
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

  // Don't render until hydrated to avoid flicker
  if (!isHydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f5]">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

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
                  // Jobs must be created from within an account
                  alert("To create a new job, open an Account and use the Jobs link.\nJobs must be associated with an account.");
                } else if (item.action === "edit" && selectedRow) {
                  const job = jobs.find(j => j.id === selectedRow);
                  if (job) openTab(`Job ${job.externalId || job.id}`, `/job-maintenance/${job.id}`);
                } else if (item.action === "delete" && selectedRow) {
                  const job = jobs.find(j => j.id === selectedRow);
                  if (job && confirm(`Delete job "${job.externalId || job.jobName}"?`)) {
                    try {
                      const res = await fetch(`/api/jobs/${selectedRow}`, { method: "DELETE" });
                      if (res.ok) { setSelectedRow(null); fetchJobs(); }
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
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        {/* Totals Display */}
        <div className="flex items-center gap-4 text-[11px]">
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
    </div>
  );
}
