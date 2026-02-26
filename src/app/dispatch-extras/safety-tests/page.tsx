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
  Grid3X3,
  Home,
  HelpCircle,
} from "lucide-react";

interface SafetyTest {
  id: string;
  status: string;
  customerId: string;
  customerName: string;
  accountId: string;
  accountTag: string;
  unit: string;
  stateNumber: string;
  testType: string;
  lastDate: string;
  nextDate: string;
  charge: boolean;
  ticketNumber: string;
  ticketStatus: string;
  worker: string;
  scheduleDate: string;
}

export default function SafetyTestsPage() {
  const { openTab } = useTabs();

  // Filters
  const [massUpdateStatus, setMassUpdateStatus] = useState("");
  const [startDate, setStartDate] = useState("10/1/2025");
  const [endDate, setEndDate] = useState("10/31/2025");
  const [dateMode, setDateMode] = useState<"Day" | "Week" | "Month" | "Quarter" | "Year">("Month");

  // Data
  const [tests, setTests] = useState<SafetyTest[]>([]);
  const [filteredTests, setFilteredTests] = useState<SafetyTest[]>([]);
  const [selectedTest, setSelectedTest] = useState<SafetyTest | null>(null);
  const [showTotals, setShowTotals] = useState(false);

  const columns = [
    { field: "status", label: "Status", width: 100 },
    { field: "customerName", label: "Customer", width: 140 },
    { field: "accountTag", label: "Account", width: 100 },
    { field: "accountId", label: "ID", width: 80 },
    { field: "unit", label: "Unit", width: 60 },
    { field: "stateNumber", label: "State#", width: 70 },
    { field: "testType", label: "Test", width: 80 },
    { field: "lastDate", label: "Last", width: 80 },
    { field: "nextDate", label: "Next", width: 80 },
    { field: "charge", label: "Charge", width: 50 },
    { field: "ticketNumber", label: "Tkt#", width: 70 },
    { field: "ticketStatus", label: "Tkt Status", width: 80 },
    { field: "worker", label: "Worker", width: 70 },
    { field: "scheduleDate", label: "Schedule", width: 80 },
  ];

  const { filteredColumns } = useFilteredColumns("safety-tests", columns);

  // Mock data
  useEffect(() => {
    const mockTests: SafetyTest[] = [
      { id: "1", status: "Inspector to s", customerId: "1", customerName: "195 B OWNER LLC", accountId: "195BROAD", accountTag: "195BROAD***", unit: "CAR 04", stateNumber: "1P836", testType: "ANNUAL INS", lastDate: "09/06/2025", nextDate: "10/19/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "2", status: "Inspector to s", customerId: "1", customerName: "195 B OWNER LLC", accountId: "195BROAD", accountTag: "195BROAD***", unit: "CAR 21", stateNumber: "1P12253", testType: "ANNUAL INS", lastDate: "09/06/2025", nextDate: "10/24/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "3", status: "Inspector to s", customerId: "1", customerName: "195 B OWNER LLC", accountId: "195BROAD", accountTag: "195BROAD***", unit: "CAR 22", stateNumber: "1P12254", testType: "ANNUAL INS", lastDate: "09/06/2025", nextDate: "10/24/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "4", status: "Inspector to s", customerId: "1", customerName: "195 B OWNER LLC", accountId: "195BROAD", accountTag: "195BROAD***", unit: "CAR 31", stateNumber: "1P12534", testType: "ANNUAL INS", lastDate: "09/06/2025", nextDate: "10/23/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "5", status: "Inspector to s", customerId: "2", customerName: "708 THIRD AVENUE ASSOC", accountId: "7083RDAVE", accountTag: "708 3RD AVI", unit: "P05", stateNumber: "1P19074", testType: "ANNUAL INS", lastDate: "10/16/2025", nextDate: "10/03/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "6", status: "Inspector to s", customerId: "2", customerName: "708 THIRD AVENUE ASSOC", accountId: "7083RDAVE", accountTag: "708 3RD AVI", unit: "P06", stateNumber: "1P19075", testType: "ANNUAL INS", lastDate: "10/16/2025", nextDate: "10/03/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "7", status: "Inspector to s", customerId: "2", customerName: "708 THIRD AVENUE ASSOC", accountId: "7083RDAVE", accountTag: "708 3RD AVI", unit: "P07", stateNumber: "1P19076", testType: "ANNUAL INS", lastDate: "10/16/2025", nextDate: "10/03/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "8", status: "Inspector to s", customerId: "2", customerName: "708 THIRD AVENUE ASSOC", accountId: "7083RDAVE", accountTag: "708 3RD AVI", unit: "P08", stateNumber: "1P19077", testType: "ANNUAL INS", lastDate: "10/16/2025", nextDate: "10/03/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "9", status: "Job Awarded", customerId: "3", customerName: "COLLIERS INTERNATIONA", accountId: "150JFKPARK", accountTag: "150 JFK PAR", unit: "P1", stateNumber: "", testType: "OUTSIDE N", lastDate: "11/15/2017", nextDate: "10/21/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "10", status: "Job Awarded", customerId: "3", customerName: "COLLIERS INTERNATIONA", accountId: "150JFKPARK", accountTag: "150 JFK PAR", unit: "P2", stateNumber: "", testType: "OUTSIDE N", lastDate: "11/15/2017", nextDate: "10/21/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "11", status: "Job Awarded", customerId: "3", customerName: "COLLIERS INTERNATIONA", accountId: "150JFKPARK", accountTag: "150 JFK PAR", unit: "P3", stateNumber: "", testType: "OUTSIDE N", lastDate: "11/15/2017", nextDate: "10/21/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "12", status: "Inspector to s", customerId: "4", customerName: "EMPIRE STATE REALTY TR", accountId: "ONEGCP", accountTag: "ONE GRAND", unit: "MID RISE 33", stateNumber: "1P17858", testType: "ANNUAL INS", lastDate: "12/31/2026", nextDate: "10/12/2025", charge: false, ticketNumber: "4087294", ticketStatus: "Assigned", worker: "Testing", scheduleDate: "12/31/2025" },
      { id: "13", status: "Inspector to s", customerId: "5", customerName: "MIRA GARAY", accountId: "60E79THST", accountTag: "60 EAST 79T", unit: "P1", stateNumber: "1T166", testType: "ANNUAL INS", lastDate: "11/10/2025", nextDate: "10/01/2025", charge: false, ticketNumber: "4029803", ticketStatus: "Assigned", worker: "Testing", scheduleDate: "11/10/2025" },
      { id: "14", status: "Inspector to s", customerId: "6", customerName: "MIRIAM BELSKY", accountId: "117E65", accountTag: "117 E 65th S", unit: "P1", stateNumber: "1P21056", testType: "ANNUAL INS", lastDate: "10/10/2025", nextDate: "10/22/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "15", status: "Inspector to s", customerId: "7", customerName: "MUSSO PROPERTIES, LLC", accountId: "135THIRDA", accountTag: "135 THIRD A", unit: "P1", stateNumber: "1P5597", testType: "OUTSIDE N", lastDate: "11/24/2025", nextDate: "10/31/2025", charge: false, ticketNumber: "4048917", ticketStatus: "Assigned", worker: "Testing", scheduleDate: "11/24/2025" },
      { id: "16", status: "Job Awarded", customerId: "8", customerName: "MUSSO PROPERTIES, LLC", accountId: "465BROADV", accountTag: "465 BROAD", unit: "P1", stateNumber: "7903", testType: "OUTSIDE N", lastDate: "", nextDate: "10/31/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "17", status: "Job Awarded", customerId: "8", customerName: "MUSSO PROPERTIES, LLC", accountId: "465BROADV", accountTag: "465 BROAD", unit: "P1", stateNumber: "7903", testType: "OUTSIDE N", lastDate: "03/01/2012", nextDate: "10/31/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "18", status: "Scheduled", customerId: "9", customerName: "NEW ROC ASSOCIATES, LI", accountId: "29-33LECOU", accountTag: "29-33 LECOU", unit: "SE7", stateNumber: "", testType: "OUTSIDE N", lastDate: "", nextDate: "10/01/2025", charge: false, ticketNumber: "4050910", ticketStatus: "Assigned", worker: "Testing", scheduleDate: "11/26/2025" },
      { id: "19", status: "Scheduled", customerId: "10", customerName: "ONE GATEWAY CENTER P", accountId: "11-43RAYMC", accountTag: "11-43 RAYM", unit: "PE02", stateNumber: "PE02", testType: "OUTSIDE N", lastDate: "11/06/2024", nextDate: "10/31/2025", charge: false, ticketNumber: "4086424", ticketStatus: "Assigned", worker: "Testing", scheduleDate: "01/19/2026" },
      { id: "20", status: "Scheduled", customerId: "10", customerName: "ONE GATEWAY CENTER P", accountId: "11-43RAYMC", accountTag: "11-43 RAYM", unit: "PE03", stateNumber: "PE03", testType: "OUTSIDE N", lastDate: "12/26/2024", nextDate: "10/31/2025", charge: false, ticketNumber: "4086425", ticketStatus: "Assigned", worker: "Testing", scheduleDate: "12/31/2025" },
      { id: "21", status: "Scheduled", customerId: "11", customerName: "SOMERSET DEVELOPMEN", accountId: "101CRAWFI", accountTag: "101 CRAWFI", unit: "WEST 4", stateNumber: "WEST 4", testType: "OUTSIDE N", lastDate: "10/09/2024", nextDate: "10/09/2025", charge: false, ticketNumber: "4004419", ticketStatus: "Assigned", worker: "Testing", scheduleDate: "10/06/2025" },
      { id: "22", status: "Job Awarded", customerId: "11", customerName: "SOMERSET DEVELOPMEN", accountId: "101CRAWFI", accountTag: "101 CRAWFI", unit: "WEST 3", stateNumber: "WEST 3", testType: "OUTSIDE N", lastDate: "10/15/2024", nextDate: "10/10/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
      { id: "23", status: "Job Awarded", customerId: "12", customerName: "WP PLAZA OWNER LLC", accountId: "1NORTHBRI", accountTag: "1 NORTH BR", unit: "P1", stateNumber: "T456P", testType: "OUTSIDE N", lastDate: "", nextDate: "10/06/2025", charge: false, ticketNumber: "", ticketStatus: "", worker: "", scheduleDate: "" },
    ];

    setTests(mockTests);
    setFilteredTests(mockTests);
    if (mockTests.length > 0) {
      setSelectedTest(mockTests[0]);
    }
  }, []);

  const handleRowClick = (test: SafetyTest) => {
    setSelectedTest(test);
  };

  const handleRowDoubleClick = (test: SafetyTest) => {
    openTab(`Test: ${test.customerName}`, `/dispatch-extras/safety-tests/${test.id}`);
  };

  const handleNavigateToCustomer = (customerId: string, customerName: string) => {
    openTab(customerName, `/customers/${customerId}`);
  };

  const handleNewTest = () => {
    openTab("New Safety Test", `/dispatch-extras/safety-tests/new`);
  };

  const handleEditTest = () => {
    if (selectedTest) {
      openTab(`Test: ${selectedTest.customerName}`, `/dispatch-extras/safety-tests/${selectedTest.id}`);
    }
  };

  const handleDeleteTest = () => {
    if (selectedTest) {
      if (confirm(`Are you sure you want to delete this safety test for ${selectedTest.customerName}?`)) {
        const updated = tests.filter(t => t.id !== selectedTest.id);
        setTests(updated);
        setFilteredTests(updated);
        setSelectedTest(updated[0] || null);
      }
    }
  };

  // Get row background color based on status
  const getRowColor = (status: string, isSelected: boolean) => {
    if (isSelected) return "bg-[#316ac5] text-white";
    switch (status) {
      case "Job Awarded":
        return "bg-[#90EE90]"; // Light green
      case "Scheduled":
        return "bg-[#87CEEB]"; // Light blue
      case "Inspector to s":
        return "bg-[#FFFACD]"; // Light yellow
      case "Test Complete":
        return "bg-[#98FB98]"; // Pale green
      case "No Proposal":
        return "bg-[#FFB6C1]"; // Light pink
      default:
        return "hover:bg-[#f0f8ff]";
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const total = filteredTests.length;
    const inspectorToSign = filteredTests.filter(t => t.status === "Inspector to s").length;
    const jobAwarded = filteredTests.filter(t => t.status === "Job Awarded").length;
    const scheduled = filteredTests.filter(t => t.status === "Scheduled").length;
    return { total, inspectorToSign, jobAwarded, scheduled };
  };

  const totals = calculateTotals();

  const statuses = ["", "Inspector to s", "Job Awarded", "Scheduled", "Test Complete", "No Proposal", "Proposal Sent"];

  return (
    <div className="h-full flex flex-col bg-[#f0f0f0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
        <span className="font-bold text-[13px]">Safety Tests</span>
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
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Pim</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Tools</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#808080] gap-0.5">
        <button
          onClick={handleNewTest}
          className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]"
          title="New"
        >
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button
          onClick={handleEditTest}
          disabled={!selectedTest}
          className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080] disabled:opacity-50"
          title="Edit"
        >
          <Search className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Save className="w-4 h-4" style={{ color: "#4a90d9" }} />
        </button>
        <button
          onClick={handleDeleteTest}
          disabled={!selectedTest}
          className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080] disabled:opacity-50"
          title="Delete"
        >
          <X className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Filter className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[11px] font-bold" style={{ color: "#e74c3c" }}>✗</span>
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[11px] font-bold" style={{ color: "#27ae60" }}>✓</span>
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Grid3X3 className="w-4 h-4" style={{ color: "#34495e" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Printer className="w-4 h-4" style={{ color: "#34495e" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[11px]" style={{ color: "#3498db" }}>Σ</span>
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Home className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white flex items-center px-2 py-2 border-b border-[#808080] gap-4">
        <SavedFiltersDropdown pageId="safety-tests" onApply={() => {}} onClear={() => {}} />
        <div className="flex items-center gap-2">
          <label className="text-[11px]">Mass Update Status</label>
          <select
            value={massUpdateStatus}
            onChange={(e) => setMassUpdateStatus(e.target.value)}
            className="px-2 py-1 border border-[#808080] text-[11px] bg-white min-w-[120px]"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s || "(Select)"}</option>
            ))}
          </select>
          <button className="px-2 py-1 border border-[#808080] bg-white hover:bg-[#e0e0e0]">
            <Check className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]">▼</span>
          <span className="text-[12px]">📋</span>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white flex items-center px-2 py-2 border-b border-[#808080] gap-3">
        <div className="flex items-center gap-2">
          <label className="text-[11px]">Start</label>
          <input
            type="text"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 border border-[#808080] text-[11px] bg-white w-[90px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[11px]">End</label>
          <input
            type="text"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 border border-[#808080] text-[11px] bg-white w-[90px]"
          />
          <button className="px-1 border border-[#808080] bg-white text-[11px]">...</button>
        </div>
        <div className="flex items-center gap-1">
          {(["Day", "Week", "Month", "Quarter", "Year"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setDateMode(mode)}
              className={`px-3 py-1 border text-[11px] ${
                dateMode === mode
                  ? "bg-[#316ac5] text-white border-[#316ac5]"
                  : "bg-white border-[#808080] hover:bg-[#e0e0e0]"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-auto bg-white border border-[#808080] m-2">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "20px" }}></th>
              {filteredColumns.map((col) => (
                <th
                  key={col.field}
                  className={`px-2 py-1 ${col.field === "charge" ? "text-center" : "text-left"} font-medium border border-[#c0c0c0]`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTests.map((test) => (
              <tr
                key={test.id}
                onClick={() => handleRowClick(test)}
                onDoubleClick={() => handleRowDoubleClick(test)}
                className={`cursor-pointer ${getRowColor(test.status, selectedTest?.id === test.id)}`}
              >
                <td className="px-2 py-1 border border-[#e0e0e0]">
                  {selectedTest?.id === test.id && "▶"}
                </td>
                {filteredColumns.map((col) => {
                  if (col.field === "customerName") {
                    return (
                      <td
                        key={col.field}
                        className={`px-2 py-1 border border-[#e0e0e0] ${selectedTest?.id !== test.id ? "text-[#0000ff] cursor-pointer hover:underline" : ""}`}
                        onClick={(e) => {
                          if (selectedTest?.id !== test.id) {
                            e.stopPropagation();
                            handleNavigateToCustomer(test.customerId, test.customerName);
                          }
                        }}
                      >
                        {test.customerName}
                      </td>
                    );
                  }
                  if (col.field === "charge") {
                    return (
                      <td key={col.field} className="px-2 py-1 border border-[#e0e0e0] text-center">
                        <input
                          type="checkbox"
                          checked={test.charge}
                          onChange={() => {}}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    );
                  }
                  return (
                    <td key={col.field} className="px-2 py-1 border border-[#e0e0e0]">
                      {test[col.field as keyof SafetyTest]}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#808080] px-3 py-1 flex items-center text-[11px]">
        <span>{selectedTest?.customerName || ""}</span>
        <span className="flex-1" />
        <button
          onClick={() => setShowTotals(!showTotals)}
          className="px-2 hover:bg-[#e0e0e0] cursor-pointer"
        >
          {showTotals
            ? `${totals.total} tests (${totals.inspectorToSign} inspector, ${totals.jobAwarded} awarded, ${totals.scheduled} scheduled)`
            : "Totals Off"}
        </button>
      </div>
    </div>
  );
}
