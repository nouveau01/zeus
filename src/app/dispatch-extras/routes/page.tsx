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

interface RouteData {
  id: number;
  name: string;
  mechanic: string;
  mechId: number | null;
  accountCount: number;
  unitCount: number;
  hours: number;
  projectedRevenue: number;
  remarks: string | null;
}

interface RouteTotals {
  totalRoutes: number;
  totalAccounts: number;
  totalUnits: number;
  totalHours: number;
  totalProjected: number;
}

type SortField = "name" | "mechanic" | "accountCount" | "unitCount" | "hours" | "projectedRevenue";
type SortDirection = "asc" | "desc";

// Toolbar icons matching Customers
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

export default function RoutesPage() {
  const { closeTab, activeTabId } = useTabs();
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [totals, setTotals] = useState<RouteTotals>({
    totalRoutes: 0,
    totalAccounts: 0,
    totalUnits: 0,
    totalHours: 0,
    totalProjected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showTotals, setShowTotals] = useState(false);

  // Menu state
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter dialog state
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  // Column resize state
  const [columnWidths, setColumnWidths] = useState<number[]>([200, 160, 80, 80, 80, 120, 300]);
  const [resizing, setResizing] = useState<{ index: number; startX: number; startWidth: number } | null>(null);

  // Filter fields for Routes
  const filterFields: FilterField[] = [
    { key: "name", label: "Name", hasLookup: false },
    { key: "mechanic", label: "Mechanic", hasLookup: true },
    { key: "accountCount", label: "# Accounts", hasLookup: false },
    { key: "unitCount", label: "# Units", hasLookup: false },
    { key: "hours", label: "Hours", hasLookup: false },
    { key: "projectedRevenue", label: "Projected $", hasLookup: false },
    { key: "remarks", label: "Remarks", hasLookup: false },
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

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/routes");
      if (response.ok) {
        const data = await response.json();
        setRoutes(data.routes || []);
        setTotals(data.totals || {
          totalRoutes: 0,
          totalAccounts: 0,
          totalUnits: 0,
          totalHours: 0,
          totalProjected: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
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

  // Helper to get route field value by filter key
  const getRouteFieldValue = (route: RouteData, fieldKey: string): string => {
    switch (fieldKey) {
      case "name": return route.name || "";
      case "mechanic": return route.mechanic || "";
      case "accountCount": return String(route.accountCount || 0);
      case "unitCount": return String(route.unitCount || 0);
      case "hours": return String(route.hours || 0);
      case "projectedRevenue": return String(route.projectedRevenue || 0);
      case "remarks": return route.remarks || "";
      default: return "";
    }
  };

  // Filter routes based on activeFilters
  const filteredRoutes = routes.filter((route) => {
    for (const [fieldKey, filter] of Object.entries(activeFilters)) {
      if (!filter.value.trim()) continue;

      const routeValue = getRouteFieldValue(route, fieldKey).toLowerCase();
      const filterValue = filter.value.toLowerCase();

      switch (filter.operator) {
        case "=":
          if (routeValue !== filterValue) return false;
          break;
        case "contains":
          if (!routeValue.includes(filterValue)) return false;
          break;
        case "startsWith":
          if (!routeValue.startsWith(filterValue)) return false;
          break;
        case "endsWith":
          if (!routeValue.endsWith(filterValue)) return false;
          break;
        case ">":
          if (parseFloat(routeValue) <= parseFloat(filterValue)) return false;
          break;
        case ">=":
          if (parseFloat(routeValue) < parseFloat(filterValue)) return false;
          break;
        case "<":
          if (parseFloat(routeValue) >= parseFloat(filterValue)) return false;
          break;
        case "<=":
          if (parseFloat(routeValue) > parseFloat(filterValue)) return false;
          break;
        case "<>":
          if (routeValue === filterValue) return false;
          break;
      }
    }
    return true;
  });

  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (sortField) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "mechanic":
        aVal = a.mechanic.toLowerCase();
        bVal = b.mechanic.toLowerCase();
        break;
      case "accountCount":
        aVal = a.accountCount || 0;
        bVal = b.accountCount || 0;
        break;
      case "unitCount":
        aVal = a.unitCount || 0;
        bVal = b.unitCount || 0;
        break;
      case "hours":
        aVal = a.hours || 0;
        bVal = b.hours || 0;
        break;
      case "projectedRevenue":
        aVal = a.projectedRevenue || 0;
        bVal = b.projectedRevenue || 0;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Calculate totals from filtered routes
  const filteredTotals = {
    totalRoutes: filteredRoutes.length,
    totalAccounts: filteredRoutes.reduce((sum, r) => sum + (r.accountCount || 0), 0),
    totalUnits: filteredRoutes.reduce((sum, r) => sum + (r.unitCount || 0), 0),
    totalHours: filteredRoutes.reduce((sum, r) => sum + (r.hours || 0), 0),
    totalProjected: filteredRoutes.reduce((sum, r) => sum + (r.projectedRevenue || 0), 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Menu actions
  const handleRefreshDisplay = () => {
    fetchRoutes();
    setOpenMenu(null);
  };

  const handleSetFilterSort = () => {
    setShowFilterDialog(true);
    setOpenMenu(null);
  };

  const handleNoFilterSort = () => {
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
        alert("New Route - Coming soon");
        break;
      case "edit":
        if (selectedRow) {
          alert("Edit Route - Coming soon");
        } else {
          alert("Please select a route to edit");
        }
        break;
      case "delete":
        if (selectedRow) {
          alert("Delete Route - Coming soon");
        } else {
          alert("Please select a route to delete");
        }
        break;
      case "replicate":
        if (selectedRow) {
          alert("Replicate - Coming soon");
        } else {
          alert("Please select a route to replicate");
        }
        break;
      case "filter":
        setShowFilterDialog(true);
        break;
      case "clearFilter":
        handleNoFilterSort();
        break;
      case "refresh":
        fetchRoutes();
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
    { field: "mechanic" as SortField, label: "Mech" },
    { field: "accountCount" as SortField, label: "Loc" },
    { field: "unitCount" as SortField, label: "Elev" },
    { field: "hours" as SortField, label: "Hour" },
    { field: "projectedRevenue" as SortField, label: "Amount" },
    { field: "remarks" as SortField, label: "Remarks" },
  ];

  if (loading) {
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
          {sortedRoutes.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">No routes found</div>
          ) : (
            sortedRoutes.map((route) => (
              <div
                key={route.id}
                onClick={() => setSelectedRow(route.name)}
                className={`flex text-[12px] cursor-pointer border-b border-[#d0d0d0] ${
                  selectedRow === route.name
                    ? "bg-[#0078d4] text-white"
                    : "bg-white hover:bg-[#f0f8ff]"
                }`}
              >
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[0] }}>{route.name}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[1] }}>{route.mechanic}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-center" style={{ width: columnWidths[2] }}>{route.accountCount}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-center" style={{ width: columnWidths[3] }}>{route.unitCount}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-center" style={{ width: columnWidths[4] }}>{route.hours.toFixed(2)}</div>
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[5] }}>{formatCurrency(route.projectedRevenue)}</div>
                <div className="px-2 py-1 truncate flex-shrink-0" style={{ width: columnWidths[6] }} title={route.remarks || ""}>{route.remarks || ""}</div>
              </div>
            ))
          )}
        </div>

        {/* Totals Row - only shows when toggled on */}
        {showTotals && (
          <div className="flex text-[12px] font-semibold bg-[#f5f5f5] border-t-2 border-[#0078d4] flex-shrink-0">
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[0] }}>TOTALS</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[1] }}>{filteredTotals.totalRoutes} routes</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-center" style={{ width: columnWidths[2] }}>{filteredTotals.totalAccounts}</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-center" style={{ width: columnWidths[3] }}>{filteredTotals.totalUnits}</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-center" style={{ width: columnWidths[4] }}>{filteredTotals.totalHours.toFixed(2)}</div>
            <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 text-right" style={{ width: columnWidths[5] }}>{formatCurrency(filteredTotals.totalProjected)}</div>
            <div className="px-2 py-1 truncate flex-shrink-0" style={{ width: columnWidths[6] }}></div>
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
          <span>{sortedRoutes.length} routes</span>
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
        title="Routes"
        fields={filterFields}
        initialFilters={activeFilters}
      />
    </div>
  );
}
