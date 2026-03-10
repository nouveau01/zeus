"use client";

import { useState, useEffect } from "react";
import {
  Pencil,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useXPDialog } from "@/components/ui/XPDialog";

interface ProposalRow {
  id: string;
  proposalNumber: number;
  title: string | null;
  status: string;
  amount: number | null;
  createdAt: string;
  sentDate: string | null;
  opportunityName: string;
  customerName: string;
  customerId: string;
  accountName: string;
  accountId: string;
  opportunityId: string;
}

const STATUS_TABS = ["All", "Draft", "Sent", "Accepted", "Rejected"];

type SortField = "proposalNumber" | "title" | "opportunityName" | "customerName" | "accountName" | "status" | "amount" | "createdAt" | "sentDate";
type SortDirection = "asc" | "desc";

const columns: { field: SortField; label: string; width: number }[] = [
  { field: "proposalNumber", label: "Proposal #", width: 100 },
  { field: "title", label: "Title", width: 200 },
  { field: "opportunityName", label: "Opportunity", width: 180 },
  { field: "customerName", label: "Customer", width: 150 },
  { field: "accountName", label: "Account", width: 130 },
  { field: "status", label: "Status", width: 90 },
  { field: "amount", label: "Amount", width: 110 },
  { field: "createdAt", label: "Created", width: 95 },
  { field: "sentDate", label: "Sent", width: 95 },
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "Draft": return "bg-[#f0f0f0] text-[#606060]";
    case "Sent": return "bg-[#fff3cd] text-[#856404]";
    case "Accepted": return "bg-[#d4edda] text-[#155724]";
    case "Rejected": return "bg-[#f8d7da] text-[#721c24]";
    default: return "bg-[#f0f0f0] text-[#606060]";
  }
};

