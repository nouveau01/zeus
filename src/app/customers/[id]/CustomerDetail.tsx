"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Save,
  Printer,
  Undo2,
  DollarSign,
  Scissors,
  Home,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  HelpCircle,
  X,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/UnsavedChangesDialog";

interface Contact {
  id: string;
  name: string;
  title: string | null;
  phone: string | null;
  fax: string | null;
  mobile: string | null;
  email: string | null;
  inv: boolean;
  es: boolean;
}

interface Premises {
  id: string;
  premisesId: string | null;
  name: string | null;
  address: string;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  type: string | null;
  isActive: boolean;
  balance: number;
  _count: {
    units: number;
  };
}

interface Customer {
  id: string;
  name: string;
  accountNumber: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  contact: string | null;
  phone: string | null;
  fax: string | null;
  cellular: string | null;
  email: string | null;
  website: string | null;
  type: string;
  isActive: boolean;
  billing: string | null;
  custom1: string | null;
  custom2: string | null;
  balance: number;
  portalAccess: boolean;
  remarks: string | null;
  salesRemarks: string | null;
  currentYearSales: number;
  priorYearSales: number;
  premises: Premises[];
  contacts: Contact[];
  createdAt: string;
  updatedAt: string;
}

const TABS = ["1 General", "2 Control", "3 Contacts", "4 Portal", "5 Remarks", "Sales Remarks"];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const toolbarItems = [
  { icon: FileText, color: "#4a7c59", title: "New" },
  { icon: Save, color: "#4a7c59", title: "Save" },
  { icon: Printer, color: "#6b8cae", title: "Print" },
  { icon: Undo2, color: "#d4a574", title: "Undo" },
  { separator: true },
  { icon: DollarSign, color: "#5cb85c", title: "Billing" },
  { icon: Scissors, color: "#5c8c8c", title: "Cut" },
  { icon: Home, color: "#e74c3c", title: "Home" },
  { icon: FileText, color: "#3498db", title: "Reports" },
  { icon: HelpCircle, color: "#3498db", title: "Help" },
  { separator: true },
  { icon: ChevronsLeft, color: "#666", title: "First" },
  { icon: ChevronLeft, color: "#666", title: "Previous" },
  { icon: ChevronRight, color: "#666", title: "Next" },
  { icon: ChevronsRight, color: "#666", title: "Last" },
  { separator: true },
  { icon: X, color: "#c45c5c", title: "Close" },
];

interface CustomerDetailProps {
  customerId: string;
  onClose?: () => void;
}

