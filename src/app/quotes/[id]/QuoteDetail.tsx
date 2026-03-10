"use client";

import { useState } from "react";
import { ActivityHistory } from "@/components/ActivityHistory";
import { useTabs } from "@/context/TabContext";
import { useXPDialog } from "@/components/ui/XPDialog";
import { validateRequiredFields } from "@/lib/detail-registry/validation";
import { useRequiredFields } from "@/hooks/useRequiredFields";

interface QuoteLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customerName: string;
  accountId: string;
  accountName: string;
  premisesId: string;
  premisesAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  subject: string;
  description: string;
  status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired" | "Converted";
  createdDate: string;
  sentDate: string | null;
  expirationDate: string;
  validDays: number;
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  lineItems: QuoteLineItem[];
  terms: string;
  notes: string;
  internalNotes: string;
  convertedToEstimateId: string | null;
  convertedToEstimateNumber: string | null;
  salesRep: string;
  createdBy: string;
  lastModified: string;
  lastModifiedBy: string;
}

interface QuoteDetailProps {
  quoteId: string;
  onClose: () => void;
}

// Mock quote data
const mockQuoteDetail: Quote = {
  id: "q-001",
  quoteNumber: "QUO-2024-0156",
  customerId: "cust-001",
  customerName: "Empire State Building",
  accountId: "acc-001",
  accountName: "Empire State Realty Trust",
  premisesId: "prem-001",
  premisesAddress: "350 5th Ave, New York, NY 10118",
  contactName: "John Smith",
  contactPhone: "(212) 555-1234",
  contactEmail: "jsmith@esrt.com",
  subject: "Elevator Door Operator Repair",
  description: "Repair door operator on passenger elevator #3. Unit has been experiencing intermittent door closing issues and occasional reopening during operation. Inspection revealed worn door operator motor and drive components.",
  status: "Sent",
  createdDate: "2024-01-20",
  sentDate: "2024-01-20",
  expirationDate: "2024-02-19",
  validDays: 30,
  subtotal: 2850,
  taxRate: 8.875,
  tax: 252.94,
  total: 3102.94,
  lineItems: [
    { id: "li-001", description: "Door operator motor - Hollister-Whitney replacement", quantity: 1, unitPrice: 1200, total: 1200 },
    { id: "li-002", description: "Labor - 2 technicians x 4 hours", quantity: 8, unitPrice: 125, total: 1000 },
    { id: "li-003", description: "Miscellaneous parts (belts, rollers, fasteners)", quantity: 1, unitPrice: 350, total: 350 },
    { id: "li-004", description: "Travel/mobilization", quantity: 1, unitPrice: 300, total: 300 },
  ],
  terms: "Net 30",
  notes: "Emergency repair requested. Can schedule within 48 hours of approval. All work to be performed during regular business hours unless otherwise arranged.",
  internalNotes: "Customer has been with us for 5 years. Good payment history. Prioritize this work.",
  convertedToEstimateId: null,
  convertedToEstimateNumber: null,
  salesRep: "Mike Johnson",
  createdBy: "Mike Johnson",
  lastModified: "2024-01-20T14:30:00",
  lastModifiedBy: "Mike Johnson",
};

