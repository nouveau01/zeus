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

// Toolbar icons matching Total Service
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

interface JobMaintenancePageProps {
  premisesId?: string | null;
}

export default function JobMaintenancePage({ premisesId }: JobMaintenancePageProps) {
  const { openTab } = useTabs();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters
  const [catalogue, setCatalogue] = useState("None");
  const [activeType, setActiveType] = useState("All");
  const [showTotals, setShowTotals] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [activeType, premisesId]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeType !== "All") {
        params.set("type", activeType);
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
  const totalJobs = jobs.length;

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
              onClick={item.title === "Refresh" ? fetchJobs : undefined}
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
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Job #</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Account ID</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Contract Date</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Account Tag</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "25%" }}>Description</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Type</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Status</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Template</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "9%" }}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                    No jobs found
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => setSelectedId(job.id)}
                    onDoubleClick={() => handleDoubleClick(job)}
                    className={`cursor-pointer ${
                      selectedId === job.id
                        ? "bg-[#0078d4] text-white"
                        : "hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{job.externalId || ""}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{job.premises?.premisesId || ""}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{formatDate(job.date)}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{job.premises?.name || job.premises?.address || ""}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{job.jobDescription || job.jobName}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{job.type || ""}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{job.status}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{job.template || ""}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{formatDate(job.dueDate)}</td>
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
