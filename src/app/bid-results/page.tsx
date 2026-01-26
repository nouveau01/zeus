"use client";

import { useState } from "react";
import { useTabs } from "@/context/TabContext";

interface CompetitorBid {
  company: string;
  amount: number;
  isWinner: boolean;
}

interface BidResult {
  id: string;
  estimateId: string;
  estimateNumber: string;
  customerId: string;
  customerName: string;
  accountId: string;
  accountName: string;
  projectName: string;
  description: string;
  type: string;
  category: string;
  ourBidAmount: number;
  bidDate: string;
  resultDate: string | null;
  status: "Won" | "Lost" | "Pending" | "No Bid";
  winningBidder: string | null;
  winningAmount: number | null;
  jobId: string | null;
  jobNumber: string | null;
  competitorBids: CompetitorBid[];
  lossReason: string | null;
  notes: string;
}

// Mock bid results data
const mockBidResults: BidResult[] = [
  {
    id: "br-001",
    estimateId: "est-001",
    estimateNumber: "EST-2024-001",
    customerId: "cust-001",
    customerName: "Empire State Building",
    accountId: "acc-001",
    accountName: "Empire State Realty Trust",
    projectName: "Elevator Modernization Phase 1",
    description: "Complete modernization of passenger elevators 1-4",
    type: "Modernization",
    category: "Capital Improvement",
    ourBidAmount: 450000,
    bidDate: "2024-01-15",
    resultDate: "2024-01-28",
    status: "Won",
    winningBidder: "Nouveau Elevator",
    winningAmount: 450000,
    jobId: "job-001",
    jobNumber: "JOB-2024-0042",
    competitorBids: [
      { company: "Nouveau Elevator (Us)", amount: 450000, isWinner: true },
      { company: "Otis Elevator Co.", amount: 485000, isWinner: false },
      { company: "Schindler Elevator", amount: 472000, isWinner: false },
      { company: "ThyssenKrupp", amount: 468000, isWinner: false },
    ],
    lossReason: null,
    notes: "Customer chose us based on prior relationship and competitive pricing",
  },
  {
    id: "br-002",
    estimateId: "est-002",
    estimateNumber: "EST-2024-002",
    customerId: "cust-002",
    customerName: "One World Trade Center",
    accountId: "acc-002",
    accountName: "Durst Organization",
    projectName: "Annual Maintenance Contract",
    description: "Full service maintenance for all 73 elevators",
    type: "Service Contract",
    category: "Maintenance",
    ourBidAmount: 1200000,
    bidDate: "2024-01-20",
    resultDate: "2024-02-05",
    status: "Lost",
    winningBidder: "KONE Corporation",
    winningAmount: 1150000,
    jobId: null,
    jobNumber: null,
    competitorBids: [
      { company: "Nouveau Elevator (Us)", amount: 1200000, isWinner: false },
      { company: "KONE Corporation", amount: 1150000, isWinner: true },
      { company: "Otis Elevator Co.", amount: 1280000, isWinner: false },
    ],
    lossReason: "Price - competitor underbid by $50,000",
    notes: "KONE was incumbent and offered renewal discount",
  },
  {
    id: "br-003",
    estimateId: "est-003",
    estimateNumber: "EST-2024-003",
    customerId: "cust-003",
    customerName: "Chrysler Building",
    accountId: "acc-003",
    accountName: "RXR Acquisition",
    projectName: "Safety System Upgrade",
    description: "Upgrade safety systems on freight elevators",
    type: "Repair",
    category: "Safety Compliance",
    ourBidAmount: 85000,
    bidDate: "2024-01-10",
    resultDate: null,
    status: "Pending",
    winningBidder: null,
    winningAmount: null,
    jobId: null,
    jobNumber: null,
    competitorBids: [
      { company: "Nouveau Elevator (Us)", amount: 85000, isWinner: false },
      { company: "Local Elevator Services", amount: 78000, isWinner: false },
    ],
    lossReason: null,
    notes: "Customer still evaluating bids",
  },
  {
    id: "br-004",
    estimateId: "est-004",
    estimateNumber: "EST-2024-004",
    customerId: "cust-004",
    customerName: "30 Rock Plaza",
    accountId: "acc-004",
    accountName: "Rockefeller Group",
    projectName: "Cab Interior Renovation",
    description: "Renovate interiors for elevators 1-8",
    type: "Modernization",
    category: "Capital Improvement",
    ourBidAmount: 320000,
    bidDate: "2024-01-08",
    resultDate: "2024-01-22",
    status: "Won",
    winningBidder: "Nouveau Elevator",
    winningAmount: 320000,
    jobId: "job-002",
    jobNumber: "JOB-2024-0038",
    competitorBids: [
      { company: "Nouveau Elevator (Us)", amount: 320000, isWinner: true },
      { company: "Premier Elevator", amount: 345000, isWinner: false },
    ],
    lossReason: null,
    notes: "Sole source relationship with this customer",
  },
  {
    id: "br-005",
    estimateId: "est-005",
    estimateNumber: "EST-2024-005",
    customerId: "cust-005",
    customerName: "MetLife Building",
    accountId: "acc-005",
    accountName: "Tishman Speyer",
    projectName: "Controller Replacement",
    description: "Replace controllers on service elevators",
    type: "Repair",
    category: "Capital Improvement",
    ourBidAmount: 175000,
    bidDate: "2024-01-05",
    resultDate: "2024-01-18",
    status: "Lost",
    winningBidder: "Otis Elevator Co.",
    winningAmount: 168000,
    jobId: null,
    jobNumber: null,
    competitorBids: [
      { company: "Nouveau Elevator (Us)", amount: 175000, isWinner: false },
      { company: "Otis Elevator Co.", amount: 168000, isWinner: true },
      { company: "Schindler Elevator", amount: 182000, isWinner: false },
    ],
    lossReason: "Price",
    notes: "Lost by narrow margin",
  },
  {
    id: "br-006",
    estimateId: "est-006",
    estimateNumber: "EST-2024-006",
    customerId: "cust-006",
    customerName: "Bank of America Tower",
    accountId: "acc-006",
    accountName: "Brookfield Properties",
    projectName: "Destination Dispatch Install",
    description: "Install destination dispatch system",
    type: "Modernization",
    category: "Capital Improvement",
    ourBidAmount: 890000,
    bidDate: "2024-01-25",
    resultDate: null,
    status: "Pending",
    winningBidder: null,
    winningAmount: null,
    jobId: null,
    jobNumber: null,
    competitorBids: [
      { company: "Nouveau Elevator (Us)", amount: 890000, isWinner: false },
      { company: "ThyssenKrupp", amount: 920000, isWinner: false },
      { company: "KONE Corporation", amount: 875000, isWinner: false },
    ],
    lossReason: null,
    notes: "High-profile project, decision expected next week",
  },
  {
    id: "br-007",
    estimateId: "est-007",
    estimateNumber: "EST-2023-089",
    customerId: "cust-007",
    customerName: "432 Park Avenue",
    accountId: "acc-007",
    accountName: "CIM Group",
    projectName: "Annual Inspection Contract",
    description: "Cat 1 and Cat 5 inspections for residential tower",
    type: "Inspection",
    category: "Maintenance",
    ourBidAmount: 45000,
    bidDate: "2023-12-15",
    resultDate: "2024-01-02",
    status: "Won",
    winningBidder: "Nouveau Elevator",
    winningAmount: 45000,
    jobId: "job-003",
    jobNumber: "JOB-2024-0012",
    competitorBids: [
      { company: "Nouveau Elevator (Us)", amount: 45000, isWinner: true },
      { company: "NYC Elevator Inspections", amount: 52000, isWinner: false },
    ],
    lossReason: null,
    notes: "Repeat customer, renewed contract",
  },
];

