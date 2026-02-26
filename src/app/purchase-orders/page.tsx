"use client";

import { useState, useEffect } from "react";
import { useTabs } from "@/context/TabContext";
import { SavedFiltersDropdown } from "@/components/SavedFiltersDropdown";
import { useFilteredColumns } from "@/hooks/useFilteredColumns";
import {
  FileText,
  Pencil,
  Trash2,
  X,
  Filter,
  Scissors,
  Check,
  Printer,
  Grid3X3,
  Plus,
  Home,
  HelpCircle,
} from "lucide-react";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  desc: string; // Job/Account reference
  vendorId: string;
  vendorName: string;
  status: "Open" | "Partial D" | "Complete" | "Closed";
  approved: boolean;
  approvedDate: string | null;
  amount: number;
  jobId: string | null;
  premisesId: string | null;
}

interface NewPOForm {
  vendorId: string;
  vendorName: string;
  date: string;
  desc: string;
  jobId: string;
}

const columns = [
  { field: "poNumber", label: "PO #", width: 10, align: "left" as const },
  { field: "date", label: "Date", width: 10, align: "left" as const },
  { field: "desc", label: "Desc", width: 12, align: "left" as const },
  { field: "vendorName", label: "Vendor", width: 30, align: "left" as const },
  { field: "status", label: "Status", width: 10, align: "left" as const },
  { field: "approved", label: "Approved", width: 10, align: "left" as const },
  { field: "amount", label: "Amount", width: 12, align: "right" as const },
];

