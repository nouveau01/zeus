"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  RotateCcw,
  Check,
  DollarSign,
  Scissors,
  Pencil,
  Home,
  HelpCircle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
} from "lucide-react";

interface CashReceiptDetailProps {
  depositId: string;
  onClose: () => void;
}

interface DepositItem {
  id: string;
  acct: string;
  title: string;
  desc: string;
  refNumbers: string;
  amount: number;
  applied: boolean;
}

interface CashReceipt {
  id: string;
  refNumber: number;
  date: string;
  description: string | null;
  amount: number;
  cleared: boolean;
  bankAccount: {
    id: string;
    name: string;
  };
  items: DepositItem[];
}

export default function CashReceiptDetail({ depositId, onClose }: CashReceiptDetailProps) {
  const [deposit, setDeposit] = useState<CashReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [printOnSave, setPrintOnSave] = useState(false);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);

  // Mock data for display
  const mockDeposit: CashReceipt = {
    id: depositId,
    refNumber: 25752,
    date: "2025-10-06",
    description: "Deposit",
    amount: 258742.11,
    cleared: true,
    bankAccount: { id: "1", name: "Checking-NEI" },
    items: [
      { id: "1", acct: "580WHITEP", title: "580 WHITE I", desc: "Payment Check #001642", refNumbers: "863196", amount: 7461.62, applied: true },
      { id: "2", acct: "375CORPOF", title: "375 CORPOF", desc: "Payment Check #051958", refNumbers: "866688", amount: 6178.92, applied: true },
      { id: "3", acct: "212-40HILL*", title: "212-40 HILLS", desc: "Payment Check #000037351", refNumbers: "862044", amount: 1823.33, applied: true },
      { id: "4", acct: "30W44*****", title: "30 WEST 44", desc: "Payment Check #38787", refNumbers: "845339, 848253, 850368, 8", amount: 127967.10, applied: true },
      { id: "5", acct: "141-0720TH", title: "141-07 20TH", desc: "Payment Check #7293", refNumbers: "864411", amount: 1918.92, applied: true },
      { id: "6", acct: "7400SHODA", title: "7400 SHORE", desc: "Payment Check #32931", refNumbers: "863291", amount: 19270.79, applied: true },
      { id: "7", acct: "7800SHORD", title: "7800 SHORE", desc: "Payment Check #32931", refNumbers: "834624", amount: 17675.86, applied: true },
      { id: "8", acct: "103-00SHOC", title: "103-00 SHOF", desc: "Payment Check #32931", refNumbers: "834625", amount: 17506.01, applied: true },
      { id: "9", acct: "7600SHODA", title: "7600 SHORE", desc: "Payment Check #32931", refNumbers: "834678", amount: 4718.64, applied: true },
      { id: "10", acct: "245MAINST", title: "245 MAIN ST", desc: "Payment Check #2630", refNumbers: "867589", amount: 1615.89, applied: true },
      { id: "11", acct: "364VERNON", title: "364 VERNOI", desc: "Payment Check #7707", refNumbers: "860072, 864385, 865901", amount: 5322.83, applied: true },
      { id: "12", acct: "149W45THS", title: "149 WEST 4", desc: "Payment Check #619744", refNumbers: "866602", amount: 728.92, applied: true },
      { id: "13", acct: "220W48***", title: "220 WEST 4", desc: "Payment Check #619744", refNumbers: "867095", amount: 2175.32, applied: true },
      { id: "14", acct: "4E63***", title: "4 EAST 63NI", desc: "Payment Check #001435", refNumbers: "869218", amount: 728.62, applied: true },
    ],
  };

  useEffect(() => {
    fetchDeposit();
  }, [depositId]);

  const fetchDeposit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/cash-receipts/${depositId}`);
      if (response.ok) {
        const data = await response.json();
        setDeposit(data);
      } else {
        // Use mock data if API fails
        setDeposit(mockDeposit);
      }
    } catch (error) {
      console.error("Error fetching deposit:", error);
      // Use mock data on error
      setDeposit(mockDeposit);
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

  // Use mock data if no real data
  const displayDeposit = deposit || mockDeposit;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f5]">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">PIM</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Move</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <RotateCcw className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Check className="w-4 h-4" style={{ color: "#5cb85c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Check className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <DollarSign className="w-4 h-4" style={{ color: "#5cb85c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Scissors className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Pencil className="w-4 h-4" style={{ color: "#e67e22" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Home className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <ChevronsLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <ChevronLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <ChevronRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <ChevronsRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
        <div className="flex-1" />
        <label className="flex items-center gap-1 text-[12px] cursor-pointer">
          <input
            type="checkbox"
            checked={printOnSave}
            onChange={(e) => setPrintOnSave(e.target.checked)}
            className="w-3 h-3"
          />
          Print on Save
        </label>
      </div>

      {/* Header Section */}
      <div className="bg-[#ffffcc] border-b border-[#d0d0d0] px-4 py-3 flex items-start gap-6">
        {/* Left - Date & Dep # */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="w-12 text-[12px]">Date</label>
            <input
              type="date"
              value={displayDeposit.date}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[100px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-12 text-[12px]">Dep #</label>
            <input
              type="text"
              value={displayDeposit.refNumber}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[100px]"
            />
          </div>
        </div>

        {/* Middle - Bank & Desc */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <label className="w-10 text-[12px]">Bank</label>
            <select
              value={displayDeposit.bankAccount.id}
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[150px]"
            >
              <option value={displayDeposit.bankAccount.id}>{displayDeposit.bankAccount.name}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-10 text-[12px]">Desc</label>
            <input
              type="text"
              value={displayDeposit.description || ""}
              readOnly
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[150px]"
            />
          </div>
        </div>

        {/* Cleared Stamp */}
        {displayDeposit.cleared && (
          <div className="flex items-center justify-center px-4">
            <span
              className="text-[#cc0000] font-bold text-[18px] border-2 border-[#cc0000] px-3 py-1 transform -rotate-3"
              style={{ fontFamily: "Impact, sans-serif", letterSpacing: "2px" }}
            >
              CLEARED
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Total Box */}
        <div className="flex flex-col items-end">
          <span className="text-[12px] font-medium">TOTAL</span>
          <div className="border border-[#a0a0a0] bg-white px-3 py-1 min-w-[120px] text-right">
            <span className="text-[14px] font-bold">{formatCurrency(displayDeposit.amount)}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white border border-[#a0a0a0] mx-2 my-2">
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Acct</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Title</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "25%" }}>Desc</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "22%" }}>Ref #'s</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Amount</th>
              <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Applied</th>
            </tr>
          </thead>
          <tbody>
            {displayDeposit.items.map((item) => (
              <tr
                key={item.id}
                onClick={() => setSelectedRow(item.id)}
                className={`cursor-pointer ${
                  selectedRow === item.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"
                }`}
              >
                <td className="px-2 py-1 border border-[#e0e0e0]">{item.acct}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{item.title}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{item.desc}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{item.refNumbers}</td>
                <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(item.amount)}</td>
                <td className="px-2 py-1 text-center border border-[#e0e0e0]">
                  <input
                    type="checkbox"
                    checked={item.applied}
                    readOnly
                    className="w-4 h-4"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center text-[11px]">
        <span className="font-medium">EDIT</span>
      </div>
    </div>
  );
}