export default function CustomerDetail({ customerId, onClose }: CustomerDetailProps) {
  const { openTab, closeTab } = useTabs();
  const isNew = customerId === "new";

  const [customer, setCustomer] = useState<Customer | null>(isNew ? {
    id: "",
    name: "",
    accountNumber: null,
    address: null,
    city: null,
    state: null,
    zipCode: null,
    country: "United States",
    contact: null,
    phone: null,
    fax: null,
    cellular: null,
    email: null,
    website: null,
    type: "General",
    isActive: true,
    billing: "Individual",
    custom1: null,
    custom2: null,
    balance: 0,
    portalAccess: false,
    remarks: null,
    salesRemarks: null,
    currentYearSales: 0,
    priorYearSales: 0,
    premises: [],
    contacts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } : null);
  const [loading, setLoading] = useState(!isNew);
  const [activeTab, setActiveTab] = useState("1 General");
  const [formData, setFormData] = useState<Partial<Customer>>(isNew ? {
    name: "",
    type: "General",
    isActive: true,
    billing: "Individual",
    country: "United States",
  } : {});
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  // Unsaved changes handling
  const handleSaveForHook = useCallback(async () => {
    if (!formData.name?.trim()) {
      throw new Error("Customer name is required");
    }
    if (isNew) {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        if (onClose) onClose();
        openTab(data.name, `/customers/${data.id}`);
      }
    } else {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setFormData(data);
      }
    }
  }, [formData, isNew, customerId, onClose, openTab]);

  const {
    isDirty,
    setIsDirty,
    confirmNavigation,
    showDialog,
    handleDialogSave,
    handleDialogDiscard,
    handleDialogCancel,
  } = useUnsavedChanges({ onSave: handleSaveForHook });

  useEffect(() => {
    if (!isNew) {
      fetchCustomer();
    }
  }, [customerId, isNew]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setFormData(data);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Customer, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      alert("Customer name is required");
      return;
    }

    try {
      if (isNew) {
        // Create new customer
        const response = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const data = await response.json();
          setIsDirty(false);
          // Close the "new" tab and open the created customer's tab
          if (onClose) onClose();
          openTab(data.name, `/customers/${data.id}`);
        }
      } else {
        // Update existing customer
        const response = await fetch(`/api/customers/${customerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const data = await response.json();
          setCustomer(data);
          setFormData(data);
          setIsDirty(false);
        }
      }
    } catch (error) {
      console.error("Error saving customer:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US");
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f5]">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f5]">
        <span className="text-gray-500">Customer not found</span>
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
        {toolbarItems.map((item, i) => {
          if (item.separator) {
            return <div key={i} className="w-px h-5 bg-[#c0c0c0] mx-1" />;
          }
          const IconComponent = item.icon!;
          return (
            <button
              key={i}
              className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
              title={item.title}
              onClick={item.title === "Save" ? handleSave : item.title === "Close" ? () => confirmNavigation(() => onClose?.()) : undefined}
            >
              <IconComponent className="w-4 h-4" style={{ color: item.color }} />
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="bg-[#ece9d8] flex items-end px-2 pt-1 border-b border-[#919b9c]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-[12px] border-t border-l border-r -mb-px ${
              activeTab === tab
                ? "bg-[#f5f5f5] border-[#919b9c] border-b-[#f5f5f5] z-10 font-medium"
                : "bg-[#d4d0c8] border-[#919b9c] text-[#000] hover:bg-[#e8e8e0]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#f5f5f5] p-2">
        {activeTab === "1 General" && (
          <div className="flex-1 flex flex-col gap-2">
            {/* Form Fields */}
            <div className="bg-[#ffffcc] border border-[#c0c0c0] p-3 flex gap-8">
              {/* Left Column */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">Name</label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">Address</label>
                  <input
                    type="text"
                    value={formData.address || ""}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">City</label>
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">State</label>
                  <select
                    value={formData.state || ""}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-16 border border-[#7f9db9] px-1 py-1 text-[12px] bg-white"
                  >
                    <option value=""></option>
                    {US_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <label className="w-8 text-[12px] text-right pr-2 ml-4">Zip</label>
                  <input
                    type="text"
                    value={formData.zipCode || ""}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    className="w-24 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">Country</label>
                  <input
                    type="text"
                    value={formData.country || "United States"}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">Contact</label>
                  <input
                    type="text"
                    value={formData.contact || ""}
                    onChange={(e) => handleInputChange("contact", e.target.value)}
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">Phone</label>
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">Fax</label>
                  <input
                    type="text"
                    value={formData.fax || ""}
                    onChange={(e) => handleInputChange("fax", e.target.value)}
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">Cellular</label>
                  <input
                    type="text"
                    value={formData.cellular || ""}
                    onChange={(e) => handleInputChange("cellular", e.target.value)}
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">e-mail</label>
                  <input
                    type="text"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">Web Site</label>
                  <input
                    type="text"
                    value={formData.website || ""}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Account Listing Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-1 py-1">
                <span className="font-medium text-[12px]">Account Listing</span>
                <button
                  onClick={() => !isNew && openTab("New Account", `/accounts/new?customerId=${customerId}`)}
                  disabled={isNew}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    if (selectedAccount && customer) {
                      openTab("New Account (Copy)", `/accounts/new?customerId=${customerId}&copyFrom=${selectedAccount}`);
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Rep
                </button>
                <button
                  onClick={() => {
                    if (selectedAccount && customer) {
                      const acct = customer.premises.find(p => p.id === selectedAccount);
                      if (acct) openTab(acct.name || acct.address, `/accounts/${selectedAccount}`);
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (selectedAccount && confirm("Delete this account?")) {
                      try {
                        const res = await fetch(`/api/premises/${selectedAccount}`, { method: "DELETE" });
                        if (res.ok) { setSelectedAccount(null); fetchCustomer(); }
                      } catch (e) { console.error(e); }
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Del
                </button>
              </div>

              {/* Account Grid */}
              <div className="flex-1 border border-[#808080] bg-white overflow-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#f0f0f0]">
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>ID</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "25%" }}>Tag</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>City</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Type</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Status</th>
                      <th className="px-2 py-1 text-center border border-[#c0c0c0] font-medium" style={{ width: "10%" }}># Units</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.premises.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                          No accounts found
                        </td>
                      </tr>
                    ) : (
                      customer.premises.map((premises) => (
                        <tr
                          key={premises.id}
                          onClick={() => setSelectedAccount(premises.id)}
                          onDoubleClick={() => openTab(premises.name || premises.address, `/accounts/${premises.id}`)}
                          className={`cursor-pointer ${
                            selectedAccount === premises.id
                              ? "bg-[#0078d4] text-white"
                              : "hover:bg-[#f0f8ff]"
                          }`}
                        >
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.premisesId || "-"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.name || premises.address}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.city || "-"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.type || "Non-Contract"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.isActive ? "Active" : "Inactive"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0] text-center">{premises._count?.units || 0}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0] text-right">{formatCurrency(Number(premises.balance))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "2 Control" && (
          <div className="flex-1 flex flex-col gap-2">
            {/* Control Form Fields */}
            <div className="bg-[#ffffcc] border border-[#c0c0c0] p-3 flex gap-8">
              {/* Left Column */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">Type</label>
                  <select
                    value={formData.type || "General"}
                    onChange={(e) => handleInputChange("type", e.target.value)}
                    className="w-40 border border-[#7f9db9] px-1 py-1 text-[12px] bg-white"
                  >
                    <option value="General">General</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Bank">Bank</option>
                    <option value="Churches">Churches</option>
                    <option value="Clubs">Clubs</option>
                    <option value="Property Manage">Property Manage</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">Status</label>
                  <select
                    value={formData.isActive ? "Active" : "Inactive"}
                    onChange={(e) => handleInputChange("isActive", e.target.value === "Active")}
                    className="w-40 border border-[#7f9db9] px-1 py-1 text-[12px] bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="w-16 text-[12px] text-right pr-2">Billing</label>
                  <select
                    value={formData.billing || "Individual"}
                    onChange={(e) => handleInputChange("billing", e.target.value)}
                    className="w-40 border border-[#7f9db9] px-1 py-1 text-[12px] bg-white"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Consolidated">Consolidated</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center">
                  <label className="w-20 text-[12px] text-right pr-2">Custom1</label>
                  <input
                    type="text"
                    value={formData.custom1 || ""}
                    onChange={(e) => handleInputChange("custom1", e.target.value)}
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-20 text-[12px] text-right pr-2">Custom2</label>
                  <input
                    type="text"
                    value={formData.custom2 || ""}
                    onChange={(e) => handleInputChange("custom2", e.target.value)}
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-20 text-[12px] text-right pr-2"># Accounts</label>
                  <input
                    type="text"
                    value={customer.premises.length}
                    readOnly
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-[#f0f0f0]"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-20 text-[12px] text-right pr-2"># Units</label>
                  <input
                    type="text"
                    value={customer.premises.reduce((sum, p) => sum + (p._count?.units || 0), 0)}
                    readOnly
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-[#f0f0f0]"
                  />
                </div>
                <div className="flex items-center">
                  <label className="w-20 text-[12px] text-right pr-2">Balance</label>
                  <input
                    type="text"
                    value={formatCurrency(Number(customer.balance))}
                    readOnly
                    className="flex-1 border border-[#7f9db9] px-2 py-1 text-[12px] bg-[#f0f0f0]"
                  />
                </div>
              </div>
            </div>

            {/* Account Listing Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-1 py-1">
                <span className="font-medium text-[12px]">Account Listing</span>
                <button
                  onClick={() => !isNew && openTab("New Account", `/accounts/new?customerId=${customerId}`)}
                  disabled={isNew}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    if (selectedAccount && customer) {
                      openTab("New Account (Copy)", `/accounts/new?customerId=${customerId}&copyFrom=${selectedAccount}`);
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Rep
                </button>
                <button
                  onClick={() => {
                    if (selectedAccount && customer) {
                      const acct = customer.premises.find(p => p.id === selectedAccount);
                      if (acct) openTab(acct.name || acct.address, `/accounts/${selectedAccount}`);
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (selectedAccount && confirm("Delete this account?")) {
                      try {
                        const res = await fetch(`/api/premises/${selectedAccount}`, { method: "DELETE" });
                        if (res.ok) { setSelectedAccount(null); fetchCustomer(); }
                      } catch (e) { console.error(e); }
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Del
                </button>
              </div>

              {/* Account Grid */}
              <div className="flex-1 border border-[#808080] bg-white overflow-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#f0f0f0]">
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>ID</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "25%" }}>Tag</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>City</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Type</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Status</th>
                      <th className="px-2 py-1 text-center border border-[#c0c0c0] font-medium" style={{ width: "10%" }}># Units</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.premises.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                          No accounts found
                        </td>
                      </tr>
                    ) : (
                      customer.premises.map((premises) => (
                        <tr
                          key={premises.id}
                          onClick={() => setSelectedAccount(premises.id)}
                          onDoubleClick={() => openTab(premises.name || premises.address, `/accounts/${premises.id}`)}
                          className={`cursor-pointer ${
                            selectedAccount === premises.id
                              ? "bg-[#0078d4] text-white"
                              : "hover:bg-[#f0f8ff]"
                          }`}
                        >
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.premisesId || "-"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.name || premises.address}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.city || "-"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.type || "Non-Contract"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.isActive ? "Active" : "Inactive"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0] text-center">{premises._count?.units || 0}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0] text-right">{formatCurrency(Number(premises.balance))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "3 Contacts" && (
          <div className="flex-1 flex flex-col gap-2">
            {/* Contacts Buttons */}
            <div className="flex items-center gap-2 py-1">
              <button className="px-6 py-1 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0]">
                Add
              </button>
              <button className="px-6 py-1 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0]">
                Edit
              </button>
              <button className="px-6 py-1 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0]">
                Delete
              </button>
            </div>

            {/* Contacts Grid */}
            <div className="bg-[#ffffcc] border border-[#c0c0c0] flex-1 min-h-[120px] overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#ffffcc]">
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Contact</th>
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "12%" }}>Title</th>
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Phone</th>
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Fax</th>
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Mobile</th>
                    <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "18%" }}>Email</th>
                    <th className="px-2 py-1 text-center border border-[#c0c0c0] font-medium" style={{ width: "5%" }}>Inv</th>
                    <th className="px-2 py-1 text-center border border-[#c0c0c0] font-medium" style={{ width: "5%" }}>ES</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.contacts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0] bg-white">
                        No contacts found
                      </td>
                    </tr>
                  ) : (
                    customer.contacts.map((contact) => (
                      <tr
                        key={contact.id}
                        onClick={() => setSelectedContact(contact.id)}
                        className={`cursor-pointer ${
                          selectedContact === contact.id
                            ? "bg-[#0078d4] text-white"
                            : "bg-white hover:bg-[#f0f8ff]"
                        }`}
                      >
                        <td className="px-2 py-1 border border-[#d0d0d0]">{contact.name}</td>
                        <td className="px-2 py-1 border border-[#d0d0d0]">{contact.title || ""}</td>
                        <td className="px-2 py-1 border border-[#d0d0d0]">{contact.phone || ""}</td>
                        <td className="px-2 py-1 border border-[#d0d0d0]">{contact.fax || ""}</td>
                        <td className="px-2 py-1 border border-[#d0d0d0]">{contact.mobile || ""}</td>
                        <td className="px-2 py-1 border border-[#d0d0d0]">{contact.email || ""}</td>
                        <td className="px-2 py-1 border border-[#d0d0d0] text-center">{contact.inv ? "Y" : ""}</td>
                        <td className="px-2 py-1 border border-[#d0d0d0] text-center">{contact.es ? "Y" : ""}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Account Listing Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-1 py-1">
                <span className="font-medium text-[12px]">Account Listing</span>
                <button
                  onClick={() => !isNew && openTab("New Account", `/accounts/new?customerId=${customerId}`)}
                  disabled={isNew}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    if (selectedAccount && customer) {
                      openTab("New Account (Copy)", `/accounts/new?customerId=${customerId}&copyFrom=${selectedAccount}`);
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Rep
                </button>
                <button
                  onClick={() => {
                    if (selectedAccount && customer) {
                      const acct = customer.premises.find(p => p.id === selectedAccount);
                      if (acct) openTab(acct.name || acct.address, `/accounts/${selectedAccount}`);
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (selectedAccount && confirm("Delete this account?")) {
                      try {
                        const res = await fetch(`/api/premises/${selectedAccount}`, { method: "DELETE" });
                        if (res.ok) { setSelectedAccount(null); fetchCustomer(); }
                      } catch (e) { console.error(e); }
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Del
                </button>
              </div>

              {/* Account Grid */}
              <div className="flex-1 border border-[#808080] bg-white overflow-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#f0f0f0]">
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>ID</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "25%" }}>Tag</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>City</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Type</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Status</th>
                      <th className="px-2 py-1 text-center border border-[#c0c0c0] font-medium" style={{ width: "10%" }}># Units</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.premises.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                          No accounts found
                        </td>
                      </tr>
                    ) : (
                      customer.premises.map((premises) => (
                        <tr
                          key={premises.id}
                          onClick={() => setSelectedAccount(premises.id)}
                          onDoubleClick={() => openTab(premises.name || premises.address, `/accounts/${premises.id}`)}
                          className={`cursor-pointer ${
                            selectedAccount === premises.id
                              ? "bg-[#0078d4] text-white"
                              : "hover:bg-[#f0f8ff]"
                          }`}
                        >
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.premisesId || "-"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.name || premises.address}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.city || "-"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.type || "Non-Contract"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.isActive ? "Active" : "Inactive"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0] text-center">{premises._count?.units || 0}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0] text-right">{formatCurrency(Number(premises.balance))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "4 Portal" && (
          <div className="flex-1 flex flex-col gap-2">
            {/* Portal Form */}
            <div className="bg-[#ffffcc] border border-[#c0c0c0] p-3">
              <div className="flex items-center">
                <label className="w-24 text-[12px] text-right pr-2">Portal Access</label>
                <select
                  value={formData.portalAccess ? "Yes" : "No"}
                  onChange={(e) => handleInputChange("portalAccess", e.target.value === "Yes")}
                  className="w-32 border border-[#7f9db9] px-1 py-1 text-[12px] bg-white"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Account Listing Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-1 py-1">
                <span className="font-medium text-[12px]">Account Listing</span>
                <button
                  onClick={() => !isNew && openTab("New Account", `/accounts/new?customerId=${customerId}`)}
                  disabled={isNew}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    if (selectedAccount && customer) {
                      openTab("New Account (Copy)", `/accounts/new?customerId=${customerId}&copyFrom=${selectedAccount}`);
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Rep
                </button>
                <button
                  onClick={() => {
                    if (selectedAccount && customer) {
                      const acct = customer.premises.find(p => p.id === selectedAccount);
                      if (acct) openTab(acct.name || acct.address, `/accounts/${selectedAccount}`);
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (selectedAccount && confirm("Delete this account?")) {
                      try {
                        const res = await fetch(`/api/premises/${selectedAccount}`, { method: "DELETE" });
                        if (res.ok) { setSelectedAccount(null); fetchCustomer(); }
                      } catch (e) { console.error(e); }
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Del
                </button>
              </div>

              {/* Account Grid */}
              <div className="flex-1 border border-[#808080] bg-white overflow-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#f0f0f0]">
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>ID</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "25%" }}>Tag</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>City</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Type</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Status</th>
                      <th className="px-2 py-1 text-center border border-[#c0c0c0] font-medium" style={{ width: "10%" }}># Units</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.premises.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                          No accounts found
                        </td>
                      </tr>
                    ) : (
                      customer.premises.map((premises) => (
                        <tr
                          key={premises.id}
                          onClick={() => setSelectedAccount(premises.id)}
                          onDoubleClick={() => openTab(premises.name || premises.address, `/accounts/${premises.id}`)}
                          className={`cursor-pointer ${
                            selectedAccount === premises.id
                              ? "bg-[#0078d4] text-white"
                              : "hover:bg-[#f0f8ff]"
                          }`}
                        >
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.premisesId || "-"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.name || premises.address}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.city || "-"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.type || "Non-Contract"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.isActive ? "Active" : "Inactive"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0] text-center">{premises._count?.units || 0}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0] text-right">{formatCurrency(Number(premises.balance))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "5 Remarks" && (
          <div className="flex-1 flex flex-col gap-2">
            {/* Add Date Link */}
            <div className="flex items-center">
              <button
                onClick={() => {
                  const today = new Date().toLocaleDateString("en-US");
                  const currentRemarks = formData.remarks || "";
                  handleInputChange("remarks", `${today}\n${currentRemarks}`);
                }}
                className="text-[#0066cc] text-[12px] hover:underline cursor-pointer"
              >
                Add Date
              </button>
            </div>

            {/* Remarks Text Area */}
            <div className="bg-white border border-[#c0c0c0] flex-1 min-h-[100px]">
              <textarea
                value={formData.remarks || ""}
                onChange={(e) => handleInputChange("remarks", e.target.value)}
                className="w-full h-full p-2 text-[12px] resize-none border-none outline-none"
                style={{ minHeight: "100px" }}
              />
            </div>

            {/* Sales Fields */}
            <div className="flex items-center gap-8 py-2">
              <div className="flex items-center">
                <label className="text-[12px] pr-2">Current Year Sales</label>
                <input
                  type="text"
                  value={formatCurrency(Number(formData.currentYearSales) || 0)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, "");
                    handleInputChange("currentYearSales", parseFloat(value) || 0);
                  }}
                  className="w-32 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white text-right"
                />
              </div>
              <div className="flex items-center">
                <label className="text-[12px] pr-2">Prior Year Sales</label>
                <input
                  type="text"
                  value={formatCurrency(Number(formData.priorYearSales) || 0)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, "");
                    handleInputChange("priorYearSales", parseFloat(value) || 0);
                  }}
                  className="w-32 border border-[#7f9db9] px-2 py-1 text-[12px] bg-white text-right"
                />
              </div>
            </div>

            {/* Account Listing Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-1 py-1">
                <span className="font-medium text-[12px]">Account Listing</span>
                <button
                  onClick={() => !isNew && openTab("New Account", `/accounts/new?customerId=${customerId}`)}
                  disabled={isNew}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    if (selectedAccount && customer) {
                      openTab("New Account (Copy)", `/accounts/new?customerId=${customerId}&copyFrom=${selectedAccount}`);
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Rep
                </button>
                <button
                  onClick={() => {
                    if (selectedAccount && customer) {
                      const acct = customer.premises.find(p => p.id === selectedAccount);
                      if (acct) openTab(acct.name || acct.address, `/accounts/${selectedAccount}`);
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (selectedAccount && confirm("Delete this account?")) {
                      try {
                        const res = await fetch(`/api/premises/${selectedAccount}`, { method: "DELETE" });
                        if (res.ok) { setSelectedAccount(null); fetchCustomer(); }
                      } catch (e) { console.error(e); }
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Del
                </button>
              </div>

              {/* Account Grid */}
              <div className="flex-1 border border-[#808080] bg-white overflow-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#f0f0f0]">
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>ID</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "25%" }}>Tag</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>City</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Type</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Status</th>
                      <th className="px-2 py-1 text-center border border-[#c0c0c0] font-medium" style={{ width: "10%" }}># Units</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.premises.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                          No accounts found
                        </td>
                      </tr>
                    ) : (
                      customer.premises.map((premises) => (
                        <tr
                          key={premises.id}
                          onClick={() => setSelectedAccount(premises.id)}
                          onDoubleClick={() => openTab(premises.name || premises.address, `/accounts/${premises.id}`)}
                          className={`cursor-pointer ${
                            selectedAccount === premises.id
                              ? "bg-[#0078d4] text-white"
                              : "hover:bg-[#f0f8ff]"
                          }`}
                        >
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.premisesId || "-"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.name || premises.address}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.city || "-"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.type || "Non-Contract"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.isActive ? "Active" : "Inactive"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0] text-center">{premises._count?.units || 0}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0] text-right">{formatCurrency(Number(premises.balance))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Sales Remarks" && (
          <div className="flex-1 flex flex-col gap-2">
            {/* Sales Remarks Header */}
            <div className="flex items-center gap-4">
              <span className="text-[12px]">Sales Remarks</span>
              <button
                onClick={() => {
                  const today = new Date().toLocaleDateString("en-US");
                  const currentRemarks = formData.salesRemarks || "";
                  handleInputChange("salesRemarks", `${today}\n${currentRemarks}`);
                }}
                className="text-[#0066cc] text-[12px] hover:underline cursor-pointer"
              >
                Add Date
              </button>
            </div>

            {/* Sales Remarks Text Area */}
            <div className="bg-white border border-[#c0c0c0] flex-1 min-h-[150px]">
              <textarea
                value={formData.salesRemarks || ""}
                onChange={(e) => handleInputChange("salesRemarks", e.target.value)}
                className="w-full h-full p-2 text-[12px] resize-none border-none outline-none"
                style={{ minHeight: "150px" }}
              />
            </div>

            {/* Account Listing Section */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-1 py-1">
                <span className="font-medium text-[12px]">Account Listing</span>
                <button
                  onClick={() => !isNew && openTab("New Account", `/accounts/new?customerId=${customerId}`)}
                  disabled={isNew}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    if (selectedAccount && customer) {
                      openTab("New Account (Copy)", `/accounts/new?customerId=${customerId}&copyFrom=${selectedAccount}`);
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Rep
                </button>
                <button
                  onClick={() => {
                    if (selectedAccount && customer) {
                      const acct = customer.premises.find(p => p.id === selectedAccount);
                      if (acct) openTab(acct.name || acct.address, `/accounts/${selectedAccount}`);
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (selectedAccount && confirm("Delete this account?")) {
                      try {
                        const res = await fetch(`/api/premises/${selectedAccount}`, { method: "DELETE" });
                        if (res.ok) { setSelectedAccount(null); fetchCustomer(); }
                      } catch (e) { console.error(e); }
                    }
                  }}
                  disabled={!selectedAccount}
                  className="px-3 py-0.5 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
                >
                  Del
                </button>
              </div>

              {/* Account Grid */}
              <div className="flex-1 border border-[#808080] bg-white overflow-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead>
                    <tr className="bg-[#f0f0f0]">
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>ID</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "25%" }}>Tag</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>City</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Type</th>
                      <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Status</th>
                      <th className="px-2 py-1 text-center border border-[#c0c0c0] font-medium" style={{ width: "10%" }}># Units</th>
                      <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.premises.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                          No accounts found
                        </td>
                      </tr>
                    ) : (
                      customer.premises.map((premises) => (
                        <tr
                          key={premises.id}
                          onClick={() => setSelectedAccount(premises.id)}
                          onDoubleClick={() => openTab(premises.name || premises.address, `/accounts/${premises.id}`)}
                          className={`cursor-pointer ${
                            selectedAccount === premises.id
                              ? "bg-[#0078d4] text-white"
                              : "hover:bg-[#f0f8ff]"
                          }`}
                        >
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.premisesId || "-"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.name || premises.address}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.city || "-"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.type || "Non-Contract"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0]">{premises.isActive ? "Active" : "Inactive"}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0] text-center">{premises._count?.units || 0}</td>
                          <td className="px-2 py-1 border border-[#d0d0d0] text-right">{formatCurrency(Number(premises.balance))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center justify-between text-[11px]">
        <span className="font-medium">{isDirty ? "EDIT*" : "EDIT"}</span>
        <div className="flex items-center gap-8">
          <span>{formatDate(customer.createdAt)}</span>
          <span>{formatDate(customer.updatedAt)}</span>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showDialog}
        onSave={handleDialogSave}
        onDiscard={handleDialogDiscard}
        onCancel={handleDialogCancel}
        message="Do you want to save changes to this customer?"
      />
    </div>
  );
}
