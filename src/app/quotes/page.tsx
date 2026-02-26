"use client";

import { useState } from "react";
import { useTabs } from "@/context/TabContext";
import { usePermissions } from "@/context/PermissionsContext";

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
  convertedToEstimateId: string | null;
  convertedToEstimateNumber: string | null;
  salesRep: string;
}

// Mock quotes data
const mockQuotes: Quote[] = [
  {
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
    description: "Repair door operator on passenger elevator #3",
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
      { id: "li-001", description: "Door operator motor", quantity: 1, unitPrice: 1200, total: 1200 },
      { id: "li-002", description: "Labor - 2 technicians x 4 hours", quantity: 8, unitPrice: 125, total: 1000 },
      { id: "li-003", description: "Miscellaneous parts", quantity: 1, unitPrice: 350, total: 350 },
      { id: "li-004", description: "Travel/mobilization", quantity: 1, unitPrice: 300, total: 300 },
    ],
    terms: "Net 30",
    notes: "Emergency repair requested. Can schedule within 48 hours of approval.",
    convertedToEstimateId: null,
    convertedToEstimateNumber: null,
    salesRep: "Mike Johnson",
  },
  {
    id: "q-002",
    quoteNumber: "QUO-2024-0155",
    customerId: "cust-002",
    customerName: "Chrysler Building",
    accountId: "acc-002",
    accountName: "RXR Acquisition",
    premisesId: "prem-002",
    premisesAddress: "405 Lexington Ave, New York, NY 10174",
    contactName: "Sarah Williams",
    contactPhone: "(212) 555-5678",
    contactEmail: "swilliams@rxr.com",
    subject: "Annual Fire Service Recall Test",
    description: "Perform annual fire service recall testing on all elevators",
    status: "Accepted",
    createdDate: "2024-01-18",
    sentDate: "2024-01-18",
    expirationDate: "2024-02-17",
    validDays: 30,
    subtotal: 4500,
    taxRate: 8.875,
    tax: 399.38,
    total: 4899.38,
    lineItems: [
      { id: "li-005", description: "Fire service recall test - per elevator", quantity: 18, unitPrice: 250, total: 4500 },
    ],
    terms: "Due on completion",
    notes: "Testing to be coordinated with building fire safety director.",
    convertedToEstimateId: null,
    convertedToEstimateNumber: null,
    salesRep: "Mike Johnson",
  },
  {
    id: "q-003",
    quoteNumber: "QUO-2024-0154",
    customerId: "cust-003",
    customerName: "One World Trade Center",
    accountId: "acc-003",
    accountName: "Durst Organization",
    premisesId: "prem-003",
    premisesAddress: "285 Fulton St, New York, NY 10007",
    contactName: "Robert Chen",
    contactPhone: "(212) 555-9012",
    contactEmail: "rchen@durst.org",
    subject: "Cab Interior Lighting Upgrade",
    description: "Upgrade cab lighting to LED on service elevators",
    status: "Converted",
    createdDate: "2024-01-15",
    sentDate: "2024-01-15",
    expirationDate: "2024-02-14",
    validDays: 30,
    subtotal: 18500,
    taxRate: 8.875,
    tax: 1641.88,
    total: 20141.88,
    lineItems: [
      { id: "li-006", description: "LED lighting kit - per cab", quantity: 5, unitPrice: 2800, total: 14000 },
      { id: "li-007", description: "Installation labor - per cab", quantity: 5, unitPrice: 900, total: 4500 },
    ],
    terms: "50% deposit, 50% on completion",
    notes: "Customer requested formal estimate for budget approval.",
    convertedToEstimateId: "est-010",
    convertedToEstimateNumber: "EST-2024-010",
    salesRep: "Lisa Park",
  },
  {
    id: "q-004",
    quoteNumber: "QUO-2024-0153",
    customerId: "cust-004",
    customerName: "30 Rock Plaza",
    accountId: "acc-004",
    accountName: "Rockefeller Group",
    premisesId: "prem-004",
    premisesAddress: "30 Rockefeller Plaza, New York, NY 10112",
    contactName: "Amanda Torres",
    contactPhone: "(212) 555-3456",
    contactEmail: "atorres@rockefellergroup.com",
    subject: "Emergency Phone Line Repair",
    description: "Repair emergency phone lines in freight elevators",
    status: "Draft",
    createdDate: "2024-01-22",
    sentDate: null,
    expirationDate: "2024-02-21",
    validDays: 30,
    subtotal: 1650,
    taxRate: 8.875,
    tax: 146.44,
    total: 1796.44,
    lineItems: [
      { id: "li-008", description: "Phone line diagnostic", quantity: 2, unitPrice: 150, total: 300 },
      { id: "li-009", description: "Phone unit replacement", quantity: 2, unitPrice: 450, total: 900 },
      { id: "li-010", description: "Labor", quantity: 3, unitPrice: 150, total: 450 },
    ],
    terms: "Net 30",
    notes: "",
    convertedToEstimateId: null,
    convertedToEstimateNumber: null,
    salesRep: "Mike Johnson",
  },
  {
    id: "q-005",
    quoteNumber: "QUO-2024-0152",
    customerId: "cust-005",
    customerName: "MetLife Building",
    accountId: "acc-005",
    accountName: "Tishman Speyer",
    premisesId: "prem-005",
    premisesAddress: "200 Park Ave, New York, NY 10166",
    contactName: "David Kim",
    contactPhone: "(212) 555-7890",
    contactEmail: "dkim@tishmanspeyer.com",
    subject: "Hydraulic Fluid Service",
    description: "Hydraulic fluid analysis and top-off for freight elevator",
    status: "Expired",
    createdDate: "2023-12-01",
    sentDate: "2023-12-01",
    expirationDate: "2023-12-31",
    validDays: 30,
    subtotal: 850,
    taxRate: 8.875,
    tax: 75.44,
    total: 925.44,
    lineItems: [
      { id: "li-011", description: "Hydraulic fluid analysis", quantity: 1, unitPrice: 250, total: 250 },
      { id: "li-012", description: "Hydraulic fluid - gallons", quantity: 10, unitPrice: 45, total: 450 },
      { id: "li-013", description: "Labor", quantity: 1, unitPrice: 150, total: 150 },
    ],
    terms: "Net 30",
    notes: "Quote expired - customer did not respond",
    convertedToEstimateId: null,
    convertedToEstimateNumber: null,
    salesRep: "Lisa Park",
  },
  {
    id: "q-006",
    quoteNumber: "QUO-2024-0151",
    customerId: "cust-006",
    customerName: "432 Park Avenue",
    accountId: "acc-006",
    accountName: "CIM Group",
    premisesId: "prem-006",
    premisesAddress: "432 Park Ave, New York, NY 10022",
    contactName: "Jennifer Lee",
    contactPhone: "(212) 555-2345",
    contactEmail: "jlee@cimgroup.com",
    subject: "Pit Waterproofing",
    description: "Waterproof elevator pit - passenger elevator 2",
    status: "Rejected",
    createdDate: "2024-01-10",
    sentDate: "2024-01-10",
    expirationDate: "2024-02-09",
    validDays: 30,
    subtotal: 5200,
    taxRate: 8.875,
    tax: 461.50,
    total: 5661.50,
    lineItems: [
      { id: "li-014", description: "Pit preparation and cleaning", quantity: 1, unitPrice: 800, total: 800 },
      { id: "li-015", description: "Waterproofing membrane", quantity: 1, unitPrice: 2400, total: 2400 },
      { id: "li-016", description: "Labor - 2 days", quantity: 16, unitPrice: 125, total: 2000 },
    ],
    terms: "Net 30",
    notes: "Customer going with another vendor - price too high",
    convertedToEstimateId: null,
    convertedToEstimateNumber: null,
    salesRep: "Mike Johnson",
  },
];

