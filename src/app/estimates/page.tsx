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
import { usePermissions } from "@/context/PermissionsContext";

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
  const { isFieldAllowed } = usePermissions();
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("createdDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showTotals, setShowTotals] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load mock estimates using real customer/account data from the DB
  useEffect(() => {
    async function loadEstimates() {
      try {
        // Fetch real customers and accounts so click-through works
        const [custRes, acctRes] = await Promise.all([
          fetch("/api/search?type=customers&limit=20"),
          fetch("/api/search?type=accounts&limit=20"),
        ]);
        const custRaw = custRes.ok ? await custRes.json() : [];
        const acctRaw = acctRes.ok ? await acctRes.json() : [];
        // Search API returns { id, label, data } format
        const customers = custRaw.map((c: any) => ({ id: c.id, name: c.label || c.data?.name || "Unknown" }));
        const accounts = acctRaw.map((a: any) => ({ id: a.id, name: a.data?.name || a.label || "Unknown", premisesId: a.label }));

        // Build estimates from real data
        const descriptions = [
          "Elevator modernization - Car 1 & 2", "Annual maintenance contract renewal",
          "Emergency phone upgrade - all units", "Hydraulic cylinder replacement",
          "New elevator installation", "Control system upgrade",
          "Door operator replacement x4", "Safety test and inspection prep",
          "Cab interior renovation", "Machine room cooling system",
        ];
        const statuses = ["Sent", "Accepted", "Draft", "Sent", "Sent", "Rejected", "Accepted", "Expired", "Draft", "Sent"];
        const amounts = [185000, 48000, 32500, 67800, 425000, 89500, 28400, 4500, 18500, 15200];
        const probs = [75, 100, 50, 60, 40, 0, 100, 0, 30, 65];
        const salespersons = ["John Smith", "Mike Johnson", "Sarah Davis"];

        const mockEstimates: Estimate[] = [];
        const count = Math.min(10, Math.max(customers.length, accounts.length, 10));

        for (let i = 0; i < count; i++) {
          const cust = customers[i % customers.length];
          const acct = accounts[i % accounts.length];
          const daysAgo = 40 + i * 3;
          const created = new Date();
          created.setDate(created.getDate() - daysAgo);
          const expires = new Date(created);
          expires.setDate(expires.getDate() + 30);

          mockEstimates.push({
            id: `est-${i + 1}`,
            estimateNumber: `EST-2025-${(142 - i).toString().padStart(4, "0")}`,
            customerId: cust?.id || `${i + 1}`,
            customerName: cust?.name || `Customer ${i + 1}`,
            accountId: acct?.id || `${i + 1}`,
            accountName: acct?.name || acct?.premisesId || `Account ${i + 1}`,
            description: descriptions[i % descriptions.length],
            amount: amounts[i % amounts.length],
            status: statuses[i % statuses.length],
            createdDate: `${(created.getMonth() + 1).toString().padStart(2, "0")}/${created.getDate().toString().padStart(2, "0")}/${created.getFullYear()}`,
            expirationDate: `${(expires.getMonth() + 1).toString().padStart(2, "0")}/${expires.getDate().toString().padStart(2, "0")}/${expires.getFullYear()}`,
            salesperson: salespersons[i % salespersons.length],
            probability: probs[i % probs.length],
          });
        }

        setEstimates(mockEstimates);
      } catch (err) {
        console.error("Failed to load estimates data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEstimates();
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

  const handleEditEstimate = () => {
    if (selectedRow) {
      const estimate = estimates.find(e => e.id === selectedRow);
      if (estimate) {
        openTab(`Estimate: ${estimate.estimateNumber}`, `/estimates/${estimate.id}`);
      }
    }
  };

  const handleDeleteEstimate = () => {
    if (selectedRow) {
      const estimate = estimates.find(e => e.id === selectedRow);
      if (estimate && confirm(`Are you sure you want to delete estimate ${estimate.estimateNumber}?`)) {
        const updated = estimates.filter(e => e.id !== selectedRow);
        setEstimates(updated);
        setSelectedRow(updated[0]?.id || null);
      }
    }
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
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">View</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        {toolbarIcons.map((item, i) => {
          const IconComponent = item.icon;
          const onClick = i === 0 ? handleNewEstimate
            : i === 1 ? handleEditEstimate
            : i === 3 ? handleDeleteEstimate
            : undefined;
          const isDisabled = (i === 1 || i === 3) && !selectedRow;
          return (
            <button
              key={i}
              onClick={onClick}
              disabled={isDisabled}
              className={`w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] ${isDisabled ? 'opacity-50' : ''}`}
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
      <div className="bg-white flex items-end px-2 pt-1">
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
              {isFieldAllowed("estimates", "estimateNumber") && <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "12%" }}
                onClick={() => handleSort("estimateNumber")}
              >
                <div className="flex items-center gap-1">
                  Estimate #
                  <SortIcon field="estimateNumber" />
                </div>
              </th>}
              {isFieldAllowed("estimates", "customerName") && <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "15%" }}
                onClick={() => handleSort("customerName")}
              >
                <div className="flex items-center gap-1">
                  Customer
                  <SortIcon field="customerName" />
                </div>
              </th>}
              {isFieldAllowed("estimates", "accountName") && <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "13%" }}
                onClick={() => handleSort("accountName")}
              >
                <div className="flex items-center gap-1">
                  Account
                  <SortIcon field="accountName" />
                </div>
              </th>}
              {isFieldAllowed("estimates", "description") && <th
                className="px-2 py-1.5 font-medium text-[#333] border border-[#c0c0c0]"
                style={{ width: "20%" }}
              >
                Description
              </th>}
              {isFieldAllowed("estimates", "amount") && <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0] text-right"
                style={{ width: "10%" }}
                onClick={() => handleSort("amount")}
              >
                <div className="flex items-center justify-end gap-1">
                  Amount
                  <SortIcon field="amount" />
                </div>
              </th>}
              {isFieldAllowed("estimates", "status") && <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0] text-center"
                style={{ width: "8%" }}
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center justify-center gap-1">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>}
              {isFieldAllowed("estimates", "createdDate") && <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "9%" }}
                onClick={() => handleSort("createdDate")}
              >
                <div className="flex items-center gap-1">
                  Created
                  <SortIcon field="createdDate" />
                </div>
              </th>}
              {isFieldAllowed("estimates", "expirationDate") && <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "9%" }}
                onClick={() => handleSort("expirationDate")}
              >
                <div className="flex items-center gap-1">
                  Expires
                  <SortIcon field="expirationDate" />
                </div>
              </th>}
              {isFieldAllowed("estimates", "probability") && <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "4%" }}
                onClick={() => handleSort("salesperson")}
                title="Probability %"
              >
                <div className="flex items-center gap-1">
                  %
                </div>
              </th>}
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
                    {isFieldAllowed("estimates", "estimateNumber") && <td className="px-2 py-1 border border-[#d0d0d0] font-medium" style={{ width: "12%" }}>
                      {estimate.estimateNumber}
                    </td>}
                    {isFieldAllowed("estimates", "customerName") && <td
                      className={`px-2 py-1 border border-[#d0d0d0] ${selectedRow !== estimate.id ? "text-[#0000ff] cursor-pointer hover:underline" : ""}`}
                      style={{ width: "15%" }}
                      onClick={(e) => selectedRow !== estimate.id && handleCustomerClick(estimate, e)}
                    >
                      {estimate.customerName}
                    </td>}
                    {isFieldAllowed("estimates", "accountName") && <td
                      className={`px-2 py-1 border border-[#d0d0d0] ${selectedRow !== estimate.id ? "text-[#0000ff] cursor-pointer hover:underline" : ""}`}
                      style={{ width: "13%" }}
                      onClick={(e) => selectedRow !== estimate.id && handleAccountClick(estimate, e)}
                    >
                      {estimate.accountName}
                    </td>}
                    {isFieldAllowed("estimates", "description") && <td className="px-2 py-1 border border-[#d0d0d0] truncate" style={{ width: "20%" }} title={estimate.description}>
                      {estimate.description}
                    </td>}
                    {isFieldAllowed("estimates", "amount") && <td className="px-2 py-1 border border-[#d0d0d0] text-right" style={{ width: "10%" }}>
                      {formatCurrency(estimate.amount)}
                    </td>}
                    {isFieldAllowed("estimates", "status") && <td className="px-2 py-1 border border-[#d0d0d0] text-center" style={{ width: "8%" }}>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${selectedRow === estimate.id ? "bg-white/20" : getStatusColor(estimate.status)}`}>
                        {estimate.status}
                      </span>
                    </td>}
                    {isFieldAllowed("estimates", "createdDate") && <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "9%" }}>
                      {estimate.createdDate}
                    </td>}
                    {isFieldAllowed("estimates", "expirationDate") && <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "9%" }}>
                      {estimate.expirationDate}
                    </td>}
                    {isFieldAllowed("estimates", "probability") && <td className="px-2 py-1 border border-[#d0d0d0] text-center" style={{ width: "4%" }}>
                      {estimate.probability}
                    </td>}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Bar with Totals */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
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
