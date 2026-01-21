"use client";

import { useState, useEffect } from "react";
import { useTabs } from "@/context/TabContext";

interface Invoice {
  id: string;
  invoiceNumber: number;
  postingDate: string;
  date: string;
  type: string;
  terms: string | null;
  status: string;
  total: number;
  salesTax: number;
  remainingUnpaid: number;
  emailStatus: string | null;
  premises: {
    id: string;
    premisesId: string | null;
    address: string;
    city: string | null;
  } | null;
  job: {
    id: string;
    externalId: string | null;
    jobName: string;
  } | null;
}

const TYPE_TABS = ["All", "Maintenance", "Modernization", "Repair", "Other", "NEW REPAIR"];

export default function InvoicesPage() {
  const { openTab } = useTabs();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters - default to wide date range to show all invoices
  const [catalogue, setCatalogue] = useState("None");
  const [startDate, setStartDate] = useState("1980-01-01");
  const [endDate, setEndDate] = useState("2030-12-31");
  const [activeType, setActiveType] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // Load saved state from localStorage (but validate it)
  useEffect(() => {
    const saved = localStorage.getItem("invoicesPageState");
    if (saved) {
      try {
        const state = JSON.parse(saved);
        // Only restore activeType and catalogue, not date range
        // This ensures invoices are always visible on load
        if (state.activeType) setActiveType(state.activeType);
        if (state.catalogue) setCatalogue(state.catalogue);
      } catch (e) {
        console.error("Error loading saved state:", e);
      }
    }
    setFiltersLoaded(true);
  }, []);

  // Only save type and catalogue to localStorage (not date range)
  useEffect(() => {
    if (filtersLoaded) {
      localStorage.setItem(
        "invoicesPageState",
        JSON.stringify({ activeType, catalogue })
      );
    }
  }, [activeType, catalogue, filtersLoaded]);

  useEffect(() => {
    if (filtersLoaded) {
      fetchInvoices();
    }
  }, [startDate, endDate, activeType, filtersLoaded]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (activeType !== "All") params.set("type", activeType);

      const response = await fetch(`/api/invoices?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDoubleClick = (invoice: Invoice) => {
    openTab(`Invoice #${invoice.invoiceNumber}`, `/invoices/${invoice.id}`);
  };

  const formatCurrency = (amount: number) => {
    const value = Number(amount);
    if (value < 0) {
      return `($${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const setDateRange = (range: string) => {
    const today = new Date();
    const start = new Date();

    switch (range) {
      case "Day":
        start.setDate(today.getDate() - 1);
        break;
      case "Week":
        start.setDate(today.getDate() - 7);
        break;
      case "Month":
        start.setMonth(today.getMonth() - 1);
        break;
      case "Quarter":
        start.setMonth(today.getMonth() - 3);
        break;
      case "Year":
        start.setFullYear(today.getFullYear() - 1);
        break;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(today.toISOString().split("T")[0]);
  };

  // Filter invoices by search term
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.invoiceNumber.toString().includes(term) ||
      inv.premises?.premisesId?.toLowerCase().includes(term) ||
      inv.premises?.address?.toLowerCase().includes(term) ||
      inv.job?.externalId?.toLowerCase().includes(term)
    );
  });

  const selectedInvoice = invoices.find((inv) => inv.id === selectedId);

  return (
    <div
      className="h-full flex flex-col bg-[#f5f5f5]"
      style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}
    >
      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Pim</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center gap-1 px-2 py-1 border-b border-[#d0d0d0]">
        <button className="p-1 hover:bg-[#e0e0e0] rounded" title="New">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button className="p-1 hover:bg-[#e0e0e0] rounded" title="Edit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button className="p-1 hover:bg-[#e0e0e0] rounded" title="Delete">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="p-1 hover:bg-[#e0e0e0] rounded" title="Refresh" onClick={fetchInvoices}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-[#f5f5f5] flex items-center gap-4 px-2 py-2 border-b border-[#d0d0d0]">
        <div className="flex items-center gap-2">
          <span className="text-[11px]">F&S Catalogue</span>
          <select
            value={catalogue}
            onChange={(e) => setCatalogue(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white min-w-[100px]"
          >
            <option value="None">None</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px]">Start</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px]">End</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
          />
        </div>

        <div className="flex items-center gap-1">
          {["Day", "Week", "Month", "Quarter", "Year"].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className="px-2 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Type Tabs */}
      <div className="bg-[#f5f5f5] flex items-end px-2 pt-1 border-b border-[#d0d0d0]">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveType(tab)}
            className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
              activeType === tab
                ? "bg-white border-[#a0a0a0] border-b-white z-10 font-medium"
                : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-auto border border-[#a0a0a0] m-2 bg-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-gray-500">Loading...</span>
          </div>
        ) : (
          <table className="w-full border-collapse text-[12px]">
            <thead className="bg-[#f0f0f0] sticky top-0">
              <tr>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>Inv #</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "9%" }}>Date</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Type</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Job</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Account</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "20%" }}>Tag</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "9%" }}>Amount</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "7%" }}>Sales Tax</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "9%" }}>Total</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Remaining Unpaid</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>Status</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">EmailStatus</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => {
                  const amount = Number(invoice.total) - Number(invoice.salesTax);
                  const isNegative = amount < 0;

                  return (
                    <tr
                      key={invoice.id}
                      onClick={() => setSelectedId(invoice.id)}
                      onDoubleClick={() => handleDoubleClick(invoice)}
                      className={`cursor-pointer ${
                        selectedId === invoice.id
                          ? "bg-[#0078d4] text-white"
                          : "hover:bg-[#f0f8ff]"
                      }`}
                    >
                      <td className="px-2 py-1 border border-[#d0d0d0]">{invoice.invoiceNumber}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{formatDate(invoice.date)}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{invoice.type}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{invoice.job?.externalId || ""}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{invoice.premises?.premisesId || ""}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">
                        {invoice.premises?.address}
                        {invoice.premises?.city ? ` - ${invoice.premises.city}` : ""}
                      </td>
                      <td className={`px-2 py-1 text-right border border-[#d0d0d0] ${isNegative && selectedId !== invoice.id ? "text-red-600" : ""}`}>
                        {formatCurrency(amount)}
                      </td>
                      <td className="px-2 py-1 text-right border border-[#d0d0d0]">
                        {formatCurrency(Number(invoice.salesTax))}
                      </td>
                      <td className={`px-2 py-1 text-right border border-[#d0d0d0] ${Number(invoice.total) < 0 && selectedId !== invoice.id ? "text-red-600" : ""}`}>
                        {formatCurrency(Number(invoice.total))}
                      </td>
                      <td className={`px-2 py-1 text-right border border-[#d0d0d0] ${Number(invoice.remainingUnpaid) < 0 && selectedId !== invoice.id ? "text-red-600" : ""}`}>
                        {formatCurrency(Number(invoice.remainingUnpaid))}
                      </td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{invoice.status}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{invoice.emailStatus || "No Email Sent"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center justify-between text-[11px]">
        <span>{selectedInvoice ? `${selectedInvoice.premises?.address || ""}` : ""}</span>
        <div className="flex gap-4">
          <span>Totals Off</span>
          <span>Totals Off</span>
          <span>Totals Off</span>
        </div>
      </div>
    </div>
  );
}
