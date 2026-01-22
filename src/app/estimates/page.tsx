"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Pencil,
  Copy,
  X,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Check,
  DollarSign,
  BarChart3,
  Printer,
  Plus,
  Home,
  HelpCircle,
  Send,
  Award,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";

interface Estimate {
  id: string;
  estimateNumber: string;
  customerId: string;
  customerName: string;
  accountId: string;
  accountName: string;
  description: string;
  amount: number;
  status: string;
  createdDate: string;
  expirationDate: string;
  salesperson: string;
  probability: number;
}

const STATUS_TABS = ["All", "Draft", "Sent", "Accepted", "Rejected", "Expired"];

type SortField = "estimateNumber" | "customerName" | "accountName" | "amount" | "status" | "createdDate" | "expirationDate" | "salesperson";
type SortDirection = "asc" | "desc";

const toolbarIcons = [
  { icon: FileText, color: "#4a7c59", title: "New Estimate" },
  { icon: Pencil, color: "#d4a574", title: "Edit" },
  { icon: Copy, color: "#6b8cae", title: "Duplicate" },
  { icon: X, color: "#c45c5c", title: "Delete" },
  { icon: FolderOpen, color: "#d4c574", title: "Open" },
  { icon: Send, color: "#3498db", title: "Send to Customer" },
  { icon: Award, color: "#27ae60", title: "Award Job" },
  { icon: Check, color: "#5cb85c", title: "Mark Accepted" },
  { icon: X, color: "#e74c3c", title: "Mark Rejected" },
  { icon: DollarSign, color: "#5cb85c", title: "Convert to Invoice" },
  { icon: BarChart3, color: "#e67e22", title: "Reports" },
  { icon: Printer, color: "#9b59b6", title: "Print" },
  { icon: Filter, color: "#7f8c8d", title: "Filter" },
  { icon: RefreshCw, color: "#3498db", title: "Refresh" },
  { icon: Plus, color: "#27ae60", title: "Add Line Item" },
  { icon: Home, color: "#e74c3c", title: "Home" },
  { icon: HelpCircle, color: "#3498db", title: "Help" },
];

