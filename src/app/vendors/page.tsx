"use client";

import { useState, useEffect } from "react";
import { useTabs } from "@/context/TabContext";
import {
  FileText,
  Pencil,
  Trash2,
  X,
  Filter,
  Scissors,
  Copy,
  Check,
  DollarSign,
  Printer,
  BarChart3,
  Grid3X3,
  Plus,
  Home,
  HelpCircle,
} from "lucide-react";

interface Vendor {
  id: string;
  vendorId: string;
  name: string;
  status: "Active" | "Inactive";
  type: "Cost of Sales" | "Overhead";
  balance: number;
  catalogue: string | null;
}

const TABS = ["All", "Cost of Sales", "Overhead"];

export default function VendorsPage() {
  const { openTab } = useTabs();
  const [activeTab, setActiveTab] = useState("All");
  const [catalogue, setCatalogue] = useState("None");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTotals1, setShowTotals1] = useState(false);
  const [showTotals2, setShowTotals2] = useState(false);
  const [showNewVendorDialog, setShowNewVendorDialog] = useState(false);
  const [newVendor, setNewVendor] = useState({
    vendorId: "",
    name: "",
    status: "Active" as "Active" | "Inactive",
    type: "Cost of Sales" as "Cost of Sales" | "Overhead",
  });

  // Mock data
  const mockVendors: Vendor[] = [
    { id: "1", vendorId: "#1SCP", name: "#1 SCREEM PRINTING0", status: "Inactive", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "2", vendorId: "@ROAD", name: "@ROAD", status: "Inactive", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "3", vendorId: "VISIONWIRE", name: "1 VISION WIRELESS INC.", status: "Inactive", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "4", vendorId: "1000BULB", name: "1000 BULBS", status: "Inactive", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "5", vendorId: "101WE", name: "101 WEST 24TH CONDO.", status: "Inactive", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "6", vendorId: "1035M", name: "1035 MANHATTAN AVE LLC", status: "Active", type: "Cost of Sales", balance: 150.00, catalogue: null },
    { id: "7", vendorId: "108CH", name: "108 CHURCH ST. (BORAIE REALTY)", status: "Inactive", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "8", vendorId: "116W6", name: "116 EAST 66TH ST. CORP.", status: "Inactive", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "9", vendorId: "122BG", name: "122B GREENWICH LLC", status: "Active", type: "Cost of Sales", balance: 500.00, catalogue: null },
    { id: "10", vendorId: "125MA", name: "125 MAIDEN EQUITIES LLC", status: "Inactive", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "11", vendorId: "14PLU", name: "14 PLUS FOUNDATION INC.", status: "Active", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "12", vendorId: "14111C", name: "1411 1C SIC PROP.LLC", status: "Active", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "13", vendorId: "150EA", name: "150 EAST TENANTS CORP.", status: "Inactive", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "14", vendorId: "169AV", name: "169 AVENUE A EQUIETIES", status: "Inactive", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "15", vendorId: "1STPE", name: "1ST PERFORMANCE MARINA", status: "Active", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "16", vendorId: "2BLST", name: "2 BLEEKER STREET CONDO", status: "Active", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "17", vendorId: "2PHILS", name: "2 PHIL'S AUTO REPAIR SHOP", status: "Active", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "18", vendorId: "200PA", name: "200 PARK AVE CHILDREN S", status: "Active", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "19", vendorId: "2000A", name: "2000 AUTO SALES INC.", status: "Active", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "20", vendorId: "202HI", name: "2022 HISTORY MAKERS GALA", status: "Active", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "21", vendorId: "2023H", name: "2023 HISTORY MAKERS GALA", status: "Active", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "22", vendorId: "2190B", name: "2190 BOSTON OWNERS INC.", status: "Active", type: "Cost of Sales", balance: 0.00, catalogue: null },
    { id: "23", vendorId: "UTIL01", name: "CON EDISON", status: "Active", type: "Overhead", balance: 1250.00, catalogue: null },
    { id: "24", vendorId: "UTIL02", name: "NATIONAL GRID", status: "Active", type: "Overhead", balance: 890.00, catalogue: null },
    { id: "25", vendorId: "INSUR1", name: "STATE FARM INSURANCE", status: "Active", type: "Overhead", balance: 0.00, catalogue: null },
  ];

  useEffect(() => {
    setVendors(mockVendors);
    setFilteredVendors(mockVendors);
    setSelectedVendor(mockVendors[0]);
    setLoading(false);
  }, []);

  // Filter vendors when tab changes
  useEffect(() => {
    let filtered = vendors;

    if (activeTab !== "All") {
      filtered = vendors.filter(v => v.type === activeTab);
    }

    setFilteredVendors(filtered);
    if (filtered.length > 0 && (!selectedVendor || !filtered.find(v => v.id === selectedVendor.id))) {
      setSelectedVendor(filtered[0]);
    }
  }, [activeTab, vendors, selectedVendor]);

  // Calculate totals
  const totals = {
    count: filteredVendors.length,
    activeCount: filteredVendors.filter(v => v.status === "Active").length,
    totalBalance: filteredVendors.reduce((sum, v) => sum + v.balance, 0),
  };

  const formatCurrency = (amount: number) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  const handleRowClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
  };

  const handleRowDoubleClick = (vendor: Vendor) => {
    openTab(`Editing Vendor '${vendor.name}'`, `/vendors/${vendor.id}`);
  };

  const handleNewVendor = () => {
    setShowNewVendorDialog(true);
  };

  const handleCreateVendor = () => {
    if (!newVendor.vendorId || !newVendor.name) {
      alert("Please fill in Vendor ID and Name");
      return;
    }

    const vendor: Vendor = {
      id: String(vendors.length + 1),
      vendorId: newVendor.vendorId,
      name: newVendor.name,
      status: newVendor.status,
      type: newVendor.type,
      balance: 0,
      catalogue: null,
    };

    setVendors([...vendors, vendor]);
    setShowNewVendorDialog(false);
    setNewVendor({
      vendorId: "",
      name: "",
      status: "Active",
      type: "Cost of Sales",
    });

    // Select the new vendor and open its detail
    setSelectedVendor(vendor);
    openTab(`Editing Vendor '${vendor.name}'`, `/vendors/${vendor.id}`);
  };

  const handleDeleteVendor = () => {
    if (!selectedVendor) return;

    if (confirm(`Are you sure you want to delete vendor "${selectedVendor.name}"?`)) {
      const newVendors = vendors.filter(v => v.id !== selectedVendor.id);
      setVendors(newVendors);
      setSelectedVendor(newVendors[0] || null);
    }
  };

  const handleEditVendor = () => {
    if (selectedVendor) {
      openTab(`Editing Vendor '${selectedVendor.name}'`, `/vendors/${selectedVendor.id}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* New Vendor Dialog */}
      {showNewVendorDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f5f5f5] border-2 border-[#0055e5] shadow-lg" style={{ minWidth: "400px" }}>
            <div className="bg-[#0055e5] text-white px-3 py-1 flex items-center justify-between">
              <span className="text-[12px] font-medium">New Vendor</span>
              <button onClick={() => setShowNewVendorDialog(false)} className="hover:bg-[#0044cc] px-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-24 text-[12px]">Vendor ID *</label>
                  <input
                    type="text"
                    value={newVendor.vendorId}
                    onChange={(e) => setNewVendor({ ...newVendor, vendorId: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px]"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-[12px]">Name *</label>
                  <input
                    type="text"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-[12px]">Status</label>
                  <select
                    value={newVendor.status}
                    onChange={(e) => setNewVendor({ ...newVendor, status: e.target.value as "Active" | "Inactive" })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px]"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-[12px]">Type</label>
                  <select
                    value={newVendor.type}
                    onChange={(e) => setNewVendor({ ...newVendor, type: e.target.value as "Cost of Sales" | "Overhead" })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px]"
                  >
                    <option value="Cost of Sales">Cost of Sales</option>
                    <option value="Overhead">Overhead</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowNewVendorDialog(false)}
                  className="px-4 py-1 border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateVendor}
                  className="px-4 py-1 border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px]"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Pim</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button
          onClick={handleNewVendor}
          title="New Vendor"
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
        >
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button
          onClick={handleEditVendor}
          title="Edit Vendor"
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
        >
          <Pencil className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button
          onClick={handleDeleteVendor}
          title="Delete Vendor"
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
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
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Copy className="w-4 h-4" style={{ color: "#95a5a6" }} />
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
          <DollarSign className="w-4 h-4" style={{ color: "#27ae60" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Printer className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <BarChart3 className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Grid3X3 className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Grid3X3 className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[11px] font-bold" style={{ color: "#3498db" }}>Σ</span>
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <BarChart3 className="w-4 h-4" style={{ color: "#27ae60" }} />
        </button>
        <button
          onClick={handleNewVendor}
          title="Add New Vendor"
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
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

      {/* F&S Catalogue Filter */}
      <div className="bg-[#f5f5f5] px-4 py-2 border-b border-[#d0d0d0] flex items-center gap-2">
        <label className="text-[12px]">F&S Catalogue</label>
        <select
          value={catalogue}
          onChange={(e) => setCatalogue(e.target.value)}
          className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[150px]"
        >
          <option value="None">None</option>
          <option value="Parts">Parts</option>
          <option value="Labor">Labor</option>
          <option value="Materials">Materials</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="bg-white px-2 pt-2 border-b border-[#a0a0a0]">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[12px] border-t border-l border-r -mb-px ${
                activeTab === tab
                  ? "bg-white border-[#a0a0a0] border-b-white z-10 font-medium"
                  : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "15%" }}>ID #</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "40%" }}>Name</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Status</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "18%" }}>Type</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "15%" }}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {filteredVendors.map((vendor) => (
              <tr
                key={vendor.id}
                onClick={() => handleRowClick(vendor)}
                onDoubleClick={() => handleRowDoubleClick(vendor)}
                className={`cursor-pointer ${
                  selectedVendor?.id === vendor.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"
                }`}
              >
                <td className="px-2 py-1 border border-[#e0e0e0]">{vendor.vendorId}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{vendor.name}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{vendor.status}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{vendor.type}</td>
                <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(vendor.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Bar with Totals */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        {/* Left side - Selected vendor name and totals info */}
        <div className="flex items-center gap-4 text-[11px]">
          <span>{selectedVendor?.name || ""}</span>
          {showTotals1 && (
            <>
              <span className="border-l border-[#c0c0c0] pl-2">
                <strong>Count:</strong> {totals.count}
              </span>
              <span>
                <strong>Active:</strong> {totals.activeCount}
              </span>
            </>
          )}
          {showTotals2 && (
            <span className="border-l border-[#c0c0c0] pl-2">
              <strong>Total Balance:</strong> {formatCurrency(totals.totalBalance)}
            </span>
          )}
        </div>

        {/* Right side - Toggle Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTotals1(!showTotals1)}
            className={`px-3 py-0.5 border border-[#c0c0c0] text-[11px] hover:bg-[#e8e8e8] ${
              showTotals1 ? "bg-[#d0e8ff]" : "bg-[#f0f0f0]"
            }`}
          >
            {showTotals1 ? "Totals On" : "Totals Off"}
          </button>
          <button
            onClick={() => setShowTotals2(!showTotals2)}
            className={`px-3 py-0.5 border border-[#c0c0c0] text-[11px] hover:bg-[#e8e8e8] ${
              showTotals2 ? "bg-[#d0e8ff]" : "bg-[#f0f0f0]"
            }`}
          >
            {showTotals2 ? "Totals On" : "Totals Off"}
          </button>
        </div>
      </div>
    </div>
  );
}
