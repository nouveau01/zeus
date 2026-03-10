"use client";

import { useState, useEffect } from "react";
import { ActivityHistory } from "@/components/ActivityHistory";
import { useTabs } from "@/context/TabContext";
import { useRequiredFields } from "@/hooks/useRequiredFields";
import { validateRequiredFields } from "@/lib/detail-registry/validation";
import { useXPDialog } from "@/components/ui/XPDialog";
import {
  FileText,
  Save,
  Trash2,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  Plus,
  HelpCircle,
  Grid3X3,
} from "lucide-react";

interface Violation {
  id: string;
  number: string;
  date: string;
  status: string;
}

interface HistoryEntry {
  id: string;
  editDate: string;
  actualDate: string;
  userName: string;
  status: string;
  lastTested: string;
}

interface TicketInfo {
  ticketNumber: string;
  ticketDate: string;
  ticketStatus: string;
  worker: string;
  scheduleDate: string;
}

interface SafetyTestData {
  id: string;
  testType: string;
  accountId: string;
  accountName: string;
  unitNumber: string;
  stateNumber: string;
  preferredWitness: string;
  lastTestedOn: string;
  testDueDate: string;
  lastDueDate: string;
  status: string;
  chargeForTest: boolean;
  remarks: string;
  witnessDropdown: string;
  billing2012To2019: string;
  specialSkill: string;
  custom10: string;
  custom11: string;
  custom12: string;
  custom13: string;
  town: string;
  townships: string;
  violations: Violation[];
  ticket: TicketInfo | null;
  history: HistoryEntry[];
}

interface SafetyTestDetailProps {
  testId: string;
  onClose: () => void;
}