type StatusFilter = "All" | "Won" | "Lost" | "Pending";

export default function BidResultsPage() {
  const { openTab } = useTabs();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"bidDate" | "resultDate" | "ourBidAmount">("bidDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedBid, setSelectedBid] = useState<BidResult | null>(null);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Filter and sort data
  const filteredResults = mockBidResults
    .filter((bid) => {
      if (statusFilter !== "All" && bid.status !== statusFilter) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          bid.estimateNumber.toLowerCase().includes(search) ||
          bid.customerName.toLowerCase().includes(search) ||
          bid.projectName.toLowerCase().includes(search) ||
          bid.type.toLowerCase().includes(search)
        );
      }
      if (dateRange.from && bid.bidDate < dateRange.from) return false;
      if (dateRange.to && bid.bidDate > dateRange.to) return false;
      return true;
    })
    .sort((a, b) => {
      let aVal: string | number = a[sortField] || "";
      let bVal: string | number = b[sortField] || "";
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

  // Calculate statistics
  const stats = {
    total: mockBidResults.length,
    won: mockBidResults.filter((b) => b.status === "Won").length,
    lost: mockBidResults.filter((b) => b.status === "Lost").length,
    pending: mockBidResults.filter((b) => b.status === "Pending").length,
    totalBidValue: mockBidResults.reduce((sum, b) => sum + b.ourBidAmount, 0),
    totalWonValue: mockBidResults
      .filter((b) => b.status === "Won")
      .reduce((sum, b) => sum + b.ourBidAmount, 0),
    winRate:
      mockBidResults.filter((b) => b.status === "Won" || b.status === "Lost").length > 0
        ? (mockBidResults.filter((b) => b.status === "Won").length /
            mockBidResults.filter((b) => b.status === "Won" || b.status === "Lost").length) *
          100
        : 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Won":
        return "bg-[#d4edda] text-[#155724]";
      case "Lost":
        return "bg-[#f8d7da] text-[#721c24]";
      case "Pending":
        return "bg-[#fff3cd] text-[#856404]";
      default:
        return "bg-[#e2e3e5] text-[#383d41]";
    }
  };

  const handleSort = (field: "bidDate" | "resultDate" | "ourBidAmount") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0]">
      {/* Header */}
      <div className="bg-[#d4d0c8] border-b border-[#808080] px-3 py-1.5 flex items-center justify-between">
        <h1 className="text-[13px] font-bold text-[#000]">Bid Results</h1>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-0.5 text-[11px] border border-[#808080] w-40"
          />
          <button
            className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
            style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
          >
            Export
          </button>
          <button
            className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
            style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
          >
            Print
          </button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="bg-white border-b border-[#808080] px-3 py-2 flex items-center gap-6">
        <div className="text-[11px]">
          <span className="text-[#606060]">Total Bids: </span>
          <span className="font-bold">{stats.total}</span>
        </div>
        <div className="text-[11px]">
          <span className="text-[#606060]">Won: </span>
          <span className="font-bold text-[#155724]">{stats.won}</span>
        </div>
        <div className="text-[11px]">
          <span className="text-[#606060]">Lost: </span>
          <span className="font-bold text-[#721c24]">{stats.lost}</span>
        </div>
        <div className="text-[11px]">
          <span className="text-[#606060]">Pending: </span>
          <span className="font-bold text-[#856404]">{stats.pending}</span>
        </div>
        <div className="border-l border-[#c0c0c0] pl-6 text-[11px]">
          <span className="text-[#606060]">Win Rate: </span>
          <span className="font-bold">{stats.winRate.toFixed(1)}%</span>
        </div>
        <div className="text-[11px]">
          <span className="text-[#606060]">Total Bid Value: </span>
          <span className="font-bold">{formatCurrency(stats.totalBidValue)}</span>
        </div>
        <div className="text-[11px]">
          <span className="text-[#606060]">Won Value: </span>
          <span className="font-bold text-[#155724]">{formatCurrency(stats.totalWonValue)}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#d4d0c8] border-b border-[#808080] px-3 py-1 flex items-center gap-4">
        <div className="flex gap-1">
          {(["All", "Won", "Lost", "Pending"] as StatusFilter[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 text-[11px] border ${
                statusFilter === status
                  ? "bg-white border-[#808080] border-b-white -mb-[1px] relative z-10"
                  : "bg-[#d4d0c8] border-[#808080] hover:bg-[#e8e8e8]"
              }`}
            >
              {status}
              {status !== "All" && (
                <span className="ml-1 text-[10px] text-[#606060]">
                  ({status === "Won" ? stats.won : status === "Lost" ? stats.lost : stats.pending})
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto text-[11px]">
          <span className="text-[#606060]">Date Range:</span>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange((prev) => ({ ...prev, from: e.target.value }))}
            className="px-1 py-0.5 text-[11px] border border-[#808080]"
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange((prev) => ({ ...prev, to: e.target.value }))}
            className="px-1 py-0.5 text-[11px] border border-[#808080]"
          />
          {(dateRange.from || dateRange.to) && (
            <button
              onClick={() => setDateRange({ from: "", to: "" })}
              className="text-[#0066cc] hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Results Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead className="bg-[#d4d0c8] sticky top-0">
              <tr>
                <th className="text-left px-2 py-1.5 border-b border-r border-[#808080] font-normal">
                  Estimate #
                </th>
                <th className="text-left px-2 py-1.5 border-b border-r border-[#808080] font-normal">
                  Customer
                </th>
                <th className="text-left px-2 py-1.5 border-b border-r border-[#808080] font-normal">
                  Project
                </th>
                <th className="text-left px-2 py-1.5 border-b border-r border-[#808080] font-normal">
                  Type
                </th>
                <th
                  className="text-right px-2 py-1.5 border-b border-r border-[#808080] font-normal cursor-pointer hover:bg-[#c0c0c0]"
                  onClick={() => handleSort("ourBidAmount")}
                >
                  Our Bid {sortField === "ourBidAmount" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th
                  className="text-left px-2 py-1.5 border-b border-r border-[#808080] font-normal cursor-pointer hover:bg-[#c0c0c0]"
                  onClick={() => handleSort("bidDate")}
                >
                  Bid Date {sortField === "bidDate" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="text-center px-2 py-1.5 border-b border-r border-[#808080] font-normal w-20">
                  Status
                </th>
                <th className="text-left px-2 py-1.5 border-b border-r border-[#808080] font-normal">
                  Winner
                </th>
                <th className="text-right px-2 py-1.5 border-b border-r border-[#808080] font-normal">
                  Win Amount
                </th>
                <th className="text-left px-2 py-1.5 border-b border-[#808080] font-normal">
                  Job #
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-[#606060]">
                    No bid results found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredResults.map((bid, index) => {
                  const isSelected = selectedBid?.id === bid.id;
                  const isOurWin = bid.status === "Won";
                  return (
                    <tr
                      key={bid.id}
                      onClick={() => setSelectedBid(bid)}
                      onDoubleClick={() => openTab(bid.estimateNumber, `/estimates/${bid.estimateId}`)}
                      className={`cursor-pointer ${
                        isSelected
                          ? "bg-[#316ac5] text-white"
                          : index % 2 === 0
                          ? "bg-white hover:bg-[#e8f4fc]"
                          : "bg-[#f5f5f5] hover:bg-[#e8f4fc]"
                      }`}
                    >
                      <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTab(`Estimate ${bid.estimateNumber}`, `/estimates/${bid.estimateId}`);
                          }}
                          className={`${isSelected ? "text-white" : "text-[#0066cc]"} hover:underline`}
                        >
                          {bid.estimateNumber}
                        </button>
                      </td>
                      <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openTab(bid.customerName, `/customers/${bid.customerId}`);
                          }}
                          className={`${isSelected ? "text-white" : "text-[#0066cc]"} hover:underline`}
                        >
                          {bid.customerName}
                        </button>
                      </td>
                      <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">{bid.projectName}</td>
                      <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">{bid.type}</td>
                      <td className="px-2 py-1 border-b border-r border-[#e0e0e0] text-right">
                        {formatCurrency(bid.ourBidAmount)}
                      </td>
                      <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">
                        {formatDate(bid.bidDate)}
                      </td>
                      <td className="px-2 py-1 border-b border-r border-[#e0e0e0] text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(bid.status)}`}>
                          {bid.status}
                        </span>
                      </td>
                      <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">
                        {bid.winningBidder || "-"}
                      </td>
                      <td className="px-2 py-1 border-b border-r border-[#e0e0e0] text-right">
                        {bid.winningAmount ? formatCurrency(bid.winningAmount) : "-"}
                      </td>
                      <td className="px-2 py-1 border-b border-[#e0e0e0]">
                        {bid.jobNumber ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTab(`Job ${bid.jobNumber}`, `/job-maintenance/${bid.jobId}`);
                            }}
                            className={`${isSelected ? "text-white" : "text-[#0066cc]"} hover:underline`}
                          >
                            {bid.jobNumber}
                          </button>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selectedBid && (
          <div
            className="w-[320px] flex-shrink-0 bg-white border-l border-[#808080] flex flex-col overflow-auto"
          >
            <div className="bg-[#d4d0c8] px-3 py-1.5 border-b border-[#808080] flex items-center justify-between">
              <span className="text-[11px] font-bold">Bid Details</span>
              <button
                onClick={() => setSelectedBid(null)}
                className="text-[#606060] hover:text-[#000] text-[14px] leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-3 text-[11px] space-y-3">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded text-[12px] font-bold ${getStatusColor(selectedBid.status)}`}>
                  {selectedBid.status}
                </span>
                {selectedBid.resultDate && (
                  <span className="text-[#606060]">{formatDate(selectedBid.resultDate)}</span>
                )}
              </div>

              {/* Links */}
              <div className="space-y-1 pb-3 border-b border-[#e0e0e0]">
                <div>
                  <span className="text-[#606060]">Estimate: </span>
                  <button
                    onClick={() => openTab(`Estimate ${selectedBid.estimateNumber}`, `/estimates/${selectedBid.estimateId}`)}
                    className="text-[#0066cc] hover:underline"
                  >
                    {selectedBid.estimateNumber}
                  </button>
                </div>
                <div>
                  <span className="text-[#606060]">Customer: </span>
                  <button
                    onClick={() => openTab(selectedBid.customerName, `/customers/${selectedBid.customerId}`)}
                    className="text-[#0066cc] hover:underline"
                  >
                    {selectedBid.customerName}
                  </button>
                </div>
                <div>
                  <span className="text-[#606060]">Account: </span>
                  <button
                    onClick={() => openTab(selectedBid.accountName, `/accounts/${selectedBid.accountId}`)}
                    className="text-[#0066cc] hover:underline"
                  >
                    {selectedBid.accountName}
                  </button>
                </div>
                {selectedBid.jobNumber && (
                  <div>
                    <span className="text-[#606060]">Job: </span>
                    <button
                      onClick={() => openTab(`Job ${selectedBid.jobNumber}`, `/job-maintenance/${selectedBid.jobId}`)}
                      className="text-[#0066cc] hover:underline"
                    >
                      {selectedBid.jobNumber}
                    </button>
                  </div>
                )}
              </div>

              {/* Project Info */}
              <div className="space-y-1 pb-3 border-b border-[#e0e0e0]">
                <div className="font-bold">{selectedBid.projectName}</div>
                <div className="text-[#606060]">{selectedBid.description}</div>
                <div className="flex gap-4 mt-2">
                  <div>
                    <span className="text-[#606060]">Type: </span>
                    <span>{selectedBid.type}</span>
                  </div>
                  <div>
                    <span className="text-[#606060]">Category: </span>
                    <span>{selectedBid.category}</span>
                  </div>
                </div>
              </div>

              {/* Competitor Bids */}
              <div className="pb-3 border-b border-[#e0e0e0]">
                <div className="font-bold mb-2">Competitor Bids</div>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-[#f5f5f5]">
                      <th className="text-left px-1 py-0.5 border border-[#e0e0e0]">Company</th>
                      <th className="text-right px-1 py-0.5 border border-[#e0e0e0]">Amount</th>
                      <th className="text-center px-1 py-0.5 border border-[#e0e0e0] w-10">Won</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBid.competitorBids.map((cb, idx) => {
                      const isOurs = cb.company.toLowerCase().includes("nouveau") || cb.company.toLowerCase().includes("us");
                      return (
                        <tr
                          key={idx}
                          className={`${cb.isWinner ? "bg-[#d4edda]" : ""} ${isOurs ? "font-semibold" : ""}`}
                        >
                          <td className="px-1 py-0.5 border border-[#e0e0e0]">{cb.company}</td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] text-right">
                            {formatCurrency(cb.amount)}
                          </td>
                          <td className="px-1 py-0.5 border border-[#e0e0e0] text-center">
                            {cb.isWinner ? "✓" : ""}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Loss Reason (if applicable) */}
              {selectedBid.status === "Lost" && selectedBid.lossReason && (
                <div className="pb-3 border-b border-[#e0e0e0]">
                  <div className="font-bold mb-1">Loss Reason</div>
                  <div className="text-[#721c24] bg-[#f8d7da] px-2 py-1 rounded">
                    {selectedBid.lossReason}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedBid.notes && (
                <div>
                  <div className="font-bold mb-1">Notes</div>
                  <div className="text-[#606060]">{selectedBid.notes}</div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 flex gap-2">
                {selectedBid.status === "Pending" && (
                  <button
                    onClick={() => openTab("Award Job", "/award-job")}
                    className="flex-1 px-2 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
                    style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
                  >
                    Award Job
                  </button>
                )}
                <button
                  onClick={() => openTab(`Estimate ${selectedBid.estimateNumber}`, `/estimates/${selectedBid.estimateId}`)}
                  className="flex-1 px-2 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
                  style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
                >
                  View Estimate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-[#d4d0c8] border-t border-[#808080] px-3 py-1.5 flex items-center justify-between">
        <span className="text-[10px] text-[#606060]">
          Showing {filteredResults.length} of {mockBidResults.length} bid results
        </span>
        <span className="text-[10px] text-[#606060]">
          Click a row to view details • Blue text = clickable link
        </span>
      </div>
    </div>
  );
}
