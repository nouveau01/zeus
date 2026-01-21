"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Pencil,
  ClipboardList,
  X,
  FolderOpen,
  ChevronDown,
  Scissors,
  Check,
  DollarSign,
  BarChart3,
  FileEdit,
  Printer,
  Paperclip,
  Sigma,
  Lock,
  Plus,
  Home,
  HelpCircle,
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  accountNumber: string | null;
  type: string;
  isActive: boolean;
  balance: number;
  _count: {
    premises: number;
    jobs: number;
  };
}

const TABS = ["All", "Bank", "Churches", "Clubs", "Commercial", "General"];

const toolbarIcons = [
  { icon: FileText, color: "#4a7c59" },
  { icon: Pencil, color: "#d4a574" },
  { icon: ClipboardList, color: "#6b8cae" },
  { icon: X, color: "#c45c5c" },
  { icon: FolderOpen, color: "#d4c574" },
  { icon: ChevronDown, color: "#7c6b8e" },
  { icon: Scissors, color: "#5c8c8c" },
  { icon: Check, color: "#5cb85c" },
  { icon: Check, color: "#5c5cb8" },
  { icon: DollarSign, color: "#5cb85c" },
  { icon: BarChart3, color: "#e67e22" },
  { icon: FileEdit, color: "#3498db" },
  { icon: Printer, color: "#9b59b6" },
  { icon: Paperclip, color: "#7f8c8d" },
  { icon: Paperclip, color: "#27ae60" },
  { icon: Sigma, color: "#2c3e50" },
  { icon: Lock, color: "#f39c12" },
  { icon: Plus, color: "#27ae60" },
  { icon: Home, color: "#e74c3c" },
  { icon: HelpCircle, color: "#3498db" },
  { icon: X, color: "#95a5a6" },
];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, [activeTab]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const url = activeTab === "All"
        ? "/api/customers"
        : `/api/customers?type=${encodeURIComponent(activeTab)}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleRowClick = (customer: Customer) => {
    setSelectedRow(customer.id);
    setSelectedCustomer(customer);
  };

  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Dim</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        {toolbarIcons.map((item, i) => {
          const IconComponent = item.icon;
          return (
            <button
              key={i}
              className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
            >
              <IconComponent className="w-4 h-4" style={{ color: item.color }} />
            </button>
          );
        })}
      </div>

      {/* F&S Catalogue Row */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="mr-2 text-[12px]">F&S Catalogue</span>
        <select className="border border-[#c0c0c0] bg-white px-2 py-0.5 text-[12px] rounded">
          <option>None</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="bg-[#f5f5f5] flex items-end px-2 pt-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
              activeTab === tab
                ? "bg-white border-[#c0c0c0] border-b-white z-10 font-medium"
                : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid Container */}
      <div className="flex-1 bg-white border border-[#c0c0c0] mx-2 mb-2 flex flex-col overflow-hidden">
        {/* Column Headers */}
        <div className="flex bg-[#fafafa] border-b border-[#e0e0e0] text-[12px] font-medium text-[#505050]">
          <div className="flex-1 min-w-[300px] px-3 py-2 border-r border-[#e8e8e8]">Name</div>
          <div className="w-[120px] px-3 py-2 border-r border-[#e8e8e8]">Type</div>
          <div className="w-[70px] px-3 py-2 border-r border-[#e8e8e8]">Status</div>
          <div className="w-[60px] px-3 py-2 border-r border-[#e8e8e8] text-center"># Accts</div>
          <div className="w-[60px] px-3 py-2 border-r border-[#e8e8e8] text-center"># Units</div>
          <div className="w-[100px] px-3 py-2 text-right">Balance</div>
        </div>

        {/* Data Rows */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-[#808080]">Loading...</div>
          ) : customers.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">No customers found</div>
          ) : (
            customers.map((customer, index) => (
              <div
                key={customer.id}
                onClick={() => handleRowClick(customer)}
                className={`flex text-[12px] border-b border-[#f0f0f0] cursor-pointer ${
                  selectedRow === customer.id
                    ? "bg-[#0078d4] text-white"
                    : index % 2 === 0
                    ? "bg-white hover:bg-[#f5f9fc]"
                    : "bg-[#fafafa] hover:bg-[#f5f9fc]"
                }`}
              >
                <div className="flex-1 min-w-[300px] px-3 py-1.5 border-r border-[#f5f5f5] truncate">
                  {customer.name}
                </div>
                <div className="w-[120px] px-3 py-1.5 border-r border-[#f5f5f5]">
                  {customer.type}
                </div>
                <div className="w-[70px] px-3 py-1.5 border-r border-[#f5f5f5]">
                  {customer.isActive ? "Active" : "Inactive"}
                </div>
                <div className="w-[60px] px-3 py-1.5 border-r border-[#f5f5f5] text-center">
                  {customer._count?.premises || 0}
                </div>
                <div className="w-[60px] px-3 py-1.5 border-r border-[#f5f5f5] text-center">
                  {customer._count?.jobs || 0}
                </div>
                <div className="w-[100px] px-3 py-1.5 text-right">
                  {formatCurrency(Number(customer.balance))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-end gap-2">
        <button className="px-4 py-1 bg-[#f0f0f0] border border-[#c0c0c0] rounded text-[11px] hover:bg-[#e8e8e8]">
          Totals Off
        </button>
        <button className="px-4 py-1 bg-[#f0f0f0] border border-[#c0c0c0] rounded text-[11px] hover:bg-[#e8e8e8]">
          Totals Off
        </button>
        <button className="px-4 py-1 bg-[#f0f0f0] border border-[#c0c0c0] rounded text-[11px] hover:bg-[#e8e8e8]">
          Totals Off
        </button>
        <button className="px-4 py-1 bg-[#f0f0f0] border border-[#c0c0c0] rounded text-[11px] hover:bg-[#e8e8e8]">
          Totals Off
        </button>
      </div>
    </div>
  );
}
