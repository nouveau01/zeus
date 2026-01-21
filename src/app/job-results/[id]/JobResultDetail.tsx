"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Printer,
  Check,
  X,
  DollarSign,
  BarChart3,
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";

interface JobResultDetailProps {
  jobId: string;
  onClose: () => void;
}

interface Job {
  id: string;
  externalId: string | null;
  jobName: string;
  jobDescription: string | null;
  status: string;
  type: string | null;
  template: string | null;
  premises: {
    id: string;
    premisesId: string | null;
    name: string | null;
    address: string;
    customer: {
      id: string;
      name: string;
    } | null;
  } | null;
}

const TABS = ["1 Summary & Hours Worked", "2 Job Costing Detail", "3 Job Costing Items", "4 Custom/Remarks"];

export default function JobResultDetail({ jobId, onClose }: JobResultDetailProps) {
  const { openTab } = useTabs();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("1 Summary & Hours Worked");

  // Hours data
  const [hours, setHours] = useState({
    regular: 0,
    overtime: 0,
    time17: 0,
    doubleTime: 0,
    travel: 0,
    total: 0,
    budgeted: 0,
    difference: 0,
  });

  // Financial summary data
  const [financials, setFinancials] = useState({
    actual: { revenues: 0, costs: 130.72, profits: -130.72, percent: 0 },
    committed: { revenues: 0, costs: 1.00, profits: -1.00, percent: 0 },
    total: { revenues: 0, costs: 131.72, profits: -131.72, percent: 0 },
    budget: { revenues: 3660.00, costs: 0, profits: 3660.00, percent: 100 },
    difference: { revenues: -3660.00, costs: 131.72, profits: -3791.72, percent: 104 },
    overUnder: { revenues: -100, costs: 0, profits: -103.60 },
  });

  // Hourly yield data
  const [hourlyYield, setHourlyYield] = useState({
    avgIncome: 0,
    avgCost: 0,
    avgProfit: 0,
  });

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
      }
    } catch (error) {
      console.error("Error fetching job:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const value = Number(amount);
    if (value < 0) {
      return `($${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => {
    if (value < 0) {
      return `${value.toFixed(2)}%`;
    }
    return `${value.toFixed(2)}%`;
  };

  const openJobMaintenance = () => {
    if (job) {
      openTab(`Job ${job.externalId || job.id}`, `/job-maintenance/${job.id}`);
    }
  };

  const openAccount = () => {
    if (job?.premises) {
      openTab(job.premises.name || job.premises.premisesId || "Account", `/accounts/${job.premises.id}`);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f5]">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f5]">
        <span className="text-red-500">Job not found</span>
      </div>
    );
  }

  const inputClass = "px-2 py-1 border border-[#a0a0a0] text-[12px] bg-[#f5f5f5]";
  const labelClass = "text-[12px] text-right";

  // Tab 1: Summary & Hours Worked
  const renderSummaryTab = () => (
    <div className="flex gap-8 p-4">
      {/* Left side - Hours */}
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-[12px] mb-2">Hours</h3>

        <div className="flex items-center gap-2">
          <label className={`${labelClass} w-20`}>Regular</label>
          <input type="text" value={hours.regular.toFixed(2)} readOnly className={`${inputClass} w-20 text-right`} />
        </div>
        <div className="flex items-center gap-2">
          <label className={`${labelClass} w-20`}>Overtime</label>
          <input type="text" value={hours.overtime.toFixed(2)} readOnly className={`${inputClass} w-20 text-right`} />
        </div>
        <div className="flex items-center gap-2">
          <label className={`${labelClass} w-20`}>1.7 Time</label>
          <input type="text" value={hours.time17.toFixed(2)} readOnly className={`${inputClass} w-20 text-right`} />
        </div>
        <div className="flex items-center gap-2">
          <label className={`${labelClass} w-20`}>DoubleTime</label>
          <input type="text" value={hours.doubleTime.toFixed(2)} readOnly className={`${inputClass} w-20 text-right`} />
        </div>
        <div className="flex items-center gap-2">
          <label className={`${labelClass} w-20`}>Travel</label>
          <input type="text" value={hours.travel.toFixed(2)} readOnly className={`${inputClass} w-20 text-right`} />
        </div>
        <div className="flex items-center gap-2">
          <label className={`${labelClass} w-20`}>Total</label>
          <input type="text" value={hours.total.toFixed(2)} readOnly className={`${inputClass} w-20 text-right`} />
        </div>
        <div className="flex items-center gap-2">
          <label className={`${labelClass} w-20`}>Budgeted</label>
          <input type="text" value={hours.budgeted.toFixed(2)} readOnly className={`${inputClass} w-20 text-right`} />
        </div>
        <div className="flex items-center gap-2">
          <label className={`${labelClass} w-20`}>Difference</label>
          <input type="text" value={hours.difference.toFixed(2)} readOnly className={`${inputClass} w-20 text-right`} />
        </div>
      </div>

      {/* Right side - Financial Summary Table and Hourly Yield */}
      <div className="flex flex-col gap-4">
        {/* Financial Summary Table */}
        <table className="border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#f0f0f0]">
              <th className="px-3 py-1 text-left border border-[#c0c0c0] font-medium">Desc</th>
              <th className="px-3 py-1 text-right border border-[#c0c0c0] font-medium">Revenues</th>
              <th className="px-3 py-1 text-right border border-[#c0c0c0] font-medium">Costs</th>
              <th className="px-3 py-1 text-right border border-[#c0c0c0] font-medium">Profits</th>
              <th className="px-3 py-1 text-right border border-[#c0c0c0] font-medium">Percent</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-1 border border-[#d0d0d0]">Actual</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(financials.actual.revenues)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(financials.actual.costs)}</td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${financials.actual.profits < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(financials.actual.profits)}
              </td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatPercent(financials.actual.percent)}</td>
            </tr>
            <tr>
              <td className="px-3 py-1 border border-[#d0d0d0]">Committed</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(financials.committed.revenues)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(financials.committed.costs)}</td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${financials.committed.profits < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(financials.committed.profits)}
              </td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatPercent(financials.committed.percent)}</td>
            </tr>
            <tr>
              <td className="px-3 py-1 border border-[#d0d0d0]">Total</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(financials.total.revenues)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(financials.total.costs)}</td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${financials.total.profits < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(financials.total.profits)}
              </td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatPercent(financials.total.percent)}</td>
            </tr>
            <tr>
              <td className="px-3 py-1 border border-[#d0d0d0]">Budget</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(financials.budget.revenues)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(financials.budget.costs)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(financials.budget.profits)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatPercent(financials.budget.percent)}</td>
            </tr>
            <tr>
              <td className="px-3 py-1 border border-[#d0d0d0]">Difference</td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${financials.difference.revenues < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(financials.difference.revenues)}
              </td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(financials.difference.costs)}</td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${financials.difference.profits < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(financials.difference.profits)}
              </td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatPercent(financials.difference.percent)}</td>
            </tr>
            <tr>
              <td className="px-3 py-1 border border-[#d0d0d0]">% Over/Under</td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${financials.overUnder.revenues < 0 ? "text-red-600" : ""}`}>
                {formatPercent(financials.overUnder.revenues)}
              </td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatPercent(financials.overUnder.costs)}</td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${financials.overUnder.profits < 0 ? "text-red-600" : ""}`}>
                {formatPercent(financials.overUnder.profits)}
              </td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
            </tr>
          </tbody>
        </table>

        {/* Hourly Yield */}
        <fieldset className="border border-[#a0a0a0] p-3">
          <legend className="text-[12px] px-1">Hourly Yield</legend>
          <div className="flex flex-col gap-2 text-[12px]">
            <div className="flex justify-between gap-8">
              <span>Average Total Income Generated Per Hour</span>
              <span>{formatCurrency(hourlyYield.avgIncome)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span>Average Total Cost Incurred Per Hour</span>
              <span>{formatCurrency(hourlyYield.avgCost)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span>Average Profit Amount Generated Per Hour</span>
              <span>{formatCurrency(hourlyYield.avgProfit)}</span>
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );

  // Tab 2: Job Costing Detail
  const renderCostingDetailTab = () => (
    <div className="p-4">
      <div className="border border-[#a0a0a0] bg-white overflow-auto" style={{ maxHeight: "400px" }}>
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Date</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Type</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Reference</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Description</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]">Revenue</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]">Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                No costing detail records
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // Tab 3: Job Costing Items
  const renderCostingItemsTab = () => (
    <div className="p-4">
      <div className="border border-[#a0a0a0] bg-white overflow-auto" style={{ maxHeight: "400px" }}>
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Item</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Description</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]">Quantity</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]">Unit Cost</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]">Total Cost</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]">Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                No costing items
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // Tab 4: Custom/Remarks
  const renderCustomRemarksTab = () => (
    <div className="p-4">
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20">Custom 1</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] w-48" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20">Custom 2</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] w-48" />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20">Custom 3</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] w-48" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20">Custom 4</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] w-48" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px]">Remarks</label>
          <textarea className="px-2 py-1 border border-[#a0a0a0] text-[12px] h-32 resize-none" />
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "1 Summary & Hours Worked":
        return renderSummaryTab();
      case "2 Job Costing Detail":
        return renderCostingDetailTab();
      case "3 Job Costing Items":
        return renderCostingItemsTab();
      case "4 Custom/Remarks":
        return renderCustomRemarksTab();
      default:
        return renderSummaryTab();
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">PIM</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Move</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Printer className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Check className="w-4 h-4" style={{ color: "#5cb85c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Check className="w-4 h-4" style={{ color: "#5cb85c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <DollarSign className="w-4 h-4" style={{ color: "#5cb85c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <BarChart3 className="w-4 h-4" style={{ color: "#e67e22" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Check className="w-4 h-4" style={{ color: "#5cb85c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Home className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <ChevronsLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <ChevronLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <ChevronRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <ChevronsRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
      </div>

      {/* Header Section */}
      <div className="bg-[#ffffcc] border-b border-[#d0d0d0] px-4 py-3 flex gap-8">
        {/* Left Column */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="w-16 text-[12px]">Job #</label>
            <input
              type="text"
              value={job.externalId || ""}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-[12px]">Type</label>
            <input
              type="text"
              value={job.type || ""}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openAccount}
              className="w-16 text-[12px] text-[#0066cc] hover:underline text-left font-medium"
            >
              Account
            </button>
            <input
              type="text"
              value={job.premises?.premisesId || ""}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-32"
            />
          </div>
        </div>

        {/* Middle Column */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="w-16 text-[12px]">Desc</label>
            <input
              type="text"
              value={job.jobDescription || ""}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-[12px]">Tag</label>
            <input
              type="text"
              value={job.premises?.name || ""}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-[12px]">Customer</label>
            <input
              type="text"
              value={job.premises?.customer?.name || ""}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-64"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="w-12 text-[12px]">Status</label>
            <input
              type="text"
              value={job.status || ""}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-24"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-12 text-[12px]">Unit</label>
            <input
              type="text"
              value=""
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-24"
            />
          </div>
        </div>

        {/* Job Maint Link */}
        <div className="flex items-start">
          <button
            onClick={openJobMaintenance}
            className="text-[14px] text-[#0066cc] hover:underline font-bold"
          >
            Job Maint
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#f5f5f5] flex items-end px-2 pt-2 border-b border-[#d0d0d0]">
        {TABS.map((tab) => (
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

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-white">
        {renderTabContent()}
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center">
        <span className="text-[11px]"></span>
      </div>
    </div>
  );
}
