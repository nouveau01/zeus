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

// Toolbar icons matching Total Service
const toolbarIcons = [
  { icon: FileText, color: "#4a7c59", title: "New" },
  { icon: Pencil, color: "#d4a574", title: "Edit" },
  { icon: X, color: "#c45c5c", title: "Delete" },
  { icon: Check, color: "#5cb85c", title: "Check" },
  { icon: BarChart3, color: "#e67e22", title: "Statistics" },
  { icon: DollarSign, color: "#5cb85c", title: "Dollar" },
  { icon: Sigma, color: "#2c3e50", title: "Totals", isToggle: true },
  { icon: Calendar, color: "#3498db", title: "Calendar" },
  { icon: Printer, color: "#9b59b6", title: "Print" },
  { icon: Upload, color: "#27ae60", title: "Export" },
  { icon: Download, color: "#27ae60", title: "Import" },
  { icon: Filter, color: "#d4c574", title: "Filter" },
  { icon: Copy, color: "#6b8cae", title: "Copy" },
  { icon: ClipboardPaste, color: "#5c8c8c", title: "Paste" },
  { icon: Lock, color: "#f39c12", title: "Lock" },
  { icon: Home, color: "#e74c3c", title: "Home" },
  { icon: HelpCircle, color: "#3498db", title: "Help" },
  { icon: X, color: "#95a5a6", title: "Close" },
];

interface JobResultsPageProps {
  premisesId?: string | null;
}

