"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Pencil,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useXPDialog } from "@/components/ui/XPDialog";

interface Opportunity {
  id: string;
  opportunityNumber: number;
  name: string;
  customerName: string;
  customerId: string;
  accountName: string;
  accountId: string;
  type: string | null;
  stage: string;
  estimatedValue: number | null;
  expectedCloseDate: string | null;
  owner: string | null;
  proposalCount: number;
}

const STAGE_TABS = ["All", "Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

type SortField = "opportunityNumber" | "name" | "customerName" | "accountName" | "type" | "stage" | "estimatedValue" | "expectedCloseDate" | "owner";
type SortDirection = "asc" | "desc";

const columns: { field: SortField; label: string; width: number }[] = [
  { field: "opportunityNumber", label: "Opp #", width: 80 },
  { field: "name", label: "Name", width: 200 },
  { field: "customerName", label: "Customer", width: 160 },
  { field: "accountName", label: "Account", width: 140 },
  { field: "type", label: "Type", width: 120 },
  { field: "stage", label: "Stage", width: 120 },
  { field: "estimatedValue", label: "Value", width: 110 },
  { field: "expectedCloseDate", label: "Close Date", width: 100 },
  { field: "owner", label: "Owner", width: 120 },
];

const formatCurrency = (amount: number | null) =>
  amount != null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
    : "";

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}`;
};

const getStageColor = (stage: string) => {
  switch (stage) {
    case "Prospecting": return "bg-[#e2e3e5] text-[#383d41]";
    case "Qualification": return "bg-[#cce5ff] text-[#004085]";
    case "Proposal": return "bg-[#fff3cd] text-[#856404]";
    case "Negotiation": return "bg-[#fce4ec] text-[#880e4f]";
    case "Closed Won": return "bg-[#d4edda] text-[#155724]";
    case "Closed Lost": return "bg-[#f8d7da] text-[#721c24]";
    default: return "bg-[#f0f0f0] text-[#606060]";
  }
};

export default function OpportunitiesPage() {
  const { openTab } = useTabs();
  const { isFieldAllowed } = usePermissions();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("opportunityNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showTotals, setShowTotals] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [columnWidths, setColumnWidths] = useState<number[]>(columns.map((c) => c.width));

  const handleResizeStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[index];
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(30, startWidth + diff);
      setColumnWidths((prev) => {
        const updated = [...prev];
        updated[index] = newWidth;
        return updated;
      });
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/opportunities");
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data);
      }
    } catch (err) {
      console.error("Failed to load opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleDoubleClick = (opp: Opportunity) => {
    openTab(`Opp: ${opp.opportunityNumber}`, `/opportunities/${opp.id}`);
  };

  const handleNew = () => {
    openTab("New Opportunity", "/opportunities/new");
  };

  const handleEdit = () => {
    if (selectedRow) {
      const opp = opportunities.find((o) => o.id === selectedRow);
      if (opp) openTab(`Opp: ${opp.opportunityNumber}`, `/opportunities/${opp.id}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    const opp = opportunities.find((o) => o.id === selectedRow);
    if (!opp) return;
    if (!(await xpConfirm(`Delete opportunity #${opp.opportunityNumber} "${opp.name}"?`))) return;
    try {
      const res = await fetch(`/api/opportunities/${opp.id}`, { method: "DELETE" });
      if (res.ok) {
        await xpAlert(`Opportunity #${opp.opportunityNumber} deleted successfully.`);
        setSelectedRow(null);
        fetchOpportunities();
      } else {
        await xpAlert("Failed to delete opportunity.");
      }
    } catch {
      await xpAlert("Failed to delete opportunity.");
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

  const handleCustomerClick = (opp: Opportunity, e: React.MouseEvent) => {
    e.stopPropagation();
    if (opp.customerId) openTab(opp.customerName, `/customers/${opp.customerId}`);
  };

  const handleAccountClick = (opp: Opportunity, e: React.MouseEvent) => {
    e.stopPropagation();
    if (opp.accountId) openTab(opp.accountName, `/accounts/${opp.accountId}`);
  };

  // Filter
  const filtered = opportunities.filter((o) => {
    const matchesTab = activeTab === "All" || o.stage === activeTab;
    const matchesSearch =
      searchTerm === "" ||
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.owner || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(o.opportunityNumber).includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    switch (sortField) {
      case "opportunityNumber":
        aVal = a.opportunityNumber;
        bVal = b.opportunityNumber;
        break;
      case "estimatedValue":
        aVal = a.estimatedValue || 0;
        bVal = b.estimatedValue || 0;
        break;
      case "expectedCloseDate":
        aVal = a.expectedCloseDate ? new Date(a.expectedCloseDate).getTime() : 0;
        bVal = b.expectedCloseDate ? new Date(b.expectedCloseDate).getTime() : 0;
        break;
      default:
        aVal = ((a as any)[sortField] || "").toString().toLowerCase();
        bVal = ((b as any)[sortField] || "").toString().toLowerCase();
    }
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const totals = {
    count: sorted.length,
    value: sorted.reduce((sum, o) => sum + (o.estimatedValue || 0), 0),
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-gray-400" />;
    return sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const getCellValue = (opp: Opportunity, field: SortField) => {
    switch (field) {
      case "estimatedValue":
        return formatCurrency(opp.estimatedValue);
      case "expectedCloseDate":
        return formatDate(opp.expectedCloseDate);
      case "stage":
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${selectedRow === opp.id ? "bg-white/20" : getStageColor(opp.stage)}`}>
            {opp.stage}
          </span>
        );
      case "customerName":
        return (
          <span
            className={selectedRow !== opp.id && opp.customerId ? "text-[#0000ff] cursor-pointer hover:underline" : ""}
            onClick={(e) => selectedRow !== opp.id && handleCustomerClick(opp, e)}
          >
            {opp.customerName}
          </span>
        );
      case "accountName":
        return (
          <span
            className={selectedRow !== opp.id && opp.accountId ? "text-[#0000ff] cursor-pointer hover:underline" : ""}
            onClick={(e) => selectedRow !== opp.id && handleAccountClick(opp, e)}
          >
            {opp.accountName}
          </span>
        );
      default:
        return (opp as any)[field] || "";
    }
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
        <button onClick={handleNew} className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="New Opportunity">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button onClick={handleEdit} disabled={!selectedRow} className={`w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] ${!selectedRow ? "opacity-50" : ""}`} title="Edit">
          <Pencil className="w-4 h-4" style={{ color: "#d4a574" }} />
        </button>
        <button onClick={handleDelete} disabled={!selectedRow} className={`w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] ${!selectedRow ? "opacity-50" : ""}`} title="Delete">
          <X className="w-4 h-4" style={{ color: "#c45c5c" }} />
        </button>
        <button onClick={fetchOpportunities} className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Refresh">
          <RefreshCw className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>

        <div className="ml-4 flex items-center gap-2">
          <span className="text-[11px]">Search:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Name, customer, account..."
            className="border border-[#c0c0c0] px-2 py-0.5 text-[11px] w-[200px] rounded"
          />
        </div>
      </div>

      {/* Stage Tabs */}
      <div className="bg-white flex items-end px-2 pt-1">
        {STAGE_TABS.map((tab) => (
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

      {/* Grid */}
      <div className="flex-1 bg-white border border-[#a0a0a0] mx-2 mb-2 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex bg-[#f0f0f0] border-b border-[#999] text-[12px] font-medium">
          {columns.map((col, index) => {
            if (!isFieldAllowed("opportunities", col.field)) return null;
            return (
              <div
                key={col.field}
                className="relative flex items-center px-2 py-1.5 border-r border-[#c0c0c0] cursor-pointer hover:bg-[#e0e0e0] select-none"
                style={{ width: columnWidths[index], minWidth: columnWidths[index] }}
                onClick={() => handleSort(col.field)}
              >
                <div className={`flex items-center gap-1 ${col.field === "estimatedValue" ? "ml-auto" : ""}`}>
                  {col.label}
                  <SortIcon field={col.field} />
                </div>
                <div
                  className="absolute top-0 right-[-4px] w-[9px] h-full cursor-col-resize z-10 group"
                  onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(index, e); }}
                >
                  <div className="absolute top-0 left-[4px] w-[1px] h-full bg-transparent group-hover:bg-[#0078d4]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-[#808080]">Loading...</div>
          ) : sorted.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">No opportunities found</div>
          ) : (
            sorted.map((opp) => (
              <div
                key={opp.id}
                onClick={() => setSelectedRow(opp.id)}
                onDoubleClick={() => handleDoubleClick(opp)}
                className={`flex text-[12px] cursor-pointer border-b border-[#e0e0e0] ${
                  selectedRow === opp.id ? "bg-[#0078d4] text-white" : "bg-white hover:bg-[#f0f8ff]"
                }`}
              >
                {columns.map((col, index) => {
                  if (!isFieldAllowed("opportunities", col.field)) return null;
                  return (
                    <div
                      key={col.field}
                      className={`px-2 py-1 border-r border-[#e0e0e0] truncate ${col.field === "estimatedValue" ? "text-right" : ""} ${col.field === "stage" ? "text-center" : ""} ${col.field === "opportunityNumber" ? "font-medium" : ""}`}
                      style={{ width: columnWidths[index], minWidth: columnWidths[index] }}
                    >
                      {getCellValue(opp, col.field)}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px]">
          {showTotals && (
            <>
              <span className="text-[#333]"><strong>Count:</strong> {totals.count}</span>
              <span className="text-[#333]"><strong>Pipeline:</strong> {formatCurrency(totals.value)}</span>
            </>
          )}
        </div>
        <button
          onClick={() => setShowTotals(!showTotals)}
          className={`px-4 py-1 border border-[#c0c0c0] rounded text-[11px] hover:bg-[#e8e8e8] ${showTotals ? "bg-[#d0e8ff]" : "bg-[#f0f0f0]"}`}
        >
          {showTotals ? "Totals On" : "Totals Off"}
        </button>
      </div>
      <XPDialogComponent />
    </div>
  );
}
