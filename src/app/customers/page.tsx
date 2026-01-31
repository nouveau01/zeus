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
import { getCustomers } from "@/lib/actions/customers";
import { usePageConfig, createDefaultFields } from "@/hooks/usePageConfig";

// Default field configuration for Customers
const CUSTOMERS_DEFAULT_FIELDS = createDefaultFields({
  name: { label: "Name", width: 250 },
  type: { label: "Type", width: 100 },
  status: { label: "Status", width: 60 },
  accts: { label: "Accts", width: 50 },
  units: { label: "Units", width: 50 },
  balance: { label: "Balance", width: 100 },
});

interface Customer {
  id: string;
  name: string;
  accountNumber: string | null;
  type: string;
  isActive: boolean;
  balance: number;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  contact: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  billing: number | null;
  status: number | null;
  custom1: string | null;
  custom2: string | null;
  portalAccess: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  _count: {
    premises: number;
    jobs: number;
  };
}

const TABS = ["All", "Bank", "Churches", "Clubs", "Commercial", "General"];

type SortField = "name" | "type" | "status" | "accts" | "units" | "balance";
type SortDirection = "asc" | "desc";

// Toolbar icons matching Job Maintenance
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

const STORAGE_KEY = "zeus-customers-state";

interface PageState {
  activeTab: string;
  sortField: SortField;
  sortDirection: SortDirection;
  selectedRow: string | null;
  showTotals: boolean;
}