export default function JobResultsView({ premisesId }: JobResultsPageProps) {
  const { openTab } = useTabs();
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters
  const [catalogue, setCatalogue] = useState("None");
  const [range, setRange] = useState("Cumulative");
  const [activeType, setActiveType] = useState("All");
  const [showTotals, setShowTotals] = useState(true);

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
        // Map job data to include financial fields (mock calculations for now)
        const jobResults: JobResult[] = data.map((job: any) => ({
          ...job,
          revenueBilled: Math.random() * 100000,
          materials: Math.random() * 50000,
          labor: Math.random() * 10000,
          committed: Math.random() * 5000,
          totalCost: Math.random() * 60000,
          profit: (Math.random() - 0.3) * 50000, // Can be negative
          ratio: Math.random() * 100,
          budget: Math.random() * 80000,
          toBeBilled: Math.random() * 20000,
          billedPercent: Math.random() * 100,
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
    openTab(`Job #${job.externalId || job.id} - ${job.jobDescription || ""}`, `/job-results/${job.id}`);
  };

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

  // Calculate totals
  const totals = {
    revenueBilled: jobs.reduce((sum, j) => sum + j.revenueBilled, 0),
    materials: jobs.reduce((sum, j) => sum + j.materials, 0),
    labor: jobs.reduce((sum, j) => sum + j.labor, 0),
    committed: jobs.reduce((sum, j) => sum + j.committed, 0),
    totalCost: jobs.reduce((sum, j) => sum + j.totalCost, 0),
    profit: jobs.reduce((sum, j) => sum + j.profit, 0),
    budget: jobs.reduce((sum, j) => sum + j.budget, 0),
    toBeBilled: jobs.reduce((sum, j) => sum + j.toBeBilled, 0),
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
          const isActive = item.title === "Totals" && showTotals;
          return (
            <button
              key={i}
              className={`w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border ${
                isActive
                  ? "border-[#0078d4] bg-[#cce4f7]"
                  : "border-transparent hover:border-[#c0c0c0]"
              }`}
              title={item.title}
              onClick={item.title === "Totals" ? () => setShowTotals(!showTotals) : undefined}
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
          <span className="text-[11px]">Range</span>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white min-w-[80px]"
          >
            <option value="Cumulative">Cumulative</option>
            <option value="This Month">This Month</option>
            <option value="This Quarter">This Quarter</option>
            <option value="This Year">This Year</option>
            <option value="Last Month">Last Month</option>
            <option value="Last Quarter">Last Quarter</option>
            <option value="Last Year">Last Year</option>
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
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>Job #</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Account</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Tag</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Description</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>Type</th>
                <th className="px-1 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Revenue Billed</th>
                <th className="px-1 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "7%" }}>Materials</th>
                <th className="px-1 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>Labor</th>
                <th className="px-1 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>Committed</th>
                <th className="px-1 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "7%" }}>Total Cost</th>
                <th className="px-1 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "7%" }}>Profit</th>
                <th className="px-1 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "5%" }}>Ratio</th>
                <th className="px-1 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>Budget</th>
                <th className="px-1 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>To Be Billed</th>
                <th className="px-1 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "5%" }}>Billed %</th>
                <th className="px-1 py-1 text-left font-medium border border-[#c0c0c0]">Address</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
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
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{job.premises?.name || ""}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{job.jobDescription || job.jobName}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{job.type || ""}</td>
                    <td className="px-1 py-0.5 text-right border border-[#d0d0d0]">{formatCurrency(job.revenueBilled)}</td>
                    <td className="px-1 py-0.5 text-right border border-[#d0d0d0]">{formatCurrency(job.materials)}</td>
                    <td className="px-1 py-0.5 text-right border border-[#d0d0d0]">{formatCurrency(job.labor)}</td>
                    <td className="px-1 py-0.5 text-right border border-[#d0d0d0]">{formatCurrency(job.committed)}</td>
                    <td className="px-1 py-0.5 text-right border border-[#d0d0d0]">{formatCurrency(job.totalCost)}</td>
                    <td className={`px-1 py-0.5 text-right border border-[#d0d0d0] ${
                      job.profit < 0 && selectedId !== job.id ? "text-red-600" : ""
                    }`}>
                      {formatCurrency(job.profit)}
                    </td>
                    <td className="px-1 py-0.5 text-right border border-[#d0d0d0]">{formatPercent(job.ratio)}</td>
                    <td className="px-1 py-0.5 text-right border border-[#d0d0d0]">{formatCurrency(job.budget)}</td>
                    <td className="px-1 py-0.5 text-right border border-[#d0d0d0]">{formatCurrency(job.toBeBilled)}</td>
                    <td className="px-1 py-0.5 text-right border border-[#d0d0d0]">{formatPercent(job.billedPercent)}</td>
                    <td className="px-1 py-0.5 border border-[#d0d0d0]">{job.premises?.address || ""}</td>
                  </tr>
                ))
              )}
              {/* Totals Row */}
              {showTotals && jobs.length > 0 && (
                <tr className="bg-[#f0f0f0] font-medium sticky bottom-0">
                  <td className="px-1 py-0.5 border border-[#c0c0c0]"></td>
                  <td className="px-1 py-0.5 border border-[#c0c0c0]"></td>
                  <td className="px-1 py-0.5 border border-[#c0c0c0]"></td>
                  <td className="px-1 py-0.5 border border-[#c0c0c0]"></td>
                  <td className="px-1 py-0.5 border border-[#c0c0c0]"></td>
                  <td className="px-1 py-0.5 text-right border border-[#c0c0c0]">{formatCurrency(totals.revenueBilled)}</td>
                  <td className="px-1 py-0.5 text-right border border-[#c0c0c0]">{formatCurrency(totals.materials)}</td>
                  <td className="px-1 py-0.5 text-right border border-[#c0c0c0]">{formatCurrency(totals.labor)}</td>
                  <td className="px-1 py-0.5 text-right border border-[#c0c0c0]">{formatCurrency(totals.committed)}</td>
                  <td className="px-1 py-0.5 text-right border border-[#c0c0c0]">{formatCurrency(totals.totalCost)}</td>
                  <td className={`px-1 py-0.5 text-right border border-[#c0c0c0] ${totals.profit < 0 ? "text-red-600" : ""}`}>
                    {formatCurrency(totals.profit)}
                  </td>
                  <td className="px-1 py-0.5 border border-[#c0c0c0]"></td>
                  <td className="px-1 py-0.5 text-right border border-[#c0c0c0]">{formatCurrency(totals.budget)}</td>
                  <td className="px-1 py-0.5 text-right border border-[#c0c0c0]">{formatCurrency(totals.toBeBilled)}</td>
                  <td className="px-1 py-0.5 border border-[#c0c0c0]"></td>
                  <td className="px-1 py-0.5 border border-[#c0c0c0]"></td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center justify-between text-[11px]">
        <span>{jobs.length} jobs</span>
        <span></span>
      </div>
    </div>
  );
}
