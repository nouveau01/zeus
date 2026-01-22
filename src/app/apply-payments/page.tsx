"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  X,
  BarChart3,
  Check,
  Home,
  HelpCircle,
} from "lucide-react";

interface Account {
  id: string;
  premisesId: string | null;
  name: string | null;
  customer: {
    id: string;
    name: string;
  } | null;
  balance: number;
}

interface InvoiceItem {
  id: string;
  date: string;
  type: string;
  refNumber: number;
  desc: string;
  balance: number;
  applied: number;
}

export default function ApplyPaymentsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [searchBy, setSearchBy] = useState<"ID" | "Tag">("Tag");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [appliedBalance, setAppliedBalance] = useState(0);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data
  const mockAccounts: Account[] = [
    { id: "1", premisesId: "1AMERICANDREAM", name: "CAN DREAM WAY - STORE # US036", customer: { id: "1", name: "H&M FASHION USA, INC." }, balance: 2.64 },
    { id: "2", premisesId: "30RICH", name: "30 RICHMAN PLAZA", customer: { id: "2", name: "RIVER PARK TOWERS" }, balance: 1250.00 },
  ];

  const mockInvoices: InvoiceItem[] = [
    { id: "1", date: "2024-11-20", type: "Invoice", refNumber: 841779, desc: "SERVICE DA", balance: 1328.55, applied: 0 },
    { id: "2", date: "2025-02-01", type: "Invoice", refNumber: 848816, desc: "Preventative", balance: 426.50, applied: 0 },
    { id: "3", date: "2025-03-01", type: "Invoice", refNumber: 851261, desc: "Preventative", balance: 426.50, applied: 0 },
    { id: "4", date: "2025-03-12", type: "Invoice", refNumber: 852560, desc: "SERVICE CA", balance: 379.59, applied: 0 },
    { id: "5", date: "2025-04-01", type: "Invoice", refNumber: 854201, desc: "Preventative", balance: 426.50, applied: 0 },
    { id: "6", date: "2025-12-09", type: "Invoice", refNumber: 875183, desc: "CREDIT ACC", balance: -2985.00, applied: 0 },
  ];

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/premises");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.length > 0 ? data : mockAccounts);
        if (data.length > 0) {
          setSelectedAccount(data[0]);
        } else {
          setSelectedAccount(mockAccounts[0]);
          setPaymentAmount(2985.00);
        }
      } else {
        setAccounts(mockAccounts);
        setSelectedAccount(mockAccounts[0]);
        setPaymentAmount(2985.00);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setAccounts(mockAccounts);
      setSelectedAccount(mockAccounts[0]);
      setPaymentAmount(2985.00);
    } finally {
      setLoading(false);
      setInvoices(mockInvoices);
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

  const formatCurrency = (amount: number, showParens: boolean = true) => {
    const value = Number(amount);
    if (value < 0 && showParens) {
      return `($${Math.abs(value).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })})`;
    }
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId) || mockAccounts.find((a) => a.id === accountId);
    setSelectedAccount(account || null);
  };

  const displayAccounts = accounts.length > 0 ? accounts : mockAccounts;

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Apply</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">PIM</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button className="px-2 py-1 text-[11px] font-medium text-[#0066cc] hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          All
        </button>
        <button className="px-2 py-1 text-[11px] font-medium text-[#cc0000] hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          Fifo
        </button>
        <button className="px-2 py-1 text-[11px] font-medium text-[#009900] hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          Lifo
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <X className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <BarChart3 className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Check className="w-4 h-4" style={{ color: "#5cb85c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Home className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
      </div>

      {/* Header Section */}
      <div className="bg-[#ffffcc] border-b border-[#d0d0d0] px-4 py-3 flex gap-6">
        {/* Left - Account Selection */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="w-20 text-[12px]">Tag</label>
            <select
              value={selectedAccount?.id || ""}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[220px]"
            >
              {displayAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name || account.premisesId}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[12px]">ID</label>
            <input
              type="text"
              value={selectedAccount?.premisesId || ""}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[220px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-[12px]">Description</label>
            <input
              type="text"
              value={selectedAccount?.customer?.name || ""}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[220px]"
            />
          </div>
        </div>

        {/* Middle - Search By */}
        <fieldset className="border border-[#a0a0a0] px-3 py-2">
          <legend className="text-[12px] px-1">Search By</legend>
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-[12px] cursor-pointer">
              <input
                type="radio"
                name="searchBy"
                checked={searchBy === "ID"}
                onChange={() => setSearchBy("ID")}
                className="w-3 h-3"
              />
              ID
            </label>
            <label className="flex items-center gap-2 text-[12px] cursor-pointer">
              <input
                type="radio"
                name="searchBy"
                checked={searchBy === "Tag"}
                onChange={() => setSearchBy("Tag")}
                className="w-3 h-3"
              />
              Tag
            </label>
          </div>
        </fieldset>

        {/* Right - Amounts */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="w-28 text-[12px] text-right">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[100px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-[12px] text-right">Account Balance</label>
            <input
              type="text"
              value={formatCurrency(selectedAccount?.balance || 0)}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[100px] text-right"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-[12px] text-right">Payment Amount</label>
            <input
              type="text"
              value={formatCurrency(paymentAmount)}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[100px] text-right"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-[12px] text-right">Applied Balance</label>
            <input
              type="text"
              value={formatCurrency(appliedBalance)}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[100px] text-right"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white border border-[#a0a0a0] mx-2 my-2">
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Date</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Type</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Ref #</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "20%" }}>Desc</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "14%" }}>Balance</th>
              <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "6%" }}>X</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "14%" }}>Applied</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                onClick={() => setSelectedRow(invoice.id)}
                className={`cursor-pointer ${
                  selectedRow === invoice.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"
                }`}
              >
                <td className="px-2 py-1 border border-[#e0e0e0]">{formatDate(invoice.date)}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{invoice.type}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{invoice.refNumber}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{invoice.desc}</td>
                <td className={`px-2 py-1 text-right border border-[#e0e0e0] ${invoice.balance < 0 && selectedRow !== invoice.id ? "text-red-600" : ""}`}>
                  {formatCurrency(invoice.balance)}
                </td>
                <td className="px-2 py-1 text-center border border-[#e0e0e0]"></td>
                <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(invoice.applied)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center text-[11px]">
        <span>{invoices.length} items</span>
      </div>
    </div>
  );
}