export default function CustomersPage() {
  const { openTab, closeTab, activeTabId } = useTabs();

  // Page configuration for admin customization
  const { fields, getLabel, isVisible, getVisibleFields, updateFields } = usePageConfig("customers", CUSTOMERS_DEFAULT_FIELDS);
  const [isEditMode, setIsEditMode] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showTotals, setShowTotals] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Menu state
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter dialog state
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  // Column resize state
  const [columnWidths, setColumnWidths] = useState<number[]>([300, 120, 80, 80, 80, 120]);
  const [resizing, setResizing] = useState<{ index: number; startX: number; startWidth: number } | null>(null);

  // Filter fields for Customers
  const filterFields: FilterField[] = [
    { key: "numAccounts", label: "# Accounts", hasLookup: false },
    { key: "numUnits", label: "# Units", hasLookup: false },
    { key: "address", label: "Address", hasLookup: false },
    { key: "balance", label: "Balance", hasLookup: false },
    { key: "billingType", label: "Billing Type*", hasLookup: true },
    { key: "city", label: "City", hasLookup: false },
    { key: "contact", label: "Contact", hasLookup: false },
    { key: "custom1", label: "Custom1", hasLookup: false },
    { key: "custom2", label: "Custom2", hasLookup: false },
    { key: "dateCreated", label: "Date Created", hasLookup: false },
    { key: "email", label: "Email Address", hasLookup: false },
    { key: "fax", label: "Fax", hasLookup: false },
    { key: "lastModified", label: "Last Modified", hasLookup: false },
    { key: "name", label: "Name", hasLookup: false },
    { key: "phone", label: "Phone", hasLookup: false },
    { key: "portalUser", label: "Portal User*", hasLookup: true },
    { key: "state", label: "State*", hasLookup: true },
    { key: "customerStatus", label: "Status*", hasLookup: true },
    { key: "type", label: "Type", hasLookup: false },
    { key: "zip", label: "Zip", hasLookup: false },
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

  const handleDoubleClick = (customer: Customer) => {
    openTab(customer.name, `/customers/${customer.id}`);
  };

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: PageState = JSON.parse(saved);
        setActiveTab(state.activeTab || "All");
        setSortField(state.sortField || "name");
        setSortDirection(state.sortDirection || "asc");
        setSelectedRow(state.selectedRow || null);
        setShowTotals(state.showTotals || false);
      }
    } catch (error) {
      console.error("Error loading customers state:", error);
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
        console.error("Error saving customers state:", error);
      }
    }
  }, [activeTab, sortField, sortDirection, selectedRow, showTotals, isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      fetchCustomers();
    }
  }, [activeTab, isHydrated]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Use Server Action - pulls from SQL Server and mirrors to PostgreSQL
      const data = await getCustomers({
        status: activeTab === "All" ? undefined : activeTab,
      });
      setCustomers(data);
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

  // Helper to get customer field value by filter key
  const getCustomerFieldValue = (customer: Customer, fieldKey: string): string => {
    switch (fieldKey) {
      case "numAccounts": return String(customer._count?.premises || 0);
      case "numUnits": return String(customer._count?.jobs || 0);
      case "address": return customer.address || "";
      case "balance": return String(customer.balance || 0);
      case "billingType": return getBillingTypeText(customer.billing);
      case "city": return customer.city || "";
      case "contact": return customer.contact || "";
      case "custom1": return customer.custom1 || "";
      case "custom2": return customer.custom2 || "";
      case "dateCreated": return customer.createdAt || "";
      case "email": return customer.email || "";
      case "fax": return customer.fax || "";
      case "lastModified": return customer.updatedAt || "";
      case "name": return customer.name || "";
      case "phone": return customer.phone || "";
      case "portalUser": return customer.portalAccess ? "Yes" : "No";
      case "state": return customer.state || "";
      case "status": return customer.isActive ? "Active" : "Inactive";
      case "customerStatus": return customer.isActive ? "Active" : "Inactive";
      case "type": return customer.type || "";
      case "zip": return customer.zipCode || "";
      default: return "";
    }
  };

  // Filter customers based on activeFilters
  const filteredCustomers = customers.filter((customer) => {
    for (const [fieldKey, filter] of Object.entries(activeFilters)) {
      if (!filter.value.trim()) continue;

      const customerValue = getCustomerFieldValue(customer, fieldKey).toLowerCase();
      const filterValue = filter.value.toLowerCase();

      switch (filter.operator) {
        case "=":
          if (customerValue !== filterValue) return false;
          break;
        case "contains":
          if (!customerValue.includes(filterValue)) return false;
          break;
        case "startsWith":
          if (!customerValue.startsWith(filterValue)) return false;
          break;
        case "endsWith":
          if (!customerValue.endsWith(filterValue)) return false;
          break;
        case ">":
          if (customerValue <= filterValue) return false;
          break;
        case ">=":
          if (customerValue < filterValue) return false;
          break;
        case "<":
          if (customerValue >= filterValue) return false;
          break;
        case "<=":
          if (customerValue > filterValue) return false;
          break;
        case "<>":
          if (customerValue === filterValue) return false;
          break;
      }
    }
    return true;
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
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

  // Calculate totals from filtered customers
  const totals = {
    accts: filteredCustomers.reduce((sum, c) => sum + (c._count?.premises || 0), 0),
    units: filteredCustomers.reduce((sum, c) => sum + (c._count?.jobs || 0), 0),
    balance: filteredCustomers.reduce((sum, c) => sum + Number(c.balance), 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Menu actions
  const handleRefreshDisplay = () => {
    fetchCustomers();
    setOpenMenu(null);
  };

  const handleSetFilterSort = () => {
    setShowFilterDialog(true);
    setOpenMenu(null);
  };

  const handleNoFilterSort = () => {
    setActiveTab("All");
    setSortField("name");
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
        openTab("New Customer", "/customers/new");
        break;
      case "edit":
        if (selectedRow) {
          const customer = customers.find(c => c.id === selectedRow);
          if (customer) openTab(customer.name, `/customers/${customer.id}`);
        } else {
          alert("Please select a customer to edit");
        }
        break;
      case "delete":
        if (selectedRow) {
          const customer = customers.find(c => c.id === selectedRow);
          if (customer && confirm(`Delete customer "${customer.name}"?`)) {
            try {
              const res = await fetch(`/api/customers/${selectedRow}`, { method: "DELETE" });
              if (res.ok) { setSelectedRow(null); fetchCustomers(); }
            } catch (e) { console.error(e); }
          }
        } else {
          alert("Please select a customer to delete");
        }
        break;
      case "replicate":
        if (selectedRow) {
          alert("Replicate - Coming soon");
        } else {
          alert("Please select a customer to replicate");
        }
        break;
      case "filter":
        setShowFilterDialog(true);
        break;
      case "clearFilter":
        handleNoFilterSort();
        break;
      case "refresh":
        fetchCustomers();
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
    { field: "name" as SortField, label: "Name" },
    { field: "type" as SortField, label: "Type" },
    { field: "status" as SortField, label: "Status" },
    { field: "accts" as SortField, label: "# Accts" },
    { field: "units" as SortField, label: "# Units" },
    { field: "balance" as SortField, label: "Balance" },
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
          pageId="customers"
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
                key={col.field}
                className="relative flex-shrink-0 border-r border-[#c0c0c0] last:border-r-0"
                style={{ width: columnWidths[index] }}
              >
                <div
                  className="px-2 py-1.5 font-medium text-[#333] cursor-pointer hover:bg-[#e0e0e0] select-none text-center truncate"
                  onClick={() => handleSort(col.field)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="truncate">{col.label}</span>
                    <SortIcon field={col.field} />
                  </div>
                </div>
                {/* Resize handle */}
                <div
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#0078d4] z-10"
                  onMouseDown={(e) => handleResizeStart(index, e)}
                  style={{ cursor: "col-resize" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Data Rows */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-[#808080]">Loading...</div>
          ) : sortedCustomers.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">No customers found</div>
          ) : (
            sortedCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => setSelectedRow(customer.id)}
                onDoubleClick={() => handleDoubleClick(customer)}
                className={`flex text-[12px] cursor-pointer border-b border-[#d0d0d0] ${
                  selectedRow === customer.id
                    ? "bg-[#0078d4] text-white"
                    : "bg-white hover:bg-[#f0f8ff]"
                }`}
              >
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[0] }}>{customer.name}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[1] }}>{customer.type}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[2] }}>{customer.isActive ? "Active" : "Inactive"}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-center" style={{ width: columnWidths[3] }}>{customer._count?.premises || 0}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-center" style={{ width: columnWidths[4] }}>{customer._count?.jobs || 0}</div>
                <div className="px-2 py-1 truncate flex-shrink-0 text-right" style={{ width: columnWidths[5] }}>{formatCurrency(Number(customer.balance))}</div>
              </div>
            ))
          )}
        </div>

        {/* Totals Row - only shows when toggled on */}
        {showTotals && (
          <div className="flex text-[12px] font-semibold bg-[#f5f5f5] border-t-2 border-[#0078d4] flex-shrink-0">
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[0] }}>TOTALS</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[1] }}>{sortedCustomers.length} rows</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[2] }}></div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-center" style={{ width: columnWidths[3] }}>{totals.accts}</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-center" style={{ width: columnWidths[4] }}>{totals.units}</div>
            <div className="px-2 py-1 truncate flex-shrink-0 text-right" style={{ width: columnWidths[5] }}>{formatCurrency(totals.balance)}</div>
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
          <span>{sortedCustomers.length} customers</span>
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
        title="Customers"
        fields={filterFields}
        initialFilters={activeFilters}
      />
    </div>
  );
}
