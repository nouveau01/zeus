"use client";

import { useState, useEffect } from "react";
import { ActivityHistory } from "@/components/ActivityHistory";
import { useTabs } from "@/context/TabContext";
import { useXPDialog } from "@/components/ui/XPDialog";
import { validateRequiredFields } from "@/lib/detail-registry/validation";
import { useRequiredFields } from "@/hooks/useRequiredFields";
import {
  FileText,
  Save,
  Trash2,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  Send,
  Award,
  Copy,
  Plus,
  HelpCircle,
  DollarSign,
} from "lucide-react";

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface EstimateData {
  id: string;
  estimateNumber: string;
  customerId: string;
  customerName: string;
  accountId: string;
  accountName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  description: string;
  status: string;
  createdDate: string;
  expirationDate: string;
  salesperson: string;
  probability: number;
  terms: string;
  notes: string;
  lineItems: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface EstimateDetailProps {
  estimateId: string;
  onClose: () => void;
}

export default function EstimateDetail({ estimateId, onClose }: EstimateDetailProps) {
  const { openTab } = useTabs();
  const { alert: xpAlert, DialogComponent: XPDialogComponent } = useXPDialog();
  const { layout: estimateLayout, fieldDefs: estimateFieldDefs, reqMark } = useRequiredFields("estimates-detail");
  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "lineItems" | "notes" | "history" | "activity">("details");
  const [selectedLineItem, setSelectedLineItem] = useState<string | null>(null);

  const statusOptions = ["Draft", "Sent", "Accepted", "Rejected", "Expired"];
  const salespeople = ["John Smith", "Mike Johnson", "Sarah Davis", "Tom Wilson"];

  useEffect(() => {
    // Mock data
    const mockEstimate: EstimateData = {
      id: estimateId,
      estimateNumber: "EST-2025-0142",
      customerId: "1",
      customerName: "195 B OWNER LLC",
      accountId: "195BROAD",
      accountName: "195 Broadway",
      address: "195 Broadway",
      city: "New York",
      state: "NY",
      zip: "10007",
      contactName: "Robert Chen",
      contactPhone: "(212) 555-0142",
      contactEmail: "rchen@195broadway.com",
      description: "Elevator modernization - Car 1 & 2",
      status: "Sent",
      createdDate: "01/15/2025",
      expirationDate: "02/15/2025",
      salesperson: "John Smith",
      probability: 75,
      terms: "Net 30",
      notes: "Customer requested quote for full modernization of passenger elevators 1 and 2. Include new controllers, door operators, and cab interiors. Existing machines to remain.",
      lineItems: [
        { id: "L1", description: "Controller replacement - Elevator 1", quantity: 1, unitPrice: 45000, total: 45000 },
        { id: "L2", description: "Controller replacement - Elevator 2", quantity: 1, unitPrice: 45000, total: 45000 },
        { id: "L3", description: "Door operator upgrade (pair)", quantity: 4, unitPrice: 8500, total: 34000 },
        { id: "L4", description: "Cab interior renovation", quantity: 2, unitPrice: 22000, total: 44000 },
        { id: "L5", description: "Installation labor", quantity: 1, unitPrice: 12000, total: 12000 },
        { id: "L6", description: "Permits and inspections", quantity: 1, unitPrice: 5000, total: 5000 },
      ],
      subtotal: 185000,
      taxRate: 0,
      taxAmount: 0,
      total: 185000,
    };

    setEstimate(mockEstimate);
  }, [estimateId]);

  const handleNavigateToCustomer = () => {
    if (estimate) {
      openTab(estimate.customerName, `/customers/${estimate.customerId}`);
    }
  };

  const handleNavigateToAccount = () => {
    if (estimate) {
      openTab(estimate.accountName, `/accounts/${estimate.accountId}`);
    }
  };

  const handleSave = async () => {
    if (estimate) {
      const formData: Record<string, any> = {
        estimateNumber: estimate.estimateNumber, status: estimate.status,
        expirationDate: estimate.expirationDate, salesperson: estimate.salesperson,
        probability: estimate.probability, description: estimate.description,
        taxRate: estimate.taxRate, terms: estimate.terms, notes: estimate.notes,
      };
      const missing = estimateLayout ? validateRequiredFields(estimateLayout, estimateFieldDefs, formData) : [];
      if (missing.length > 0) {
        await xpAlert(`Please fill in required fields: ${missing.join(", ")}`);
        return;
      }
    }
    // Save logic
  };

  const handleSendToCustomer = () => {
    if (estimate) {
      setEstimate({ ...estimate, status: "Sent" });
    }
  };

  const handleAwardJob = () => {
    if (estimate) {
      openTab(`New Job from ${estimate.estimateNumber}`, `/job-maintenance/new?estimateId=${estimate.id}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft": return "bg-[#f0f0f0] text-[#606060] border-[#c0c0c0]";
      case "Sent": return "bg-[#fff3cd] text-[#856404] border-[#ffc107]";
      case "Accepted": return "bg-[#d4edda] text-[#155724] border-[#28a745]";
      case "Rejected": return "bg-[#f8d7da] text-[#721c24] border-[#dc3545]";
      case "Expired": return "bg-[#e2e3e5] text-[#383d41] border-[#6c757d]";
      default: return "bg-[#f0f0f0] text-[#606060] border-[#c0c0c0]";
    }
  };

  if (!estimate) {
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
        <span className="font-bold text-[13px]">Estimate: {estimate.estimateNumber} - {estimate.customerName}</span>
        <div className="flex items-center gap-1">
          <button className="hover:bg-[#ffffff30] px-1 rounded text-[11px]">_</button>
          <button className="hover:bg-[#ffffff30] px-1 rounded text-[11px]">□</button>
          <button onClick={onClose} className="hover:bg-[#ff0000] px-1 rounded text-[11px]">×</button>
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
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]" title="New">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button onClick={handleSave} className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]" title="Save">
          <Save className="w-4 h-4" style={{ color: "#4a90d9" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]" title="Delete">
          <Trash2 className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button onClick={onClose} className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]" title="Close">
          <X className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]" title="Previous">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]" title="Next">
          <ChevronRight className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button onClick={handleSendToCustomer} className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]" title="Send to Customer">
          <Send className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button onClick={handleAwardJob} className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]" title="Award Job">
          <Award className="w-4 h-4" style={{ color: "#27ae60" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]" title="Duplicate">
          <Copy className="w-4 h-4" style={{ color: "#6b8cae" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]" title="Convert to Invoice">
          <DollarSign className="w-4 h-4" style={{ color: "#27ae60" }} />
        </button>
        <div className="w-px h-5 bg-[#808080] mx-1" />
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]" title="Print">
          <Printer className="w-4 h-4" style={{ color: "#34495e" }} />
        </button>
        <button className="w-[24px] h-[24px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#808080]" title="Help">
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>

        {/* Status badge */}
        <div className="ml-auto">
          <span className={`px-3 py-1 rounded border text-[11px] font-medium ${getStatusColor(estimate.status)}`}>
            {estimate.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white flex items-end px-2 pt-1 border-b border-[#808080]">
        {(["details", "lineItems", "notes", "history", "activity"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
              activeTab === tab
                ? "bg-white border-[#808080] border-b-white z-10 font-medium"
                : "bg-[#e0e0e0] border-[#808080] text-[#606060] hover:bg-[#f0f0f0]"
            }`}
          >
            {tab === "details" && "Details"}
            {tab === "lineItems" && "Line Items"}
            {tab === "notes" && "Notes"}
            {tab === "history" && "History"}
            {tab === "activity" && "Field History"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-3 bg-white">
        {activeTab === "details" && (
          <div className="flex gap-4">
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-3">
              {/* Estimate Info */}
              <div className="border border-[#808080] bg-white">
                <div className="bg-[#f0f0f0] px-2 py-1 border-b border-[#808080] font-medium text-[11px]">
                  Estimate Information
                </div>
                <div className="p-3 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[90px]">Estimate #{reqMark("estimateNumber")}</label>
                    <input
                      type="text"
                      value={estimate.estimateNumber}
                      readOnly
                      className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-[#f0f0f0]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[90px]">Status{reqMark("status")}</label>
                    <select
                      value={estimate.status}
                      onChange={(e) => setEstimate({ ...estimate, status: e.target.value })}
                      className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[90px]">Created</label>
                    <input
                      type="text"
                      value={estimate.createdDate}
                      readOnly
                      className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-[#f0f0f0]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[90px]">Expires{reqMark("expirationDate")}</label>
                    <input
                      type="text"
                      value={estimate.expirationDate}
                      onChange={(e) => setEstimate({ ...estimate, expirationDate: e.target.value })}
                      className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[90px]">Salesperson{reqMark("salesperson")}</label>
                    <select
                      value={estimate.salesperson}
                      onChange={(e) => setEstimate({ ...estimate, salesperson: e.target.value })}
                      className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                    >
                      {salespeople.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[90px]">Probability{reqMark("probability")}</label>
                    <input
                      type="number"
                      value={estimate.probability}
                      onChange={(e) => setEstimate({ ...estimate, probability: parseInt(e.target.value) || 0 })}
                      className="w-[60px] px-2 py-1 border border-[#808080] text-[11px] bg-white text-right"
                      min="0"
                      max="100"
                    />
                    <span className="text-[11px]">%</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <label className="text-[11px] w-[90px]">Description{reqMark("description")}</label>
                    <input
                      type="text"
                      value={estimate.description}
                      onChange={(e) => setEstimate({ ...estimate, description: e.target.value })}
                      className="flex-1 px-2 py-1 border border-[#808080] text-[11px] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Customer/Account Info */}
              <div className="border border-[#808080] bg-white">
                <div className="bg-[#f0f0f0] px-2 py-1 border-b border-[#808080] font-medium text-[11px]">
                  Customer & Account
                </div>
                <div className="p-3 grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[90px]">Customer</label>
                    <span
                      onClick={handleNavigateToCustomer}
                      className="flex-1 text-[#0000ff] cursor-pointer hover:underline text-[11px]"
                    >
                      {estimate.customerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[90px]">Account</label>
                    <span
                      onClick={handleNavigateToAccount}
                      className="flex-1 text-[#0000ff] cursor-pointer hover:underline text-[11px]"
                    >
                      {estimate.accountName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <label className="text-[11px] w-[90px]">Address</label>
                    <span className="text-[11px]">
                      {estimate.address}, {estimate.city}, {estimate.state} {estimate.zip}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[90px]">Contact</label>
                    <span className="text-[11px]">{estimate.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] w-[90px]">Phone</label>
                    <span className="text-[11px]">{estimate.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <label className="text-[11px] w-[90px]">Email</label>
                    <span className="text-[#0000ff] text-[11px] cursor-pointer hover:underline">{estimate.contactEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Totals */}
            <div className="w-[280px] flex flex-col gap-3">
              <div className="border border-[#808080] bg-white">
                <div className="bg-[#f0f0f0] px-2 py-1 border-b border-[#808080] font-medium text-[11px]">
                  Totals
                </div>
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px]">Subtotal</label>
                    <span className="text-[11px] font-medium">{formatCurrency(estimate.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px]">Tax ({estimate.taxRate}%){reqMark("taxRate")}</label>
                    <span className="text-[11px]">{formatCurrency(estimate.taxAmount)}</span>
                  </div>
                  <div className="border-t border-[#808080] pt-2 flex items-center justify-between">
                    <label className="text-[12px] font-bold">Total</label>
                    <span className="text-[14px] font-bold text-[#155724]">{formatCurrency(estimate.total)}</span>
                  </div>
                  <div className="border-t border-[#808080] pt-2 flex items-center justify-between">
                    <label className="text-[11px]">Weighted Value</label>
                    <span className="text-[11px] text-[#666]">{formatCurrency(estimate.total * estimate.probability / 100)}</span>
                  </div>
                </div>
              </div>

              <div className="border border-[#808080] bg-white">
                <div className="bg-[#f0f0f0] px-2 py-1 border-b border-[#808080] font-medium text-[11px]">
                  Terms{reqMark("terms")}
                </div>
                <div className="p-3">
                  <select
                    value={estimate.terms}
                    onChange={(e) => setEstimate({ ...estimate, terms: e.target.value })}
                    className="w-full px-2 py-1 border border-[#808080] text-[11px] bg-white"
                  >
                    <option value="Net 30">Net 30</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="50% Deposit">50% Deposit Required</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "lineItems" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[11px] flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Line Item
              </button>
              <button className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[11px]">
                Edit
              </button>
              <button className="px-3 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[11px]">
                Delete
              </button>
            </div>

            <div className="border border-[#808080] flex-1">
              <table className="w-full border-collapse text-[11px]">
                <thead className="bg-[#f0f0f0]">
                  <tr>
                    <th className="px-2 py-1.5 text-left font-medium border-b border-[#808080]" style={{ width: "50%" }}>Description</th>
                    <th className="px-2 py-1.5 text-right font-medium border-b border-[#808080]" style={{ width: "10%" }}>Qty</th>
                    <th className="px-2 py-1.5 text-right font-medium border-b border-[#808080]" style={{ width: "20%" }}>Unit Price</th>
                    <th className="px-2 py-1.5 text-right font-medium border-b border-[#808080]" style={{ width: "20%" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.lineItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedLineItem(item.id)}
                      className={`cursor-pointer ${
                        selectedLineItem === item.id
                          ? "bg-[#0078d4] text-white"
                          : "hover:bg-[#f0f8ff]"
                      }`}
                    >
                      <td className="px-2 py-1 border-b border-[#e0e0e0]">{item.description}</td>
                      <td className="px-2 py-1 border-b border-[#e0e0e0] text-right">{item.quantity}</td>
                      <td className="px-2 py-1 border-b border-[#e0e0e0] text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-2 py-1 border-b border-[#e0e0e0] text-right font-medium">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#f0f0f0]">
                  <tr>
                    <td colSpan={3} className="px-2 py-1.5 text-right font-bold border-t border-[#808080]">Subtotal:</td>
                    <td className="px-2 py-1.5 text-right font-bold border-t border-[#808080]">{formatCurrency(estimate.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-2 py-1 text-right">Tax:</td>
                    <td className="px-2 py-1 text-right">{formatCurrency(estimate.taxAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-2 py-1.5 text-right font-bold text-[12px]">Total:</td>
                    <td className="px-2 py-1.5 text-right font-bold text-[12px] text-[#155724]">{formatCurrency(estimate.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="flex flex-col gap-3">
            <div className="border border-[#808080] bg-white">
              <div className="bg-[#f0f0f0] px-2 py-1 border-b border-[#808080] font-medium text-[11px]">
                Internal Notes
              </div>
              <div className="p-2">
                <textarea
                  value={estimate.notes}
                  onChange={(e) => setEstimate({ ...estimate, notes: e.target.value })}
                  rows={8}
                  className="w-full px-2 py-1 border border-[#808080] text-[11px] resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="border border-[#808080]">
            <table className="w-full border-collapse text-[11px]">
              <thead className="bg-[#f0f0f0]">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium border-b border-[#808080]">Date</th>
                  <th className="px-2 py-1.5 text-left font-medium border-b border-[#808080]">User</th>
                  <th className="px-2 py-1.5 text-left font-medium border-b border-[#808080]">Action</th>
                  <th className="px-2 py-1.5 text-left font-medium border-b border-[#808080]">Details</th>
                </tr>
              </thead>
              <tbody>
                <tr className="hover:bg-[#f0f8ff]">
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">01/15/2025 2:30 PM</td>
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">John Smith</td>
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">Status Changed</td>
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">Draft → Sent</td>
                </tr>
                <tr className="hover:bg-[#f0f8ff]">
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">01/15/2025 10:15 AM</td>
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">John Smith</td>
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">Line Item Added</td>
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">Permits and inspections - $5,000</td>
                </tr>
                <tr className="hover:bg-[#f0f8ff]">
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">01/15/2025 9:00 AM</td>
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">John Smith</td>
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">Created</td>
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">Estimate created</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "activity" && estimate && (
          <ActivityHistory entityType="Estimate" entityId={estimate.id} />
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#808080] px-3 py-1 flex items-center text-[11px]">
        <span>Estimate: {estimate.estimateNumber}</span>
        <span className="mx-2">|</span>
        <span>Customer: {estimate.customerName}</span>
        <span className="mx-2">|</span>
        <span>Total: {formatCurrency(estimate.total)}</span>
        <span className="flex-1" />
        <span className={`px-2 py-0.5 rounded ${getStatusColor(estimate.status)}`}>
          {estimate.status}
        </span>
      </div>
      <XPDialogComponent />
    </div>
  );
}