export default function PurchaseOrdersPage() {
  const { openTab } = useTabs();
  const { filteredColumns } = useFilteredColumns("purchase-orders", columns);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-01-31");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [filteredPOs, setFilteredPOs] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTotals1, setShowTotals1] = useState(false);
  const [showTotals2, setShowTotals2] = useState(false);
  const [showNewPODialog, setShowNewPODialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newPO, setNewPO] = useState<NewPOForm>({
    vendorId: "",
    vendorName: "",
    date: new Date().toISOString().split("T")[0],
    desc: "",
    jobId: "",
  });

  // Mock vendors for dropdown
  const vendors = [
    { id: "1", name: "REMS PLUS" },
    { id: "2", name: "CINTAS CORPORATION" },
    { id: "3", name: "GRAINGER" },
    { id: "4", name: "FERGUSON ENTERPRISES LLC" },
    { id: "5", name: "McMASTER-CARR SUPPLY CO." },
    { id: "6", name: "NOUVEAU ELEVATOR" },
  ];

  // Mock data matching the screenshot
  const mockPurchaseOrders: PurchaseOrder[] = [
    { id: "1", poNumber: "0", date: "2026-01-22", desc: "", vendorId: "1", vendorName: "", status: "Open", approved: false, approvedDate: null, amount: 0.00, jobId: null, premisesId: null },
    { id: "2", poNumber: "81178204", date: "2026-01-12", desc: "209583 - LIR", vendorId: "2", vendorName: "REMS PLUS", status: "Partial D", approved: false, approvedDate: null, amount: 2500.00, jobId: "209583", premisesId: "LIR" },
    { id: "3", poNumber: "81178745", date: "2026-01-16", desc: "9999 - MISC", vendorId: "3", vendorName: "CINTAS CORPORATION", status: "Partial D", approved: false, approvedDate: null, amount: 2830.85, jobId: "9999", premisesId: "MISC" },
    { id: "4", poNumber: "81178746", date: "2026-01-16", desc: "206982 - 14C", vendorId: "4", vendorName: "CLADDAGH ELECTRONICS LTD.", status: "Partial D", approved: false, approvedDate: null, amount: 920.00, jobId: "206982", premisesId: "14C" },
    { id: "5", poNumber: "81178747", date: "2026-01-16", desc: "9999 - MISC", vendorId: "5", vendorName: "PRINTECH", status: "Partial D", approved: false, approvedDate: null, amount: 76.21, jobId: "9999", premisesId: "MISC" },
    { id: "6", poNumber: "81178748", date: "2026-01-16", desc: "9999 - 2013 I", vendorId: "6", vendorName: "SMITHTOWN GENERAL TIRE", status: "Partial D", approved: false, approvedDate: null, amount: 1626.49, jobId: "9999", premisesId: "2013I" },
    { id: "7", poNumber: "81178749", date: "2026-01-16", desc: "9999 - 2015 I", vendorId: "6", vendorName: "SMITHTOWN GENERAL TIRE", status: "Partial D", approved: false, approvedDate: null, amount: 1676.52, jobId: "9999", premisesId: "2015I" },
    { id: "8", poNumber: "81178750", date: "2026-01-16", desc: "200580 - 15C", vendorId: "7", vendorName: "PRECISION ESCALATOR", status: "Partial D", approved: false, approvedDate: null, amount: 4065.00, jobId: "200580", premisesId: "15C" },
    { id: "9", poNumber: "81178751", date: "2026-01-16", desc: "9999 - MISC", vendorId: "8", vendorName: "HOTEL BEACON", status: "Partial D", approved: false, approvedDate: null, amount: 424.33, jobId: "9999", premisesId: "MISC" },
    { id: "10", poNumber: "81178942", date: "2026-01-16", desc: "209517 - 15C", vendorId: "8", vendorName: "HOTEL BEACON", status: "Partial D", approved: false, approvedDate: null, amount: 659.58, jobId: "209517", premisesId: "15C" },
    { id: "11", poNumber: "81179904", date: "2026-01-05", desc: "1129 - 300 C", vendorId: "9", vendorName: "McMASTER-CARR SUPPLY CO.", status: "Open", approved: false, approvedDate: null, amount: 127.30, jobId: "1129", premisesId: "300C" },
    { id: "12", poNumber: "81179938", date: "2026-01-06", desc: "195489 - SHI", vendorId: "10", vendorName: "BASS OIL & CHEMICALS LLC", status: "Open", approved: false, approvedDate: null, amount: 1.00, jobId: "195489", premisesId: "SHI" },
    { id: "13", poNumber: "81179970", date: "2026-01-08", desc: "209422 - ON", vendorId: "11", vendorName: "FERGUSON ENTERPRISES LLC", status: "Open", approved: false, approvedDate: null, amount: 292.52, jobId: "209422", premisesId: "ON" },
    { id: "14", poNumber: "81179971", date: "2026-01-08", desc: "165343 - 127", vendorId: "12", vendorName: "SCHMIT MACHINE INC.", status: "Open", approved: false, approvedDate: null, amount: 1.00, jobId: "165343", premisesId: "127" },
    { id: "15", poNumber: "81179972", date: "2026-01-08", desc: "169285 - 2-0", vendorId: "13", vendorName: "ACE WIRE AND CABLE CO.,", status: "Open", approved: false, approvedDate: null, amount: 250.32, jobId: "169285", premisesId: "2-0" },
    { id: "16", poNumber: "81180927", date: "2026-01-15", desc: "208414 - 55 I", vendorId: "14", vendorName: "GRAINGER", status: "Partial D", approved: false, approvedDate: null, amount: 507.72, jobId: "208414", premisesId: "55I" },
    { id: "17", poNumber: "81180928", date: "2026-01-15", desc: "200023 - 34C", vendorId: "15", vendorName: "MONITOR ELEVATOR PRODUCTS", status: "Partial D", approved: false, approvedDate: null, amount: 551.26, jobId: "200023", premisesId: "34C" },
    { id: "18", poNumber: "81181032", date: "2026-01-12", desc: "179953 - 118", vendorId: "16", vendorName: "HERBERT WOLF ENTERPRISES LLC", status: "Open", approved: false, approvedDate: null, amount: 274.80, jobId: "179953", premisesId: "118" },
    { id: "19", poNumber: "81181048", date: "2026-01-13", desc: "206269 - 11C", vendorId: "17", vendorName: "NOUVEAU ELEVATOR", status: "Open", approved: false, approvedDate: null, amount: 0.00, jobId: "206269", premisesId: "11C" },
    { id: "20", poNumber: "81181059", date: "2026-01-14", desc: "155667 - 63 I", vendorId: "17", vendorName: "NOUVEAU ELEVATOR", status: "Open", approved: false, approvedDate: null, amount: 0.00, jobId: "155667", premisesId: "63I" },
    { id: "21", poNumber: "81182220", date: "2026-01-14", desc: "194450 57 e", vendorId: "18", vendorName: "VANTAGE ELEVATION LLC", status: "Open", approved: false, approvedDate: null, amount: 248.00, jobId: "194450", premisesId: "57e" },
  ];

  useEffect(() => {
    setPurchaseOrders(mockPurchaseOrders);
    setFilteredPOs(mockPurchaseOrders);
    setSelectedPO(mockPurchaseOrders[0]);
    setLoading(false);
  }, []);

  // Filter by date range
  useEffect(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const filtered = purchaseOrders.filter(po => {
      const poDate = new Date(po.date);
      return poDate >= start && poDate <= end;
    });
    setFilteredPOs(filtered);
  }, [startDate, endDate, purchaseOrders]);

  const setDateRange = (range: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
      case "Day":
        start = today;
        end = today;
        break;
      case "Week":
        start = new Date(today.setDate(today.getDate() - today.getDay()));
        end = new Date(today.setDate(today.getDate() + 6));
        break;
      case "Month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "Quarter":
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        end = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        break;
      case "Year":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      case "All":
        start = new Date(2020, 0, 1);
        end = new Date(2030, 11, 31);
        break;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleRowClick = (po: PurchaseOrder) => {
    setSelectedPO(po);
  };

  const handleRowDoubleClick = (po: PurchaseOrder) => {
    openTab(`PO# ${po.poNumber}`, `/purchase-orders/${po.id}`);
  };

  // Calculate totals
  const calculateTotals = () => {
    const count = filteredPOs.length;
    const totalAmount = filteredPOs.reduce((sum, po) => sum + po.amount, 0);
    const approvedCount = filteredPOs.filter(po => po.approved).length;
    return { count, totalAmount, approvedCount };
  };

  const totals = calculateTotals();

  // New PO handlers
  const handleNewPO = () => {
    setNewPO({
      vendorId: "",
      vendorName: "",
      date: new Date().toISOString().split("T")[0],
      desc: "",
      jobId: "",
    });
    setShowNewPODialog(true);
  };

  const handleCreatePO = () => {
    if (!newPO.vendorId) {
      alert("Please select a vendor");
      return;
    }

    // Generate next PO number
    const maxPONum = Math.max(...purchaseOrders.map(po => parseInt(po.poNumber) || 0));
    const newPONumber = String(maxPONum + 1);

    const po: PurchaseOrder = {
      id: String(purchaseOrders.length + 1),
      poNumber: newPONumber,
      date: newPO.date,
      desc: newPO.desc,
      vendorId: newPO.vendorId,
      vendorName: newPO.vendorName,
      status: "Open",
      approved: false,
      approvedDate: null,
      amount: 0.00,
      jobId: newPO.jobId || null,
      premisesId: null,
    };

    setPurchaseOrders([...purchaseOrders, po]);
    setShowNewPODialog(false);
    setSelectedPO(po);

    // Open the new PO detail
    openTab(`PO# ${newPONumber}`, `/purchase-orders/${po.id}`);
  };

  // Edit handler
  const handleEditPO = () => {
    if (selectedPO) {
      openTab(`PO# ${selectedPO.poNumber}`, `/purchase-orders/${selectedPO.id}`);
    }
  };

  // Delete handler
  const handleDeletePO = () => {
    if (selectedPO) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (selectedPO) {
      const updated = purchaseOrders.filter(po => po.id !== selectedPO.id);
      setPurchaseOrders(updated);
      setSelectedPO(updated[0] || null);
      setShowDeleteConfirm(false);
    }
  };

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
        <button
          onClick={handleNewPO}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="New PO"
        >
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button
          onClick={handleEditPO}
          disabled={!selectedPO}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Edit PO"
        >
          <Pencil className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <button
          onClick={handleDeletePO}
          disabled={!selectedPO}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Delete PO"
        >
          <Trash2 className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <X className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Filter className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Scissors className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Check className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Check className="w-4 h-4" style={{ color: "#5cb85c" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Printer className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Grid3X3 className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[11px] font-bold" style={{ color: "#3498db" }}>Σ</span>
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Printer className="w-4 h-4" style={{ color: "#27ae60" }} />
        </button>
        <button
          onClick={handleNewPO}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="New PO"
        >
          <Plus className="w-4 h-4" style={{ color: "#27ae60" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Home className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white px-4 py-2 border-b border-[#d0d0d0] flex items-center gap-4">
        <SavedFiltersDropdown pageId="purchase-orders" onApply={() => {}} onClear={() => {}} />

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <label className="text-[12px]">Start</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-[#ffff00] w-[100px]"
          />
          <button className="px-1 border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px]">...</button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[12px]">End</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[100px]"
          />
          <button className="px-1 border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px]">...</button>
        </div>

        {/* Quick Date Buttons */}
        <div className="flex items-center gap-1">
          {["Day", "Week", "Month", "Quarter", "Year", "All"].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className="px-2 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              {filteredColumns.map((col) => (
                <th
                  key={col.field}
                  className={`px-2 py-1 text-${col.align} font-medium border border-[#c0c0c0]`}
                  style={{ width: `${col.width}%` }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPOs.map((po) => (
              <tr
                key={po.id}
                onClick={() => handleRowClick(po)}
                onDoubleClick={() => handleRowDoubleClick(po)}
                className={`cursor-pointer ${
                  selectedPO?.id === po.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"
                }`}
              >
                {filteredColumns.map((col) => {
                  let cellValue: React.ReactNode;
                  if (col.field === "date") cellValue = formatDate(po.date);
                  else if (col.field === "approved") cellValue = po.approved ? "Yes" : "";
                  else if (col.field === "amount") cellValue = formatCurrency(po.amount);
                  else cellValue = po[col.field as keyof PurchaseOrder] as string;
                  return (
                    <td
                      key={col.field}
                      className={`px-2 py-1 border border-[#e0e0e0] ${col.align === "right" ? "text-right" : ""}`}
                    >
                      {cellValue}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1 flex items-center text-[11px]">
        <span className="px-2">{selectedPO ? "1" : "0"}</span>
        <span className="flex-1" />
        <button
          onClick={() => setShowTotals1(!showTotals1)}
          className="px-2 border-l border-[#c0c0c0] hover:bg-[#e0e0e0] cursor-pointer"
        >
          {showTotals1 ? `${totals.count} POs` : "Totals Off"}
        </button>
        <button
          onClick={() => setShowTotals2(!showTotals2)}
          className="px-2 border-l border-[#c0c0c0] hover:bg-[#e0e0e0] cursor-pointer"
        >
          {showTotals2 ? formatCurrency(totals.totalAmount) : "Totals Off"}
        </button>
      </div>

      {/* New PO Dialog */}
      {showNewPODialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] border-2 border-[#808080] shadow-lg" style={{ minWidth: "400px" }}>
            {/* Dialog Title Bar */}
            <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">New Purchase Order</span>
              <button
                onClick={() => setShowNewPODialog(false)}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                ×
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Vendor</label>
                  <select
                    value={newPO.vendorId}
                    onChange={(e) => {
                      const vendor = vendors.find(v => v.id === e.target.value);
                      setNewPO({
                        ...newPO,
                        vendorId: e.target.value,
                        vendorName: vendor?.name || "",
                      });
                    }}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Date</label>
                  <input
                    type="date"
                    value={newPO.date}
                    onChange={(e) => setNewPO({ ...newPO, date: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Job #</label>
                  <input
                    type="text"
                    value={newPO.jobId}
                    onChange={(e) => setNewPO({ ...newPO, jobId: e.target.value })}
                    placeholder="Optional"
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Description</label>
                  <input
                    type="text"
                    value={newPO.desc}
                    onChange={(e) => setNewPO({ ...newPO, desc: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
              </div>

              {/* Dialog Buttons */}
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#808080]">
                <button
                  onClick={handleCreatePO}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  OK
                </button>
                <button
                  onClick={() => setShowNewPODialog(false)}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] border-2 border-[#808080] shadow-lg" style={{ minWidth: "300px" }}>
            {/* Dialog Title Bar */}
            <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">Confirm Delete</span>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                ×
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-4">
              <p className="text-[12px] mb-4">
                Are you sure you want to delete PO# {selectedPO.poNumber}?
              </p>

              {/* Dialog Buttons */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={confirmDelete}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
