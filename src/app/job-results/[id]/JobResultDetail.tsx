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
  const [showExpenseDetails, setShowExpenseDetails] = useState(false);
  const [itemScope, setItemScope] = useState("All");
  const [itemType, setItemType] = useState("Actual");

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
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-red-500">Job not found</span>
      </div>
    );
  }

  const inputClass = "px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white";
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
  const costingData = {
    revenues: { actual: 0, committed: 0, total: 0, budget: 3660.00, difference: -3660.00, ratio: -100 },
    labor: { actual: 124.72, committed: 0, total: 124.72, budget: 0, difference: 124.72, ratio: 0 },
    materials: { actual: 6.00, committed: 1.00, total: 7.00, budget: 0, difference: 7.00, ratio: 0 },
    totalCost: { actual: 130.72, committed: 1.00, total: 131.72, budget: 0, difference: 131.72, ratio: 0 },
    netProfit: { actual: -130.72, committed: -1.00, total: -131.72, budget: 3660.00, difference: -3791.72, ratio: -104 },
  };

  const renderCostingDetailTab = () => (
    <div className="p-4">
      {/* Show Expense Details checkbox */}
      <div className="flex justify-end mb-2">
        <label className="flex items-center gap-2 text-[12px]">
          <input
            type="checkbox"
            checked={showExpenseDetails}
            onChange={(e) => setShowExpenseDetails(e.target.checked)}
            className="w-3 h-3"
          />
          Show Expense Details
        </label>
      </div>

      {/* Costing Detail Table */}
      <div className="border border-[#a0a0a0] bg-white overflow-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              <th className="px-3 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "20%" }}>Description</th>
              <th className="px-3 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Code</th>
              <th className="px-3 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Actual</th>
              <th className="px-3 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Committed</th>
              <th className="px-3 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Total</th>
              <th className="px-3 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Budget</th>
              <th className="px-3 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Difference</th>
              <th className="px-3 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Ratio</th>
            </tr>
          </thead>
          <tbody>
            {/* REVENUES Section */}
            <tr className="bg-[#f8f8f8]">
              <td className="px-3 py-1 font-bold border border-[#d0d0d0]">REVENUES</td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
            </tr>
            <tr>
              <td className="px-3 py-1 border border-[#d0d0d0]">Revenue</td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.revenues.actual)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.revenues.committed)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.revenues.total)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.revenues.budget)}</td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${costingData.revenues.difference < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(costingData.revenues.difference)}
              </td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${costingData.revenues.ratio < 0 ? "text-red-600" : ""}`}>
                {formatPercent(costingData.revenues.ratio)}
              </td>
            </tr>
            <tr>
              <td className="px-3 py-1 font-medium border border-[#d0d0d0]">TOTAL REVENUES</td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.revenues.actual)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.revenues.committed)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.revenues.total)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.revenues.budget)}</td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${costingData.revenues.difference < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(costingData.revenues.difference)}
              </td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${costingData.revenues.ratio < 0 ? "text-red-600" : ""}`}>
                {formatPercent(costingData.revenues.ratio)}
              </td>
            </tr>

            {/* Empty row separator */}
            <tr>
              <td className="px-3 py-1 border border-[#d0d0d0]" colSpan={8}></td>
            </tr>

            {/* JOB COSTS Section */}
            <tr className="bg-[#f8f8f8]">
              <td className="px-3 py-1 font-bold border border-[#d0d0d0]">JOB COSTS</td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
            </tr>
            <tr>
              <td className="px-3 py-1 border border-[#d0d0d0]">Labor</td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.labor.actual)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.labor.committed)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.labor.total)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.labor.budget)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.labor.difference)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatPercent(costingData.labor.ratio)}</td>
            </tr>
            <tr>
              <td className="px-3 py-1 border border-[#d0d0d0]">Materials</td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.materials.actual)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.materials.committed)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.materials.total)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.materials.budget)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.materials.difference)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatPercent(costingData.materials.ratio)}</td>
            </tr>
            <tr>
              <td className="px-3 py-1 font-medium border border-[#d0d0d0]">TOTAL COST</td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.totalCost.actual)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.totalCost.committed)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.totalCost.total)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.totalCost.budget)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.totalCost.difference)}</td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatPercent(costingData.totalCost.ratio)}</td>
            </tr>

            {/* Empty row separator */}
            <tr>
              <td className="px-3 py-1 border border-[#d0d0d0]" colSpan={8}></td>
            </tr>

            {/* NET PROFIT */}
            <tr className="font-medium">
              <td className="px-3 py-1 border border-[#d0d0d0]">NET PROFIT</td>
              <td className="px-3 py-1 border border-[#d0d0d0]"></td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${costingData.netProfit.actual < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(costingData.netProfit.actual)}
              </td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${costingData.netProfit.committed < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(costingData.netProfit.committed)}
              </td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${costingData.netProfit.total < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(costingData.netProfit.total)}
              </td>
              <td className="px-3 py-1 text-right border border-[#d0d0d0]">{formatCurrency(costingData.netProfit.budget)}</td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${costingData.netProfit.difference < 0 ? "text-red-600" : ""}`}>
                {formatCurrency(costingData.netProfit.difference)}
              </td>
              <td className={`px-3 py-1 text-right border border-[#d0d0d0] ${costingData.netProfit.ratio < 0 ? "text-red-600" : ""}`}>
                {formatPercent(costingData.netProfit.ratio)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  // Tab 3: Job Costing Items
  const costingItems = [
    { date: "8/9/2003", source: "Ticket", ref: "71663", desc: "Labor on Ticket", revenues: null, expenses: 124.72, phase: 1 },
    { date: "5/20/2004", source: "AP Item", ref: "3211680", desc: "CAGE 303H1", revenues: null, expenses: 6.00, phase: 2 },
  ];

  const renderCostingItemsTab = () => (
    <div className="p-4">
      {/* Filter Row */}
      <div className="flex items-center gap-8 mb-3">
        <div className="flex items-center gap-2">
          <label className="text-[12px]">Item Scope</label>
          <select
            value={itemScope}
            onChange={(e) => setItemScope(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[100px]"
          >
            <option value="All">All</option>
            <option value="Labor">Labor</option>
            <option value="Materials">Materials</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[12px]">Type</label>
          <select
            value={itemType}
            onChange={(e) => setItemType(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[100px]"
          >
            <option value="Actual">Actual</option>
            <option value="Committed">Committed</option>
            <option value="Budget">Budget</option>
          </select>
        </div>
      </div>

      {/* Costing Items Table */}
      <div className="border border-[#a0a0a0] bg-white overflow-auto" style={{ maxHeight: "400px" }}>
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Date</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Source</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Ref</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "35%" }}>Desc</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Revenues</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Expenses</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>Phase</th>
            </tr>
          </thead>
          <tbody>
            {costingItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                  No costing items
                </td>
              </tr>
            ) : (
              costingItems.map((item, index) => (
                <tr key={index} className="hover:bg-[#f0f8ff]">
                  <td className="px-2 py-1 border border-[#d0d0d0]">{item.date}</td>
                  <td className="px-2 py-1 border border-[#d0d0d0]">{item.source}</td>
                  <td className="px-2 py-1 border border-[#d0d0d0]">{item.ref}</td>
                  <td className="px-2 py-1 border border-[#d0d0d0]">{item.desc}</td>
                  <td className="px-2 py-1 text-right border border-[#d0d0d0]">
                    {item.revenues !== null ? formatCurrency(item.revenues) : ""}
                  </td>
                  <td className="px-2 py-1 text-right border border-[#d0d0d0]">
                    {item.expenses !== null ? formatCurrency(item.expenses) : ""}
                  </td>
                  <td className="px-2 py-1 text-right border border-[#d0d0d0]">{item.phase}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Tab 4: Custom/Remarks
  const renderCustomRemarksTab = () => (
    <div className="p-4">
      {/* 4-column grid of custom fields */}
      <div className="grid grid-cols-4 gap-x-6 gap-y-2 mb-6">
        {/* Column 1 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Supervisor</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">City #</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Rep Reques</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">MR Reques</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Req Date</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Date</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">W/F/Misu</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Guzman</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Status</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Comp. Date</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Schedule</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Billing Terms</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Material</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Paperless</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Fldr Loc</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
        </div>

        {/* Column 4 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Due Date</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Fine Fault</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Job Type</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Priority Level</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">Project Mgr</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] w-20 text-right">PO #</label>
            <input type="text" className="px-2 py-1 border border-[#a0a0a0] text-[12px] flex-1 bg-white" />
          </div>
        </div>
      </div>

      {/* Remarks text area */}
      <div className="border border-[#a0a0a0] bg-white">
        <textarea
          className="w-full h-48 px-2 py-1 text-[12px] resize-none border-none focus:outline-none"
          placeholder=""
          defaultValue={`2P5603 DAMAGED DOOR FABRICATE NEW ONE
Job Closing On 6/11/2004 by GPUK

WB COMP`}
        />
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
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">PIM</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Move</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
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
      <div className="bg-white border-b border-[#d0d0d0] px-4 py-3 flex gap-8">
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
      <div className="bg-white flex items-end px-2 pt-2 border-b border-[#d0d0d0]">
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
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1 flex items-center">
        <span className="text-[11px]"></span>
      </div>
    </div>
  );
}
