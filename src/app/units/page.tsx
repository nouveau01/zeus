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
  Check,
  Printer,
  Grid3X3,
  Plus,
  Home,
  HelpCircle,
  Lock,
} from "lucide-react";

interface Unit {
  id: string;
  accountId: string;
  accountTag: string;
  unitNumber: string;
  type: "Elevator" | "Hydraulic" | "Service";
  category: "CONSULTANT" | "N/A" | "Other" | "Private" | "Public" | "Service";
  building: string;
  customerId: string;
  customerName: string;
  status: "Active" | "Inactive";
  stateNumber: string;
}

interface NewUnitForm {
  accountId: string;
  unitNumber: string;
  type: string;
  category: string;
  building: string;
}

export default function UnitsPage() {
  const { openTab } = useTabs();
  const [catalogue, setCatalogue] = useState("None");
  const [filterType, setFilterType] = useState<"Category" | "Type" | "Building">("Category");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [units, setUnits] = useState<Unit[]>([]);
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTotals, setShowTotals] = useState(false);
  const [showNewUnitDialog, setShowNewUnitDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newUnit, setNewUnit] = useState<NewUnitForm>({
    accountId: "",
    unitNumber: "",
    type: "Elevator",
    category: "CONSULTANT",
    building: "Office / Commercial",
  });

  const categories = ["All", "CONSULTANT", "N/A", "Other", "Private", "Public", "Service"];
  const types = ["All", "Elevator", "Hydraulic", "Service"];
  const buildings = ["All", "Hospital", "Office / Commercial", "Store / Retail", "School", "Other"];

  // Mock data matching the screenshot
  const mockUnits: Unit[] = [
    { id: "1", accountId: "1ALEX", accountTag: "1 ALEXANDER PL", unitNumber: "HYDRO", type: "Elevator", category: "CONSULTANT", building: "Hospital", customerId: "1", customerName: "SCO FAMILY OF SERVICES", status: "Inactive", stateNumber: "" },
    { id: "2", accountId: "1AMERICANDREAM", accountTag: "1 AMERICAN DREAM WAY - STORE", unitNumber: "P1", type: "Elevator", category: "Service", building: "Store / Retail", customerId: "2", customerName: "H&M FASHION USA, INC.", status: "Inactive", stateNumber: "SE26" },
    { id: "3", accountId: "1CAPLAZA", accountTag: "1 CA PLAZA", unitNumber: "NORTH 1", type: "Elevator", category: "CONSULTANT", building: "Office / Commercial", customerId: "3", customerName: "ONYX EQUITIES", status: "Inactive", stateNumber: "" },
    { id: "4", accountId: "1CAPLAZA", accountTag: "1 CA PLAZA", unitNumber: "NORTH 2", type: "Elevator", category: "CONSULTANT", building: "Office / Commercial", customerId: "3", customerName: "ONYX EQUITIES", status: "Inactive", stateNumber: "" },
    { id: "5", accountId: "1CAPLAZA", accountTag: "1 CA PLAZA", unitNumber: "NORTH 3", type: "Elevator", category: "CONSULTANT", building: "Office / Commercial", customerId: "3", customerName: "ONYX EQUITIES", status: "Inactive", stateNumber: "" },
    { id: "6", accountId: "1CAPLAZA", accountTag: "1 CA PLAZA", unitNumber: "P10 CONF C", type: "Hydraulic", category: "CONSULTANT", building: "Office / Commercial", customerId: "3", customerName: "ONYX EQUITIES", status: "Inactive", stateNumber: "" },
    { id: "7", accountId: "1CAPLAZA", accountTag: "1 CA PLAZA", unitNumber: "P11 FITNESS", type: "Hydraulic", category: "CONSULTANT", building: "Office / Commercial", customerId: "3", customerName: "ONYX EQUITIES", status: "Inactive", stateNumber: "" },
    { id: "8", accountId: "1CAPLAZA", accountTag: "1 CA PLAZA", unitNumber: "P12 DAY CA", type: "Hydraulic", category: "CONSULTANT", building: "Office / Commercial", customerId: "3", customerName: "ONYX EQUITIES", status: "Inactive", stateNumber: "" },
    { id: "9", accountId: "1CAPLAZA", accountTag: "1 CA PLAZA", unitNumber: "S7", type: "Elevator", category: "CONSULTANT", building: "Office / Commercial", customerId: "3", customerName: "ONYX EQUITIES", status: "Inactive", stateNumber: "" },
    { id: "10", accountId: "1CAPLAZA", accountTag: "1 CA PLAZA", unitNumber: "S8", type: "Hydraulic", category: "CONSULTANT", building: "Office / Commercial", customerId: "3", customerName: "ONYX EQUITIES", status: "Inactive", stateNumber: "" },
    { id: "11", accountId: "1CAPLAZA", accountTag: "1 CA PLAZA", unitNumber: "S9 KITCHEN", type: "Hydraulic", category: "CONSULTANT", building: "Office / Commercial", customerId: "3", customerName: "ONYX EQUITIES", status: "Inactive", stateNumber: "" },
    { id: "12", accountId: "1CAPLAZA", accountTag: "1 CA PLAZA", unitNumber: "SOUTH 1", type: "Elevator", category: "CONSULTANT", building: "Office / Commercial", customerId: "3", customerName: "ONYX EQUITIES", status: "Inactive", stateNumber: "" },
    { id: "13", accountId: "1CAPLAZA", accountTag: "1 CA PLAZA", unitNumber: "SOUTH 2", type: "Elevator", category: "CONSULTANT", building: "Office / Commercial", customerId: "3", customerName: "ONYX EQUITIES", status: "Inactive", stateNumber: "" },
    { id: "14", accountId: "1CAPLAZA", accountTag: "1 CA PLAZA", unitNumber: "SOUTH 3", type: "Elevator", category: "CONSULTANT", building: "Office / Commercial", customerId: "3", customerName: "ONYX EQUITIES", status: "Inactive", stateNumber: "" },
    { id: "15", accountId: "1CAROWPL", accountTag: "1 CAROW PLACE", unitNumber: "LULA", type: "Elevator", category: "Service", building: "Other", customerId: "4", customerName: "ST. PHILIP AND JAMES", status: "Active", stateNumber: "" },
    { id: "16", accountId: "1CASTLEPOINT", accountTag: "1 CASTLE POINT TERRACE", unitNumber: "F3", type: "Elevator", category: "Public", building: "School", customerId: "5", customerName: "STEVENS INSTITUTE OF TECHN", status: "Inactive", stateNumber: "" },
    { id: "17", accountId: "1CASTLEPOINT", accountTag: "1 CASTLE POINT TERRACE", unitNumber: "P1", type: "Elevator", category: "CONSULTANT", building: "School", customerId: "5", customerName: "STEVENS INSTITUTE OF TECHN", status: "Inactive", stateNumber: "" },
  ];

  useEffect(() => {
    setUnits(mockUnits);
    setFilteredUnits(mockUnits);
    setSelectedUnit(mockUnits[0]);
    setLoading(false);
  }, []);

  // Filter units based on selected filter type and category
  useEffect(() => {
    let filtered = units;

    if (selectedCategory !== "All") {
      if (filterType === "Category") {
        filtered = units.filter(u => u.category === selectedCategory);
      } else if (filterType === "Type") {
        filtered = units.filter(u => u.type === selectedCategory);
      } else if (filterType === "Building") {
        filtered = units.filter(u => u.building === selectedCategory);
      }
    }

    setFilteredUnits(filtered);
  }, [selectedCategory, filterType, units]);

  // Get filter options based on filter type
  const getFilterOptions = () => {
    switch (filterType) {
      case "Category":
        return categories;
      case "Type":
        return types;
      case "Building":
        return buildings;
      default:
        return categories;
    }
  };

  const handleRowClick = (unit: Unit) => {
    setSelectedUnit(unit);
  };

  const handleRowDoubleClick = (unit: Unit) => {
    openTab(`Unit ${unit.unitNumber}`, `/units/${unit.id}`);
  };

  // Navigate to Account
  const handleNavigateToAccount = (accountId: string, accountTag: string) => {
    openTab(accountTag, `/accounts/${accountId}`);
  };

  // Navigate to Customer
  const handleNavigateToCustomer = (customerId: string, customerName: string) => {
    openTab(customerName, `/customers/${customerId}`);
  };

  // Calculate totals
  const calculateTotals = () => {
    const count = filteredUnits.length;
    const activeCount = filteredUnits.filter(u => u.status === "Active").length;
    return { count, activeCount };
  };

  const totals = calculateTotals();

  // New unit handlers
  const handleNewUnit = () => {
    setNewUnit({
      accountId: "",
      unitNumber: "",
      type: "Elevator",
      category: "CONSULTANT",
      building: "Office / Commercial",
    });
    setShowNewUnitDialog(true);
  };

  const handleCreateUnit = () => {
    if (!newUnit.accountId || !newUnit.unitNumber) {
      alert("Please enter Account ID and Unit Number");
      return;
    }

    const unit: Unit = {
      id: String(units.length + 1),
      accountId: newUnit.accountId,
      accountTag: newUnit.accountId,
      unitNumber: newUnit.unitNumber,
      type: newUnit.type as "Elevator" | "Hydraulic" | "Service",
      category: newUnit.category as "CONSULTANT" | "N/A" | "Other" | "Private" | "Public" | "Service",
      building: newUnit.building,
      customerId: "",
      customerName: "",
      status: "Active",
      stateNumber: "",
    };

    setUnits([...units, unit]);
    setShowNewUnitDialog(false);
    setSelectedUnit(unit);
    openTab(`Unit ${unit.unitNumber}`, `/units/${unit.id}`);
  };

  // Edit handler
  const handleEditUnit = () => {
    if (selectedUnit) {
      openTab(`Unit ${selectedUnit.unitNumber}`, `/units/${selectedUnit.id}`);
    }
  };

  // Delete handler
  const handleDeleteUnit = () => {
    if (selectedUnit) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (selectedUnit) {
      const updated = units.filter(u => u.id !== selectedUnit.id);
      setUnits(updated);
      setSelectedUnit(updated[0] || null);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
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
          onClick={handleNewUnit}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="New Unit"
        >
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button
          onClick={handleEditUnit}
          disabled={!selectedUnit}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Edit Unit"
        >
          <Pencil className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Grid3X3 className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
        <button
          onClick={handleDeleteUnit}
          disabled={!selectedUnit}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Delete Unit"
        >
          <Trash2 className="w-4 h-4" style={{ color: "#e74c3c" }} />
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
          <span className="text-[11px] font-bold" style={{ color: "#3498db" }}>Σ</span>
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Lock className="w-4 h-4" style={{ color: "#f39c12" }} />
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
      <div className="bg-[#f5f5f5] px-4 py-2 border-b border-[#d0d0d0]">
        {/* F&S Catalogue and Radio Buttons */}
        <div className="flex items-center gap-6 mb-2">
          <div className="flex items-center gap-2">
            <label className="text-[12px]">F&S Catalogue</label>
            <select
              value={catalogue}
              onChange={(e) => setCatalogue(e.target.value)}
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[100px]"
            >
              <option value="None">None</option>
              <option value="Parts">Parts</option>
              <option value="Labor">Labor</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1 text-[12px]">
              <input
                type="radio"
                name="filterType"
                checked={filterType === "Category"}
                onChange={() => { setFilterType("Category"); setSelectedCategory("All"); }}
              />
              Category
            </label>
            <label className="flex items-center gap-1 text-[12px]">
              <input
                type="radio"
                name="filterType"
                checked={filterType === "Type"}
                onChange={() => { setFilterType("Type"); setSelectedCategory("All"); }}
              />
              Type
            </label>
            <label className="flex items-center gap-1 text-[12px]">
              <input
                type="radio"
                name="filterType"
                checked={filterType === "Building"}
                onChange={() => { setFilterType("Building"); setSelectedCategory("All"); }}
              />
              Building
            </label>
          </div>
        </div>

        {/* Category/Type/Building Tabs */}
        <div className="flex items-center border border-[#808080]">
          {getFilterOptions().map((option) => (
            <button
              key={option}
              onClick={() => setSelectedCategory(option)}
              className={`px-4 py-1 text-[12px] border-r border-[#808080] last:border-r-0 ${
                selectedCategory === option
                  ? "bg-white font-medium"
                  : "bg-[#f0f0f0] hover:bg-[#e8e8e8]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Account ID</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "18%" }}>Account Tag</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Unit #</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Type</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Category</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Building</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "18%" }}>Customer</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "7%" }}>Status</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "7%" }}>State #</th>
            </tr>
          </thead>
          <tbody>
            {filteredUnits.map((unit) => (
              <tr
                key={unit.id}
                onClick={() => handleRowClick(unit)}
                onDoubleClick={() => handleRowDoubleClick(unit)}
                className={`cursor-pointer ${
                  selectedUnit?.id === unit.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"
                }`}
              >
                <td
                  className={`px-2 py-1 border border-[#e0e0e0] ${selectedUnit?.id !== unit.id ? "text-[#0000ff] cursor-pointer hover:underline" : ""}`}
                  onClick={(e) => {
                    if (selectedUnit?.id !== unit.id) {
                      e.stopPropagation();
                      handleNavigateToAccount(unit.accountId, unit.accountTag);
                    }
                  }}
                >
                  {unit.accountId}
                </td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{unit.accountTag}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{unit.unitNumber}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{unit.type}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{unit.category}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{unit.building}</td>
                <td
                  className={`px-2 py-1 border border-[#e0e0e0] ${selectedUnit?.id !== unit.id ? "text-[#0000ff] cursor-pointer hover:underline" : ""}`}
                  onClick={(e) => {
                    if (selectedUnit?.id !== unit.id) {
                      e.stopPropagation();
                      handleNavigateToCustomer(unit.customerId, unit.customerName);
                    }
                  }}
                >
                  {unit.customerName}
                </td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{unit.status}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{unit.stateNumber}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center text-[11px]">
        <span className="px-2">{selectedUnit?.unitNumber || ""}</span>
        <span className="flex-1" />
        <button
          onClick={() => setShowTotals(!showTotals)}
          className="px-2 border-l border-[#c0c0c0] hover:bg-[#e0e0e0] cursor-pointer"
        >
          {showTotals ? `${totals.count} units (${totals.activeCount} active)` : "Totals Off"}
        </button>
      </div>

      {/* New Unit Dialog */}
      {showNewUnitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] border-2 border-[#808080] shadow-lg" style={{ minWidth: "400px" }}>
            <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">New Unit</span>
              <button
                onClick={() => setShowNewUnitDialog(false)}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-24 text-[12px]">Account ID</label>
                  <input
                    type="text"
                    value={newUnit.accountId}
                    onChange={(e) => setNewUnit({ ...newUnit, accountId: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-[12px]">Unit #</label>
                  <input
                    type="text"
                    value={newUnit.unitNumber}
                    onChange={(e) => setNewUnit({ ...newUnit, unitNumber: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-[12px]">Type</label>
                  <select
                    value={newUnit.type}
                    onChange={(e) => setNewUnit({ ...newUnit, type: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    <option value="Elevator">Elevator</option>
                    <option value="Hydraulic">Hydraulic</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-[12px]">Category</label>
                  <select
                    value={newUnit.category}
                    onChange={(e) => setNewUnit({ ...newUnit, category: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    <option value="CONSULTANT">CONSULTANT</option>
                    <option value="N/A">N/A</option>
                    <option value="Other">Other</option>
                    <option value="Private">Private</option>
                    <option value="Public">Public</option>
                    <option value="Service">Service</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-[12px]">Building</label>
                  <select
                    value={newUnit.building}
                    onChange={(e) => setNewUnit({ ...newUnit, building: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    <option value="Hospital">Hospital</option>
                    <option value="Office / Commercial">Office / Commercial</option>
                    <option value="Store / Retail">Store / Retail</option>
                    <option value="School">School</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#808080]">
                <button
                  onClick={handleCreateUnit}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  OK
                </button>
                <button
                  onClick={() => setShowNewUnitDialog(false)}
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
      {showDeleteConfirm && selectedUnit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] border-2 border-[#808080] shadow-lg" style={{ minWidth: "300px" }}>
            <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">Confirm Delete</span>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <p className="text-[12px] mb-4">
                Are you sure you want to delete unit "{selectedUnit.unitNumber}"?
              </p>
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