export default function ProposalsPage() {
  const { openTab } = useTabs();
  const { isFieldAllowed } = usePermissions();
  const { alert: xpAlert, DialogComponent: XPDialogComponent } = useXPDialog();
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("proposalNumber");
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

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proposals");
      if (res.ok) {
        setProposals(await res.json());
      }
    } catch (err) {
      console.error("Failed to load proposals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleDoubleClick = (p: ProposalRow) => {
    openTab(`Proposal: ${p.proposalNumber}`, `/proposals/${p.id}`);
  };

  const handleEdit = () => {
    if (selectedRow) {
      const p = proposals.find((x) => x.id === selectedRow);
      if (p) openTab(`Proposal: ${p.proposalNumber}`, `/proposals/${p.id}`);
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

  const handleCustomerClick = (p: ProposalRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (p.customerId) openTab(p.customerName, `/customers/${p.customerId}`);
  };

  const handleAccountClick = (p: ProposalRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (p.accountId) openTab(p.accountName, `/accounts/${p.accountId}`);
  };

  const handleOppClick = (p: ProposalRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (p.opportunityId) openTab(`Opp: ${p.opportunityName}`, `/opportunities/${p.opportunityId}`);
  };

  // Filter
  const filtered = proposals.filter((p) => {
    const matchesTab = activeTab === "All" || p.status === activeTab;
    const matchesSearch =
      searchTerm === "" ||
      (p.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.opportunityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(p.proposalNumber).includes(searchTerm);
    return matchesTab && matchesSearch;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    switch (sortField) {
      case "proposalNumber":
        aVal = a.proposalNumber;
        bVal = b.proposalNumber;
        break;
      case "amount":
        aVal = a.amount || 0;
        bVal = b.amount || 0;
        break;
      case "createdAt":
      case "sentDate":
        aVal = a[sortField] ? new Date(a[sortField]!).getTime() : 0;
        bVal = b[sortField] ? new Date(b[sortField]!).getTime() : 0;
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
    amount: sorted.reduce((sum, p) => sum + (p.amount || 0), 0),
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-gray-400" />;
    return sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const getCellValue = (p: ProposalRow, field: SortField) => {
    switch (field) {
      case "amount":
        return formatCurrency(p.amount);
      case "createdAt":
        return formatDate(p.createdAt);
      case "sentDate":
        return formatDate(p.sentDate);
      case "status":
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${selectedRow === p.id ? "bg-white/20" : getStatusColor(p.status)}`}>
            {p.status}
          </span>
        );
      case "customerName":
        return (
          <span className={selectedRow !== p.id && p.customerId ? "text-[#0000ff] cursor-pointer hover:underline" : ""} onClick={(e) => selectedRow !== p.id && handleCustomerClick(p, e)}>
            {p.customerName}
          </span>
        );
      case "accountName":
        return (
          <span className={selectedRow !== p.id && p.accountId ? "text-[#0000ff] cursor-pointer hover:underline" : ""} onClick={(e) => selectedRow !== p.id && handleAccountClick(p, e)}>
            {p.accountName}
          </span>
        );
      case "opportunityName":
        return (
          <span className={selectedRow !== p.id && p.opportunityId ? "text-[#0000ff] cursor-pointer hover:underline" : ""} onClick={(e) => selectedRow !== p.id && handleOppClick(p, e)}>
            {p.opportunityName}
          </span>
        );
      case "title":
        return p.title || "";
      default:
        return (p as any)[field] || "";
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

      {/* Toolbar — No "New" button since proposals are created from Opportunities */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button onClick={handleEdit} disabled={!selectedRow} className={`w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] ${!selectedRow ? "opacity-50" : ""}`} title="Edit">
          <Pencil className="w-4 h-4" style={{ color: "#d4a574" }} />
        </button>
        <button onClick={fetchProposals} className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Refresh">
          <RefreshCw className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>

        <div className="ml-2 text-[10px] text-[#999] italic">Proposals are created from Opportunities</div>

        <div className="ml-4 flex items-center gap-2">
          <span className="text-[11px]">Search:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Title, opportunity, customer..."
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

      {/* Grid */}
      <div className="flex-1 bg-white border border-[#a0a0a0] mx-2 mb-2 flex flex-col overflow-hidden">
        <div className="flex bg-[#f0f0f0] border-b border-[#999] text-[12px] font-medium">
          {columns.map((col, index) => {
            if (!isFieldAllowed("proposals", col.field)) return null;
            return (
              <div
                key={col.field}
                className="relative flex items-center px-2 py-1.5 border-r border-[#c0c0c0] cursor-pointer hover:bg-[#e0e0e0] select-none"
                style={{ width: columnWidths[index], minWidth: columnWidths[index] }}
                onClick={() => handleSort(col.field)}
              >
                <div className={`flex items-center gap-1 ${col.field === "amount" ? "ml-auto" : ""}`}>
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

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-[#808080]">Loading...</div>
          ) : sorted.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">No proposals found</div>
          ) : (
            sorted.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedRow(p.id)}
                onDoubleClick={() => handleDoubleClick(p)}
                className={`flex text-[12px] cursor-pointer border-b border-[#e0e0e0] ${
                  selectedRow === p.id ? "bg-[#0078d4] text-white" : "bg-white hover:bg-[#f0f8ff]"
                }`}
              >
                {columns.map((col, index) => {
                  if (!isFieldAllowed("proposals", col.field)) return null;
                  return (
                    <div
                      key={col.field}
                      className={`px-2 py-1 border-r border-[#e0e0e0] truncate ${col.field === "amount" ? "text-right" : ""} ${col.field === "status" ? "text-center" : ""} ${col.field === "proposalNumber" ? "font-medium" : ""}`}
                      style={{ width: columnWidths[index], minWidth: columnWidths[index] }}
                    >
                      {getCellValue(p, col.field)}
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
              <span className="text-[#333]"><strong>Total:</strong> {formatCurrency(totals.amount)}</span>
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
