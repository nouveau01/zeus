"use client";

import { useState, useEffect } from "react";
import { useTabs } from "@/context/TabContext";
import { SavedFiltersDropdown } from "@/components/SavedFiltersDropdown";
import { useFilteredColumns } from "@/hooks/useFilteredColumns";
import { useXPDialog } from "@/components/ui/XPDialog";
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

const columns = [
  { field: "vendorId", label: "ID #", width: 15, align: "left" as const },
  { field: "name", label: "Name", width: 40, align: "left" as const },
  { field: "status", label: "Status", width: 12, align: "left" as const },
  { field: "type", label: "Type", width: 18, align: "left" as const },
  { field: "balance", label: "Balance", width: 15, align: "right" as const },
];

export default function VendorsPage() {
  const { openTab } = useTabs();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const { filteredColumns } = useFilteredColumns("vendors", columns);
  const [activeTab, setActiveTab] = useState("All");
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

  // Fetch vendors from API
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/vendors");
      if (response.ok) {
        const data = await response.json();
        const mappedVendors: Vendor[] = data.map((v: any) => ({
          id: v.id,
          vendorId: v.acct || "",
          name: v.name || "",
          status: v.isActive ? "Active" : "Inactive",
          type: v.type || "Cost of Sales",
          balance: Number(v.balance) || 0,
          catalogue: null,
        }));
        setVendors(mappedVendors);
        if (mappedVendors.length > 0) {
          setSelectedVendor(mappedVendors[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
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

  const handleCreateVendor = async () => {
    if (!newVendor.vendorId || !newVendor.name) {
      await xpAlert("Please fill in Vendor ID and Name");
      return;
    }

    try {
      const response = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: newVendor.vendorId,
          name: newVendor.name,
          status: newVendor.status,
          type: newVendor.type,
        }),
      });

      if (response.ok) {
        const created = await response.json();
        setShowNewVendorDialog(false);
        setNewVendor({
          vendorId: "",
          name: "",
          status: "Active",
          type: "Cost of Sales",
        });
        fetchVendors();
        openTab(`Editing Vendor '${newVendor.name}'`, `/vendors/${created.id}`);
      } else {
        await xpAlert("Failed to create vendor");
      }
    } catch (error) {
      console.error("Error creating vendor:", error);
      await xpAlert("Error creating vendor");
    }
  };

  const handleDeleteVendor = async () => {
    if (!selectedVendor) return;

    if (await xpConfirm(`Are you sure you want to delete vendor "${selectedVendor.name}"?`)) {
      try {
        const response = await fetch(`/api/vendors/${selectedVendor.id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setSelectedVendor(null);
          fetchVendors();
        } else {
          await xpAlert("Failed to delete vendor");
        }
      } catch (error) {
        console.error("Error deleting vendor:", error);
        await xpAlert("Error deleting vendor");
      }
    }
  };

  const handleEditVendor = () => {
    if (selectedVendor) {
      openTab(`Editing Vendor '${selectedVendor.name}'`, `/vendors/${selectedVendor.id}`);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* New Vendor Dialog */}
      {showNewVendorDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-[#0055e5] shadow-lg" style={{ minWidth: "400px" }}>
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

      {/* Saved Filters */}
      <div className="bg-white px-4 py-2 border-b border-[#d0d0d0] flex items-center gap-2">
        <SavedFiltersDropdown
          pageId="vendors"
          onApply={() => {}}
          onClear={() => {}}
        />
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
            {filteredVendors.map((vendor) => (
              <tr
                key={vendor.id}
                onClick={() => handleRowClick(vendor)}
                onDoubleClick={() => handleRowDoubleClick(vendor)}
                className={`cursor-pointer ${
                  selectedVendor?.id === vendor.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"
                }`}
              >
                {filteredColumns.map((col) => (
                  <td
                    key={col.field}
                    className={`px-2 py-1 border border-[#e0e0e0] ${col.align === "right" ? "text-right" : ""}`}
                  >
                    {col.field === "balance"
                      ? formatCurrency(vendor[col.field as keyof Vendor] as number)
                      : (vendor[col.field as keyof Vendor] as string)}
                  </td>
                ))}
              </tr>
            ))}
            {/* Totals Row - only shows when toggled on */}
            {showTotals1 && (
              <tr className="font-semibold bg-[#f5f5f5] border-t-2 border-[#0078d4]">
                <td className="px-2 py-1 border border-[#d0d0d0]">TOTALS</td>
                <td className="px-2 py-1 border border-[#d0d0d0]">{totals.count} vendors</td>
                <td className="px-2 py-1 border border-[#d0d0d0]">{totals.activeCount} active</td>
                <td className="px-2 py-1 border border-[#d0d0d0]"></td>
                <td className="px-2 py-1 text-right border border-[#d0d0d0]">{formatCurrency(totals.totalBalance)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px]">
          <span>{selectedVendor?.name || ""}</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>{filteredVendors.length} vendors</span>
          <button
            onClick={() => setShowTotals1(!showTotals1)}
            className={`px-2 py-0.5 text-[10px] border rounded ${
              showTotals1 ? "bg-[#0078d4] text-white border-[#0078d4]" : "bg-white border-[#a0a0a0] hover:bg-[#f0f0f0]"
            }`}
          >
            Totals {showTotals1 ? "On" : "Off"}
          </button>
        </div>
      </div>
      <XPDialogComponent />
    </div>
  );
}
