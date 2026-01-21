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

interface Customer {
  id: string;
  name: string;
  accountNumber: string | null;
  type: string;
  isActive: boolean;
  balance: number;
  _count: {
    premises: number;
    jobs: number;
  };
}

const TABS = ["All", "Bank", "Churches", "Clubs", "Commercial", "General"];

type SortField = "name" | "type" | "status" | "accts" | "units" | "balance";
type SortDirection = "asc" | "desc";

const toolbarIcons = [
  { icon: FileText, color: "#4a7c59" },
  { icon: Pencil, color: "#d4a574" },
  { icon: ClipboardList, color: "#6b8cae" },
  { icon: X, color: "#c45c5c" },
  { icon: FolderOpen, color: "#d4c574" },
  { icon: ChevronDown, color: "#7c6b8e" },
  { icon: Scissors, color: "#5c8c8c" },
  { icon: Check, color: "#5cb85c" },
  { icon: Check, color: "#5c5cb8" },
  { icon: DollarSign, color: "#5cb85c" },
  { icon: BarChart3, color: "#e67e22" },
  { icon: FileEdit, color: "#3498db" },
  { icon: Printer, color: "#9b59b6" },
  { icon: Paperclip, color: "#7f8c8d" },
  { icon: Paperclip, color: "#27ae60" },
  { icon: Sigma, color: "#2c3e50" },
  { icon: Lock, color: "#f39c12" },
  { icon: Plus, color: "#27ae60" },
  { icon: Home, color: "#e74c3c" },
  { icon: HelpCircle, color: "#3498db" },
  { icon: X, color: "#95a5a6" },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showTotals, setShowTotals] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [activeTab]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const url = activeTab === "All"
        ? "/api/customers"
        : `/api/customers?type=${encodeURIComponent(activeTab)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
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

  const sortedCustomers = [...customers].sort((a, b) => {
    let aVal: string | number | boolean;
    let bVal: string | number | boolean;

    switch (sortField) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "type":
        aVal = a.type.toLowerCase();
        bVal = b.type.toLowerCase();
        break;
      case "status":
        aVal = a.isActive ? "active" : "inactive";
        bVal = b.isActive ? "active" : "inactive";
        break;
      case "accts":
        aVal = a._count?.premises || 0;
        bVal = b._count?.premises || 0;
        break;
      case "units":
        aVal = a._count?.jobs || 0;
        bVal = b._count?.jobs || 0;
        break;
      case "balance":
        aVal = Number(a.balance);
        bVal = Number(b.balance);
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
    accts: sortedCustomers.reduce((sum, c) => sum + (c._count?.premises || 0), 0),
    units: sortedCustomers.reduce((sum, c) => sum + (c._count?.jobs || 0), 0),
    balance: sortedCustomers.reduce((sum, c) => sum + Number(c.balance), 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
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
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Dim</span>
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
            >
              <IconComponent className="w-4 h-4" style={{ color: item.color }} />
            </button>
          );
        })}
      </div>

      {/* F&S Catalogue Row */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="mr-2 text-[12px]">F&S Catalogue</span>
        <select className="border border-[#c0c0c0] bg-white px-2 py-0.5 text-[12px] rounded">
          <option>None</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="bg-[#f5f5f5] flex items-end px-2 pt-1">
        {TABS.map((tab) => (
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
                style={{ width: "35%" }}
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Name
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "15%" }}
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center gap-1">
                  Type
                  <SortIcon field="type" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "12%" }}
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1">
                  Status
                  <SortIcon field="status" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0] text-center"
                style={{ width: "10%" }}
                onClick={() => handleSort("accts")}
              >
                <div className="flex items-center justify-center gap-1">
                  # Accts
                  <SortIcon field="accts" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0] text-center"
                style={{ width: "10%" }}
                onClick={() => handleSort("units")}
              >
                <div className="flex items-center justify-center gap-1">
                  # Units
                  <SortIcon field="units" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0] text-right"
                style={{ width: "18%" }}
                onClick={() => handleSort("balance")}
              >
                <div className="flex items-center justify-end gap-1">
                  Balance
                  <SortIcon field="balance" />
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
                  <td colSpan={6} className="p-4 text-center text-[#808080] border border-[#d0d0d0]">Loading...</td>
                </tr>
              ) : sortedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-[#808080] border border-[#d0d0d0]">No customers found</td>
                </tr>
              ) : (
                sortedCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedRow(customer.id)}
                    className={`text-[12px] cursor-pointer ${
                      selectedRow === customer.id
                        ? "bg-[#0078d4] text-white"
                        : "bg-white hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "35%" }}>{customer.name}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "15%" }}>{customer.type}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "12%" }}>{customer.isActive ? "Active" : "Inactive"}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0] text-center" style={{ width: "10%" }}>{customer._count?.premises || 0}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0] text-center" style={{ width: "10%" }}>{customer._count?.jobs || 0}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0] text-right" style={{ width: "18%" }}>{formatCurrency(Number(customer.balance))}</td>
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
            <>
              <span className="text-[#333]">
                <strong>Rows:</strong> {sortedCustomers.length}
              </span>
              <span className="text-[#333]">
                <strong># Accts:</strong> {totals.accts}
              </span>
              <span className="text-[#333]">
                <strong># Units:</strong> {totals.units}
              </span>
              <span className="text-[#333]">
                <strong>Balance:</strong> {formatCurrency(totals.balance)}
              </span>
            </>
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
