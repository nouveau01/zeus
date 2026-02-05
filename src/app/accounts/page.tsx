"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Pencil,
  X,
  Copy,
  ChevronDown,
  ChevronUp,
  Sigma,
  RefreshCw,
  Filter,
  FilterX,
  Printer,
  Settings,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { FilterDialog, FilterField, FilterValue } from "@/components/FilterDialog";
import { AdminTools } from "@/components/AdminTools";
import { usePageConfig, createDefaultFields } from "@/hooks/usePageConfig";
import { getAccounts } from "@/lib/actions/accounts";

// Default field configuration for Accounts
const ACCOUNTS_DEFAULT_FIELDS = createDefaultFields({
  premisesId: { label: "Account", width: 120 },
  address: { label: "Address", width: 200 },
  city: { label: "City", width: 100 },
  type: { label: "Type", width: 80 },
  status: { label: "Status", width: 60 },
  units: { label: "Units", width: 50 },
  balance: { label: "Balance", width: 100 },
});

interface Account {
  id: string;
  premisesId: string | null;
  name: string | null;
  address: string;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  type: string | null;
  isActive: boolean;
  balance: number;
  contact: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  route: number | null;
  zone: number | null;
  terr: number | null;
  maint: number | null;
  billing: number | null;
  custom1: string | null;
  custom2: string | null;
  createdAt: string | null;
  updatedAt: string | null;
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

// Toolbar icons matching Job Maintenance/Customers
const toolbarIcons = [
  { icon: FileText, color: "#4a7c59", title: "New", action: "new" },
  { icon: Pencil, color: "#d4a574", title: "Edit", action: "edit" },
  { icon: X, color: "#c45c5c", title: "Delete", action: "delete" },
  { icon: Copy, color: "#6b8cae", title: "Replicate Record", action: "replicate" },
  { type: "separator" },
  { icon: Filter, color: "#7c6b8e", title: "Set Filter and Sort", action: "filter" },
  { icon: FilterX, color: "#c45c5c", title: "Remove Filter and Sort", action: "clearFilter" },
  { type: "separator" },
  { icon: RefreshCw, color: "#e67e22", title: "Refresh Display", action: "refresh" },
  { type: "separator" },
  { icon: Sigma, color: "#2c3e50", title: "Totals", action: "totals" },
] as const;

const STORAGE_KEY = "zeus-accounts-state";

interface PageState {
  activeTab: string;
  sortField: SortField;
  sortDirection: SortDirection;
  selectedRow: string | null;
  showTotals: boolean;
}

export default function AccountsPage() {
  const { openTab, closeTab, activeTabId } = useTabs();

  // Page configuration for admin customization
  const { fields, getLabel, isVisible, getVisibleFields, updateFields } = usePageConfig("accounts", ACCOUNTS_DEFAULT_FIELDS);
  const [isEditMode, setIsEditMode] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("id");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showTotals, setShowTotals] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Menu state
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter dialog state
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  // Column resize state
  const [columnWidths, setColumnWidths] = useState<number[]>([80, 150, 200, 100, 80, 100, 100, 60, 50]);
  const [resizing, setResizing] = useState<{ index: number; startX: number; startWidth: number } | null>(null);