type StatusFilter = "All" | "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired" | "Converted";

export default function QuotesPage() {
  const { openTab } = useTabs();
  const { isFieldAllowed } = usePermissions();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"createdDate" | "total" | "quoteNumber">("createdDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>(mockQuotes);

  // Filter and sort data
  const filteredQuotes = quotes
    .filter((quote) => {
      if (statusFilter !== "All" && quote.status !== statusFilter) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          quote.quoteNumber.toLowerCase().includes(search) ||
          quote.customerName.toLowerCase().includes(search) ||
          quote.subject.toLowerCase().includes(search) ||
          quote.contactName.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .sort((a, b) => {
      let aVal: string | number = a[sortField];
      let bVal: string | number = b[sortField];
      if (sortDirection === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

  // Calculate statistics
  const stats = {
    total: quotes.length,
    draft: quotes.filter((q) => q.status === "Draft").length,
    sent: quotes.filter((q) => q.status === "Sent").length,
    accepted: quotes.filter((q) => q.status === "Accepted").length,
    rejected: quotes.filter((q) => q.status === "Rejected").length,
    expired: quotes.filter((q) => q.status === "Expired").length,
    converted: quotes.filter((q) => q.status === "Converted").length,
    totalValue: quotes.reduce((sum, q) => sum + q.total, 0),
    acceptedValue: quotes
      .filter((q) => q.status === "Accepted" || q.status === "Converted")
      .reduce((sum, q) => sum + q.total, 0),
  };

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

  const handleSort = (field: "createdDate" | "total" | "quoteNumber") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleNewQuote = () => {
    openTab("New Quote", `/quotes/new`);
  };

  const handleEditQuote = () => {
    if (selectedQuote) {
      openTab(`Quote ${selectedQuote.quoteNumber}`, `/quotes/${selectedQuote.id}`);
    }
  };

  const handleDeleteQuote = () => {
    if (selectedQuote) {
      if (confirm(`Are you sure you want to delete quote ${selectedQuote.quoteNumber}?`)) {
        const updated = quotes.filter(q => q.id !== selectedQuote.id);
        setQuotes(updated);
        setSelectedQuote(null);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0]">
      {/* Header */}
      <div className="bg-[#d4d0c8] border-b border-[#808080] px-3 py-1.5 flex items-center justify-between">
        <h1 className="text-[13px] font-bold text-[#000]">Quotes</h1>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Search quotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-2 py-0.5 text-[11px] border border-[#808080] w-44"
          />
          <button
            onClick={handleNewQuote}
            className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
            style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
          >
            + New Quote
          </button>
          <button
            onClick={handleEditQuote}
            disabled={!selectedQuote}
            className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8] disabled:opacity-50"
            style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
          >
            Edit
          </button>
          <button
            onClick={handleDeleteQuote}
            disabled={!selectedQuote}
            className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8] disabled:opacity-50"
            style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
          >
            Delete
          </button>
          <button
            className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
            style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
          >
            Export
          </button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="bg-white border-b border-[#808080] px-3 py-2 flex items-center gap-6">
        <div className="text-[11px]">
          <span className="text-[#606060]">Total Quotes: </span>
          <span className="font-bold">{stats.total}</span>
        </div>
        <div className="text-[11px]">
          <span className="text-[#606060]">Total Value: </span>
          <span className="font-bold">{formatCurrency(stats.totalValue)}</span>
        </div>
        <div className="text-[11px]">
          <span className="text-[#606060]">Accepted/Converted Value: </span>
          <span className="font-bold text-[#155724]">{formatCurrency(stats.acceptedValue)}</span>
        </div>
        <div className="text-[11px]">
          <span className="text-[#606060]">Conversion Rate: </span>
          <span className="font-bold">
            {((stats.accepted + stats.converted) / (stats.total - stats.draft) * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-[#d4d0c8] border-b border-[#808080] px-3 py-1 flex items-center">
        <div className="flex gap-1">
          {(["All", "Draft", "Sent", "Accepted", "Rejected", "Expired", "Converted"] as StatusFilter[]).map(
            (status) => {
              const count =
                status === "All"
                  ? stats.total
                  : status === "Draft"
                  ? stats.draft
                  : status === "Sent"
                  ? stats.sent
                  : status === "Accepted"
                  ? stats.accepted
                  : status === "Rejected"
                  ? stats.rejected
                  : status === "Expired"
                  ? stats.expired
                  : stats.converted;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 text-[11px] border ${
                    statusFilter === status
                      ? "bg-white border-[#808080] border-b-white -mb-[1px] relative z-10"
                      : "bg-[#d4d0c8] border-[#808080] hover:bg-[#e8e8e8]"
                  }`}
                >
                  {status}
                  <span className="ml-1 text-[10px] text-[#606060]">({count})</span>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-[11px] border-collapse">
          <thead className="bg-[#d4d0c8] sticky top-0">
            <tr>
              {isFieldAllowed("quotes", "quoteNumber") && <th
                className="text-left px-2 py-1.5 border-b border-r border-[#808080] font-normal cursor-pointer hover:bg-[#c0c0c0]"
                onClick={() => handleSort("quoteNumber")}
              >
                Quote # {sortField === "quoteNumber" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>}
              {isFieldAllowed("quotes", "customerName") && <th className="text-left px-2 py-1.5 border-b border-r border-[#808080] font-normal">
                Customer
              </th>}
              {isFieldAllowed("quotes", "subject") && <th className="text-left px-2 py-1.5 border-b border-r border-[#808080] font-normal">
                Subject
              </th>}
              {isFieldAllowed("quotes", "contactName") && <th className="text-left px-2 py-1.5 border-b border-r border-[#808080] font-normal">
                Contact
              </th>}
              {isFieldAllowed("quotes", "total") && <th
                className="text-right px-2 py-1.5 border-b border-r border-[#808080] font-normal cursor-pointer hover:bg-[#c0c0c0]"
                onClick={() => handleSort("total")}
              >
                Total {sortField === "total" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>}
              {isFieldAllowed("quotes", "createdDate") && <th
                className="text-left px-2 py-1.5 border-b border-r border-[#808080] font-normal cursor-pointer hover:bg-[#c0c0c0]"
                onClick={() => handleSort("createdDate")}
              >
                Created {sortField === "createdDate" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>}
              {isFieldAllowed("quotes", "expirationDate") && <th className="text-left px-2 py-1.5 border-b border-r border-[#808080] font-normal">
                Expires
              </th>}
              {isFieldAllowed("quotes", "status") && <th className="text-center px-2 py-1.5 border-b border-r border-[#808080] font-normal w-24">
                Status
              </th>}
              {isFieldAllowed("quotes", "salesRep") && <th className="text-left px-2 py-1.5 border-b border-[#808080] font-normal">
                Sales Rep
              </th>}
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-8 text-[#606060]">
                  No quotes found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredQuotes.map((quote, index) => (
                <tr
                  key={quote.id}
                  onClick={() => setSelectedQuote(quote)}
                  className={`${
                    selectedQuote?.id === quote.id
                      ? "bg-[#0078d4] text-white"
                      : index % 2 === 0 ? "bg-white" : "bg-white"
                  } hover:bg-[#e8f4fc] cursor-pointer`}
                  onDoubleClick={() => openTab(`Quote ${quote.quoteNumber}`, `/quotes/${quote.id}`)}
                >
                  {isFieldAllowed("quotes", "quoteNumber") && <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">
                    <button
                      onClick={() => openTab(`Quote ${quote.quoteNumber}`, `/quotes/${quote.id}`)}
                      className="text-[#0066cc] hover:underline"
                    >
                      {quote.quoteNumber}
                    </button>
                  </td>}
                  {isFieldAllowed("quotes", "customerName") && <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">
                    <button
                      onClick={() => openTab(quote.customerName, `/customers/${quote.customerId}`)}
                      className="text-[#0066cc] hover:underline"
                    >
                      {quote.customerName}
                    </button>
                  </td>}
                  {isFieldAllowed("quotes", "subject") && <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">{quote.subject}</td>}
                  {isFieldAllowed("quotes", "contactName") && <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">{quote.contactName}</td>}
                  {isFieldAllowed("quotes", "total") && <td className="px-2 py-1 border-b border-r border-[#e0e0e0] text-right">
                    {formatCurrency(quote.total)}
                  </td>}
                  {isFieldAllowed("quotes", "createdDate") && <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">
                    {formatDate(quote.createdDate)}
                  </td>}
                  {isFieldAllowed("quotes", "expirationDate") && <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">
                    {formatDate(quote.expirationDate)}
                  </td>}
                  {isFieldAllowed("quotes", "status") && <td className="px-2 py-1 border-b border-r border-[#e0e0e0] text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </td>}
                  {isFieldAllowed("quotes", "salesRep") && <td className="px-2 py-1 border-b border-[#e0e0e0]">{quote.salesRep}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-[#d4d0c8] border-t border-[#808080] px-3 py-1.5 flex items-center justify-between">
        <span className="text-[10px] text-[#606060]">
          Showing {filteredQuotes.length} of {mockQuotes.length} quotes
        </span>
        <span className="text-[10px] text-[#606060]">
          Double-click or click Quote # to view details
        </span>
      </div>
    </div>
  );
}
