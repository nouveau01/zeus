"use client";

import { useState, useEffect } from "react";
import { useTabs } from "@/context/TabContext";
import { useXPDialog } from "@/components/ui/XPDialog";
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
  Trash2,
} from "lucide-react";

interface GLItem {
  id: string;
  type: string;
  account: string;
  desc: string;
  amount: number;
  useTax: boolean;
}

interface JobCostingItem {
  id: string;
  account: string;
  job: string;
  phase: string;
  desc: string;
  amount: number;
  useTax: boolean;
}

interface InventoryItem {
  id: string;
  item: string;
  quan: number;
  desc: string;
  price: number;
  amount: number;
  useTax: boolean;
}

interface JournalEntryDetailProps {
  entryId: string;
  onClose: () => void;
}

const mockVendors = [
  { id: "1", name: "GLEASON PAINTS" },
  { id: "2", name: "MIDTOWN ELECTRIC SUPPLY" },
  { id: "3", name: "WAYLAND LLC" },
  { id: "4", name: "GRAINGER" },
  { id: "5", name: "WESCO DISTRIBUTION INC." },
];

export default function JournalEntryDetail({ entryId, onClose }: JournalEntryDetailProps) {
  const { openTab } = useTabs();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  // Header fields
  const [vendorId, setVendorId] = useState("1");
  const [vendorName, setVendorName] = useState("GLEASON PAINTS");
  const [refNumber, setRefNumber] = useState("180662/1");
  const [postingDate, setPostingDate] = useState("2026-01-21");
  const [date, setDate] = useState("2026-01-02");
  const [dueDate, setDueDate] = useState("2026-01-21");
  const [dueIn, setDueIn] = useState(19);
  const [discPercent, setDiscPercent] = useState(0.00);
  const [ifPaidIn, setIfPaidIn] = useState(30);
  const [status, setStatus] = useState("Verified");
  const [poNumber, setPONumber] = useState("81179893");
  const [custom1, setCustom1] = useState("");
  const [custom2, setCustom2] = useState("MOD");
  const [description, setDescription] = useState("195489 - MAINTENANCE STOCK - IW");

  // Line items
  const [glItems, setGLItems] = useState<GLItem[]>([]);
  const [jobCostingItems, setJobCostingItems] = useState<JobCostingItem[]>([
    { id: "1", account: "4310-000", job: "195489", phase: "2", desc: "24 PCS BLACK TUBE SILICONE", amount: 239.76, useTax: false },
  ]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    // Load mock data based on entryId
    setLoading(false);
  }, [entryId]);

  // Calculate totals
  const glTotal = glItems.reduce((sum, item) => sum + item.amount, 0);
  const jobTotal = jobCostingItems.reduce((sum, item) => sum + item.amount, 0);
  const invTotal = inventoryItems.reduce((sum, item) => sum + item.amount, 0);
  const total = glTotal + jobTotal + invTotal;

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Handlers
  const handleSave = async () => {
    setHasChanges(false);
    await xpAlert("AP Invoice saved successfully");
  };

  const handleUndo = async () => {
    if (await xpConfirm("Discard all changes?")) {
      setHasChanges(false);
    }
  };

  const handleVendorChange = (id: string) => {
    const vendor = mockVendors.find(v => v.id === id);
    if (vendor) {
      setVendorId(id);
      setVendorName(vendor.name);
      setHasChanges(true);
    }
  };

  // Navigate to PO
  const handleNavigateToPO = () => {
    if (poNumber && poNumber !== "0") {
      openTab(`PO# ${poNumber}`, `/purchase-orders/${poNumber}`);
    }
  };

  // Navigate to Job
  const handleNavigateToJob = () => {
    if (jobCostingItems.length > 0) {
      const jobNum = jobCostingItems[0].job;
      openTab(`Job ${jobNum}`, `/job-maintenance/${jobNum}`);
    }
  };

  // Navigate to Account
  const handleNavigateToAccount = () => {
    openTab("Account", `/accounts/1`);
  };

  // Add GL Item
  const handleAddGLItem = () => {
    const newItem: GLItem = {
      id: String(Date.now()),
      type: "",
      account: "",
      desc: "",
      amount: 0,
      useTax: false,
    };
    setGLItems([...glItems, newItem]);
    setHasChanges(true);
  };

  // Add Job Costing Item
  const handleAddJobCostingItem = () => {
    const newItem: JobCostingItem = {
      id: String(Date.now()),
      account: "",
      job: "",
      phase: "",
      desc: "",
      amount: 0,
      useTax: false,
    };
    setJobCostingItems([...jobCostingItems, newItem]);
    setHasChanges(true);
  };

  // Add Inventory Item
  const handleAddInventoryItem = () => {
    const newItem: InventoryItem = {
      id: String(Date.now()),
      item: "",
      quan: 0,
      desc: "",
      price: 0,
      amount: 0,
      useTax: false,
    };
    setInventoryItems([...inventoryItems, newItem]);
    setHasChanges(true);
  };

  // Update Job Costing Item
  const updateJobCostingItem = (id: string, field: keyof JobCostingItem, value: string | number | boolean) => {
    setJobCostingItems(items => items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
    setHasChanges(true);
  };

  // Update Inventory Item
  const updateInventoryItem = (id: string, field: keyof InventoryItem, value: string | number | boolean) => {
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

  // Delete handlers
  const deleteGLItem = (id: string) => {
    setGLItems(items => items.filter(item => item.id !== id));
    setHasChanges(true);
  };

  const deleteJobCostingItem = (id: string) => {
    setJobCostingItems(items => items.filter(item => item.id !== id));
    setHasChanges(true);
  };

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
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="New">
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
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Printer className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[11px] font-bold text-red-500">✓</span>
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[10px]" style={{ color: "#e74c3c" }}>ABC</span>
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Home className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="px-3 py-1 text-[11px] border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
          Quick Check
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
          onClick={onClose}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="Close"
        >
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-2">
        {/* Header Section */}
        <div className="bg-white border border-[#808080] p-3 mb-2">
          <div className="flex gap-6">
            {/* Left Column - Vendor and Ref */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="text-[#0000ff] text-[12px] font-medium w-14">Vendor</label>
                <select
                  value={vendorId}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[160px]"
                >
                  {mockVendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <button className="px-1 border border-[#7f9db9] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px]">...</button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[12px] w-14">Ref #</label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => { setRefNumber(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[160px]"
                />
              </div>
            </div>

            {/* Middle Column - Dates */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="text-[12px] w-14">Posting</label>
                <input
                  type="date"
                  value={postingDate}
                  onChange={(e) => { setPostingDate(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[100px]"
                />
                <button className="px-1 border border-[#7f9db9] bg-[#f0f0f0] text-[12px]">...</button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[12px] w-14">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[100px]"
                />
                <button className="px-1 border border-[#7f9db9] bg-[#f0f0f0] text-[12px]">...</button>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[12px] w-14">Due</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => { setDueDate(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[100px]"
                />
                <button className="px-1 border border-[#7f9db9] bg-[#f0f0f0] text-[12px]">...</button>
              </div>
            </div>

            {/* Middle-Right Column - Due In, Disc, etc */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="text-[12px] w-16">Due In</label>
                <input
                  type="number"
                  value={dueIn}
                  onChange={(e) => { setDueIn(parseInt(e.target.value) || 0); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[50px] text-right"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[12px] w-16">% Disc</label>
                <input
                  type="number"
                  value={discPercent}
                  onChange={(e) => { setDiscPercent(parseFloat(e.target.value) || 0); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[50px] text-right"
                  step="0.01"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[12px] w-16">If Paid In</label>
                <input
                  type="number"
                  value={ifPaidIn}
                  onChange={(e) => { setIfPaidIn(parseInt(e.target.value) || 0); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[50px] text-right"
                />
              </div>
            </div>

            {/* Right Column - Status, PO, Custom */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <label className="text-[12px] w-14">Status</label>
                <select
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[90px]"
                >
                  <option value="Verified">Verified</option>
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                  <option value="Void">Void</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-[#0000ff] text-[12px] font-bold w-14 cursor-pointer hover:underline"
                  onClick={handleNavigateToPO}
                >
                  PO #
                </span>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => { setPONumber(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[90px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[12px] w-14">Custom1</label>
                <input
                  type="text"
                  value={custom1}
                  onChange={(e) => { setCustom1(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[90px]"
                />
              </div>
            </div>

            {/* Far Right - Total and Custom2 */}
            <div className="flex flex-col gap-2 ml-auto">
              <div className="flex items-center gap-2">
                <label className="text-[12px]">Custom2</label>
                <input
                  type="text"
                  value={custom2}
                  onChange={(e) => { setCustom2(e.target.value); setHasChanges(true); }}
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-white w-[70px]"
                />
              </div>
              <div className="bg-[#808080] text-white px-3 py-1 text-center">
                <div className="text-[11px] font-bold">TOTAL</div>
                <div className="text-[14px] font-bold">{formatCurrency(total)}</div>
              </div>
              <div className="text-right">
                <input
                  type="text"
                  value="$0.00"
                  readOnly
                  className="px-2 py-1 border border-[#7f9db9] text-[12px] bg-[#e0e0e0] w-[70px] text-right"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-2">
          <label className="text-[12px]">Description</label>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setHasChanges(true); }}
            className="w-full px-2 py-1 border border-[#7f9db9] text-[12px] bg-[#0000ff] text-white h-12 resize-none mt-1"
          />
        </div>

        {/* GL Items Section */}
        <div className="mb-2">
          <label className="text-[12px] font-medium">GL Items (No job cost or inventory)</label>
          <div className="border border-[#808080] bg-white mt-1">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-[#f0f0f0]">
                <tr>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Type</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "20%" }}>Account</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Desc</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Amount</th>
                  <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Use Tax</th>
                </tr>
              </thead>
              <tbody>
                {glItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input type="text" value={item.type} className="w-full border-none text-[12px]" />
                    </td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input type="text" value={item.account} className="w-full border-none text-[12px]" />
                    </td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input type="text" value={item.desc} className="w-full border-none text-[12px]" />
                    </td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input type="number" value={item.amount} className="w-full border-none text-[12px] text-right" />
                    </td>
                    <td className="px-2 py-1 border border-[#e0e0e0] text-center">
                      <input type="checkbox" checked={item.useTax} />
                    </td>
                  </tr>
                ))}
                {glItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-2 py-8 border border-[#e0e0e0]"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Job Costing Items Section */}
        <div className="mb-2">
          <div className="flex items-center gap-4 mb-1">
            <label className="text-[12px] font-medium">Job Costing Items</label>
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
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Account</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Job</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Phase</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Desc</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Amount</th>
                  <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Use Tax</th>
                </tr>
              </thead>
              <tbody>
                {jobCostingItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.account}
                        onChange={(e) => updateJobCostingItem(item.id, 'account', e.target.value)}
                        className="w-full border-none text-[12px]"
                      />
                    </td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.job}
                        onChange={(e) => updateJobCostingItem(item.id, 'job', e.target.value)}
                        className="w-full border-none text-[12px]"
                      />
                    </td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.phase}
                        onChange={(e) => updateJobCostingItem(item.id, 'phase', e.target.value)}
                        className="w-full border-none text-[12px]"
                      />
                    </td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.desc}
                        onChange={(e) => updateJobCostingItem(item.id, 'desc', e.target.value)}
                        className="w-full border-none text-[12px]"
                      />
                    </td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateJobCostingItem(item.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full border-none text-[12px] text-right"
                        step="0.01"
                      />
                    </td>
                    <td className="px-2 py-1 border border-[#e0e0e0] text-center">
                      <input
                        type="checkbox"
                        checked={item.useTax}
                        onChange={(e) => updateJobCostingItem(item.id, 'useTax', e.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
                {jobCostingItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-8 border border-[#e0e0e0]"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inventory Items Section */}
        <div className="mb-2">
          <div className="flex items-center gap-4 mb-1">
            <label className="text-[12px] font-medium">Inventory Items</label>
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
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Item</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Quan</th>
                  <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Desc</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Price</th>
                  <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Amount</th>
                  <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Use Tax</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.item}
                        onChange={(e) => updateInventoryItem(item.id, 'item', e.target.value)}
                        className="w-full border-none text-[12px]"
                      />
                    </td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input
                        type="number"
                        value={item.quan}
                        onChange={(e) => updateInventoryItem(item.id, 'quan', parseFloat(e.target.value) || 0)}
                        className="w-full border-none text-[12px] text-right"
                      />
                    </td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input
                        type="text"
                        value={item.desc}
                        onChange={(e) => updateInventoryItem(item.id, 'desc', e.target.value)}
                        className="w-full border-none text-[12px]"
                      />
                    </td>
                    <td className="px-2 py-1 border border-[#e0e0e0]">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateInventoryItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full border-none text-[12px] text-right"
                        step="0.01"
                      />
                    </td>
                    <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(item.amount)}</td>
                    <td className="px-2 py-1 border border-[#e0e0e0] text-center">
                      <input
                        type="checkbox"
                        checked={item.useTax}
                        onChange={(e) => updateInventoryItem(item.id, 'useTax', e.target.checked)}
                      />
                    </td>
                  </tr>
                ))}
                {inventoryItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-8 border border-[#e0e0e0]"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#808080] px-2 py-1 flex items-center text-[11px]">
        <span className="px-2 border-r border-[#808080] font-medium">{editMode ? "EDIT" : "VIEW"}</span>
        <span className="flex-1" />
        <span className="px-4 border-l border-[#808080]">{formatCurrency(glTotal)}</span>
        <span className="px-4 border-l border-[#808080]">{formatCurrency(jobTotal)}</span>
        <span className="px-4 border-l border-[#808080]">{formatCurrency(invTotal)}</span>
      </div>
      <XPDialogComponent />
    </div>
  );
}
