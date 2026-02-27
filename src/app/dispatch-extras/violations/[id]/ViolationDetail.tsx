"use client";

import { useState, useEffect } from "react";
import { useTabs } from "@/context/TabContext";
import { useXPDialog } from "@/components/ui/XPDialog";
import {
  FileText,
  Save,
  Undo2,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Printer,
  Check,
} from "lucide-react";

interface ViolationData {
  id: string;
  visibleId: string;
  accountId: string;
  accountTag: string;
  accountAddress1: string;
  accountAddress2: string;
  accountCityStateZip: string;
  violationNumber: string;
  unit: string;
  violationDate: string;
  status: string;
  // Related records
  jobId: string;
  jobNumber: string;
  quote: string;
  estimateId: string;
  estimate: string;
  ticketId: string;
  ticket: string;
  testId: string;
  test: string;
  price: string;
  // Dates
  filePermit: string;
  permitApproved: string;
  neiDateSent: string;
  formsToDob: string;
  inspection: string;
  hearing: string;
  cureDueDate: string;
  formsToCust: string;
  recvFromCust: string;
  cancelContract: string;
  // Checkboxes and notes
  assignedDiv5: boolean;
  assignedDiv5Link: string;
  assignedDiv2: boolean;
  assignedDiv2Notes: string;
  jobCreated: boolean;
  assignedMod: boolean;
  assignedDiv1: boolean;
  assignedDiv3: boolean;
  assignedRepair: boolean;
  assignedCode: boolean;
  assignedCodeBldgResp: string;
  assignedDiv4: boolean;
  assignedDiv4Elv29Status: string;
  columbiaUniv: boolean;
  columbiaUnivDismissalDate: string;
  // Remarks
  remarks1: string;
  remarks2: string;
}

interface ViolationDetailProps {
  violationId: string;
  onClose: () => void;
}

