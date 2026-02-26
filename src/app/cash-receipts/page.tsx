"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Pencil,
  Copy,
  X,
  Scissors,
  Filter,
  Check,
  BarChart3,
  Calculator,
  Lock,
  Home,
  HelpCircle,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { SavedFiltersDropdown } from "@/components/SavedFiltersDropdown";

interface BankAccount {
  id: string;
  name: string;
  type: string;
}

interface CashReceipt {
  id: string;
  refNumber: number;
  date: string;
  description: string | null;
  amount: number;
  bankAccount: {
    id: string;
    name: string;
    type: string;
  };
}

export default function CashReceiptsPage() {
  const { openTab } = useTabs();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [cashReceipts, setCashReceipts] = useState<CashReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  // Date filters - default to current week
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const [startDate, setStartDate] = useState(weekStart.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(weekEnd.toISOString().split("T")[0]);

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    fetchCashReceipts();
  }, [startDate, endDate, selectedTab]);

  const fetchBankAccounts = async () => {
    try {
      const response = await fetch("/api/bank-accounts");
      if (response.ok) {
        const data = await response.json();
        setBankAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
    }
  };

  const fetchCashReceipts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (selectedTab !== "all") params.append("bankAccountId", selectedTab);
      const response = await fetch(`/api/cash-receipts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCashReceipts(data);
        // Select first row by default
        if (data.length > 0 && !selectedRow) {
          setSelectedRow(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching cash receipts:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDateInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  // Quick date range handlers
  const setDateRange = (range: string) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
      case "Day":
        start = new Date(now);
        end = new Date(now);
        break;
      case "Week":
        start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case "Month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "Quarter":
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case "Year":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  // Calculate totals
  const filteredReceipts = selectedTab === "all"
    ? cashReceipts
    : cashReceipts.filter((r) => r.bankAccount.id === selectedTab);

  const totalAmount = filteredReceipts.reduce((sum, r) => sum + Number(r.amount), 0);
  const depositCount = filteredReceipts.length;

  // Get selected receipt for status bar
  const selectedReceipt = cashReceipts.find((r) => r.id === selectedRow);

  // CRUD handlers
  const handleNewDeposit = () => {
    openTab("New Deposit", `/cash-receipts/new`);
  };

  const handleEditDeposit = () => {
    if (selectedRow) {
      const receipt = displayReceipts.find(r => r.id === selectedRow);
      if (receipt) {
        openTab(`Editing Deposit #${receipt.refNumber}`, `/cash-receipts/${receipt.id}`);
      }
    }
  };

  const handleDeleteDeposit = async () => {
    if (selectedRow) {
      const receipt = displayReceipts.find(r => r.id === selectedRow);
      if (receipt && confirm(`Are you sure you want to delete deposit #${receipt.refNumber}?`)) {
        try {
          const response = await fetch(`/api/cash-receipts/${selectedRow}`, { method: "DELETE" });
          if (response.ok) {
            setSelectedRow(null);
            fetchCashReceipts();
          }
        } catch (error) {
          console.error("Error deleting deposit:", error);
        }
      }
    }
  };

  // Mock data for display since we don't have real data yet
  const mockReceipts: CashReceipt[] = [
    { id: "1", refNumber: 25747, date: "2025-10-02", description: "10.01.2025 NEI Acco", amount: 59730.11, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "2", refNumber: 25749, date: "2025-10-02", description: "Deposit", amount: 320604.25, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "3", refNumber: 25750, date: "2025-10-03", description: "Deposit", amount: 502823.20, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "4", refNumber: 25751, date: "2025-10-03", description: "Deposit", amount: 433559.91, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "5", refNumber: 25752, date: "2025-10-06", description: "Deposit", amount: 258742.11, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "6", refNumber: 25753, date: "2025-10-06", description: "Deposit", amount: 167745.05, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "7", refNumber: 25754, date: "2025-10-06", description: "Deposit", amount: 125296.17, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "8", refNumber: 25755, date: "2025-10-06", description: "NEI Invoices 10.02.2", amount: 55012.68, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "9", refNumber: 25756, date: "2025-10-07", description: "Deposit", amount: 81762.52, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "10", refNumber: 25757, date: "2025-10-07", description: "Deposit", amount: 80427.05, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "11", refNumber: 25758, date: "2025-10-08", description: "Deposit", amount: 19438.55, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "12", refNumber: 25759, date: "2025-10-08", description: "Deposit Correction - C", amount: 0.00, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "13", refNumber: 25760, date: "2025-10-08", description: "10.03.2025 NEI Acco", amount: 545020.00, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "14", refNumber: 25761, date: "2025-10-08", description: "10.06.2025 NEI Acco", amount: 478798.26, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "15", refNumber: 25762, date: "2025-10-08", description: "10.07.2025 NEI Acco", amount: 124468.95, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "16", refNumber: 25766, date: "2025-10-02", description: "St Lukes Payve Depo", amount: 12718.02, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "17", refNumber: 25767, date: "2025-10-02", description: "NoShore Payve Depo", amount: 10533.63, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "18", refNumber: 25809, date: "2025-10-08", description: "N-FL loan Repaymen", amount: 500000.00, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
    { id: "19", refNumber: 25823, date: "2025-10-06", description: "Northwell Deposit", amount: 52481.41, bankAccount: { id: "1", name: "Checking-NEI", type: "Checking" } },
  ];

  // Use mock data if no real data
  const displayReceipts = cashReceipts.length > 0 ? cashReceipts : mockReceipts;
  const displayTotal = displayReceipts.reduce((sum, r) => sum + Number(r.amount), 0);
  const displayCount = displayReceipts.length;

  // Mock bank accounts for tabs
  const mockBankAccounts = [
    { id: "1", name: "Checking-NEI", type: "Checking" },
    { id: "2", name: "Payroll-NEI", type: "Payroll" },
  ];

  const displayBankAccounts = bankAccounts.length > 0 ? bankAccounts : mockBankAccounts;

  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Pim</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button
          onClick={handleNewDeposit}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="New Deposit"
        >
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button
          onClick={handleEditDeposit}
          disabled={!selectedRow}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Edit Deposit"
        >
          <Pencil className="w-4 h-4" style={{ color: "#e67e22" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Copy className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button
          onClick={handleDeleteDeposit}
          disabled={!selectedRow}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Delete Deposit"
        >
          <X className="w-4 h-4" style={{ color: "#e74c3c" }} />
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
          <BarChart3 className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <BarChart3 className="w-4 h-4" style={{ color: "#e67e22" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Calculator className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Calculator className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Lock className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Home className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
      </div>

      {/* Filter Row */}
      <div className="bg-white flex items-center px-3 py-2 border-b border-[#d0d0d0] gap-4">
        <SavedFiltersDropdown pageId="cash-receipts" onApply={() => {}} onClear={() => {}} />

        <div className="flex-1" />

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <label className="text-[12px]">Start</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[110px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[12px]">End</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[110px]"
          />
        </div>

        {/* Quick Date Buttons */}
        <div className="flex items-center gap-1">
          {["Day", "Week", "Month", "Quarter", "Year"].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className="px-3 py-1 text-[12px] border border-[#a0a0a0] bg-white hover:bg-[#e8e8e8]"
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Bank Account Tabs */}
      <div className="bg-white flex items-end px-2 pt-1 border-b border-[#a0a0a0]">
        {/* All Tab */}
        <button
          onClick={() => setSelectedTab("all")}
          className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
            selectedTab === "all"
              ? "bg-white border-[#a0a0a0] border-b-white z-10 font-medium"
              : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
          }`}
        >
          All
        </button>

        {/* Bank Account Tabs */}
        {displayBankAccounts.map((account, index) => (
          <button
            key={account.id}
            onClick={() => setSelectedTab(account.id)}
            className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
              selectedTab === account.id
                ? "bg-white border-[#a0a0a0] border-b-white z-10 font-medium"
                : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
            }`}
          >
            {account.name} - {index + 1}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white border border-[#a0a0a0] mx-2 my-2">
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Date</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Ref</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "30%" }}>Description</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "20%" }}>Bank</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "15%" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {displayReceipts.map((receipt, index) => (
              <tr
                key={receipt.id}
                onClick={() => setSelectedRow(receipt.id)}
                onDoubleClick={() => openTab(`Editing Deposit #${receipt.refNumber}`, `/cash-receipts/${receipt.id}`)}
                className={`cursor-pointer ${
                  selectedRow === receipt.id || (index === 0 && !selectedRow)
                    ? "bg-white"
                    : "hover:bg-[#f0f8ff]"
                }`}
              >
                <td className="px-2 py-1 border border-[#e0e0e0]">{formatDate(receipt.date)}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{receipt.refNumber}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{receipt.description}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{receipt.bankAccount.name}</td>
                <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(receipt.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1 flex items-center text-[11px]">
        <span className="px-2 border-r border-[#c0c0c0]">
          {selectedReceipt ? formatDate(selectedReceipt.date) : formatDate(displayReceipts[0]?.date || new Date().toISOString())}
        </span>
        <span className="px-2 border-r border-[#c0c0c0]">
          {selectedReceipt?.bankAccount.name || displayReceipts[0]?.bankAccount.name || "Checking-NEI"}
        </span>
        <span className="flex-1" />
        <span className="px-2 border-l border-[#c0c0c0]">{displayCount} deposits</span>
        <span className="px-2 border-l border-[#c0c0c0] font-medium">{formatCurrency(displayTotal)}</span>
      </div>
    </div>
  );
}