export default function QuoteDetail({ quoteId, onClose }: QuoteDetailProps) {
  const { openTab } = useTabs();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const { layout: quoteLayout, fieldDefs: quoteFieldDefs, reqMark } = useRequiredFields("quotes-detail");
  const [activeTab, setActiveTab] = useState<"details" | "lineItems" | "notes" | "history" | "activity">("details");
  const [quote] = useState<Quote>(mockQuoteDetail);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Draft":
        return "bg-[#e2e3e5] text-[#383d41]";
      case "Sent":
        return "bg-[#cce5ff] text-[#004085]";
      case "Accepted":
        return "bg-[#d4edda] text-[#155724]";
      case "Rejected":
        return "bg-[#f8d7da] text-[#721c24]";
      case "Expired":
        return "bg-[#fff3cd] text-[#856404]";
      case "Converted":
        return "bg-[#d1ecf1] text-[#0c5460]";
      default:
        return "bg-[#e2e3e5] text-[#383d41]";
    }
  };

  const handleConvertToEstimate = async () => {
    await xpAlert(`Quote ${quote.quoteNumber} would be converted to a formal Estimate.\n\nThis would:\n1. Create a new Estimate with all line items\n2. Link the Quote to the Estimate\n3. Update Quote status to "Converted"`);
  };

  const handleSendQuote = async () => {
    await xpAlert(`Quote ${quote.quoteNumber} would be emailed to:\n${quote.contactName}\n${quote.contactEmail}`);
  };

  const handlePrint = async () => {
    await xpAlert("Print quote dialog would open");
  };

  const handleDuplicate = async () => {
    await xpAlert(`A copy of Quote ${quote.quoteNumber} would be created as a new Draft`);
  };

  // Mock history
  const quoteHistory = [
    { date: "2024-01-20T14:30:00", action: "Quote sent to customer", user: "Mike Johnson" },
    { date: "2024-01-20T14:25:00", action: "Quote marked as ready to send", user: "Mike Johnson" },
    { date: "2024-01-20T10:15:00", action: "Line items updated", user: "Mike Johnson" },
    { date: "2024-01-20T09:45:00", action: "Quote created", user: "Mike Johnson" },
  ];

  const tabs = [
    { id: "details", label: "Details" },
    { id: "lineItems", label: "Line Items" },
    { id: "notes", label: "Notes" },
    { id: "history", label: "History" },
    { id: "activity", label: "Field History" },
  ];

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0]">
      {/* Header */}
      <div className="bg-[#d4d0c8] border-b border-[#808080] px-3 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[13px] font-bold text-[#000]">Quote: {quote.quoteNumber}</h1>
          <span className={`px-2 py-0.5 rounded text-[11px] ${getStatusColor(quote.status)}`}>
            {quote.status}
          </span>
        </div>
        <div className="flex gap-1">
          {quote.status === "Draft" && (
            <button
              onClick={handleSendQuote}
              className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
              style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
            >
              Send Quote
            </button>
          )}
          {(quote.status === "Sent" || quote.status === "Accepted") && !quote.convertedToEstimateId && (
            <button
              onClick={handleConvertToEstimate}
              className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
              style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
            >
              Convert to Estimate
            </button>
          )}
          <button
            onClick={handleDuplicate}
            className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
            style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
          >
            Duplicate
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
            style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
            style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Quick Info Bar */}
      <div className="bg-white border-b border-[#808080] px-3 py-2 flex items-center gap-6 text-[11px]">
        <div>
          <span className="text-[#606060]">Customer: </span>
          <button
            onClick={() => openTab(quote.customerName, `/customers/${quote.customerId}`)}
            className="text-[#0066cc] hover:underline"
          >
            {quote.customerName}
          </button>
        </div>
        <div>
          <span className="text-[#606060]">Account: </span>
          <button
            onClick={() => openTab(quote.accountName, `/accounts/${quote.accountId}`)}
            className="text-[#0066cc] hover:underline"
          >
            {quote.accountName}
          </button>
        </div>
        <div>
          <span className="text-[#606060]">Total: </span>
          <span className="font-bold">{formatCurrency(quote.total)}</span>
        </div>
        {quote.convertedToEstimateNumber && (
          <div>
            <span className="text-[#606060]">Estimate: </span>
            <button
              onClick={() => openTab(`Estimate ${quote.convertedToEstimateNumber}`, `/estimates/${quote.convertedToEstimateId}`)}
              className="text-[#0066cc] hover:underline"
            >
              {quote.convertedToEstimateNumber}
            </button>
          </div>
        )}
        <div className="ml-auto">
          <span className="text-[#606060]">Created: </span>
          <span>{formatDate(quote.createdDate)}</span>
        </div>
        <div>
          <span className="text-[#606060]">Expires: </span>
          <span>{formatDate(quote.expirationDate)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#d4d0c8] border-b border-[#808080] px-3 flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-1.5 text-[11px] border-t border-l border-r ${
              activeTab === tab.id
                ? "bg-white border-[#808080] -mb-[1px] relative z-10"
                : "bg-[#d4d0c8] border-transparent hover:bg-[#e8e8e8]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-3">
        {activeTab === "details" && (
          <div className="flex gap-4">
            {/* Left Column - Quote Info */}
            <div
              className="flex-1 bg-white border border-[#808080] p-3"
              style={{ boxShadow: "inset -1px -1px 0 #fff, inset 1px 1px 0 #404040" }}
            >
              <h2 className="text-[12px] font-bold text-[#000] mb-3 pb-1 border-b border-[#c0c0c0]">
                Quote Information
              </h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
                <div>
                  <span className="text-[#606060]">Quote Number:{reqMark("quoteNumber")}</span>
                  <span className="ml-2 font-medium">{quote.quoteNumber}</span>
                </div>
                <div>
                  <span className="text-[#606060]">Status:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded text-[10px] ${getStatusColor(quote.status)}`}>
                    {quote.status}
                  </span>
                </div>
                <div>
                  <span className="text-[#606060]">Subject:{reqMark("subject")}</span>
                  <span className="ml-2">{quote.subject}</span>
                </div>
                <div>
                  <span className="text-[#606060]">Sales Rep:</span>
                  <span className="ml-2">{quote.salesRep}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#606060]">Description:{reqMark("description")}</span>
                  <p className="mt-1 text-[#000]">{quote.description}</p>
                </div>
                <div>
                  <span className="text-[#606060]">Created:</span>
                  <span className="ml-2">{formatDate(quote.createdDate)}</span>
                </div>
                <div>
                  <span className="text-[#606060]">Sent:</span>
                  <span className="ml-2">{formatDate(quote.sentDate)}</span>
                </div>
                <div>
                  <span className="text-[#606060]">Expires:{reqMark("expirationDate")}</span>
                  <span className="ml-2">{formatDate(quote.expirationDate)}</span>
                </div>
                <div>
                  <span className="text-[#606060]">Valid Days:</span>
                  <span className="ml-2">{quote.validDays}</span>
                </div>
                <div>
                  <span className="text-[#606060]">Terms:{reqMark("terms")}</span>
                  <span className="ml-2">{quote.terms}</span>
                </div>
              </div>
            </div>

            {/* Right Column - Contact & Location */}
            <div className="w-[320px] flex-shrink-0 space-y-3">
              {/* Contact Info */}
              <div
                className="bg-white border border-[#808080] p-3"
                style={{ boxShadow: "inset -1px -1px 0 #fff, inset 1px 1px 0 #404040" }}
              >
                <h2 className="text-[12px] font-bold text-[#000] mb-3 pb-1 border-b border-[#c0c0c0]">
                  Contact
                </h2>
                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-[#606060]">Name:</span>
                    <span className="ml-2">{quote.contactName}</span>
                  </div>
                  <div>
                    <span className="text-[#606060]">Phone:</span>
                    <span className="ml-2">{quote.contactPhone}</span>
                  </div>
                  <div>
                    <span className="text-[#606060]">Email:</span>
                    <span className="ml-2 text-[#0066cc]">{quote.contactEmail}</span>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div
                className="bg-white border border-[#808080] p-3"
                style={{ boxShadow: "inset -1px -1px 0 #fff, inset 1px 1px 0 #404040" }}
              >
                <h2 className="text-[12px] font-bold text-[#000] mb-3 pb-1 border-b border-[#c0c0c0]">
                  Location
                </h2>
                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="text-[#606060]">Customer:</span>
                    <button
                      onClick={() => openTab(quote.customerName, `/customers/${quote.customerId}`)}
                      className="ml-2 text-[#0066cc] hover:underline"
                    >
                      {quote.customerName}
                    </button>
                  </div>
                  <div>
                    <span className="text-[#606060]">Address:</span>
                    <span className="ml-2">{quote.premisesAddress}</span>
                  </div>
                </div>
              </div>

              {/* Totals */}
              <div
                className="bg-white border border-[#808080] p-3"
                style={{ boxShadow: "inset -1px -1px 0 #fff, inset 1px 1px 0 #404040" }}
              >
                <h2 className="text-[12px] font-bold text-[#000] mb-3 pb-1 border-b border-[#c0c0c0]">
                  Totals
                </h2>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#606060]">Subtotal:</span>
                    <span>{formatCurrency(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#606060]">Tax ({quote.taxRate}%):{reqMark("taxRate")}</span>
                    <span>{formatCurrency(quote.tax)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#c0c0c0] font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(quote.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "lineItems" && (
          <div
            className="bg-white border border-[#808080]"
            style={{ boxShadow: "inset -1px -1px 0 #fff, inset 1px 1px 0 #404040" }}
          >
            <div className="bg-[#d4d0c8] px-3 py-1.5 border-b border-[#808080] flex items-center justify-between">
              <span className="text-[11px] font-bold">Line Items</span>
              <button
                className="px-2 py-0.5 text-[10px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
                style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
              >
                + Add Item
              </button>
            </div>
            <table className="w-full text-[11px]">
              <thead className="bg-white">
                <tr>
                  <th className="text-left px-3 py-1.5 border-b border-[#e0e0e0] font-normal w-8">#</th>
                  <th className="text-left px-3 py-1.5 border-b border-[#e0e0e0] font-normal">Description</th>
                  <th className="text-right px-3 py-1.5 border-b border-[#e0e0e0] font-normal w-20">Qty</th>
                  <th className="text-right px-3 py-1.5 border-b border-[#e0e0e0] font-normal w-28">Unit Price</th>
                  <th className="text-right px-3 py-1.5 border-b border-[#e0e0e0] font-normal w-28">Total</th>
                  <th className="text-center px-3 py-1.5 border-b border-[#e0e0e0] font-normal w-16">Actions</th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}>
                    <td className="px-3 py-1.5 border-b border-[#e0e0e0] text-[#606060]">{index + 1}</td>
                    <td className="px-3 py-1.5 border-b border-[#e0e0e0]">{item.description}</td>
                    <td className="px-3 py-1.5 border-b border-[#e0e0e0] text-right">{item.quantity}</td>
                    <td className="px-3 py-1.5 border-b border-[#e0e0e0] text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-3 py-1.5 border-b border-[#e0e0e0] text-right font-medium">{formatCurrency(item.total)}</td>
                    <td className="px-3 py-1.5 border-b border-[#e0e0e0] text-center">
                      <button className="text-[#0066cc] hover:underline mr-2">Edit</button>
                      <button className="text-[#cc0000] hover:underline">Del</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white">
                <tr>
                  <td colSpan={4} className="px-3 py-1.5 text-right font-medium">Subtotal:</td>
                  <td className="px-3 py-1.5 text-right font-medium">{formatCurrency(quote.subtotal)}</td>
                  <td></td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-3 py-1.5 text-right">Tax ({quote.taxRate}%):</td>
                  <td className="px-3 py-1.5 text-right">{formatCurrency(quote.tax)}</td>
                  <td></td>
                </tr>
                <tr className="font-bold">
                  <td colSpan={4} className="px-3 py-1.5 text-right border-t border-[#808080]">Total:</td>
                  <td className="px-3 py-1.5 text-right border-t border-[#808080]">{formatCurrency(quote.total)}</td>
                  <td className="border-t border-[#808080]"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-3">
            {/* Customer Notes */}
            <div
              className="bg-white border border-[#808080] p-3"
              style={{ boxShadow: "inset -1px -1px 0 #fff, inset 1px 1px 0 #404040" }}
            >
              <h2 className="text-[12px] font-bold text-[#000] mb-2">Customer Notes{reqMark("notes")}</h2>
              <p className="text-[11px] text-[#606060] mb-2">These notes will appear on the quote sent to customer</p>
              <textarea
                className="w-full h-24 px-2 py-1 text-[11px] border border-[#808080] resize-none"
                defaultValue={quote.notes}
              />
            </div>

            {/* Internal Notes */}
            <div
              className="bg-white border border-[#808080] p-3"
              style={{ boxShadow: "inset -1px -1px 0 #fff, inset 1px 1px 0 #404040" }}
            >
              <h2 className="text-[12px] font-bold text-[#000] mb-2">Internal Notes{reqMark("internalNotes")}</h2>
              <p className="text-[11px] text-[#606060] mb-2">These notes are for internal use only</p>
              <textarea
                className="w-full h-24 px-2 py-1 text-[11px] border border-[#808080] resize-none"
                defaultValue={quote.internalNotes}
              />
            </div>

            {/* Terms */}
            <div
              className="bg-white border border-[#808080] p-3"
              style={{ boxShadow: "inset -1px -1px 0 #fff, inset 1px 1px 0 #404040" }}
            >
              <h2 className="text-[12px] font-bold text-[#000] mb-2">Payment Terms</h2>
              <select className="px-2 py-1 text-[11px] border border-[#808080]" defaultValue={quote.terms}>
                <option value="Due on receipt">Due on receipt</option>
                <option value="Due on completion">Due on completion</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="50% deposit, 50% on completion">50% deposit, 50% on completion</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                className="px-4 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
                style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
              >
                Save Notes
              </button>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div
            className="bg-white border border-[#808080]"
            style={{ boxShadow: "inset -1px -1px 0 #fff, inset 1px 1px 0 #404040" }}
          >
            <div className="bg-[#d4d0c8] px-3 py-1.5 border-b border-[#808080]">
              <span className="text-[11px] font-bold">Quote History</span>
            </div>
            <div className="divide-y divide-[#e0e0e0]">
              {quoteHistory.map((entry, index) => (
                <div key={index} className="px-3 py-2 flex items-start gap-4">
                  <div className="text-[10px] text-[#606060] w-36 flex-shrink-0">
                    {formatDateTime(entry.date)}
                  </div>
                  <div className="flex-1 text-[11px]">{entry.action}</div>
                  <div className="text-[11px] text-[#606060]">{entry.user}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "activity" && quote && (
          <ActivityHistory entityType="Quote" entityId={quote.id} />
        )}
      </div>

      {/* Footer */}
      <div className="bg-[#d4d0c8] border-t border-[#808080] px-3 py-1.5 flex items-center justify-between text-[10px] text-[#606060]">
        <span>Last modified: {formatDateTime(quote.lastModified)} by {quote.lastModifiedBy}</span>
        <span>Quote ID: {quote.id}</span>
      </div>
      <XPDialogComponent />
    </div>
  );
}