export default function ViolationDetail({ violationId, onClose }: ViolationDetailProps) {
  const { openTab } = useTabs();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const [hasChanges, setHasChanges] = useState(false);

  const [violation, setViolation] = useState<ViolationData>({
    id: "",
    visibleId: "",
    accountId: "",
    accountTag: "",
    accountAddress1: "",
    accountAddress2: "",
    accountCityStateZip: "",
    violationNumber: "",
    unit: "",
    violationDate: "",
    status: "Dismissed",
    jobId: "",
    jobNumber: "",
    quote: "0",
    estimateId: "",
    estimate: "0",
    ticketId: "",
    ticket: "0",
    testId: "",
    test: "",
    price: "$0.00",
    filePermit: "",
    permitApproved: "",
    neiDateSent: "",
    formsToDob: "",
    inspection: "",
    hearing: "",
    cureDueDate: "",
    formsToCust: "",
    recvFromCust: "",
    cancelContract: "",
    assignedDiv5: false,
    assignedDiv5Link: "",
    assignedDiv2: false,
    assignedDiv2Notes: "",
    jobCreated: false,
    assignedMod: false,
    assignedDiv1: false,
    assignedDiv3: false,
    assignedRepair: false,
    assignedCode: false,
    assignedCodeBldgResp: "",
    assignedDiv4: false,
    assignedDiv4Elv29Status: "",
    columbiaUniv: false,
    columbiaUnivDismissalDate: "",
    remarks1: "",
    remarks2: "",
  });

  const [originalViolation, setOriginalViolation] = useState<ViolationData | null>(null);

  // Load violation data
  useEffect(() => {
    // Mock data
    const mockViolation: ViolationData = {
      id: violationId,
      visibleId: "105598",
      accountId: "66W38TH",
      accountTag: "66W38TH***",
      accountAddress1: "66 WEST 38TH STREET - GOTHAM ORG",
      accountAddress2: "66 WEST 38TH STREET",
      accountCityStateZip: "NEW YORK, NY 10018",
      violationNumber: "PERIODIC",
      unit: "",
      violationDate: "1/2/2025",
      status: "Dismissed",
      jobId: "197218",
      jobNumber: "197218",
      quote: "0",
      estimateId: "",
      estimate: "0",
      ticketId: "",
      ticket: "0",
      testId: "1",
      test: "Periodic",
      price: "$0.00",
      filePermit: "",
      permitApproved: "",
      neiDateSent: "1/6/2025",
      formsToDob: "1/29/2025",
      inspection: "",
      hearing: "",
      cureDueDate: "4/2/2025",
      formsToCust: "",
      recvFromCust: "",
      cancelContract: "",
      assignedDiv5: false,
      assignedDiv5Link: "",
      assignedDiv2: false,
      assignedDiv2Notes: "",
      jobCreated: true,
      assignedMod: true,
      assignedDiv1: false,
      assignedDiv3: false,
      assignedRepair: false,
      assignedCode: false,
      assignedCodeBldgResp: "",
      assignedDiv4: false,
      assignedDiv4Elv29Status: "",
      columbiaUniv: false,
      columbiaUnivDismissalDate: "",
      remarks1: "01/24/2024 AOC EFILED\n01/20/2025 TEST IN PROCESS ON DOB\n1/2025 WORK DONE. NEED AOC",
      remarks2: "01/28/2025 $160 (4 UNITS)",
    };

    setViolation(mockViolation);
    setOriginalViolation(mockViolation);
  }, [violationId]);

  // Track changes
  useEffect(() => {
    if (originalViolation) {
      setHasChanges(JSON.stringify(violation) !== JSON.stringify(originalViolation));
    }
  }, [violation, originalViolation]);

  const handleSave = async () => {
    setOriginalViolation({ ...violation });
    setHasChanges(false);
    await xpAlert("Violation saved successfully!");
  };

  const handleUndo = () => {
    if (originalViolation) {
      setViolation({ ...originalViolation });
      setHasChanges(false);
    }
  };

  // Navigation handlers
  const handleNavigateToAccount = () => {
    if (violation.accountId) {
      openTab(violation.accountTag, `/accounts/${violation.accountId}`);
    }
  };

  const handleNavigateToJob = () => {
    if (violation.jobId) {
      openTab(`Job ${violation.jobNumber}`, `/job-maintenance/${violation.jobId}`);
    }
  };

  const handleNavigateToEstimate = () => {
    if (violation.estimateId) {
      openTab(`Estimate ${violation.estimate}`, `/estimates/${violation.estimateId}`);
    }
  };

  const handleNavigateToTicket = () => {
    if (violation.ticketId) {
      openTab(`Ticket ${violation.ticket}`, `/dispatch/${violation.ticketId}`);
    }
  };

  const handleNavigateToTest = () => {
    if (violation.testId) {
      openTab(`Test ${violation.test}`, `/tests/${violation.testId}`);
    }
  };

  const statuses = ["Dismissed", "Work on Hold", "CONTRACT CANCELLED", "Open", "Pending"];

  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
        <span className="font-bold text-[12px]">
          Violation ID {violation.visibleId}: {violation.accountTag} (P2/1P41979), #{violation.violationNumber}
        </span>
        <button onClick={onClose} className="hover:bg-[#c0c0c0] hover:text-black px-2 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Menu Bar */}
      <div className="bg-white flex items-center px-1 py-0.5 border-b border-[#808080]">
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">File</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Tools</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Elm</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Move</span>
        <span className="px-2 py-0.5 hover:bg-[#e5e5e5] cursor-pointer text-[12px]">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#808080] gap-0.5">
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[12px] font-bold">1</span>
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Search className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080] disabled:opacity-50"
          title="Save"
        >
          <Save className="w-4 h-4" style={{ color: "#4a90d9" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[12px] font-bold" style={{ color: "#e74c3c" }}>✓</span>
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[12px] font-bold" style={{ color: "#27ae60" }}>✓</span>
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Printer className="w-4 h-4" style={{ color: "#34495e" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <Search className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <span className="text-[12px]" style={{ color: "#27ae60" }}>●</span>
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronsLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <ChevronsRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button onClick={onClose} className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]">
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-3">
        {/* Top Row - Account, Violation Info, Related Records */}
        <div className="flex gap-4 mb-4">
          {/* Account Section */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <label className="text-[11px] bg-[#ffff00] px-1 font-medium">Account</label>
              <input
                type="text"
                value={violation.accountTag}
                onClick={handleNavigateToAccount}
                readOnly
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white text-[#0000ff] cursor-pointer hover:underline w-[140px]"
              />
              <button className="px-1 border border-[#808080] bg-white text-[11px]">...</button>
            </div>
            <div className="border border-[#808080] bg-white p-2 min-h-[60px] w-[200px]">
              <div className="text-[11px]">{violation.accountAddress1}</div>
              <div className="text-[11px]">{violation.accountAddress2}</div>
              <div className="text-[11px]">{violation.accountCityStateZip}</div>
            </div>
          </div>

          {/* Violation Info Section */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className="w-20 text-[11px]">Violation ID</label>
              <input
                type="text"
                value={violation.visibleId}
                readOnly
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-[#f0f0f0] w-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-20 text-[11px]">Violation #</label>
              <input
                type="text"
                value={violation.violationNumber}
                onChange={(e) => setViolation({ ...violation, violationNumber: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-20 text-[11px]">Unit</label>
              <input
                type="text"
                value={violation.unit}
                onChange={(e) => setViolation({ ...violation, unit: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-20 text-[11px]">Violation Date</label>
              <input
                type="text"
                value={violation.violationDate}
                onChange={(e) => setViolation({ ...violation, violationDate: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
              <button className="px-1 border border-[#808080] bg-white text-[11px]">...</button>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-20 text-[11px]">Status</label>
              <select
                value={violation.status}
                onChange={(e) => setViolation({ ...violation, status: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[100px]"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Related Records Section */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className="w-16 text-[11px] text-[#0000ff]">Job</label>
              <span
                onClick={handleNavigateToJob}
                className="text-[11px] text-[#0000ff] cursor-pointer hover:underline"
              >
                {violation.jobNumber || "0"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 text-[11px]">Quote</label>
              <input
                type="text"
                value={violation.quote}
                onChange={(e) => setViolation({ ...violation, quote: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[60px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 text-[11px] text-[#0000ff]">Estimate</label>
              <span
                onClick={handleNavigateToEstimate}
                className="text-[11px] text-[#0000ff] cursor-pointer hover:underline"
              >
                {violation.estimate || "0"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 text-[11px] text-[#0000ff]">Ticket</label>
              <span
                onClick={handleNavigateToTicket}
                className="text-[11px] text-[#0000ff] cursor-pointer hover:underline"
              >
                {violation.ticket || "0"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 text-[11px] text-[#0000ff]">Test</label>
              <span
                onClick={handleNavigateToTest}
                className="text-[11px] text-[#0000ff] cursor-pointer hover:underline"
              >
                {violation.test || ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="w-16 text-[11px]">Price</label>
              <input
                type="text"
                value={violation.price}
                onChange={(e) => setViolation({ ...violation, price: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[60px]"
              />
            </div>
          </div>
        </div>

        {/* Middle Section - Dates and Checkboxes */}
        <div className="flex gap-8 mb-4">
          {/* Left - Dates */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className="w-24 text-[11px]">File Permit</label>
              <input
                type="text"
                value={violation.filePermit}
                onChange={(e) => setViolation({ ...violation, filePermit: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24 text-[11px]">Permit Approved</label>
              <input
                type="text"
                value={violation.permitApproved}
                onChange={(e) => setViolation({ ...violation, permitApproved: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24 text-[11px]">NEI DATE SENT</label>
              <input
                type="text"
                value={violation.neiDateSent}
                onChange={(e) => setViolation({ ...violation, neiDateSent: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24 text-[11px]">Forms to DOB</label>
              <input
                type="text"
                value={violation.formsToDob}
                onChange={(e) => setViolation({ ...violation, formsToDob: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24 text-[11px]">Inspection</label>
              <input
                type="text"
                value={violation.inspection}
                onChange={(e) => setViolation({ ...violation, inspection: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24 text-[11px]">Hearing</label>
              <input
                type="text"
                value={violation.hearing}
                onChange={(e) => setViolation({ ...violation, hearing: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24 text-[11px]">Cure / Due Date</label>
              <input
                type="text"
                value={violation.cureDueDate}
                onChange={(e) => setViolation({ ...violation, cureDueDate: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24 text-[11px]">Forms to Cust</label>
              <input
                type="text"
                value={violation.formsToCust}
                onChange={(e) => setViolation({ ...violation, formsToCust: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24 text-[11px]">Recv from Cust</label>
              <input
                type="text"
                value={violation.recvFromCust}
                onChange={(e) => setViolation({ ...violation, recvFromCust: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-24 text-[11px]">Cancel Contract</label>
              <input
                type="text"
                value={violation.cancelContract}
                onChange={(e) => setViolation({ ...violation, cancelContract: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[80px]"
              />
            </div>
          </div>

          {/* Middle - Checkboxes */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 w-28 text-[11px]">
                <input
                  type="checkbox"
                  checked={violation.assignedDiv5}
                  onChange={(e) => setViolation({ ...violation, assignedDiv5: e.target.checked })}
                />
                Assigned Div # 5
              </label>
              <label className="text-[11px] w-16">Link</label>
              <input
                type="text"
                value={violation.assignedDiv5Link}
                onChange={(e) => setViolation({ ...violation, assignedDiv5Link: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[100px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 w-28 text-[11px]">
                <input
                  type="checkbox"
                  checked={violation.assignedDiv2}
                  onChange={(e) => setViolation({ ...violation, assignedDiv2: e.target.checked })}
                />
                Assigned Div # 2
              </label>
              <label className="text-[11px] w-16">Notes</label>
              <input
                type="text"
                value={violation.assignedDiv2Notes}
                onChange={(e) => setViolation({ ...violation, assignedDiv2Notes: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[100px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 w-28 text-[11px]">
                <input
                  type="checkbox"
                  checked={violation.jobCreated}
                  onChange={(e) => setViolation({ ...violation, jobCreated: e.target.checked })}
                />
                Job Created
              </label>
              <div className="w-[132px]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 w-28 text-[11px]">
                <input
                  type="checkbox"
                  checked={violation.assignedMod}
                  onChange={(e) => setViolation({ ...violation, assignedMod: e.target.checked })}
                />
                Assigned Mod
              </label>
              <div className="w-[132px]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 w-28 text-[11px]">
                <input
                  type="checkbox"
                  checked={violation.assignedDiv1}
                  onChange={(e) => setViolation({ ...violation, assignedDiv1: e.target.checked })}
                />
                Assigned Div # 1
              </label>
              <div className="w-[132px]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 w-28 text-[11px]">
                <input
                  type="checkbox"
                  checked={violation.assignedDiv3}
                  onChange={(e) => setViolation({ ...violation, assignedDiv3: e.target.checked })}
                />
                Assigned Div # 3
              </label>
              <div className="w-[132px]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 w-28 text-[11px]">
                <input
                  type="checkbox"
                  checked={violation.assignedRepair}
                  onChange={(e) => setViolation({ ...violation, assignedRepair: e.target.checked })}
                />
                Assigned Repair
              </label>
              <div className="w-[132px]" />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 w-28 text-[11px]">
                <input
                  type="checkbox"
                  checked={violation.assignedCode}
                  onChange={(e) => setViolation({ ...violation, assignedCode: e.target.checked })}
                />
                Assigned Code
              </label>
              <label className="text-[11px] w-16">BLDG Resp</label>
              <input
                type="text"
                value={violation.assignedCodeBldgResp}
                onChange={(e) => setViolation({ ...violation, assignedCodeBldgResp: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[100px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 w-28 text-[11px]">
                <input
                  type="checkbox"
                  checked={violation.assignedDiv4}
                  onChange={(e) => setViolation({ ...violation, assignedDiv4: e.target.checked })}
                />
                Assigned Div # 4
              </label>
              <label className="text-[11px] w-16">ELV29 Status</label>
              <input
                type="text"
                value={violation.assignedDiv4Elv29Status}
                onChange={(e) => setViolation({ ...violation, assignedDiv4Elv29Status: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[100px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 w-28 text-[11px]">
                <input
                  type="checkbox"
                  checked={violation.columbiaUniv}
                  onChange={(e) => setViolation({ ...violation, columbiaUniv: e.target.checked })}
                />
                Columbia Univ
              </label>
              <label className="text-[11px] w-16">Dismissal Date</label>
              <input
                type="text"
                value={violation.columbiaUnivDismissalDate}
                onChange={(e) => setViolation({ ...violation, columbiaUnivDismissalDate: e.target.value })}
                className="px-1 py-0.5 border border-[#808080] text-[11px] bg-white w-[100px]"
              />
            </div>
          </div>
        </div>

        {/* Bottom Section - Remarks */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-[11px] font-medium">Remarks 1</label>
            <textarea
              value={violation.remarks1}
              onChange={(e) => setViolation({ ...violation, remarks1: e.target.value })}
              className="w-full px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[60px] mt-1"
            />
          </div>
          <div className="flex-1">
            <label className="text-[11px] font-medium">Remarks 2</label>
            <textarea
              value={violation.remarks2}
              onChange={(e) => setViolation({ ...violation, remarks2: e.target.value })}
              className="w-full px-1 py-0.5 border border-[#808080] text-[11px] bg-white resize-none min-h-[60px] mt-1"
            />
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#808080] px-2 py-1 flex items-center text-[11px]">
        <button
          className="px-4 py-1 border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px]"
        >
          EDIT
        </button>
        <span className="flex-1" />
        {hasChanges && <span className="text-[#c00] mr-4">Unsaved changes</span>}
      </div>
      <XPDialogComponent />
    </div>
  );
}