  // Filter fields for Accounts (matching Total Service)
  const filterFields: FilterField[] = [
    { key: "numUnits", label: "# Units", hasLookup: false },
    { key: "acctRep", label: "Acct Rep", hasLookup: false },
    { key: "address", label: "Address", hasLookup: false },
    { key: "balance", label: "Balance", hasLookup: false },
    { key: "city", label: "City", hasLookup: false },
    { key: "collector", label: "COLLECTOR", hasLookup: false },
    { key: "creditHold", label: "Credit Hold", hasLookup: false },
    { key: "custom12", label: "Custom 12", hasLookup: false },
    { key: "custom13", label: "Custom 13", hasLookup: false },
    { key: "custom14", label: "Custom 14", hasLookup: false },
    { key: "customContact", label: "CustomContact*", hasLookup: true },
    { key: "customerType", label: "Customer Type", hasLookup: false },
    { key: "dateCreated", label: "Date Created", hasLookup: false },
    { key: "dateModified", label: "Date Modified", hasLookup: false },
    { key: "dispatchAlert", label: "Dispatch Alert", hasLookup: false },
    { key: "dws", label: "DWS", hasLookup: false },
    { key: "email", label: "Email", hasLookup: false },
    { key: "emailInvoice", label: "Email Invoice", hasLookup: false },
    { key: "emailTicket", label: "Email Ticket", hasLookup: false },
    { key: "grouping", label: "GROUPING", hasLookup: false },
    { key: "grouping2", label: "Grouping 2", hasLookup: false },
    { key: "accountId", label: "ID*", hasLookup: true },
    { key: "interest", label: "Interest", hasLookup: false },
    { key: "onMaintenance", label: "On Maintenance", hasLookup: false },
    { key: "owner", label: "Owner*", hasLookup: true },
    { key: "preTest", label: "Pre Test", hasLookup: false },
    { key: "priceLevel", label: "Price Level", hasLookup: false },
    { key: "printInvoice", label: "Print Invoice", hasLookup: false },
    { key: "printTicket", label: "Print Ticket", hasLookup: false },
    { key: "proposalRcvd", label: "Proposal Rcvd", hasLookup: false },
    { key: "residentMech", label: "Resident Mech", hasLookup: false },
    { key: "routeField", label: "ROUTE", hasLookup: false },
    { key: "route", label: "Route*", hasLookup: true },
    { key: "salesTaxRegion", label: "Sales Tax Region*", hasLookup: true },
    { key: "state", label: "State*", hasLookup: true },
    { key: "accountStatus", label: "Status*", hasLookup: true },
    { key: "supervisor", label: "Supervisor", hasLookup: false },
    { key: "tag", label: "Tag*", hasLookup: true },
    { key: "territory", label: "Territory*", hasLookup: true },
    { key: "typeCategories", label: "Type Categories", hasLookup: false },
    { key: "type", label: "Type*", hasLookup: true },
    { key: "useTax", label: "Use Tax*", hasLookup: true },
    { key: "violationUpdate", label: "ViolationUpdate", hasLookup: false },
    { key: "writeOffs", label: "Write-Offs", hasLookup: false },
    { key: "zip", label: "Zip", hasLookup: false },
    { key: "zone", label: "Zone*", hasLookup: true },
  ];

