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

interface Account {
  id: string;
  premisesId: string | null;
  name: string | null;
  address: string;
  city: string | null;
  state: string | null;
  type: string | null;
  isActive: boolean;
  balance: number;
  customerId: string;
  customer: {
    id: string;
    name: string;
  };
  _count: {
    units: number;
    jobs: number;
  };
}

const TABS = ["All", "2% IC", "D", "E", "H", "L"];

type SortField = "id" | "tag" | "address" | "city" | "status" | "type" | "balance" | "units";
type SortDirection = "asc" | "desc";

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

const STORAGE_KEY = "zeus-accounts-state";

interface PageState {
  activeTab: string;
  sortField: SortField;
  sortDirection: SortDirection;
  selectedRow: string | null;
  showTotals: boolean;
}

export default function AccountsPage() {
  const { openTab } = useTabs();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showTotals, setShowTotals] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const handleDoubleClick = (account: Account) => {
    openTab(account.name || account.premisesId || "Account", `/accounts/${account.id}`);
  };

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: PageState = JSON.parse(saved);
        setActiveTab(state.activeTab || "All");
        setSortField(state.sortField || "id");
        setSortDirection(state.sortDirection || "asc");
        setSelectedRow(state.selectedRow || null);
        setShowTotals(state.showTotals || false);
      }
    } catch (error) {
      console.error("Error loading accounts state:", error);
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
        console.error("Error saving accounts state:", error);
      }
    }
  }, [activeTab, sortField, sortDirection, selectedRow, showTotals, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      fetchAccounts();
    }
  }, [activeTab, isHydrated]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const url = activeTab === "All"
        ? "/api/premises"
        : `/api/premises?filter=${encodeURIComponent(activeTab)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
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

  const sortedAccounts = [...accounts].sort((a, b) => {
    let aVal: string | number | boolean;
    let bVal: string | number | boolean;

    switch (sortField) {
      case "id":
        aVal = (a.premisesId || "").toLowerCase();
        bVal = (b.premisesId || "").toLowerCase();
        break;
      case "tag":
        aVal = (a.name || "").toLowerCase();
        bVal = (b.name || "").toLowerCase();
        break;
      case "address":
        aVal = a.address.toLowerCase();
        bVal = b.address.toLowerCase();
        break;
      case "city":
        aVal = (a.city || "").toLowerCase();
        bVal = (b.city || "").toLowerCase();
        break;
      case "status":
        aVal = a.isActive ? "active" : "inactive";
        bVal = b.isActive ? "active" : "inactive";
        break;
      case "type":
        aVal = (a.type || "").toLowerCase();
        bVal = (b.type || "").toLowerCase();
        break;
      case "units":
        aVal = a._count?.units || 0;
        bVal = b._count?.units || 0;
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
    units: sortedAccounts.reduce((sum, a) => sum + (a._count?.units || 0), 0),
    balance: sortedAccounts.reduce((sum, a) => sum + Number(a.balance), 0),
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

  // Don't render until hydrated to avoid flicker
  if (!isHydrated) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Pim</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        {toolbarIcons.map((item, i) => {
          const IconComponent = item.icon;
          return (
            <button
              key={i}
              className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
              title={item.title}
              onClick={async () => {
                if (item.action === "new") {
                  // Accounts must be created from within a customer
                  alert("To add a new account, open a Customer and use the Add button in the Account Listing section.");
                } else if (item.action === "edit" && selectedRow) {
                  const account = accounts.find(a => a.id === selectedRow);
                  if (account) openTab(account.name || account.address, `/accounts/${account.id}`);
                } else if (item.action === "delete" && selectedRow) {
                  const account = accounts.find(a => a.id === selectedRow);
                  if (account && confirm(`Delete account "${account.name || account.address}"?`)) {
                    try {
                      const res = await fetch(`/api/premises/${selectedRow}`, { method: "DELETE" });
                      if (res.ok) { setSelectedRow(null); fetchAccounts(); }
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

      {/* F&S Catalogue Row */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="mr-2 text-[12px]">F&S Catalogue</span>
        <select className="border border-[#c0c0c0] bg-white px-2 py-0.5 text-[12px] rounded">
          <option>None</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="bg-white flex items-end px-2 pt-1">
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
                style={{ width: "10%" }}
                onClick={() => handleSort("id")}
              >
                <div className="flex items-center gap-1">
                  ID
                  <SortIcon field="id" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "18%" }}
                onClick={() => handleSort("tag")}
              >
                <div className="flex items-center gap-1">
                  Tag
                  <SortIcon field="tag" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "22%" }}
                onClick={() => handleSort("address")}
              >
                <div className="flex items-center gap-1">
                  Address
                  <SortIcon field="address" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0]"
                style={{ width: "12%" }}
                onClick={() => handleSort("city")}
              >
                <div className="flex items-center gap-1">
                  City
                  <SortIcon field="city" />
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
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center gap-1">
                  Type
                  <SortIcon field="type" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0] text-right"
                style={{ width: "10%" }}
                onClick={() => handleSort("balance")}
              >
                <div className="flex items-center justify-end gap-1">
                  Balance
                  <SortIcon field="balance" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none border border-[#c0c0c0] text-center"
                style={{ width: "6%" }}
                onClick={() => handleSort("units")}
              >
                <div className="flex items-center justify-center gap-1">
                  # Units
                  <SortIcon field="units" />
                </div>
              </th>
              <th
                className="px-2 py-1.5 font-medium text-[#333] select-none border border-[#c0c0c0] text-center"
                style={{ width: "4%" }}
              >
                Maint
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
              ) : sortedAccounts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-[#808080] border border-[#d0d0d0]">No accounts found</td>
                </tr>
              ) : (
                sortedAccounts.map((account) => (
                  <tr
                    key={account.id}
                    onClick={() => setSelectedRow(account.id)}
                    onDoubleClick={() => handleDoubleClick(account)}
                    className={`text-[12px] cursor-pointer ${
                      selectedRow === account.id
                        ? "bg-[#0078d4] text-white"
                        : "bg-white hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "10%" }}>{account.premisesId || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "18%" }}>{account.name || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "22%" }}>{account.address}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "12%" }}>{account.city || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "8%" }}>{account.isActive ? "Active" : "Inactive"}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]" style={{ width: "10%" }}>{account.type || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0] text-right" style={{ width: "10%" }}>{formatCurrency(Number(account.balance))}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0] text-center" style={{ width: "6%" }}>{account._count?.units || 0}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0] text-center" style={{ width: "4%" }}>
                      <input type="checkbox" checked={account.type !== "Non-Contract"} readOnly className="w-3 h-3" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Bar with Totals */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        {/* Totals Display */}
        <div className="flex items-center gap-4 text-[11px]">
          {showTotals && (
            <>
              <span className="text-[#333]">
                <strong>Rows:</strong> {sortedAccounts.length}
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
