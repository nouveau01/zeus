"use client";

import { useState } from "react";
import {
  FileText,
  SpellCheck,
  Home,
  HelpCircle,
} from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function ProcessContractsPage() {
  const currentDate = new Date();
  const [forMonth, setForMonth] = useState(MONTHS[currentDate.getMonth()]);
  const [forYear, setForYear] = useState(currentDate.getFullYear().toString());
  const [cycle, setCycle] = useState("All");
  const [frequency, setFrequency] = useState("ALL");
  const [postingDate, setPostingDate] = useState(currentDate.toISOString().split("T")[0]);
  const [invoiceDate, setInvoiceDate] = useState(currentDate.toISOString().split("T")[0]);
  const [salesTaxEnabled, setSalesTaxEnabled] = useState(true);
  const [salesTaxFactor, setSalesTaxFactor] = useState("100.00");

  const [generateZeroAmount, setGenerateZeroAmount] = useState(false);
  const [processExpired, setProcessExpired] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState("Upon Receipt");
  const [specialHandling, setSpecialHandling] = useState("All");
  const [accountRange, setAccountRange] = useState("All");
  const [lineItemDesc, setLineItemDesc] = useState("Enter Text Below");

  const [description, setDescription] = useState(
    "Preventative maintenance service for the period of @P per\nyour contract @J."
  );

  const lastRunDate = "1/1/2026";

  // Generate year options (current year +/- 5 years)
  const yearOptions = [];
  for (let y = currentDate.getFullYear() - 5; y <= currentDate.getFullYear() + 5; y++) {
    yearOptions.push(y.toString());
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <SpellCheck className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Home className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-auto p-4 bg-[#f5f5f5]">
        <div className="flex gap-8">
          {/* Left Column */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <label className="w-24 text-[12px]">For Month</label>
              <select
                value={forMonth}
                onChange={(e) => setForMonth(e.target.value)}
                className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[120px]"
              >
                {MONTHS.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-24 text-[12px]">For Year</label>
              <select
                value={forYear}
                onChange={(e) => setForYear(e.target.value)}
                className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[120px]"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-24 text-[12px]">Cycle</label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[120px]"
              >
                <option value="All">All</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-24 text-[12px]">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[120px]"
              >
                <option value="ALL">ALL</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Semi-Annual">Semi-Annual</option>
                <option value="Annual">Annual</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-24 text-[12px]">Posting Date</label>
              <input
                type="date"
                value={postingDate}
                onChange={(e) => setPostingDate(e.target.value)}
                className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[120px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-24 text-[12px]">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[120px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-24 text-[12px]">Sales Tax/Factor</label>
              <input
                type="checkbox"
                checked={salesTaxEnabled}
                onChange={(e) => setSalesTaxEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <input
                type="text"
                value={salesTaxFactor}
                onChange={(e) => setSalesTaxFactor(e.target.value)}
                disabled={!salesTaxEnabled}
                className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[80px] text-right"
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <label className="w-40 text-[12px]">Generate Zero Amount Invoices</label>
              <input
                type="checkbox"
                checked={generateZeroAmount}
                onChange={(e) => setGenerateZeroAmount(e.target.checked)}
                className="w-4 h-4"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-40 text-[12px]">Process Expired Contracts</label>
              <input
                type="checkbox"
                checked={processExpired}
                onChange={(e) => setProcessExpired(e.target.checked)}
                className="w-4 h-4"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="w-40 text-[12px]">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[140px]"
              >
                <option value="Upon Receipt">Upon Receipt</option>
                <option value="Net 10 Days">Net 10 Days</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
                <option value="Net 45 Days">Net 45 Days</option>
                <option value="Net 60 Days">Net 60 Days</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-40 text-[12px]">Special Handling</label>
              <select
                value={specialHandling}
                onChange={(e) => setSpecialHandling(e.target.value)}
                className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[140px]"
              >
                <option value="All">All</option>
                <option value="None">None</option>
                <option value="Special">Special</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="w-40 text-[12px]">Account Processing Range</label>
              <select
                value={accountRange}
                onChange={(e) => setAccountRange(e.target.value)}
                className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[140px]"
              >
                <option value="All">All</option>
                <option value="A-M">A-M</option>
                <option value="N-Z">N-Z</option>
              </select>
            </div>

            <div className="h-6" /> {/* Spacer */}

            <div className="flex items-center gap-2">
              <label className="w-40 text-[12px]">Line Item Description</label>
              <select
                value={lineItemDesc}
                onChange={(e) => setLineItemDesc(e.target.value)}
                className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[140px]"
              >
                <option value="Enter Text Below">Enter Text Below</option>
                <option value="Use Contract Description">Use Contract Description</option>
                <option value="Use Account Name">Use Account Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-6">
          <label className="text-[12px] font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mt-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white h-24 resize-none"
            style={{ maxWidth: "450px" }}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center text-[11px]">
        <span>Contracts were last run on {lastRunDate}</span>
      </div>
    </div>
  );
}
