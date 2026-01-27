"use client";

import { useState, useEffect } from "react";
import {
  X,
  Printer,
  Save,
  FileText,
  Check,
  BarChart3,
  DollarSign,
  Home,
  HelpCircle,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";

interface Customer {
  id: string;
  name: string;
}

interface Account {
  id: string;
  accountId: string;
  tag: string;
  city: string;
  status: string;
  balance: number;
  days0_30: number;
  days31_60: number;
  days61_90: number;
  days91Up: number;
  customerId: string;
}

interface OpenItem {
  id: string;
  date: string;
  type: string;
  ref: number;
  desc: string;
  amount: number;
  days: number;
  accountId: string;
}

const TABS = ["Accounts", "Main Contacts", "Cust Contacts", "Acct Contacts", "Notes"];

export default function CollectionsPage() {
  const { openTab } = useTabs();
  const [searchBy, setSearchBy] = useState<"Customer" | "Account ID" | "Tag">("Account ID");
  const [selectedValue, setSelectedValue] = useState("1"); // Can be account id, tag, or customer id
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [openItems, setOpenItems] = useState<OpenItem[]>([]);
  const [filteredOpenItems, setFilteredOpenItems] = useState<OpenItem[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Accounts");
  const [daysPastDue, setDaysPastDue] = useState(0);
  const [sendStatement, setSendStatement] = useState(false);
  const [emailTo, setEmailTo] = useState("Account");
  const [loading, setLoading] = useState(true);

  // Mock customers
  const mockCustomers: Customer[] = [
    { id: "c1", name: "CAN DREAM WAY HOLDINGS" },
    { id: "c2", name: "RIVER PARK TOWERS" },
    { id: "c3", name: "H&M FASHION USA, INC." },
  ];

  // Mock data
  const mockAccounts: Account[] = [
    {
      id: "1",
      accountId: "100-1723RD*****",
      tag: "100-17 23RD AVENUE - ELMHURST",
      city: "LONG ISLAN",
      status: "Active",
      balance: 604906.32,
      days0_30: 56569.99,
      days31_60: 18808.39,
      days61_90: 5229.84,
      days91Up: 524298.10,
      customerId: "c3",
    },
    {
      id: "2",
      accountId: "30RICH*****",
      tag: "30 RICHMAN PLAZA",
      city: "BRONX",
      status: "Active",
      balance: 125000.00,
      days0_30: 25000.00,
      days31_60: 50000.00,
      days61_90: 25000.00,
      days91Up: 25000.00,
      customerId: "c2",
    },
    {
      id: "3",
      accountId: "CAN-DREAM-01",
      tag: "CAN DREAM WAY - STORE # US036",
      city: "NEW YORK",
      status: "Active",
      balance: 50000.00,
      days0_30: 10000.00,
      days31_60: 15000.00,
      days61_90: 10000.00,
      days91Up: 15000.00,
      customerId: "c1",
    },
  ];

  const mockOpenItems: OpenItem[] = [
    // Account 1 invoices (100-1723RD*****)
    { id: "1", date: "2021-01-25", type: "Invoice", ref: 723287, desc: "REMAINING BALANCE DUE UPON COMPLE*", amount: 8875.60, days: 1823, accountId: "1" },
    { id: "2", date: "2021-01-25", type: "Invoice", ref: 723288, desc: "REMAINING BALANCE DUE UPON COMPLE*", amount: 11431.88, days: 1823, accountId: "1" },
    { id: "3", date: "2021-01-25", type: "Invoice", ref: 723289, desc: "REMAINING BALANCE DUE UPON COMPLE*", amount: 5715.94, days: 1823, accountId: "1" },
    { id: "4", date: "2021-08-18", type: "Invoice", ref: 740370, desc: "AS PER PROPOSAL #134846, DATED 8/10/2...", amount: 5443.75, days: 1618, accountId: "1" },
    { id: "5", date: "2023-04-06", type: "Invoice", ref: 791565, desc: "AS PER PROPOSAL# 147262, DATED 4/5/2...", amount: 3247.23, days: 1022, accountId: "1" },
    { id: "6", date: "2023-05-19", type: "Invoice", ref: 794797, desc: "AS PER PROPOSAL# 147262, DATED 4/5/2...", amount: 3294.46, days: 979, accountId: "1" },
    { id: "7", date: "2023-09-14", type: "Invoice", ref: 804360, desc: "SERVICE DATES: 7.13.2023 - 8.22.2023", amount: 52412.70, days: 861, accountId: "1" },
    { id: "8", date: "2023-10-13", type: "Invoice", ref: 807040, desc: "SERVICE CALL- 09/07/2023, 09/08/2023, 09...", amount: 24747.02, days: 832, accountId: "1" },
    { id: "9", date: "2024-02-01", type: "Invoice", ref: 816563, desc: "Preventative maintenance service for the perio...", amount: 1388.16, days: 721, accountId: "1" },
    { id: "10", date: "2024-02-26", type: "Invoice", ref: 819025, desc: "SERVICE CALL- 01/17/2024 AND 01/18/2024...", amount: 3313.54, days: 696, accountId: "1" },
    { id: "11", date: "2024-03-01", type: "Invoice", ref: 819513, desc: "Preventative maintenance service for the perio...", amount: 2156.28, days: 692, accountId: "1" },
    // Account 2 invoices (30RICH*****)
    { id: "12", date: "2024-06-15", type: "Invoice", ref: 830001, desc: "ELEVATOR MAINTENANCE - JUNE 2024", amount: 15000.00, days: 220, accountId: "2" },
    { id: "13", date: "2024-07-15", type: "Invoice", ref: 832500, desc: "ELEVATOR MAINTENANCE - JULY 2024", amount: 15000.00, days: 190, accountId: "2" },
    { id: "14", date: "2024-08-15", type: "Invoice", ref: 835000, desc: "EMERGENCY REPAIR - UNIT 3", amount: 45000.00, days: 159, accountId: "2" },
    { id: "15", date: "2024-09-15", type: "Invoice", ref: 837500, desc: "ELEVATOR MAINTENANCE - SEPT 2024", amount: 15000.00, days: 128, accountId: "2" },
    { id: "16", date: "2024-10-15", type: "Invoice", ref: 840000, desc: "ELEVATOR MAINTENANCE - OCT 2024", amount: 15000.00, days: 98, accountId: "2" },
    { id: "17", date: "2024-11-15", type: "Invoice", ref: 842500, desc: "ELEVATOR MAINTENANCE - NOV 2024", amount: 20000.00, days: 67, accountId: "2" },
    // Account 3 invoices (CAN-DREAM-01)
    { id: "18", date: "2024-09-01", type: "Invoice", ref: 836000, desc: "SERVICE CALL - STORE ESCALATOR", amount: 8500.00, days: 143, accountId: "3" },
    { id: "19", date: "2024-10-01", type: "Invoice", ref: 838500, desc: "MONTHLY MAINTENANCE - OCT 2024", amount: 12000.00, days: 112, accountId: "3" },
    { id: "20", date: "2024-11-01", type: "Invoice", ref: 841000, desc: "MONTHLY MAINTENANCE - NOV 2024", amount: 12000.00, days: 81, accountId: "3" },
    { id: "21", date: "2024-12-01", type: "Invoice", ref: 843500, desc: "MONTHLY MAINTENANCE - DEC 2024", amount: 12000.00, days: 51, accountId: "3" },
    { id: "22", date: "2025-01-01", type: "Invoice", ref: 846000, desc: "MONTHLY MAINTENANCE - JAN 2025", amount: 5500.00, days: 21, accountId: "3" },
  ];

  useEffect(() => {
    // Load mock data
    setAccounts(mockAccounts);
    setFilteredAccounts(mockAccounts);
    setSelectedAccount(mockAccounts[0]);
    setOpenItems(mockOpenItems);
    // Filter open items for first account
    setFilteredOpenItems(mockOpenItems.filter(item => item.accountId === mockAccounts[0]?.id));
    setLoading(false);
  }, []);

  // Update filtered open items when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      const items = mockOpenItems.filter(item => item.accountId === selectedAccount.id);
      setFilteredOpenItems(items);
    } else {
      setFilteredOpenItems([]);
    }
  }, [selectedAccount]);

  // Handle search mode change
  const handleSearchByChange = (newSearchBy: "Customer" | "Account ID" | "Tag") => {
    setSearchBy(newSearchBy);
    // Reset selection when changing search mode
    if (newSearchBy === "Customer") {
      setSelectedValue(mockCustomers[0]?.id || "");
      // Show all accounts for this customer
      const customerAccounts = mockAccounts.filter(a => a.customerId === mockCustomers[0]?.id);
      setFilteredAccounts(customerAccounts.length > 0 ? customerAccounts : mockAccounts);
      setSelectedAccount(customerAccounts[0] || mockAccounts[0]);
    } else {
      setSelectedValue(mockAccounts[0]?.id || "");
      setFilteredAccounts(mockAccounts);
      setSelectedAccount(mockAccounts[0]);
    }
  };

  const handleSelectionChange = (value: string) => {
    setSelectedValue(value);

    if (searchBy === "Customer") {
      // Filter accounts by customer
      const customerAccounts = mockAccounts.filter(a => a.customerId === value);
      setFilteredAccounts(customerAccounts);
      setSelectedAccount(customerAccounts[0] || null);
    } else if (searchBy === "Account ID") {
      // Find account by id
      const account = mockAccounts.find(a => a.id === value);
      setFilteredAccounts(account ? [account] : []);
      setSelectedAccount(account || null);
    } else if (searchBy === "Tag") {
      // Find account by tag (using id as key since tag is the display)
      const account = mockAccounts.find(a => a.id === value);
      setFilteredAccounts(account ? [account] : []);
      setSelectedAccount(account || null);
    }
  };

  const handleAccountRowClick = (account: Account) => {
    setSelectedAccount(account);
  };

  // Get dropdown options based on search mode
  const getDropdownOptions = () => {
    switch (searchBy) {
      case "Customer":
        return mockCustomers.map(c => ({ value: c.id, label: c.name }));
      case "Account ID":
        return mockAccounts.map(a => ({ value: a.id, label: a.accountId }));
      case "Tag":
        return mockAccounts.map(a => ({ value: a.id, label: a.tag }));
      default:
        return [];
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

  // Summary totals from selected account
  const summaryBalance = selectedAccount?.balance || 0;
  const summary0_30 = selectedAccount?.days0_30 || 0;
  const summary31_60 = selectedAccount?.days31_60 || 0;
  const summary61_90 = selectedAccount?.days61_90 || 0;
  const summary91Up = selectedAccount?.days91Up || 0;

  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Pim</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Mass Update</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <X className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Printer className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Save className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
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
          <DollarSign className="w-4 h-4" style={{ color: "#5cb85c" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Printer className="w-4 h-4" style={{ color: "#9b59b6" }} />
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

      {/* Search/Filter Section */}
      <div className="bg-white px-4 py-2 border-b border-[#d0d0d0] flex items-center gap-4">
        {/* Radio Buttons */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-[12px] cursor-pointer">
            <input
              type="radio"
              name="searchBy"
              checked={searchBy === "Customer"}
              onChange={() => handleSearchByChange("Customer")}
              className="w-3 h-3"
            />
            Customer
          </label>
          <label className="flex items-center gap-1 text-[12px] cursor-pointer">
            <input
              type="radio"
              name="searchBy"
              checked={searchBy === "Account ID"}
              onChange={() => handleSearchByChange("Account ID")}
              className="w-3 h-3"
            />
            Account ID
          </label>
          <label className="flex items-center gap-1 text-[12px] cursor-pointer">
            <input
              type="radio"
              name="searchBy"
              checked={searchBy === "Tag"}
              onChange={() => handleSearchByChange("Tag")}
              className="w-3 h-3"
            />
            Tag
          </label>
        </div>

        {/* Dynamic Dropdown based on search mode */}
        <select
          value={selectedValue}
          onChange={(e) => handleSelectionChange(e.target.value)}
          className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-[#000080] text-white min-w-[180px]"
        >
          {getDropdownOptions().map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Aging Summary */}
        <div className="flex items-center gap-4 ml-4">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-[#606060]">Balance</span>
            <span className="text-[12px] font-medium">{formatCurrency(summaryBalance)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-[#606060]">0-30 Days</span>
            <span className="text-[12px]">{formatCurrency(summary0_30)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-[#606060]">31-60 Days</span>
            <span className="text-[12px]">{formatCurrency(summary31_60)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-[#606060]">61-90 Days</span>
            <span className="text-[12px]">{formatCurrency(summary61_90)}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-[#606060]">91 & Up</span>
            <span className="text-[12px]">{formatCurrency(summary91Up)}</span>
          </div>
        </div>
      </div>

      {/* Upper Accounts Table */}
      <div className="px-2 pt-2">
        <div className="text-[12px] font-medium mb-1">Accounts</div>
        <div className="border border-[#a0a0a0] bg-white overflow-auto" style={{ maxHeight: "100px" }}>
          <table className="w-full border-collapse text-[12px]">
            <thead className="bg-[#f0f0f0] sticky top-0">
              <tr>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">ID</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Tag</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">City</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Status</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]">Balance</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]">0-30</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]">31-60</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]">61-90</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]">91 & Up</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr
                  key={account.id}
                  onClick={() => handleAccountRowClick(account)}
                  className={`cursor-pointer ${
                    selectedAccount?.id === account.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"
                  }`}
                >
                  <td className="px-2 py-1 border border-[#e0e0e0]">{account.accountId}</td>
                  <td className="px-2 py-1 border border-[#e0e0e0]">{account.tag}</td>
                  <td className="px-2 py-1 border border-[#e0e0e0]">{account.city}</td>
                  <td className="px-2 py-1 border border-[#e0e0e0]">{account.status}</td>
                  <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(account.balance)}</td>
                  <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(account.days0_30)}</td>
                  <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(account.days31_60)}</td>
                  <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(account.days61_90)}</td>
                  <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(account.days91Up)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section with Tabs */}
      <div className="flex-1 flex flex-col px-2 pt-4 overflow-hidden">
        {/* Tabs */}
        <div className="flex items-end border-b border-[#a0a0a0]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
                activeTab === tab
                  ? "bg-white border-[#a0a0a0] border-b-white z-10 font-medium"
                  : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 flex bg-white border-l border-r border-b border-[#a0a0a0] overflow-hidden">
          {/* Left - Open Items Table */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-2 py-1 bg-white border-b border-[#d0d0d0] text-[12px]">
              Open Items For Account {selectedAccount?.accountId} ({selectedAccount?.tag})
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f0f0f0] sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Date</th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Type</th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Ref</th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "40%" }}>Desc</th>
                    <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Amount</th>
                    <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Days</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpenItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRow(item.id)}
                      onDoubleClick={() => openTab(`Invoice ${item.ref}`, `/invoices/${item.id}`)}
                      className={`cursor-pointer ${
                        selectedRow === item.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"
                      }`}
                    >
                      <td className="px-2 py-1 border border-[#e0e0e0]">{formatDate(item.date)}</td>
                      <td className="px-2 py-1 border border-[#e0e0e0]">{item.type}</td>
                      <td className="px-2 py-1 border border-[#e0e0e0]">{item.ref}</td>
                      <td className="px-2 py-1 border border-[#e0e0e0] truncate" style={{ maxWidth: "300px" }}>{item.desc}</td>
                      <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(item.amount)}</td>
                      <td className="px-2 py-1 text-right border border-[#e0e0e0]">{item.days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right - Action Panel */}
          <div className="w-[160px] flex flex-col gap-3 p-3 border-l border-[#d0d0d0] bg-white">
            {/* Days Past Due */}
            <div className="flex items-center gap-2">
              <label className="text-[11px]">Days Past Due</label>
              <input
                type="number"
                value={daysPastDue}
                onChange={(e) => setDaysPastDue(Number(e.target.value))}
                className="w-12 px-1 py-0.5 border border-[#a0a0a0] text-[11px] text-right"
                min={0}
              />
            </div>

            {/* Send Statement */}
            <label className="flex items-center gap-2 text-[11px] cursor-pointer">
              <input
                type="checkbox"
                checked={sendStatement}
                onChange={(e) => setSendStatement(e.target.checked)}
                className="w-3 h-3"
              />
              Send Statement
            </label>

            {/* Email To */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px]">Email To:</label>
              <select
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="px-1 py-0.5 border border-[#a0a0a0] text-[11px] bg-white"
              >
                <option value="Account">Account</option>
                <option value="Customer">Customer</option>
                <option value="Both">Both</option>
              </select>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex gap-1">
                <button className="flex-1 px-2 py-1 text-[10px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
                  Print Stmt<br />for Acct
                </button>
                <button className="flex-1 px-2 py-1 text-[10px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
                  Email<br />Statement
                </button>
              </div>
              <div className="flex gap-1">
                <button className="flex-1 px-2 py-1 text-[10px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
                  Print<br />Invoice
                </button>
                <button className="flex-1 px-2 py-1 text-[10px] border border-[#a0a0a0] bg-[#cce5ff] hover:bg-[#b3d9ff]">
                  Email<br />Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1 flex items-center text-[11px]">
        <span className="px-2 border-r border-[#c0c0c0]">SH</span>
        <span className="px-2 border-r border-[#c0c0c0]">{filteredOpenItems.length} items</span>
        <span className="flex-1" />
        <span className="px-2 border-l border-[#c0c0c0]">On Service</span>
        <span className="px-2 border-l border-[#c0c0c0]">Average Paid = 143 days</span>
        <span className="px-2 border-l border-[#c0c0c0]">Write-Offs = $0.50</span>
      </div>
    </div>
  );
}
