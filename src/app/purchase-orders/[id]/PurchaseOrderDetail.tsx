"use client";

import { useState, useEffect, useCallback } from "react";
import { ActivityHistory } from "@/components/ActivityHistory";
import { useTabs } from "@/context/TabContext";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/UnsavedChangesDialog";
import { useXPDialog } from "@/components/ui/XPDialog";
import { validateRequiredFields } from "@/lib/detail-registry/validation";
import { useRequiredFields } from "@/hooks/useRequiredFields";
import {
  FileText,
  Save,
  Undo,
  Printer,
  Home,
  HelpCircle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  Plus,
  Trash2,
} from "lucide-react";

interface Vendor {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

interface GLItem {
  id: string;
  glAcct: string;
  quan: number;
  description: string;
  price: number;
  amount: number;
  ticket: string;
}

interface JobCostingItem {
  id: string;
  glAcct: string;
  quan: number;
  description: string;
  price: number;
  amount: number;
  jobNumber: string;
  phase: string;
  ticket: string;
}

interface InventoryItem {
  id: string;
  itemCode: string;
  quan: number;
  description: string;
  price: number;
  amount: number;
  partNumber: string;
  warehouse: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendor: Vendor;
  date: string;
  dueDate: string;
  terms: string;
  fob: string;
  status: string;
  shipVia: string;
  freight: number;
  createdBy: string;
  custom1: string;
  custom2: string;
  total: number;
  approved: boolean;
  shipToName: string;
  shipToAddress: string;
  shipToCity: string;
  shipToState: string;
  shipToZip: string;
  description: string;
  jobId: string | null;
  glItems: GLItem[];
  jobCostingItems: JobCostingItem[];
  inventoryItems: InventoryItem[];
}

interface PurchaseOrderDetailProps {
  poId: string;
  onClose: () => void;
}

// Mock job data for "Get Job Address"
const mockJobs: Record<string, { address: string; city: string; state: string; zip: string; name: string }> = {
  "209422": { name: "ONE DAG HAMMARSKJOLD", address: "1 Dag Hammarskjold Plaza", city: "New York", state: "NY", zip: "10017" },
  "209583": { name: "LIR Building", address: "123 Main Street", city: "Long Island City", state: "NY", zip: "11101" },
  "206982": { name: "14 Central Building", address: "14 Central Park West", city: "New York", state: "NY", zip: "10023" },
};

// Mock vendors
const mockVendors: Vendor[] = [
  { id: "11", name: "FERGUSON ENTERPRISES", address: "PO BOX 644054", city: "PITTSBURGH", state: "PA", zip: "15264-4054", phone: "(718) 832-7900" },
  { id: "1", name: "REMS PLUS", address: "100 Industrial Blvd", city: "Newark", state: "NJ", zip: "07102", phone: "(973) 555-1234" },
  { id: "2", name: "GRAINGER", address: "500 Commerce Way", city: "Lake Forest", state: "IL", zip: "60045", phone: "(800) 472-4643" },
  { id: "3", name: "NOUVEAU ELEVATOR", address: "47-55 37th Street", city: "Long Island City", state: "NY", zip: "11101", phone: "(718) 555-0000" },
];

export default function PurchaseOrderDetail({ poId, onClose }: PurchaseOrderDetailProps) {
  const { openTab } = useTabs();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const { layout: poLayout, fieldDefs: poFieldDefs, reqMark } = useRequiredFields("purchase-orders-detail");
  const [activeTab, setActiveTab] = useState<"detail" | "activity">("detail");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [printOnSave, setPrintOnSave] = useState(false);
  const [savingFromHook, setSavingFromHook] = useState(false);
  const [showNewVendorDialog, setShowNewVendorDialog] = useState(false);

  // PO State
  const [poNumber, setPONumber] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [date, setDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [terms, setTerms] = useState("Upon Receipt");
  const [fob, setFob] = useState("");
  const [status, setStatus] = useState("Open");
  const [shipVia, setShipVia] = useState("");
  const [freight, setFreight] = useState(0);
  const [createdBy, setCreatedBy] = useState("");
  const [custom1, setCustom1] = useState("");
  const [custom2, setCustom2] = useState("");
  const [approved, setApproved] = useState(false);
  const [shipToName, setShipToName] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [shipToCity, setShipToCity] = useState("");
  const [shipToState, setShipToState] = useState("");
  const [shipToZip, setShipToZip] = useState("");
  const [description, setDescription] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);

  const [glItems, setGLItems] = useState<GLItem[]>([]);
  const [jobCostingItems, setJobCostingItems] = useState<JobCostingItem[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Save callback for the unsaved changes hook
  const handleSaveForHook = useCallback(async () => {
    const formData: Record<string, any> = {
      poNumber, date, dueDate, terms, fob, status, shipVia, freight,
      createdBy, custom1, custom2, approved, description,
    };
    const missing = poLayout ? validateRequiredFields(poLayout, poFieldDefs, formData) : [];
    if (missing.length > 0) throw new Error(`Please fill in required fields: ${missing.join(", ")}`);
    setSavingFromHook(true);
    try {
      // In real app, this would save to API
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setSavingFromHook(false);
    }
  }, []);

  // Unsaved changes hook
  const {
    isDirty: hasChanges,
    setIsDirty: setHasChanges,
    markDirty,
    confirmNavigation,
    showDialog,
    handleDialogSave,
    handleDialogDiscard,
    handleDialogCancel,
  } = useUnsavedChanges({ onSave: handleSaveForHook });

  // Load mock data
  useEffect(() => {
    // Mock data
    const mockPO: PurchaseOrder = {
      id: "13",
      poNumber: "81179970",
      vendorId: "11",
      vendor: mockVendors[0],
      date: "2026-01-08",
      dueDate: "2026-02-08",
      terms: "Upon Receipt",
      fob: "",
      status: "Open",
      shipVia: "UPS",
      freight: 0.00,
      createdBy: "",
      custom1: "",
      custom2: "MOD",
      total: 292.52,
      approved: false,
      shipToName: "Nouveau Elevator Industries LLC",
      shipToAddress: "47-55 37th Street",
      shipToCity: "Long Island City",
      shipToState: "NY",
      shipToZip: "11101",
      description: "209422 - ONE DAG - MI",
      jobId: "209422",
      glItems: [
        { id: "1", glAcct: "", quan: 0.00, description: "", price: 0, amount: 0, ticket: "" },
      ],
      jobCostingItems: [
        { id: "1", glAcct: "4310-000", quan: 1.00, description: "VIC REDUCER,", price: 292.52, amount: 292.52, jobNumber: "209422", phase: "2", ticket: "0" },
      ],
      inventoryItems: [
        { id: "1", itemCode: "", quan: 0.00, description: "", price: 0, amount: 0.00, partNumber: "", warehouse: "" },
      ],
    };

    setPONumber(mockPO.poNumber);
    setVendorId(mockPO.vendorId);
    setVendor(mockPO.vendor);
    setDate(mockPO.date);
    setDueDate(mockPO.dueDate);
    setTerms(mockPO.terms);
    setFob(mockPO.fob);
    setStatus(mockPO.status);
    setShipVia(mockPO.shipVia);
    setFreight(mockPO.freight);
    setCreatedBy(mockPO.createdBy);
    setCustom1(mockPO.custom1);
    setCustom2(mockPO.custom2);
    setApproved(mockPO.approved);
    setShipToName(mockPO.shipToName);
    setShipToAddress(mockPO.shipToAddress);
    setShipToCity(mockPO.shipToCity);
    setShipToState(mockPO.shipToState);
    setShipToZip(mockPO.shipToZip);
    setDescription(mockPO.description);
    setJobId(mockPO.jobId);
    setGLItems(mockPO.glItems);
    setJobCostingItems(mockPO.jobCostingItems);
    setInventoryItems(mockPO.inventoryItems);

    setLoading(false);
  }, [poId]);

  const formatCurrency = (amount: number) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  // Calculate total from all items
  const calculateTotal = () => {
    const glTotal = glItems.reduce((sum, item) => sum + item.amount, 0);
    const jobTotal = jobCostingItems.reduce((sum, item) => sum + item.amount, 0);
    const invTotal = inventoryItems.reduce((sum, item) => sum + item.amount, 0);
    return glTotal + jobTotal + invTotal + freight;
  };

  const total = calculateTotal();
  const totalUnits = jobCostingItems.reduce((sum, item) => sum + item.quan, 0);

  // Handle vendor change
  const handleVendorChange = (newVendorId: string) => {
    const newVendor = mockVendors.find(v => v.id === newVendorId);
    if (newVendor) {
      setVendorId(newVendorId);
      setVendor(newVendor);
      setHasChanges(true);
    }
  };

  // Get Job Address
  const handleGetJobAddress = async () => {
    if (jobId && mockJobs[jobId]) {
      const job = mockJobs[jobId];
      setShipToName(job.name);
      setShipToAddress(job.address);
      setShipToCity(job.city);
      setShipToState(job.state);
      setShipToZip(job.zip);
      setHasChanges(true);
    } else {
      await xpAlert("No job associated with this PO or job address not found");
    }
  };

  // Navigate to Job
  const handleNavigateToJob = () => {
    if (jobId) {
      openTab(`Job ${jobId}`, `/job-maintenance/${jobId}`);
    }
  };

  // Navigate to Account
  const handleNavigateToAccount = () => {
    openTab("Account Detail", `/accounts/1`);
  };

  // Save handler
  const handleSave = async () => {
    const formData: Record<string, any> = {
      poNumber, date, dueDate, terms, fob, status, shipVia, freight,
      createdBy, custom1, custom2, approved, description,
    };
    const missing = poLayout ? validateRequiredFields(poLayout, poFieldDefs, formData) : [];
    if (missing.length > 0) {
      await xpAlert(`Please fill in required fields: ${missing.join(", ")}`);
      return;
    }
    setHasChanges(false);
    if (printOnSave) {
      await xpAlert("PO saved and sent to printer");
    } else {
      await xpAlert("PO saved successfully");
    }
  };

  // Undo handler
  const handleUndo = async () => {
    if (await xpConfirm("Discard all changes?")) {
      setHasChanges(false);
      // Would reload original data here
    }
  };

  // Close PO handler
  const handleClosePO = async () => {
    if (await xpConfirm("Close this Purchase Order?")) {
      setStatus("Closed");
      setHasChanges(true);
    }
  };

  // Add new GL item
  const handleAddGLItem = () => {
    const newItem: GLItem = {
      id: String(glItems.length + 1),
      glAcct: "",
      quan: 0,
      description: "",
      price: 0,
      amount: 0,
      ticket: "",
    };
    setGLItems([...glItems, newItem]);
    setHasChanges(true);
  };

  // Add new Job Costing item
  const handleAddJobCostingItem = () => {
    const newItem: JobCostingItem = {
      id: String(jobCostingItems.length + 1),
      glAcct: "",
      quan: 0,
      description: "",
      price: 0,
      amount: 0,
      jobNumber: jobId || "",
      phase: "",
      ticket: "",
    };
    setJobCostingItems([...jobCostingItems, newItem]);
    setHasChanges(true);
  };

  // Add new Inventory item
  const handleAddInventoryItem = () => {
    const newItem: InventoryItem = {
      id: String(inventoryItems.length + 1),
      itemCode: "",
      quan: 0,
      description: "",
      price: 0,
      amount: 0,
      partNumber: "",
      warehouse: "",
    };
    setInventoryItems([...inventoryItems, newItem]);
    setHasChanges(true);
  };

  // Update Job Costing item
  const updateJobCostingItem = (id: string, field: keyof JobCostingItem, value: string | number) => {
    setJobCostingItems(items => items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate amount if quan or price changed
        if (field === 'quan' || field === 'price') {
          updated.amount = updated.quan * updated.price;
        }
        return updated;
      }
      return item;
    }));
    setHasChanges(true);
  };

  // Update Inventory item
  const updateInventoryItem = (id: string, field: keyof InventoryItem, value: string | number) => {
    setInventoryItems(items => items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quan' || field === 'price') {
          updated.amount = updated.quan * updated.price;
        }
        return updated;
      }
      return item;
    }));
    setHasChanges(true);
  };

  // Delete Job Costing item
  const deleteJobCostingItem = (id: string) => {
    setJobCostingItems(items => items.filter(item => item.id !== id));
    setHasChanges(true);
  };

  // Delete Inventory item
  const deleteInventoryItem = (id: string) => {
    setInventoryItems(items => items.filter(item => item.id !== id));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-[12px]">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">PIM</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Move</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="New"
        >
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Save"
        >
          <Save className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button
          onClick={handleUndo}
          disabled={!hasChanges}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Undo"
        >
          <Undo className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[11px] font-bold text-red-500">✓</span>
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[10px]" style={{ color: "#e74c3c" }}>ABC</span>
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Print">
          <Printer className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Home className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        {/* Navigation */}
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="First">
          <ChevronsLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Previous">
          <ChevronLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Next">
          <ChevronRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Last">
          <ChevronsRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button
          onClick={() => confirmNavigation(() => onClose())}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="Close"
        >
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <label className="flex items-center gap-1 text-[11px] ml-2">
          <input
            type="checkbox"
            checked={printOnSave}
            onChange={(e) => setPrintOnSave(e.target.checked)}
            className="w-3 h-3"
          />
          Print PO on Save
        </label>
      </div>

      {/* Tab Bar */}
      <div className="bg-white flex items-end px-2 pt-1 border-b border-[#d0d0d0]">
        {(["Detail", "Field History"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab === "Detail" ? "detail" : "activity")}
            className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
              (tab === "Detail" ? "detail" : "activity") === activeTab
                ? "bg-white border-[#a0a0a0] border-b-white z-10 font-medium"
                : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "detail" && (<>
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-2">
        {/* Header Section */}
        <div className="bg-white border border-[#808080] p-3 mb-2">
          <div className="flex gap-4">
            {/* Left - Vendor Info */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <select
                  value={vendorId}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white min-w-[180px]"
                >
                  {mockVendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <button className="px-1 border border-[#7f9db9] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px]">...</button>
                <span
                  className="text-[#0000ff] text-[12px] cursor-pointer hover:underline font-medium"
                  onClick={() => setShowNewVendorDialog(true)}
                >
                  New
                </span>
              </div>
              {vendor && (
                <div className="border border-[#7f9db9] bg-white p-2 min-w-[200px] text-[12px]">
                  <div>{vendor.address}</div>
                  <div>{vendor.city}, {vendor.state}</div>
                  <div>{vendor.zip}</div>
                  <div className="mt-1">{vendor.phone}</div>
                </div>
              )}
            </div>

            {/* Middle - Dates and Terms */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="w-16 text-[12px]">Date{reqMark("date")}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[100px]"
                />
                <button className="px-1 border border-[#7f9db9] bg-[#f0f0f0] text-[12px]">...</button>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-16 text-[12px]">Due{reqMark("dueDate")}</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => { setDueDate(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[100px]"
                />
                <button className="px-1 border border-[#7f9db9] bg-[#f0f0f0] text-[12px]">...</button>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-16 text-[12px]">Terms{reqMark("terms")}</label>
                <select
                  value={terms}
                  onChange={(e) => { setTerms(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-[#ffff00] w-[110px]"
                >
                  <option value="Upon Receipt">Upon Receipt</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Net 90">Net 90</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="w-16 text-[12px]">FOB{reqMark("fob")}</label>
                <input
                  type="text"
                  value={fob}
                  onChange={(e) => { setFob(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[110px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-16 text-[12px]">Status{reqMark("status")}</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-[#ffff00] w-[110px]"
                >
                  <option value="Open">Open</option>
                  <option value="Partial D">Partial D</option>
                  <option value="Complete">Complete</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Middle-Right - Ship Via, Freight, etc */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Ship Via{reqMark("shipVia")}</label>
                <input
                  type="text"
                  value={shipVia}
                  onChange={(e) => { setShipVia(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[80px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Freight{reqMark("freight")}</label>
                <input
                  type="number"
                  value={freight}
                  onChange={(e) => { setFreight(parseFloat(e.target.value) || 0); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[80px] text-right"
                  step="0.01"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Created By{reqMark("createdBy")}</label>
                <input
                  type="text"
                  value={createdBy}
                  onChange={(e) => { setCreatedBy(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[80px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Custom1{reqMark("custom1")}</label>
                <input
                  type="text"
                  value={custom1}
                  onChange={(e) => { setCustom1(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[80px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Custom2{reqMark("custom2")}</label>
                <input
                  type="text"
                  value={custom2}
                  onChange={(e) => { setCustom2(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[80px]"
                />
              </div>
            </div>

            {/* Right - PO # and Total */}
            <div className="flex flex-col gap-2 ml-auto">
              <div className="flex flex-col items-end">
                <label className="text-[12px]">PO #{reqMark("poNumber")}</label>
                <div className="bg-[#000080] text-white px-3 py-1 text-[14px] font-bold min-w-[80px] text-center">
                  {poNumber}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <label className="text-[12px]">Total{reqMark("total")}</label>
                <input
                  type="text"
                  value={formatCurrency(total)}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-[#e0e0e0] w-[80px] text-right"
                  readOnly
                />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(e) => { setApproved(e.target.checked); setHasChanges(true); }}
                  className="w-4 h-4"
                  id="approved-checkbox"
                />
                <label htmlFor="approved-checkbox" className="text-[12px] cursor-pointer">Approved{reqMark("approved")}</label>
              </div>
            </div>
          </div>
        </div>

        {/* Ship To Section */}
        <div className="flex gap-4 mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-1">
              <span className="text-[12px] font-medium">Ship To</span>
              <span
                className="text-[#0000ff] text-[12px] cursor-pointer hover:underline font-medium"
                onClick={handleGetJobAddress}
              >
                Get Job Address
              </span>
            </div>
            <div className="border border-[#7f9db9] bg-white p-2 text-[12px] min-h-[60px]">
              <input
                type="text"
                value={shipToName}
                onChange={(e) => { setShipToName(e.target.value); setHasChanges(true); }}
                placeholder="Name"
                className="w-full border-none outline-none bg-transparent"
              />
              <input
                type="text"
                value={shipToAddress}
                onChange={(e) => { setShipToAddress(e.target.value); setHasChanges(true); }}
                placeholder="Address"
                className="w-full border-none outline-none bg-transparent"
              />
              <div className="flex gap-1">
                <input
                  type="text"
                  value={shipToCity}
                  onChange={(e) => { setShipToCity(e.target.value); setHasChanges(true); }}
                  placeholder="City"
                  className="flex-1 border-none outline-none bg-transparent"
                />
                <input
                  type="text"
                  value={shipToState}
                  onChange={(e) => { setShipToState(e.target.value); setHasChanges(true); }}
                  placeholder="ST"
                  className="w-[30px] border-none outline-none bg-transparent"
                />
                <input
                  type="text"
                  value={shipToZip}
                  onChange={(e) => { setShipToZip(e.target.value); setHasChanges(true); }}
                  placeholder="Zip"
                  className="w-[60px] border-none outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[12px] font-medium">Description{reqMark("description")}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setHasChanges(true); }}
              className="w-full px-2 py-1 border border-[#7f9db9] text-[12px] bg-white mt-1"
            />
          </div>
          <div>
            <button
              onClick={handleClosePO}
              className="px-4 py-2 border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px] mt-4"
            >
              Close PO
            </button>
          </div>
        </div>

        {/* GL Items Section */}
        <div className="mb-2">
          <div className="flex items-center gap-4 mb-1">
            <span className="text-[12px] font-medium">GL Items (No job cost or inventory)</span>
            <span
              className="text-[#0000ff] text-[12px] cursor-pointer hover:underline font-medium"
              onClick={handleAddGLItem}
            >
              Add
            </span>
          </div>
          <div className="border border-[#808080] bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-[#f0f0f0]">
                <tr>
                  <th className="w-6 border border-[#c0c0c0]"></th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">GL Acct</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "60px" }}>Quan</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Description</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "70px" }}>Price</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "80px" }}>Amount</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "60px" }}>Ticket</th>
                </tr>
              </thead>
              <tbody>
                {glItems.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-[#e0e0e0] text-center">▶</td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">{item.glAcct}</td>
                    <td className="px-2 py-1 text-right border border-[#e0e0e0]">{item.quan.toFixed(2)}</td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">{item.description}</td>
                    <td className="px-2 py-1 text-right border border-[#e0e0e0]">{item.price}</td>
                    <td className="px-2 py-1 text-right border border-[#e0e0e0]">{item.amount}</td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">{item.ticket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Job Costing Items Section */}
        <div className="mb-2">
          <div className="flex items-center gap-4 mb-1">
            <span className="text-[12px] font-medium">Job Costing Items</span>
            <span
              className="text-[#0000ff] text-[12px] cursor-pointer hover:underline font-medium"
              onClick={handleAddJobCostingItem}
            >
              Add
            </span>
            <span
              className="text-[#0000ff] text-[12px] cursor-pointer hover:underline font-medium"
              onClick={handleNavigateToJob}
            >
              Job
            </span>
            <span
              className="text-[#0000ff] text-[12px] cursor-pointer hover:underline font-medium"
              onClick={handleNavigateToAccount}
            >
              Acct
            </span>
          </div>
          <div className="border border-[#808080] bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-[#f0f0f0]">
                <tr>
                  <th className="w-6 border border-[#c0c0c0]"></th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">GL Acct</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "60px" }}>Quan</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Description</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "70px" }}>Price</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "80px" }}>Amount</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "70px" }}>Job #</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "50px" }}>Phase</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "50px" }}>Ticket</th>
                  <th className="w-6 border border-[#c0c0c0]"></th>
                </tr>
              </thead>
              <tbody>
                {jobCostingItems.map((item) => (
                  <tr key={item.id} className="bg-[#ffff00]">
                    <td className="border border-[#e0e0e0] text-center">▶</td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.glAcct}
                        onChange={(e) => updateJobCostingItem(item.id, 'glAcct', e.target.value)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px]"
                      />
                    </td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="number"
                        value={item.quan}
                        onChange={(e) => updateJobCostingItem(item.id, 'quan', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px] text-right"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateJobCostingItem(item.id, 'description', e.target.value)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px]"
                      />
                    </td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateJobCostingItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px] text-right"
                        step="0.01"
                      />
                    </td>
                    <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(item.amount)}</td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.jobNumber}
                        onChange={(e) => updateJobCostingItem(item.id, 'jobNumber', e.target.value)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px]"
                      />
                    </td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.phase}
                        onChange={(e) => updateJobCostingItem(item.id, 'phase', e.target.value)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px]"
                      />
                    </td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.ticket}
                        onChange={(e) => updateJobCostingItem(item.id, 'ticket', e.target.value)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px]"
                      />
                    </td>
                    <td className="border border-[#e0e0e0] text-center">
                      <button
                        onClick={() => deleteJobCostingItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Items Section */}
        <div className="mb-2">
          <div className="flex items-center gap-4 mb-1">
            <span className="text-[12px] font-medium">Inventory Items</span>
            <span
              className="text-[#0000ff] text-[12px] cursor-pointer hover:underline font-medium"
              onClick={handleAddInventoryItem}
            >
              New
            </span>
          </div>
          <div className="border border-[#808080] bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-[#f0f0f0]">
                <tr>
                  <th className="w-6 border border-[#c0c0c0]"></th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Item Code</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "60px" }}>Quan</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Description</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "70px" }}>Price</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "80px" }}>Amount</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "70px" }}>Part #</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "80px" }}>Warehouse</th>
                  <th className="w-6 border border-[#c0c0c0]"></th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-[#e0e0e0] text-center">▶</td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.itemCode}
                        onChange={(e) => updateInventoryItem(item.id, 'itemCode', e.target.value)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px]"
                      />
                    </td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="number"
                        value={item.quan}
                        onChange={(e) => updateInventoryItem(item.id, 'quan', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px] text-right"
                        step="0.01"
                      />
                    </td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateInventoryItem(item.id, 'description', e.target.value)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px]"
                      />
                    </td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateInventoryItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px] text-right"
                        step="0.01"
                      />
                    </td>
                    <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(item.amount)}</td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.partNumber}
                        onChange={(e) => updateInventoryItem(item.id, 'partNumber', e.target.value)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px]"
                      />
                    </td>
                    <td className="border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.warehouse}
                        onChange={(e) => updateInventoryItem(item.id, 'warehouse', e.target.value)}
                        className="w-full px-1 py-0 bg-transparent border-none text-[12px]"
                      />
                    </td>
                    <td className="border border-[#e0e0e0] text-center">
                      <button
                        onClick={() => deleteInventoryItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#808080] px-2 py-1 flex items-center text-[11px]">
        <span className="px-2 border-r border-[#808080] font-medium">{editMode ? "EDIT" : "VIEW"}</span>
        <span className="px-2 border-r border-[#808080]">{hasChanges ? "Modified" : ""}</span>
        <span className="flex-1" />
        <span className="px-2 border-l border-[#808080]">{totalUnits} Units, {formatCurrency(total)} total</span>
      </div>
      </>)}

      {activeTab === "activity" && (
        <div className="flex-1 overflow-auto">
          {poId && poId !== "new" && <ActivityHistory entityType="Purchase Order" entityId={poId} />}
        </div>
      )}

      {/* New Vendor Dialog */}
      {showNewVendorDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] border-2 border-[#808080] shadow-lg" style={{ minWidth: "300px" }}>
            <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">New Vendor</span>
              <button
                onClick={() => setShowNewVendorDialog(false)}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <p className="text-[12px] mb-4">
                This will open the Vendor Maintenance screen to create a new vendor.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowNewVendorDialog(false);
                    openTab("New Vendor", "/vendors/new");
                  }}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  OK
                </button>
                <button
                  onClick={() => setShowNewVendorDialog(false)}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showDialog}
        onSave={handleDialogSave}
        onDiscard={handleDialogDiscard}
        onCancel={handleDialogCancel}
        saving={savingFromHook}
      />
      <XPDialogComponent />
    </div>
  );
}
