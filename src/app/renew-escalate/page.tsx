"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  DollarSign,
  Printer,
  Calculator,
  BarChart3,
  Home,
  HelpCircle,
  X,
} from "lucide-react";

interface Contract {
  id: string;
  accountId: string;
  accountTag: string;
  type: string; // VS, etc.
  billFreq: string; // Mo = Monthly
  escType: string; // Ma = Manual, Re = Renewal
  lastEsc: string;
  nextDue: string;
  prvYear: number;
  total: number;
  currentAmount: number;
  newAmount: number;
  startDate: string;
  lengthMonths: number;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export default function RenewEscalatePage() {
  const currentDate = new Date();
  const [viewContractsPriorTo, setViewContractsPriorTo] = useState(currentDate.toISOString().split("T")[0]);
  const [renewalDate, setRenewalDate] = useState(currentDate.toISOString().split("T")[0]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data
  const mockContracts: Contract[] = [
    {
      id: "1",
      accountId: "98AVEU***",
      accountTag: "98 AVENUE",
      type: "VS.",
      billFreq: "Mo",
      escType: "Ma",
      lastEsc: "2025-01-01",
      nextDue: "",
      prvYear: 0.00,
      total: 0.00,
      currentAmount: 0.00,
      newAmount: 0.00,
      startDate: "2025-01-01",
      lengthMonths: 12,
      address: "98 Avenue U",
      city: "BROOKLYN",
      state: "NY",
      zip: "11223",
    },
    {
      id: "2",
      accountId: "98AVEU***",
      accountTag: "98 AVENUE",
      type: "12",
      billFreq: "Mo",
      escType: "Re",
      lastEsc: "2026-01-01",
      nextDue: "",
      prvYear: -4.00,
      total: -4.00,
      currentAmount: 0.00,
      newAmount: 0.00,
      startDate: "2025-01-01",
      lengthMonths: 12,
      address: "98 Avenue U",
      city: "BROOKLYN",
      state: "NY",
      zip: "11223",
    },
  ];

  useEffect(() => {
    setContracts(mockContracts);
    setSelectedContract(mockContracts[0]);
    setLoading(false);
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatCurrency = (amount: number) => {
    return `$${Number(amount).toFixed(2)}`;
  };

  const handleRowClick = (contract: Contract) => {
    setSelectedContract(contract);
  };

  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <DollarSign className="w-4 h-4" style={{ color: "#f1c40f" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Printer className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Calculator className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <BarChart3 className="w-4 h-4" style={{ color: "#3498db" }} />
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

      {/* Filter Section */}
      <div className="bg-white px-4 py-2 border-b border-[#d0d0d0] flex items-center gap-6">
        <div className="flex items-center gap-2">
          <label className="text-[12px]">View Contracts Due For<br/>Escalation Prior To</label>
          <input
            type="date"
            value={viewContractsPriorTo}
            onChange={(e) => setViewContractsPriorTo(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[110px]"
          />
          <button className="px-2 py-1 border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px]">
            ...
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[12px]">Renewal Date if<br/>contract is renewed</label>
          <input
            type="date"
            value={renewalDate}
            onChange={(e) => setRenewalDate(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[110px]"
          />
          <button className="px-2 py-1 border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px]">
            ...
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white mx-2 my-2 border border-[#a0a0a0]">
        <table className="w-full border-collapse text-[12px]">
          <thead className="sticky top-0">
            {/* Group Headers */}
            <tr>
              <th colSpan={2} className="px-2 py-1 text-center font-medium bg-[#000080] text-white border border-[#c0c0c0]">
                Account
              </th>
              <th colSpan={3} className="px-2 py-1 text-center font-medium bg-[#808000] text-white border border-[#c0c0c0]">
                Contract
              </th>
              <th colSpan={2} className="px-2 py-1 text-center font-medium bg-[#808000] text-white border border-[#c0c0c0]">
                Dates
              </th>
              <th colSpan={2} className="px-2 py-1 text-center font-medium bg-[#000080] text-white border border-[#c0c0c0]">
                Results
              </th>
              <th colSpan={2} className="px-2 py-1 text-center font-medium bg-[#c0a000] text-white border border-[#c0c0c0]">
                Amounts
              </th>
            </tr>
            {/* Column Headers */}
            <tr className="bg-[#f0f0f0]">
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>ID</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Tag</th>
              <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "5%" }}>Ty</th>
              <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "5%" }}>Bill</th>
              <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "5%" }}>Esc</th>
              <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Last Esc</th>
              <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Next Due</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "9%" }}>Prv Year</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Total</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Current</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>New</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr
                key={contract.id}
                onClick={() => handleRowClick(contract)}
                className={`cursor-pointer ${
                  selectedContract?.id === contract.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"
                }`}
              >
                <td className="px-2 py-1 border border-[#e0e0e0]">{contract.accountId}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{contract.accountTag}</td>
                <td className="px-2 py-1 text-center border border-[#e0e0e0]">{contract.type}</td>
                <td className="px-2 py-1 text-center border border-[#e0e0e0]">{contract.billFreq}</td>
                <td className="px-2 py-1 text-center border border-[#e0e0e0]">{contract.escType}</td>
                <td className="px-2 py-1 text-center border border-[#e0e0e0]">{formatDate(contract.lastEsc)}</td>
                <td className="px-2 py-1 text-center border border-[#e0e0e0]">{formatDate(contract.nextDue)}</td>
                <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatPercent(contract.prvYear)}</td>
                <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatPercent(contract.total)}</td>
                <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(contract.currentAmount)}</td>
                <td className={`px-2 py-1 text-right border border-[#e0e0e0] ${
                  selectedContract?.id !== contract.id ? "bg-[#00ffff] text-black" : ""
                }`}>
                  {formatCurrency(contract.newAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1 flex items-center text-[11px]">
        <span className="px-2 border-r border-[#c0c0c0]">
          Start : {selectedContract ? formatDate(selectedContract.startDate) : ""}
        </span>
        <span className="px-2 border-r border-[#c0c0c0]">
          Length : {selectedContract?.lengthMonths || 0} months
        </span>
        <span className="flex-1 px-2">
          {selectedContract ? `${selectedContract.address}, ${selectedContract.city}, ${selectedContract.state}  ${selectedContract.zip}` : ""}
        </span>
        <span className="px-2 border-l border-[#c0c0c0]">
          {contracts.length} contracts
        </span>
      </div>
    </div>
  );
}