  // Active filters
  const [activeFilters, setActiveFilters] = useState<Record<string, FilterValue>>({});

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({});
  };

  // Column resize handlers
  const handleResizeStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({ index, startX: e.clientX, startWidth: columnWidths[index] });
  };

  useEffect(() => {
    if (!resizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizing.startX;
      const newWidth = Math.max(50, resizing.startWidth + diff);
      setColumnWidths(prev => {
        const updated = [...prev];
        updated[resizing.index] = newWidth;
        return updated;
      });
    };

    const handleMouseUp = () => {
      setResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizing]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      // Use Server Action - pulls from SQL Server and mirrors to PostgreSQL
      const data = await getAccounts({
        status: activeTab === "All" ? undefined : activeTab,
      });
      setAccounts(data);
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

  // Map billing int to text
  const getBillingTypeText = (billing: number | null): string => {
    switch (billing) {
      case 0: return "Consolidated";
      case 1: return "Detailed";
      case 2: return "Detailed Group";
      case 3: return "Detailed Sub";
      default: return "";
    }
  };

  // Helper to get account field value by filter key
  const getAccountFieldValue = (account: Account, fieldKey: string): string => {
    // Type assertion for fields not in interface yet
    const acct = account as unknown as Record<string, unknown>;

    switch (fieldKey) {
      case "numUnits": return String(account._count?.units || 0);
      case "acctRep": return String(acct.acctRep || "");
      case "address": return account.address || "";
      case "balance": return String(account.balance || 0);
      case "city": return account.city || "";
      case "collector": return String(acct.collector || "");
      case "creditHold": return String(acct.creditHold || "");
      case "custom12": return String(acct.custom12 || "");
      case "custom13": return String(acct.custom13 || "");
      case "custom14": return String(acct.custom14 || "");
      case "customContact": return account.contact || "";
      case "customerType": return account.customer?.name ? "Customer" : "";
      case "dateCreated": return account.createdAt || "";
      case "dateModified": return account.updatedAt || "";
      case "dispatchAlert": return String(acct.dispatchAlert || "");
      case "dws": return String(acct.dws || "");
      case "email": return account.email || "";
      case "emailInvoice": return String(acct.emailInvoice || "");
      case "emailTicket": return String(acct.emailTicket || "");
      case "grouping": return String(acct.grouping || "");
      case "grouping2": return String(acct.grouping2 || "");
      case "accountId": return account.premisesId || "";
      case "interest": return String(acct.interest || "");
      case "onMaintenance": return account.maint === 1 ? "Yes" : "No";
      case "owner": return account.customer?.name || "";
      case "preTest": return String(acct.preTest || "");
      case "priceLevel": return String(acct.priceL || "");
      case "printInvoice": return String(acct.printInvoice || "");
      case "printTicket": return String(acct.printTicket || "");
      case "proposalRcvd": return String(acct.proposalRcvd || "");
      case "residentMech": return String(acct.residentMech || "");
      case "routeField": return String(account.route || "");
      case "route": return String(account.route || "");
      case "salesTaxRegion": return String(acct.sTax || "");
      case "state": return account.state || "";
      case "accountStatus": return account.isActive ? "Active" : "Inactive";
      case "supervisor": return String(acct.supervisor || "");
      case "tag": return account.name || "";
      case "territory": return String(account.terr || "");
      case "typeCategories": return String(acct.typeCategories || "");
      case "type": return account.type || "";
      case "useTax": return String(acct.uTax || "");
      case "violationUpdate": return String(acct.violationUpdate || "");
      case "writeOffs": return String(acct.writeOff || "");
      case "zip": return account.zipCode || "";
      case "zone": return String(account.zone || "");
      default: return "";
    }
  };

  // Filter accounts based on activeFilters
  const filteredAccounts = accounts.filter((account) => {
    for (const [fieldKey, filter] of Object.entries(activeFilters)) {
      if (!filter.value.trim()) continue;

      const accountValue = getAccountFieldValue(account, fieldKey).toLowerCase();
      const filterValue = filter.value.toLowerCase();

      switch (filter.operator) {
        case "=":
          if (accountValue !== filterValue) return false;
          break;
        case "contains":
          if (!accountValue.includes(filterValue)) return false;
          break;
        case "startsWith":
          if (!accountValue.startsWith(filterValue)) return false;
          break;
        case "endsWith":
          if (!accountValue.endsWith(filterValue)) return false;
          break;
        case ">":
          if (accountValue <= filterValue) return false;
          break;
        case ">=":
          if (accountValue < filterValue) return false;
          break;
        case "<":
          if (accountValue >= filterValue) return false;
          break;
        case "<=":
          if (accountValue > filterValue) return false;
          break;
        case "<>":
          if (accountValue === filterValue) return false;
          break;
      }
    }
    return true;
  });

  const sortedAccounts = [...filteredAccounts].sort((a, b) => {
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

  // Calculate totals from filtered accounts
  const totals = {
    units: filteredAccounts.reduce((sum, a) => sum + (a._count?.units || 0), 0),
    balance: filteredAccounts.reduce((sum, a) => sum + Number(a.balance), 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Menu actions
  const handleRefreshDisplay = () => {
    fetchAccounts();
    setOpenMenu(null);
  };

  const handleSetFilterSort = () => {
    setShowFilterDialog(true);
    setOpenMenu(null);
  };

  const handleNoFilterSort = () => {
    setActiveTab("All");
    setSortField("id");
    setSortDirection("asc");
    clearFilters();
    setOpenMenu(null);
  };

  const handlePrint = () => {
    window.print();
    setOpenMenu(null);
  };

  const handleSettings = () => {
    alert("Settings - Coming soon");
    setOpenMenu(null);
  };

  const handleExit = () => {
    if (activeTabId) {
      closeTab(activeTabId);
    }
    setOpenMenu(null);
  };

  // Toolbar click handler
  const handleToolbarClick = async (action: string) => {
    switch (action) {
      case "new":
        openTab("New Account", "/accounts/new");
        break;
      case "edit":
        if (selectedRow) {
          const account = accounts.find(a => a.id === selectedRow);
          if (account) openTab(account.name || account.address, `/accounts/${account.id}`);
        } else {
          alert("Please select an account to edit");
        }
        break;
      case "delete":
        if (selectedRow) {
          const account = accounts.find(a => a.id === selectedRow);
          if (account && confirm(`Delete account "${account.name || account.address}"?`)) {
            try {
              const res = await fetch(`/api/premises/${selectedRow}`, { method: "DELETE" });
              if (res.ok) { setSelectedRow(null); fetchAccounts(); }
            } catch (e) { console.error(e); }
          }
        } else {
          alert("Please select an account to delete");
        }
        break;
      case "replicate":
        if (selectedRow) {
          alert("Replicate - Coming soon");
        } else {
          alert("Please select an account to replicate");
        }
        break;
      case "filter":
        setShowFilterDialog(true);
        break;
      case "clearFilter":
        handleNoFilterSort();
        break;
      case "refresh":
        fetchAccounts();
        break;
      case "totals":
        setShowTotals(!showTotals);
        break;
    }
  };

  // Edit menu actions
  const handleNewRecord = () => handleToolbarClick("new");
  const handleEditRecord = () => handleToolbarClick("edit");
  const handleDeleteRecord = () => handleToolbarClick("delete");
  const handleReplicateRecord = () => handleToolbarClick("replicate");

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    );
  };

  const columns = [
    { field: "id" as SortField, label: "ID" },
    { field: "tag" as SortField, label: "Tag" },
    { field: "address" as SortField, label: "Address" },
    { field: "city" as SortField, label: "City" },
    { field: "status" as SortField, label: "Status" },
    { field: "type" as SortField, label: "Type" },
    { field: "balance" as SortField, label: "Balance" },
    { field: "units" as SortField, label: "# Units" },
    { field: null, label: "Maint" },
  ];

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
      <div ref={menuRef} className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] relative">
        {/* File Menu */}
        <div className="relative">
          <span
            className={`px-3 py-1 cursor-pointer rounded ${openMenu === "file" ? "bg-[#e5e5e5]" : "hover:bg-[#e5e5e5]"}`}
            onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}
          >
            File
          </span>
          {openMenu === "file" && (
            <div className="absolute top-full left-0 mt-0 bg-white border border-[#c0c0c0] shadow-md z-50 min-w-[180px]">
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={handleRefreshDisplay}
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Display
              </button>
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={handleSetFilterSort}
              >
                <Filter className="w-4 h-4" />
                Set Filter & Sort
              </button>
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={handleNoFilterSort}
              >
                <FilterX className="w-4 h-4" />
                No Filter & Sort
              </button>
              <div className="border-t border-[#d0d0d0] my-1" />
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <div className="border-t border-[#d0d0d0] my-1" />
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={handleSettings}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <div className="border-t border-[#d0d0d0] my-1" />
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={handleExit}
              >
                <X className="w-4 h-4" />
                Exit
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <span
            className={`px-3 py-1 cursor-pointer rounded ${openMenu === "edit" ? "bg-[#e5e5e5]" : "hover:bg-[#e5e5e5]"}`}
            onClick={() => setOpenMenu(openMenu === "edit" ? null : "edit")}
          >
            Edit
          </span>
          {openMenu === "edit" && (
            <div className="absolute top-full left-0 mt-0 bg-white border border-[#c0c0c0] shadow-md z-50 min-w-[180px]">
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={() => { handleNewRecord(); setOpenMenu(null); }}
              >
                <FileText className="w-4 h-4 text-[#4a7c59]" />
                Add New Record
              </button>
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={() => { handleEditRecord(); setOpenMenu(null); }}
              >
                <Pencil className="w-4 h-4 text-[#d4a574]" />
                Edit Existing Record
              </button>
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={() => { handleDeleteRecord(); setOpenMenu(null); }}
              >
                <X className="w-4 h-4 text-[#c45c5c]" />
                Delete Existing Record
              </button>
              <button
                className="w-full px-4 py-1.5 text-left hover:bg-[#e5e5e5] flex items-center gap-2 text-[12px]"
                onClick={() => { handleReplicateRecord(); setOpenMenu(null); }}
              >
                <Copy className="w-4 h-4 text-[#6b8cae]" />
                Replicate Record
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        {toolbarIcons.map((item, i) => {
          if ("type" in item && item.type === "separator") {
            return <div key={i} className="w-px h-5 bg-[#c0c0c0] mx-1" />;
          }

          if ("icon" in item) {
            const IconComponent = item.icon;
            const isActive = item.action === "totals" && showTotals;
            return (
              <button
                key={i}
                className={`w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border ${
                  isActive
                    ? "border-[#0078d4] bg-[#cce4f7]"
                    : "border-transparent hover:border-[#c0c0c0]"
                }`}
                title={item.title}
                onClick={() => handleToolbarClick(item.action)}
              >
                <IconComponent className="w-4 h-4" style={{ color: item.color }} />
              </button>
            );
          }
          return null;
        })}
        <div className="flex-1" />
        <AdminTools
          pageId="accounts"
          fields={fields}
          onFieldsChange={updateFields}
          isEditMode={isEditMode}
          onEditModeChange={setIsEditMode}
        />
      </div>

      {/* Filter Row */}
      <div className="bg-white flex flex-wrap items-center gap-3 px-2 py-2 border-b border-[#d0d0d0]">
        <div className="flex items-center gap-1">
          <span className="text-[11px]">F&S Catalogue</span>
          <select className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white min-w-[60px]">
            <option value="None">None</option>
          </select>
        </div>
      </div>

      {/* Type Tabs */}
      <div className="bg-white flex items-end px-2 pt-1 border-b border-[#d0d0d0]">
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

      {/* Grid Container */}
      <div className="flex-1 bg-white border border-[#a0a0a0] mx-2 mb-2 flex flex-col overflow-hidden">
        {/* Column Headers */}
        <div className="bg-[#f0f0f0] border-b border-[#c0c0c0] flex-shrink-0">
          <div className="flex text-[12px]">
            {columns.map((col, index) => (
              <div
                key={col.label}
                className="relative flex-shrink-0 border-r border-[#c0c0c0] last:border-r-0"
                style={{ width: columnWidths[index] }}
              >
                <div
                  className={`px-2 py-1.5 font-medium text-[#333] select-none text-center truncate ${
                    col.field ? "cursor-pointer hover:bg-[#e0e0e0]" : ""
                  }`}
                  onClick={() => col.field && handleSort(col.field)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="truncate">{col.label}</span>
                    {col.field && <SortIcon field={col.field} />}
                  </div>
                </div>
                {/* Resize handle - wider clickable area with thin visual indicator */}
                <div
                  className="absolute top-0 right-[-4px] w-[9px] h-full cursor-col-resize z-10 group"
                  onMouseDown={(e) => handleResizeStart(index, e)}
                >
                  <div className="absolute top-0 left-[4px] w-[1px] h-full bg-transparent group-hover:bg-[#0078d4]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Rows */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-[#808080]">Loading...</div>
          ) : sortedAccounts.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">No accounts found</div>
          ) : (
            sortedAccounts.map((account) => (
              <div
                key={account.id}
                onClick={() => setSelectedRow(account.id)}
                onDoubleClick={() => handleDoubleClick(account)}
                className={`flex text-[12px] cursor-pointer border-b border-[#d0d0d0] ${
                  selectedRow === account.id
                    ? "bg-[#0078d4] text-white"
                    : "bg-white hover:bg-[#f0f8ff]"
                }`}
              >
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[0] }}>{account.premisesId || ""}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[1] }}>{account.name || ""}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[2] }}>{account.address}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[3] }}>{account.city || ""}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[4] }}>{account.isActive ? "Active" : "Inactive"}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[5] }}>{account.type || ""}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[6] }}>{formatCurrency(Number(account.balance))}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-center" style={{ width: columnWidths[7] }}>{account._count?.units || 0}</div>
                <div className="px-2 py-1 truncate flex-shrink-0 text-center" style={{ width: columnWidths[8] }}>
                  <input type="checkbox" checked={account.maint === 1} readOnly className="w-3 h-3" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals Row - only shows when toggled on */}
        {showTotals && (
          <div className="flex text-[12px] font-semibold bg-[#f5f5f5] border-t-2 border-[#0078d4] flex-shrink-0">
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[0] }}>TOTALS</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[1] }}>{sortedAccounts.length} accts</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[2] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[3] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[4] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[5] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[6] }}>{formatCurrency(totals.balance)}</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-center" style={{ width: columnWidths[7] }}>{totals.units}</div>
            <div className="px-2 py-1 truncate flex-shrink-0 text-center" style={{ width: columnWidths[8] }}></div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px]">
          {Object.keys(activeFilters).length > 0 && (
            <span className="text-[#0066cc] flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <strong>Filtered</strong>
              <button
                onClick={clearFilters}
                className="ml-1 text-[#c00] hover:underline"
                title="Clear filters"
              >
                (clear)
              </button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>{sortedAccounts.length} accounts</span>
          <button
            onClick={() => setShowTotals(!showTotals)}
            className={`px-2 py-0.5 text-[10px] border rounded ${
              showTotals ? "bg-[#0078d4] text-white border-[#0078d4]" : "bg-white border-[#a0a0a0] hover:bg-[#f0f0f0]"
            }`}
          >
            Totals {showTotals ? "On" : "Off"}
          </button>
        </div>
      </div>

      {/* Filter Dialog */}
      <FilterDialog
        isOpen={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        onApply={(filters) => setActiveFilters(filters)}
        title="Accounts"
        fields={filterFields}
        initialFilters={activeFilters}
      />
    </div>
  );
}