export default function EstimatesPage() {
  const { openTab } = useTabs();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("createdDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showTotals, setShowTotals] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data
  useEffect(() => {
    const mockEstimates: Estimate[] = [
      { id: "1", estimateNumber: "EST-2025-0142", customerId: "1", customerName: "195 B OWNER LLC", accountId: "195BROAD", accountName: "195 Broadway", description: "Elevator modernization - Car 1 & 2", amount: 185000, status: "Sent", createdDate: "01/15/2025", expirationDate: "02/15/2025", salesperson: "John Smith", probability: 75 },
      { id: "2", estimateNumber: "EST-2025-0141", customerId: "2", customerName: "708 THIRD AVENUE ASSOC", accountId: "7083RDAVE", accountName: "708 3rd Avenue", description: "Annual maintenance contract renewal", amount: 48000, status: "Accepted", createdDate: "01/14/2025", expirationDate: "02/14/2025", salesperson: "Mike Johnson", probability: 100 },
      { id: "3", estimateNumber: "EST-2025-0140", customerId: "3", customerName: "EMPIRE STATE REALTY", accountId: "ONEGCP", accountName: "One Grand Central Place", description: "Emergency phone upgrade - all units", amount: 32500, status: "Draft", createdDate: "01/13/2025", expirationDate: "02/13/2025", salesperson: "John Smith", probability: 50 },
      { id: "4", estimateNumber: "EST-2025-0139", customerId: "4", customerName: "COLLIERS INTERNATIONAL", accountId: "150JFKPARK", accountName: "150 JFK Parkway", description: "Hydraulic cylinder replacement", amount: 67800, status: "Sent", createdDate: "01/12/2025", expirationDate: "02/12/2025", salesperson: "Sarah Davis", probability: 60 },
      { id: "5", estimateNumber: "EST-2025-0138", customerId: "5", customerName: "SOMERSET DEVELOPMENT", accountId: "101CRAWFI", accountName: "101 Crawford St", description: "New elevator installation", amount: 425000, status: "Sent", createdDate: "01/10/2025", expirationDate: "03/10/2025", salesperson: "Mike Johnson", probability: 40 },
      { id: "6", estimateNumber: "EST-2025-0137", customerId: "6", customerName: "WP PLAZA OWNER LLC", accountId: "1NORTHBRI", accountName: "1 North Bridge", description: "Control system upgrade", amount: 89500, status: "Rejected", createdDate: "01/08/2025", expirationDate: "02/08/2025", salesperson: "John Smith", probability: 0 },
      { id: "7", estimateNumber: "EST-2025-0136", customerId: "7", customerName: "NEW ROC ASSOCIATES", accountId: "29-33LECOU", accountName: "29-33 LeCount Place", description: "Door operator replacement x4", amount: 28400, status: "Accepted", createdDate: "01/05/2025", expirationDate: "02/05/2025", salesperson: "Sarah Davis", probability: 100 },
      { id: "8", estimateNumber: "EST-2024-0892", customerId: "8", customerName: "MUSSO PROPERTIES LLC", accountId: "135THIRDA", accountName: "135 Third Avenue", description: "Safety test and inspection prep", amount: 4500, status: "Expired", createdDate: "12/15/2024", expirationDate: "01/15/2025", salesperson: "John Smith", probability: 0 },
      { id: "9", estimateNumber: "EST-2024-0891", customerId: "9", customerName: "MIRA GARAY", accountId: "60E79THST", accountName: "60 East 79th St", description: "Cab interior renovation", amount: 18500, status: "Draft", createdDate: "12/12/2024", expirationDate: "01/12/2025", salesperson: "Mike Johnson", probability: 30 },
      { id: "10", estimateNumber: "EST-2024-0890", customerId: "10", customerName: "ONE GATEWAY CENTER", accountId: "11-43RAYMC", accountName: "11-43 Raymond Plaza", description: "Machine room cooling system", amount: 15200, status: "Sent", createdDate: "12/10/2024", expirationDate: "01/10/2025", salesperson: "Sarah Davis", probability: 65 },
    ];

    setTimeout(() => {
      setEstimates(mockEstimates);
      setLoading(false);
    }, 300);
  }, []);

  const handleDoubleClick = (estimate: Estimate) => {
    openTab(`Estimate: ${estimate.estimateNumber}`, `/estimates/${estimate.id}`);
  };

  const handleCustomerClick = (estimate: Estimate, e: React.MouseEvent) => {
    e.stopPropagation();
    openTab(estimate.customerName, `/customers/${estimate.customerId}`);
  };

  const handleAccountClick = (estimate: Estimate, e: React.MouseEvent) => {
    e.stopPropagation();
    openTab(estimate.accountName, `/accounts/${estimate.accountId}`);
  };

  const handleNewEstimate = () => {
    openTab("New Estimate", `/estimates/new`);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter by tab and search
  const filteredEstimates = estimates.filter((est) => {
    const matchesTab = activeTab === "All" || est.status === activeTab;
    const matchesSearch = searchTerm === "" ||
      est.estimateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      est.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Sort
  const sortedEstimates = [...filteredEstimates].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortField) {
      case "estimateNumber":
        aVal = a.estimateNumber;
        bVal = b.estimateNumber;
        break;
      case "customerName":
        aVal = a.customerName.toLowerCase();
        bVal = b.customerName.toLowerCase();
        break;
      case "accountName":
        aVal = a.accountName.toLowerCase();
        bVal = b.accountName.toLowerCase();
        break;
      case "amount":
        aVal = a.amount;
        bVal = b.amount;
        break;
      case "status":
        aVal = a.status;
        bVal = b.status;
        break;
      case "createdDate":
        aVal = new Date(a.createdDate).getTime();
        bVal = new Date(b.createdDate).getTime();
        break;
      case "expirationDate":
        aVal = new Date(a.expirationDate).getTime();
        bVal = new Date(b.expirationDate).getTime();
        break;
      case "salesperson":
        aVal = a.salesperson.toLowerCase();
        bVal = b.salesperson.toLowerCase();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Calculate totals
  const totals = {
    count: sortedEstimates.length,
    amount: sortedEstimates.reduce((sum, e) => sum + e.amount, 0),
    avgProbability: sortedEstimates.length > 0
      ? Math.round(sortedEstimates.reduce((sum, e) => sum + e.probability, 0) / sortedEstimates.length)
      : 0,
    weightedValue: sortedEstimates.reduce((sum, e) => sum + (e.amount * e.probability / 100), 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "bg-[#f0f0f0] text-[#606060]";
      case "Sent": return "bg-[#fff3cd] text-[#856404]";
      case "Accepted": return "bg-[#d4edda] text-[#155724]";
      case "Rejected": return "bg-[#f8d7da] text-[#721c24]";
      case "Expired": return "bg-[#e2e3e5] text-[#383d41]";
      default: return "bg-[#f0f0f0] text-[#606060]";
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-gray-400" />;
    return sortDirection === "asc"
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">View</span>
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
              onClick={i === 0 ? handleNewEstimate : undefined}
              className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
              title={item.title}
            >
              <IconComponent className="w-4 h-4" style={{ color: item.color }} />
            </button>
          );
        })}

        {/* Search */}
        <div className="ml-4 flex items-center gap-2">
          <span className="text-[11px]">Search:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Estimate #, customer, description..."
            className="border border-[#c0c0c0] px-2 py-0.5 text-[11px] w-[200px] rounded"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-[#f5f5f5] flex items-end px-2 pt-1">
        {STATUS_TABS.map((tab) => (
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
                style={{ width: "12%" }}
                onClick={() => handleSort("estimateNumber")}
              >
                <div className="flex items-center gap-1">
                  Estimate #
                  <SortIcon field="estimateNumber" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "15%" }}
                onClick={() => handleSort("customerName")}
              >
                <div className="flex items-center gap-1">
                  Customer
                  <SortIcon field="customerName" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "13%" }}
                onClick={() => handleSort("accountName")}
              >
                <div className="flex items-center gap-1">
                  Account
                  <SortIcon field="accountName" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] border border-[#c0c0c0]"
                style={{ width: "20%" }}
              >
                Description
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0] text-right"
                style={{ width: "10%" }}
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end gap-1">
                  Amount
                  <SortIcon field="amount" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0] text-center"
                style={{ width: "8%" }}
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center justify-center gap-1">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "9%" }}
                onClick={() => handleSort("createdDate")}
              >
                <div className="flex items-center gap-1">
                  Created
                  <SortIcon field="createdDate" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "9%" }}
                onClick={() => handleSort("expirationDate")}
              >
                <div className="flex items-center gap-1">
                  Expires
                  <SortIcon field="expirationDate" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "4%" }}
                onClick={() => handleSort("salesperson")}
                title="Probability %"
              >
                <div className="flex items-center gap-1">
                  %
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
              ) : sortedEstimates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-[#808080] border border-[#d0d0d0]">No estimates found</td>
                </tr>
              ) : (
                sortedEstimates.map((estimate) => (
                  <tr
                    key={estimate.id}
                    onClick={() => setSelectedRow(estimate.id)}
                    onDoubleClick={() => handleDoubleClick(estimate)}
                    className={`text-[12px] cursor-pointer ${
                      selectedRow === estimate.id
                        ? "bg-[#0078d4] text-white"
                        : "bg-white hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-2 py-1 border border-[#d0d0d0] font-medium" style={{ width: "12%" }}>
                      {estimate.estimateNumber}
                    </td>
                    <td
                      className={`px-2 py-1 border border-[#d0d0d0] ${selectedRow !== estimate.id ? "text-[#0000ff] cursor-pointer hover:underline" : ""}`}
                      style={{ width: "15%" }}
                      onClick={(e) => selectedRow !== estimate.id && handleCustomerClick(estimate, e)}
                    >
                      {estimate.customerName}
                    </td>
                    <td
                      className={`px-2 py-1 border border-[#d0d0d0] ${selectedRow !== estimate.id ? "text-[#0000ff] cursor-pointer hover:underline" : ""}`}
                      style={{ width: "13%" }}
                      onClick={(e) => selectedRow !== estimate.id && handleAccountClick(estimate, e)}
                    >
                      {estimate.accountName}
                    </td>
                    <td className="px-2 py-1 border border-[#d0d0d0] truncate" style={{ width: "20%" }} title={estimate.description}>
                      {estimate.description}
                    </td>
                    <td className="px-2 py-1 border border-[#d0d0d0] text-right" style={{ width: "10%" }}>
                      {formatCurrency(estimate.amount)}
                    </td>
                    <td className="px-2 py-1 border border-[#d0d0d0] text-center" style={{ width: "8%" }}>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${selectedRow === estimate.id ? "bg-white/20" : getStatusColor(estimate.status)}`}>
                        {estimate.status}
                      </span>
                    </td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "9%" }}>
                      {estimate.createdDate}
                    </td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "9%" }}>
                      {estimate.expirationDate}
                    </td>
                    <td className="px-2 py-1 border border-[#d0d0d0] text-center" style={{ width: "4%" }}>
                      {estimate.probability}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Bar with Totals */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px]">
          {showTotals && (
            <>
              <span className="text-[#333]">
                <strong>Count:</strong> {totals.count}
              </span>
              <span className="text-[#333]">
                <strong>Total:</strong> {formatCurrency(totals.amount)}
              </span>
              <span className="text-[#333]">
                <strong>Avg Probability:</strong> {totals.avgProbability}%
              </span>
              <span className="text-[#333]">
                <strong>Weighted Value:</strong> {formatCurrency(totals.weightedValue)}
              </span>
            </>
          )}
        </div>

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
