"use client";

import { useState, useEffect } from "react";
import { useTabs } from "@/context/TabContext";
import { useFilteredColumns } from "@/hooks/useFilteredColumns";
import { SavedFiltersDropdown } from "@/components/SavedFiltersDropdown";
import {
  FileText,
  Save,
  Trash2,
  X,
  Filter,
  Printer,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Check,
  RotateCcw,
} from "lucide-react";

interface Violation {
  id: string;
  visibleId: string;
  violation: string;
  date: string;
  accountId: string;
  accountTag: string;
  tag: string;
  unit: string;
  stateNumber: string;
  status: "Dismissed" | "Work on Hold" | "CONTRACT CANCELLED" | "Open" | "Pending";
  supervisor: string;
}

export default function ViolationsPage() {
  const { openTab } = useTabs();

  // Filters
  const [startDate, setStartDate] = useState("1/1/2025");
  const [endDate, setEndDate] = useState("12/31/2025");
  const [dateMode, setDateMode] = useState<"Week" | "Month" | "Quarter" | "Year">("Year");

  // Data
  const [violations, setViolations] = useState<Violation[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<Violation[]>([]);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showTotals, setShowTotals] = useState(false);

  const columns = [
    { field: "visibleId", label: "ID", width: 60 },
    { field: "violation", label: "Violation", width: 100 },
    { field: "date", label: "Date", width: 80 },
    { field: "accountId", label: "Account ID", width: 100 },
    { field: "tag", label: "Tag", width: 160 },
    { field: "unit", label: "Unit", width: 60 },
    { field: "stateNumber", label: "State#", width: 80 },
    { field: "status", label: "Status", width: 100 },
    { field: "supervisor", label: "Supervisor", width: 80 },
  ];

  const { filteredColumns } = useFilteredColumns("violations", columns);

  // Mock data
  useEffect(() => {
    const mockViolations: Violation[] = [
      { id: "1", visibleId: "103571", violation: "MH176031", date: "2/13/2025", accountId: "420W118T1", accountTag: "420 W 118TH", tag: "CUA-SIPA-#A", unit: "(V0)", stateNumber: "1P25044", status: "Dismissed", supervisor: "" },
      { id: "2", visibleId: "105595", violation: "PERIODIC", date: "1/3/2025", accountId: "36TIFFANYPL", accountTag: "36 TIFFANY PLACE", tag: "36 TIFFANY PLACE", unit: "P1", stateNumber: "3P12686", status: "Work on Hold", supervisor: "CODE" },
      { id: "3", visibleId: "105596", violation: "PERIODIC", date: "1/3/2025", accountId: "36TIFFANYPL", accountTag: "36 TIFFANY PLACE", tag: "36 TIFFANY PLACE", unit: "P1", stateNumber: "3P1647", status: "Work on Hold", supervisor: "CODE" },
      { id: "4", visibleId: "105597", violation: "PERIODIC", date: "1/2/2025", accountId: "66W38TH", accountTag: "66 WEST 38TH STREET", tag: "66 WEST 38TH STREET - GOTH", unit: "P1", stateNumber: "1P41977", status: "Dismissed", supervisor: "21AROSA" },
      { id: "5", visibleId: "105598", violation: "PERIODIC", date: "1/2/2025", accountId: "66W38TH", accountTag: "66 WEST 38TH STREET", tag: "66 WEST 38TH STREET - GOTH", unit: "P2", stateNumber: "1P41978", status: "Dismissed", supervisor: "21AROSA" },
      { id: "6", visibleId: "105599", violation: "PERIODIC", date: "1/2/2025", accountId: "66W38TH", accountTag: "66 WEST 38TH STREET", tag: "66 WEST 38TH STREET - GOTH", unit: "P3", stateNumber: "1P41979", status: "Dismissed", supervisor: "21AROSA" },
      { id: "7", visibleId: "105600", violation: "PERIODIC", date: "1/2/2025", accountId: "66W38TH", accountTag: "66 WEST 38TH STREET", tag: "66 WEST 38TH STREET - GOTH", unit: "P4", stateNumber: "1P41980", status: "Dismissed", supervisor: "21AROSA" },
      { id: "8", visibleId: "105601", violation: "PERIODIC", date: "1/2/2025", accountId: "70W38TH", accountTag: "70 WEST 38TH STREET", tag: "70 WEST 38TH STREET", unit: "P1", stateNumber: "1P42039", status: "Dismissed", supervisor: "CODE" },
      { id: "9", visibleId: "105602", violation: "PERIODIC", date: "1/2/2025", accountId: "70W38TH", accountTag: "70 WEST 38TH STREET", tag: "70 WEST 38TH STREET", unit: "P2", stateNumber: "1P42040", status: "Dismissed", supervisor: "21AROSA" },
      { id: "10", visibleId: "105686", violation: "PERIODIC", date: "1/6/2025", accountId: "1212AOA", accountTag: "1212 AVENUE OF THE AMERICAS", tag: "1212 AVENUE OF THE AMERIC", unit: "P3", stateNumber: "1P26568", status: "Dismissed", supervisor: "21AROSA" },
      { id: "11", visibleId: "105687", violation: "PERIODIC", date: "1/6/2025", accountId: "1212AOA", accountTag: "1212 AVENUE OF THE AMERICAS", tag: "1212 AVENUE OF THE AMERIC", unit: "P6", stateNumber: "1P26570", status: "Dismissed", supervisor: "21AROSA" },
      { id: "12", visibleId: "105688", violation: "PERIODIC", date: "1/6/2025", accountId: "1212AOA", accountTag: "1212 AVENUE OF THE AMERICAS", tag: "1212 AVENUE OF THE AMERIC", unit: "HYDRO", stateNumber: "1P36619", status: "Dismissed", supervisor: "21AROSA" },
      { id: "13", visibleId: "105689", violation: "PERIODIC", date: "1/6/2025", accountId: "1212AOA", accountTag: "1212 AVENUE OF THE AMERICAS", tag: "1212 AVENUE OF THE AMERIC", unit: "P4", stateNumber: "1P26569", status: "Dismissed", supervisor: "21AROSA" },
      { id: "14", visibleId: "105690", violation: "PERIODIC", date: "1/6/2025", accountId: "1212AOA", accountTag: "1212 AVENUE OF THE AMERICAS", tag: "1212 AVENUE OF THE AMERIC", unit: "P1", stateNumber: "1P26566", status: "Dismissed", supervisor: "21AROSA" },
      { id: "15", visibleId: "105691", violation: "PERIODIC", date: "1/6/2025", accountId: "1212AOA", accountTag: "1212 AVENUE OF THE AMERICAS", tag: "1212 AVENUE OF THE AMERIC", unit: "P2", stateNumber: "1P26567", status: "Dismissed", supervisor: "21AROSA" },
      { id: "16", visibleId: "105729", violation: "INCIDENT", date: "1/8/2025", accountId: "481EIGHTHAVE", accountTag: "481 EIGHTH AVENUE", tag: "481 EIGHTH AVENUE - THE NE", unit: "PEL2", stateNumber: "1P17288", status: "Dismissed", supervisor: "REPAIR" },
      { id: "17", visibleId: "105730", violation: "PERIODIC", date: "1/8/2025", accountId: "870SEVENTH", accountTag: "870 SEVENTH AVENUE", tag: "870 SEVENTH AVENUE", unit: "PE7", stateNumber: "1P53709", status: "Dismissed", supervisor: "REPAIR" },
      { id: "18", visibleId: "105732", violation: "PERIODIC", date: "1/8/2025", accountId: "870SEVENTH", accountTag: "870 SEVENTH AVENUE", tag: "870 SEVENTH AVENUE", unit: "PE8", stateNumber: "1P15780", status: "Dismissed", supervisor: "REPAIR" },
      { id: "19", visibleId: "105733", violation: "PERIODIC", date: "1/3/2025", accountId: "477MADISONRFR", accountTag: "477 MADISON AVENUE - RFR", tag: "477 MADISON AVENUE - RFR", unit: "P1", stateNumber: "1P23004", status: "Dismissed", supervisor: "21AROSA" },
      { id: "20", visibleId: "105735", violation: "PERIODIC", date: "1/3/2025", accountId: "477MADISONRFR", accountTag: "477 MADISON AVENUE - RFR", tag: "477 MADISON AVENUE - RFR", unit: "P2", stateNumber: "1P23005", status: "Dismissed", supervisor: "21AROSA" },
      { id: "21", visibleId: "105736", violation: "PERIODIC", date: "1/3/2025", accountId: "477MADISONRFR", accountTag: "477 MADISON AVENUE - RFR", tag: "477 MADISON AVENUE - RFR", unit: "P3", stateNumber: "1P23006", status: "Dismissed", supervisor: "21AROSA" },
      { id: "22", visibleId: "105737", violation: "PERIODIC", date: "1/3/2025", accountId: "477MADISONRFR", accountTag: "477 MADISON AVENUE - RFR", tag: "477 MADISON AVENUE - RFR", unit: "P4", stateNumber: "1P23007", status: "Dismissed", supervisor: "21AROSA" },
      { id: "23", visibleId: "105738", violation: "PERIODIC", date: "1/3/2025", accountId: "477MADISONRFR", accountTag: "477 MADISON AVENUE - RFR", tag: "477 MADISON AVENUE - RFR", unit: "P5", stateNumber: "1P23008", status: "Dismissed", supervisor: "21AROSA" },
      { id: "24", visibleId: "105739", violation: "PERIODIC", date: "1/3/2025", accountId: "477MADISONRFR", accountTag: "477 MADISON AVENUE - RFR", tag: "477 MADISON AVENUE - RFR", unit: "P6", stateNumber: "1P23009", status: "Dismissed", supervisor: "21AROSA" },
      { id: "25", visibleId: "105740", violation: "PERIODIC", date: "1/3/2025", accountId: "142W36THNEW", accountTag: "142 WEST 36 STREET - CBRF", tag: "142 WEST 36 STREET - CBRF", unit: "P3", stateNumber: "1P12426", status: "Dismissed", supervisor: "DIY" },
      { id: "26", visibleId: "105741", violation: "PERIODIC", date: "1/3/2025", accountId: "142W36THNEW", accountTag: "142 WEST 36 STREET - CBRF", tag: "142 WEST 36 STREET - CBRF", unit: "P4", stateNumber: "1P12427", status: "Dismissed", supervisor: "21AROSA" },
      { id: "27", visibleId: "105742", violation: "PERIODIC", date: "1/7/2025", accountId: "550W45TH", accountTag: "550 WEST 45TH STREET - GOT", tag: "550 WEST 45TH STREET - GOT", unit: "P6", stateNumber: "1P47001", status: "Dismissed", supervisor: "21AROSA" },
      { id: "28", visibleId: "105743", violation: "PERIODIC", date: "1/7/2025", accountId: "550W45TH", accountTag: "550 WEST 45TH STREET - GOT", tag: "550 WEST 45TH STREET - GOT", unit: "PE6", stateNumber: "1P47002", status: "Dismissed", supervisor: "21AROSA" },
      { id: "29", visibleId: "105744", violation: "PERIODIC", date: "1/7/2025", accountId: "550W45TH", accountTag: "550 WEST 45TH STREET - GOT", tag: "550 WEST 45TH STREET SE2- SEE BI", unit: "4Hop 1P471", stateNumber: "", status: "Dismissed", supervisor: "Guttow" },
      { id: "30", visibleId: "105745", violation: "PERIODIC", date: "1/7/2025", accountId: "550W45TH", accountTag: "550 WEST 45TH STREET - GOT", tag: "550 WEST 45TH STREET - GOT", unit: "SE1", stateNumber: "1P47107", status: "Dismissed", supervisor: "21AROSA" },
      { id: "31", visibleId: "105763", violation: "PERIODIC", date: "1/8/2025", accountId: "414W119TH", accountTag: "414 WEST 119TH STREET (aka ", tag: "414 WEST 119TH STREET (aka", unit: "P1", stateNumber: "1P5391", status: "Dismissed", supervisor: "COLUMBIA" },
      { id: "32", visibleId: "105765", violation: "DUPLICATE", date: "1/8/2025", accountId: "417W119TH", accountTag: "417 WEST 119TH STREET", tag: "417 WEST 119TH ST. NYC", unit: "P1", stateNumber: "1P5388", status: "Dismissed", supervisor: "" },
      { id: "33", visibleId: "105766", violation: "PERIODIC", date: "1/8/2025", accountId: "424W119TH", accountTag: "424 WEST 119TH STREET (aka ", tag: "424 WEST 119TH STREET (aka", unit: "P1", stateNumber: "1P5392", status: "Dismissed", supervisor: "COLUMBIA" },
      { id: "34", visibleId: "105767", violation: "PERIODIC", date: "1/7/2025", accountId: "508W114E51", accountTag: "CUA-RIEGELS", tag: "CUA-RIEGELS", unit: "097", stateNumber: "1P2600", status: "Dismissed", supervisor: "CODE" },
      { id: "35", visibleId: "105768", violation: "PERIODIC", date: "1/7/2025", accountId: "511W114E51", accountTag: "CUA-JOHN JAY", tag: "CUA-JOHN JAY", unit: "", stateNumber: "1F4061", status: "Dismissed", supervisor: "CODE" },
      { id: "36", visibleId: "105769", violation: "PERIODIC", date: "1/7/2025", accountId: "511W114E51", accountTag: "CUA-JOHN JAY", tag: "CUA-JOHN JAY", unit: "", stateNumber: "1F256", status: "Dismissed", supervisor: "CODE" },
      { id: "37", visibleId: "105771", violation: "PERIODIC", date: "1/9/2025", accountId: "1050PEL", accountTag: "1050 PELHAM PARKWAY SOUT", tag: "1050 PELHAM PARKWAY SOUT", unit: "PE4", stateNumber: "2P4569", status: "Dismissed", supervisor: "21AROSA" },
      { id: "38", visibleId: "105772", violation: "PERIODIC", date: "1/9/2025", accountId: "1050PEL", accountTag: "1050 PELHAM PARKWAY SOUT", tag: "1050 PELHAM PARKWAY SOUT", unit: "PE5", stateNumber: "2P4570", status: "Dismissed", supervisor: "21AROSA" },
      { id: "39", visibleId: "105773", violation: "PERIODIC", date: "1/9/2025", accountId: "1050PEL", accountTag: "1050 PELHAM PARKWAY SOUT", tag: "1050 PELHAM PARKWAY SOUT", unit: "SE2", stateNumber: "3P4567", status: "Dismissed", supervisor: "21AROSA" },
      { id: "40", visibleId: "105786", violation: "PERIODIC", date: "1/9/2025", accountId: "145W44THST", accountTag: "145 WEST 44TH STREET", tag: "145 WEST 44TH STREET", unit: "11", stateNumber: "1P35688", status: "Dismissed", supervisor: "21AROSA" },
      { id: "41", visibleId: "105787", violation: "PERIODIC", date: "1/9/2025", accountId: "145W44THST", accountTag: "145 WEST 44TH STREET", tag: "145 WEST 44TH STREET", unit: "09", stateNumber: "1P35686", status: "Dismissed", supervisor: "21AROSA" },
      { id: "42", visibleId: "105789", violation: "PERIODIC", date: "1/9/2025", accountId: "145W44THST", accountTag: "145 WEST 44TH STREET", tag: "145 WEST 44TH STREET", unit: "12", stateNumber: "1P35809", status: "Dismissed", supervisor: "21AROSA" },
      { id: "43", visibleId: "105833", violation: "2025 ANNUAL RESULT", date: "1/2/2025", accountId: "800FRONT", accountTag: "800 FRONT STREET", tag: "800 FRONT STREET", unit: "H1", stateNumber: "", status: "CONTRACT CANCELLED", supervisor: "REPAIR" },
      { id: "44", visibleId: "105834", violation: "2025 ANNUAL RESULT", date: "1/2/2025", accountId: "800FRONT", accountTag: "800 FRONT STREET", tag: "800 FRONT STREET", unit: "H2", stateNumber: "", status: "CONTRACT CANCELLED", supervisor: "21AROSA" },
    ];

    setViolations(mockViolations);
    setFilteredViolations(mockViolations);
    if (mockViolations.length > 0) {
      setSelectedViolation(mockViolations[0]);
    }
  }, []);

  const handleRowClick = (violation: Violation) => {
    setSelectedViolation(violation);
  };

  const handleRowDoubleClick = (violation: Violation) => {
    openTab(`Violation ${violation.visibleId}`, `/dispatch-extras/violations/${violation.id}`);
  };

  const handleCheckboxChange = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleNewViolation = () => {
    openTab("New Violation", `/dispatch-extras/violations/new`);
  };

  const handleEditViolation = () => {
    if (selectedViolation) {
      openTab(`Violation ${selectedViolation.visibleId}`, `/dispatch-extras/violations/${selectedViolation.id}`);
    }
  };

  const handleDeleteViolation = () => {
    if (selectedViolation) {
      if (confirm(`Are you sure you want to delete violation ${selectedViolation.visibleId}?`)) {
        const updated = violations.filter(v => v.id !== selectedViolation.id);
        setViolations(updated);
        setFilteredViolations(updated);
        setSelectedViolation(updated[0] || null);
      }
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const total = filteredViolations.length;
    const dismissed = filteredViolations.filter(v => v.status === "Dismissed").length;
    const workOnHold = filteredViolations.filter(v => v.status === "Work on Hold").length;
    return { total, dismissed, workOnHold };
  };

  const totals = calculateTotals();

  return (
    <div className="h-full flex flex-col bg-[#c0c0c0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
        <span className="font-bold text-[13px]">Violations</span>
        <div className="flex items-center gap-1">
          <button className="hover:bg-[#ffffff30] px-1 rounded text-[11px]">_</button>
          <button className="hover:bg-[#ffffff30] px-1 rounded text-[11px]">□</button>
          <button className="hover:bg-[#ff0000] px-1 rounded text-[11px]">×</button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-white flex items-center px-1 py-0.5 border-b border-[#808080]">
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">File</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Edit</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Elm</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Tools</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#808080] gap-0.5">
        <button
          onClick={handleNewViolation}
          className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]"
          title="New Violation"
        >
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button
          onClick={handleEditViolation}
          className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]"
          title="Edit"
        >
          <Search className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <X className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button
          onClick={handleDeleteViolation}
          disabled={!selectedViolation}
          className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080] disabled:opacity-50"
          title="Delete Violation"
        >
          <Trash2 className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Filter className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[12px] font-bold" style={{ color: "#e74c3c" }}>✓</span>
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[12px] font-bold" style={{ color: "#27ae60" }}>✓</span>
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[11px]" style={{ color: "#3498db" }}>Σ</span>
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Plus className="w-4 h-4" style={{ color: "#27ae60" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <RotateCcw className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Printer className="w-4 h-4" style={{ color: "#34495e" }} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#808080] gap-3">
        <SavedFiltersDropdown pageId="violations" onApply={() => {}} onClear={() => {}} />
        <span className="text-[11px]">*</span>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">Start</label>
          <input
            type="text"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-1 py-0.5 border border-[#808080] text-[11px] bg-[#ffffe1] w-[80px]"
          />
        </div>
        <div className="flex items-center gap-1">
          <label className="text-[11px]">End</label>
          <input
            type="text"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
          />
        </div>
        <div className="flex items-center gap-0.5">
          {(["Week", "Month", "Quarter", "Year"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDateMode(mode)}
              className={`px-2 py-0.5 border text-[11px] ${
                dateMode === mode
                  ? "bg-[#316ac5] text-white border-[#316ac5]"
                  : "bg-white border-[#808080] hover:bg-[#e0e0e0]"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-[11px]">
          <input type="checkbox" />
          View
        </label>
        <select className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white">
          <option></option>
        </select>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-auto bg-white border border-[#808080] m-1">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              <th className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]" style={{ width: "30px" }}>
                <input type="checkbox" />
              </th>
              {filteredColumns.map((col) => (
                <th key={col.field} className="px-1 py-0.5 text-left font-medium border border-[#c0c0c0]">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredViolations.map((violation) => (
              <tr
                key={violation.id}
                onClick={() => handleRowClick(violation)}
                onDoubleClick={() => handleRowDoubleClick(violation)}
                className={`cursor-pointer ${
                  selectedViolation?.id === violation.id
                    ? "bg-[#316ac5] text-white"
                    : "hover:bg-[#f0f8ff]"
                }`}
              >
                <td className="px-1 py-0.5 border border-[#e0e0e0]">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(violation.id)}
                    onChange={() => handleCheckboxChange(violation.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                {filteredColumns.map((col) => (
                  <td key={col.field} className="px-1 py-0.5 border border-[#e0e0e0]">
                    {violation[col.field as keyof Violation]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#808080] px-2 py-1 flex items-center text-[11px]">
        <span>{selectedViolation?.tag || ""}</span>
        <span className="flex-1" />
        <button
          onClick={() => setShowTotals(!showTotals)}
          className="px-2 hover:bg-[#e0e0e0] cursor-pointer"
        >
          {showTotals
            ? `${totals.total} violations (${totals.dismissed} dismissed, ${totals.workOnHold} on hold)`
            : "Totals Off"}
        </button>
      </div>
    </div>
  );
}