export default function SafetyTestDetail({ testId, onClose }: SafetyTestDetailProps) {
  const { openTab } = useTabs();
  const [activeTab, setActiveTab] = useState<"detail" | "activity">("detail");
  const [testData, setTestData] = useState<SafetyTestData | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<HistoryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { layout: safetyLayout, fieldDefs: safetyFieldDefs, reqMark } = useRequiredFields("safety-tests-detail");
  const { alert: xpAlert, DialogComponent: XPDialogComponent } = useXPDialog();

  // Test type options
  const testTypes = [
    "ANNUAL INS",
    "OUTSIDE N",
    "CAT 1 TEST",
    "CAT 3 TEST",
    "CAT 5 TEST",
    "LOAD TEST",
    "FIRE SERVICE",
    "HYDRAULIC",
    "PRESSURE TEST",
    "SAFETY TEST",
  ];

  // Status options
  const statusOptions = [
    "Inspector to s",
    "Job Awarded",
    "Scheduled",
    "Test Complete",
    "No Proposal",
    "Proposal Sent",
    "Cancelled",
    "On Hold",
  ];

  // Load mock data
  useEffect(() => {
    const mockData: SafetyTestData = {
      id: testId,
      testType: "ANNUAL INS",
      accountId: "195BROAD",
      accountName: "195 B OWNER LLC - 195 BROADWAY",
      unitNumber: "CAR 04",
      stateNumber: "1P836",
      preferredWitness: "PREF-WITNESS",
      lastTestedOn: "09/06/2025",
      testDueDate: "10/19/2025",
      lastDueDate: "09/06/2024",
      status: "Inspector to s",
      chargeForTest: false,
      remarks: "Annual inspection required per state regulation. Inspector must be present for full test cycle.",
      witnessDropdown: "Building Super",
      billing2012To2019: "Standard Rate",
      specialSkill: "Hydraulic Cert",
      custom10: "",
      custom11: "",
      custom12: "",
      custom13: "",
      town: "Manhattan",
      townships: "NYC",
      violations: [
        { id: "V001", number: "VIO-2024-0891", date: "08/15/2024", status: "Open" },
        { id: "V002", number: "VIO-2024-0456", date: "03/22/2024", status: "Resolved" },
        { id: "V003", number: "VIO-2023-1102", date: "11/02/2023", status: "Resolved" },
      ],
      ticket: {
        ticketNumber: "4087294",
        ticketDate: "09/01/2025",
        ticketStatus: "Assigned",
        worker: "Testing",
        scheduleDate: "12/31/2025",
      },
      history: [
        { id: "H1", editDate: "09/06/2025", actualDate: "09/06/2025", userName: "ADMIN", status: "Inspector to s", lastTested: "09/06/2025" },
        { id: "H2", editDate: "09/06/2024", actualDate: "09/06/2024", userName: "ADMIN", status: "Test Complete", lastTested: "09/06/2024" },
        { id: "H3", editDate: "09/05/2023", actualDate: "09/05/2023", userName: "JSMITH", status: "Test Complete", lastTested: "09/05/2023" },
        { id: "H4", editDate: "09/10/2022", actualDate: "09/10/2022", userName: "JSMITH", status: "Test Complete", lastTested: "09/10/2022" },
        { id: "H5", editDate: "09/08/2021", actualDate: "09/08/2021", userName: "ADMIN", status: "Test Complete", lastTested: "09/08/2021" },
      ],
    };

    setTestData(mockData);
  }, [testId]);

  const handleNavigateToAccount = () => {
    if (testData) {
      openTab(testData.accountName, `/accounts/${testData.accountId}`);
    }
  };

  const handleNavigateToUnit = () => {
    if (testData) {
      openTab(`Unit: ${testData.unitNumber}`, `/units/${testData.unitNumber}`);
    }
  };

  const handleNavigateToViolation = (violation: Violation) => {
    openTab(`Violation: ${violation.number}`, `/dispatch-extras/violations/${violation.id}`);
  };

  const handleNavigateToTicket = () => {
    if (testData?.ticket) {
      openTab(`Ticket: ${testData.ticket.ticketNumber}`, `/completed-tickets/${testData.ticket.ticketNumber}`);
    }
  };

  const handleNavigateToWitness = () => {
    // Navigate to contact/witness record
    openTab("PREF-WITNESS", `/contacts/PREF-WITNESS`);
  };

  const handleAddViolation = () => {
    openTab("New Violation", `/dispatch-extras/violations/new`);
  };

  const handleSave = async () => {
    if (safetyLayout && testData) {
      const missing = validateRequiredFields(safetyLayout, safetyFieldDefs, testData);
      if (missing.length > 0) {
        await xpAlert(`Please fill in required fields: ${missing.join(", ")}`);
        return;
      }
    }
    setIsEditing(false);
    // API call would go here
  };

  if (!testData) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f0f0f0]">
        <span className="text-[12px]">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#f0f0f0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
        <span className="font-bold text-[13px]">Safety Test Detail - {testData.accountName}</span>
        <div className="flex items-center gap-1">
          <button className="hover:bg-[#ffffff30] px-1 rounded text-[11px]">_</button>
          <button className="hover:bg-[#ffffff30] px-1 rounded text-[11px]">□</button>
          <button
            onClick={onClose}
            className="hover:bg-[#ff0000] px-1 rounded text-[11px]"
          >
            ×
          </button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="bg-white flex items-center px-1 py-0.5 border-b border-[#808080]">
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">File</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Edit</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Tools</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#808080] gap-0.5">
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button
          onClick={handleSave}
          className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]"
        >
          <Save className="w-4 h-4" style={{ color: "#4a90d9" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Trash2 className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button
          onClick={onClose}
          className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]"
        >
          <X className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Grid3X3 className="w-4 h-4" style={{ color: "#34495e" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Printer className="w-4 h-4" style={{ color: "#34495e" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
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
      <div className="flex-1 overflow-auto p-3">
        <div className="flex gap-4">
          {/* Left Column - Test Info */}
          <div className="flex-1 flex flex-col gap-3">
            {/* Test Information */}
            <div className="border border-[#808080] bg-white">
              <div className="bg-[#f0f0f0] px-2 py-1 border-b border-[#808080] font-medium text-[11px]">
                Test Information
              </div>
              <div className="p-3 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[80px]">Test Type{reqMark("testType")}</label>
                  <select
                    value={testData.testType}
                    onChange={(e) => setTestData({ ...testData, testType: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  >
                    {testTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[80px]">Account</label>
                  <span
                    onClick={handleNavigateToAccount}
                    className="flex-1 text-[#0000ff] cursor-pointer hover:underline text-[11px]"
                  >
                    {testData.accountName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[80px]">Unit #</label>
                  <span
                    onClick={handleNavigateToUnit}
                    className="flex-1 text-[#0000ff] cursor-pointer hover:underline text-[11px]"
                  >
                    {testData.unitNumber}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[80px]">State #{reqMark("stateNumber")}</label>
                  <input
                    type="text"
                    value={testData.stateNumber}
                    onChange={(e) => setTestData({ ...testData, stateNumber: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <label className="text-[11px] w-[80px]">Pref. Witness</label>
                  <span
                    onClick={handleNavigateToWitness}
                    className="text-[#0000ff] cursor-pointer hover:underline text-[11px]"
                  >
                    {testData.preferredWitness}
                  </span>
                  <button
                    onClick={handleAddViolation}
                    className="ml-auto px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[11px] flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Violation
                  </button>
                </div>
              </div>
            </div>

            {/* Dates & Status */}
            <div className="border border-[#808080] bg-white">
              <div className="bg-[#f0f0f0] px-2 py-1 border-b border-[#808080] font-medium text-[11px]">
                Dates & Status
              </div>
              <div className="p-3 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">Last Tested On{reqMark("lastTestedOn")}</label>
                  <input
                    type="text"
                    value={testData.lastTestedOn}
                    onChange={(e) => setTestData({ ...testData, lastTestedOn: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">Test Due Date{reqMark("testDueDate")}</label>
                  <input
                    type="text"
                    value={testData.testDueDate}
                    onChange={(e) => setTestData({ ...testData, testDueDate: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">Last Due Date{reqMark("lastDueDate")}</label>
                  <input
                    type="text"
                    value={testData.lastDueDate}
                    onChange={(e) => setTestData({ ...testData, lastDueDate: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">Status{reqMark("status")}</label>
                  <select
                    value={testData.status}
                    onChange={(e) => setTestData({ ...testData, status: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <input
                    type="checkbox"
                    checked={testData.chargeForTest}
                    onChange={(e) => setTestData({ ...testData, chargeForTest: e.target.checked })}
                    className="mr-1"
                  />
                  <label className="text-[11px]">Charge for Test{reqMark("chargeForTest")}</label>
                </div>
              </div>
            </div>

            {/* Violations Table */}
            <div className="border border-[#808080] bg-white">
              <div className="bg-[#f0f0f0] px-2 py-1 border-b border-[#808080] font-medium text-[11px] flex items-center justify-between">
                <span>Violations</span>
                <span className="text-[10px] text-[#606060]">({testData.violations.length} records)</span>
              </div>
              <div className="max-h-[150px] overflow-auto">
                <table className="w-full border-collapse text-[11px]">
                  <thead className="bg-[#f0f0f0] sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium border-b border-[#c0c0c0]">ID</th>
                      <th className="px-2 py-1 text-left font-medium border-b border-[#c0c0c0]">Number</th>
                      <th className="px-2 py-1 text-left font-medium border-b border-[#c0c0c0]">Date</th>
                      <th className="px-2 py-1 text-left font-medium border-b border-[#c0c0c0]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testData.violations.map((violation) => (
                      <tr
                        key={violation.id}
                        onClick={() => setSelectedViolation(violation)}
                        onDoubleClick={() => handleNavigateToViolation(violation)}
                        className={`cursor-pointer ${
                          selectedViolation?.id === violation.id
                            ? "bg-[#316ac5] text-white"
                            : "hover:bg-[#f0f8ff]"
                        }`}
                      >
                        <td className="px-2 py-1 border-b border-[#e0e0e0]">{violation.id}</td>
                        <td
                          className={`px-2 py-1 border-b border-[#e0e0e0] ${
                            selectedViolation?.id !== violation.id ? "text-[#0000ff] hover:underline" : ""
                          }`}
                          onClick={(e) => {
                            if (selectedViolation?.id !== violation.id) {
                              e.stopPropagation();
                              handleNavigateToViolation(violation);
                            }
                          }}
                        >
                          {violation.number}
                        </td>
                        <td className="px-2 py-1 border-b border-[#e0e0e0]">{violation.date}</td>
                        <td className="px-2 py-1 border-b border-[#e0e0e0]">
                          <span className={`px-1 ${
                            violation.status === "Open" ? "text-[#ff0000]" : "text-[#008000]"
                          }`}>
                            {violation.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ticket Details */}
            {testData.ticket && (
              <div className="border border-[#808080] bg-white">
                <div className="bg-[#f0f0f0] px-2 py-1 border-b border-[#808080] font-medium text-[11px]">
                  Ticket Details
                </div>
                <div className="p-3 grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[60px]">Ticket #</label>
                    <span
                      onClick={handleNavigateToTicket}
                      className="text-[#0000ff] cursor-pointer hover:underline text-[11px]"
                    >
                      {testData.ticket.ticketNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[60px]">Date</label>
                    <span className="text-[11px]">{testData.ticket.ticketDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[60px]">Status</label>
                    <span className="text-[11px]">{testData.ticket.ticketStatus}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[60px]">Worker</label>
                    <span className="text-[11px]">{testData.ticket.worker}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <label className="text-[11px] w-[60px]">Scheduled</label>
                    <span className="text-[11px]">{testData.ticket.scheduleDate}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-3">
                    <label className="text-[11px] w-[60px]">Witness</label>
                    <span
                      onClick={handleNavigateToWitness}
                      className="text-[#0000ff] cursor-pointer hover:underline text-[11px]"
                    >
                      {testData.preferredWitness}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Custom Fields, Remarks, History */}
          <div className="w-[320px] flex flex-col gap-3">
            {/* Custom Fields */}
            <div className="border border-[#808080] bg-white">
              <div className="bg-[#f0f0f0] px-2 py-1 border-b border-[#808080] font-medium text-[11px]">
                Custom Fields
              </div>
              <div className="p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">WITNESS{reqMark("witnessDropdown")}</label>
                  <select
                    value={testData.witnessDropdown}
                    onChange={(e) => setTestData({ ...testData, witnessDropdown: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  >
                    <option value="">Select...</option>
                    <option value="Building Super">Building Super</option>
                    <option value="Property Manager">Property Manager</option>
                    <option value="Owner">Owner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">2012-2019 Billing{reqMark("billing2012To2019")}</label>
                  <input
                    type="text"
                    value={testData.billing2012To2019}
                    onChange={(e) => setTestData({ ...testData, billing2012To2019: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">Special Skill{reqMark("specialSkill")}</label>
                  <input
                    type="text"
                    value={testData.specialSkill}
                    onChange={(e) => setTestData({ ...testData, specialSkill: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">Custom 10{reqMark("custom10")}</label>
                  <input
                    type="text"
                    value={testData.custom10}
                    onChange={(e) => setTestData({ ...testData, custom10: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">Custom 11{reqMark("custom11")}</label>
                  <input
                    type="text"
                    value={testData.custom11}
                    onChange={(e) => setTestData({ ...testData, custom11: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">Custom 12{reqMark("custom12")}</label>
                  <input
                    type="text"
                    value={testData.custom12}
                    onChange={(e) => setTestData({ ...testData, custom12: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">Custom 13{reqMark("custom13")}</label>
                  <input
                    type="text"
                    value={testData.custom13}
                    onChange={(e) => setTestData({ ...testData, custom13: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">Town{reqMark("town")}</label>
                  <input
                    type="text"
                    value={testData.town}
                    onChange={(e) => setTestData({ ...testData, town: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-[11px] w-[100px]">Townships{reqMark("townships")}</label>
                  <input
                    type="text"
                    value={testData.townships}
                    onChange={(e) => setTestData({ ...testData, townships: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="border border-[#808080] bg-white">
              <div className="bg-[#f0f0f0] px-2 py-1 border-b border-[#808080] font-medium text-[11px]">
                Remarks
              </div>
              <div className="p-2">
                <textarea
                  value={testData.remarks}
                  onChange={(e) => setTestData({ ...testData, remarks: e.target.value })}
                  rows={4}
                  className="w-full px-2 py-1 border border-[#808080] text-[11px] bg-white resize-none"
                />
              </div>
            </div>

            {/* History Table */}
            <div className="border border-[#808080] bg-white flex-1">
              <div className="bg-[#f0f0f0] px-2 py-1 border-b border-[#808080] font-medium text-[11px] flex items-center justify-between">
                <span>History</span>
                <span className="text-[10px] text-[#606060]">({testData.history.length} records)</span>
              </div>
              <div className="max-h-[180px] overflow-auto">
                <table className="w-full border-collapse text-[10px]">
                  <thead className="bg-[#f0f0f0] sticky top-0">
                    <tr>
                      <th className="px-1 py-1 text-left font-medium border-b border-[#c0c0c0]">Edit</th>
                      <th className="px-1 py-1 text-left font-medium border-b border-[#c0c0c0]">Actual</th>
                      <th className="px-1 py-1 text-left font-medium border-b border-[#c0c0c0]">User</th>
                      <th className="px-1 py-1 text-left font-medium border-b border-[#c0c0c0]">Status</th>
                      <th className="px-1 py-1 text-left font-medium border-b border-[#c0c0c0]">Last Test</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testData.history.map((entry) => (
                      <tr
                        key={entry.id}
                        onClick={() => setSelectedHistory(entry)}
                        className={`cursor-pointer ${
                          selectedHistory?.id === entry.id
                            ? "bg-[#316ac5] text-white"
                            : "hover:bg-[#f0f8ff]"
                        }`}
                      >
                        <td className="px-1 py-1 border-b border-[#e0e0e0]">{entry.editDate}</td>
                        <td className="px-1 py-1 border-b border-[#e0e0e0]">{entry.actualDate}</td>
                        <td className="px-1 py-1 border-b border-[#e0e0e0]">{entry.userName}</td>
                        <td className="px-1 py-1 border-b border-[#e0e0e0]">{entry.status}</td>
                        <td className="px-1 py-1 border-b border-[#e0e0e0]">{entry.lastTested}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#808080] px-3 py-1 flex items-center text-[11px]">
        <span>Test ID: {testData.id}</span>
        <span className="mx-2">|</span>
        <span>Account: {testData.accountId}</span>
        <span className="mx-2">|</span>
        <span>Unit: {testData.unitNumber}</span>
        <span className="flex-1" />
        <span className={`px-2 py-0.5 rounded ${
          testData.status === "Test Complete" ? "bg-[#90EE90]" :
          testData.status === "Scheduled" ? "bg-[#87CEEB]" :
          testData.status === "Job Awarded" ? "bg-[#90EE90]" :
          testData.status === "Inspector to s" ? "bg-[#FFFACD]" : ""
        }`}>
          {testData.status}
        </span>
      </div>
      </>)}

      {activeTab === "activity" && (
        <div className="flex-1 overflow-auto">
          {testData && <ActivityHistory entityType="Safety Test" entityId={testData.id} />}
        </div>
      )}

      <XPDialogComponent />
    </div>
  );
}
