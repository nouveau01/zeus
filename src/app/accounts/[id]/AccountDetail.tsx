"use client";

import { useState, useEffect } from "react";
import { useTabs } from "@/context/TabContext";

interface Unit {
  id: string;
  unitNumber: string;
  unitType: string | null;
  category: string | null;
  serial: string | null;
  manufacturer: string | null;
  status: string | null;
  description: string | null;
}

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

interface Account {
  id: string;
  premisesId: string | null;
  name: string | null;
  address: string;
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
  type: string | null;
  isActive: boolean;
  balance: number;
  customerId: string;
  customer: {
    id: string;
    name: string;
  };
  units: Unit[];
  _count: {
    units: number;
    jobs: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface AccountDetailProps {
  accountId: string;
  onClose: () => void;
}

const TABS = ["General", "Billing", "Control", "Custom", "PM Contracts", "Contacts", "Remarks", "Sales Remarks"];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function AccountDetail({ accountId, onClose }: AccountDetailProps) {
  const { openTab } = useTabs();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("General");
  const [formData, setFormData] = useState<Partial<Account>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);

  // Remarks state
  const [accountRemarks, setAccountRemarks] = useState("");
  const [customerRemarks, setCustomerRemarks] = useState("");
  const [collectionNotes, setCollectionNotes] = useState("");
  const [salesRemarks, setSalesRemarks] = useState("");

  // Mock contacts data (will be fetched from API later)
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Mock PM contracts data
  const [pmContracts, setPmContracts] = useState<any[]>([]);

  useEffect(() => {
    fetchAccount();
  }, [accountId]);

  const fetchAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/premises/${accountId}`);
      if (response.ok) {
        const data = await response.json();
        setAccount(data);
        setFormData(data);
      }
    } catch (error) {
      console.error("Error fetching account:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Account, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/premises/${accountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const updated = await response.json();
        setAccount(updated);
        setFormData(updated);
        setIsDirty(false);
      }
    } catch (error) {
      console.error("Error saving account:", error);
    }
  };

  const openCustomer = () => {
    if (account?.customer) {
      openTab(account.customer.name, `/customers/${account.customer.id}`);
    }
  };

  const addDateToRemarks = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    const date = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
    setter((prev) => `${prev}${prev ? "\n" : ""}${date} - `);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f5]">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f5]">
        <span className="text-red-500">Account not found</span>
      </div>
    );
  }

  // General Tab Content
  const renderGeneralTab = () => (
    <>
      {/* Form Section */}
      <div className="bg-[#ffffcc] border border-[#d0d0d0] m-2 p-3 flex gap-6">
        {/* Left Column - Address Info */}
        <div className="flex flex-col gap-2 min-w-[280px]">
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">ID</label>
            <input
              type="text"
              value={formData.premisesId || ""}
              onChange={(e) => handleInputChange("premisesId", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Tag</label>
            <input
              type="text"
              value={formData.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Address</label>
            <input
              type="text"
              value={formData.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">City</label>
            <input
              type="text"
              value={formData.city || ""}
              onChange={(e) => handleInputChange("city", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">State</label>
            <select
              value={formData.state || ""}
              onChange={(e) => handleInputChange("state", e.target.value)}
              className="w-16 px-1 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            >
              <option value=""></option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <label className="text-[12px] ml-2">Zip</label>
            <input
              type="text"
              value={formData.zipCode || ""}
              onChange={(e) => handleInputChange("zipCode", e.target.value)}
              className="w-24 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Country</label>
            <input
              type="text"
              value={formData.country || "United States"}
              onChange={(e) => handleInputChange("country", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
        </div>

        {/* Middle Column - Contact Info */}
        <div className="flex flex-col gap-2 min-w-[280px]">
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Contact</label>
            <input
              type="text"
              value={formData.contact || ""}
              onChange={(e) => handleInputChange("contact", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Phone</label>
            <input
              type="text"
              value={formData.phone || ""}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Fax</label>
            <input
              type="text"
              value={formData.fax || ""}
              onChange={(e) => handleInputChange("fax", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Cellular</label>
            <input
              type="text"
              value={formData.cellular || ""}
              onChange={(e) => handleInputChange("cellular", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">e-mail</label>
            <input
              type="text"
              value={formData.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Web Site</label>
            <input
              type="text"
              value={formData.website || ""}
              onChange={(e) => handleInputChange("website", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
        </div>

        {/* Right Column - Link Buttons */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <button
            onClick={openCustomer}
            className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium"
          >
            Customer
          </button>
          <button
            onClick={() => openTab(`Jobs - ${account.name || account.premisesId}`, `/job-maintenance?premisesId=${account.id}`)}
            className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium"
          >
            Jobs
          </button>
          <button className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium">
            Job Results
          </button>
          <button className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium">
            Invoices
          </button>
          <button className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium">
            Completed Tickets
          </button>
          <button className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium">
            Open Tickets
          </button>
          <button className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium">
            Quotes
          </button>
          <button className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium">
            Estimates
          </button>
          <button className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium">
            Violations
          </button>
          <button className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium">
            Safety Tests
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-6 px-4 py-2 bg-[#f5f5f5]">
        <div className="flex items-center gap-2">
          <label className="text-[12px]"># Units</label>
          <input
            type="text"
            value={account._count?.units || 0}
            readOnly
            className="w-12 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-[#f0f0f0] text-center"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[12px]">Write-Offs</label>
          <input
            type="text"
            value="$0.00"
            readOnly
            className="w-20 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-[#f0f0f0] text-right"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[12px]">Avg Paid</label>
          <input
            type="text"
            value="0"
            readOnly
            className="w-16 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-[#f0f0f0] text-center"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[12px]">Balance</label>
          <input
            type="text"
            value={formatCurrency(Number(account.balance))}
            readOnly
            className="w-28 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-[#f0f0f0] text-right"
          />
        </div>
      </div>

      {/* Unit Listing Section */}
      <div className="flex-1 flex flex-col mx-2 mb-2 overflow-hidden">
        <div className="flex items-center gap-2 py-1 bg-[#f5f5f5]">
          <span className="text-[12px] font-medium">Unit Listing</span>
          <button className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
            Add
          </button>
          <button className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
            Rep
          </button>
          <button className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
            Edit
          </button>
          <button className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
            Del
          </button>
        </div>

        <div className="flex-1 border border-[#a0a0a0] bg-white overflow-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead className="bg-[#f0f0f0] sticky top-0">
              <tr>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Unit #</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "15%" }}>Category</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Type</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Serial</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "15%" }}>Manufacturer</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Status</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]">Description</th>
              </tr>
            </thead>
            <tbody>
              {account.units.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                    No units found
                  </td>
                </tr>
              ) : (
                account.units.map((unit) => (
                  <tr
                    key={unit.id}
                    onClick={() => setSelectedUnit(unit.id)}
                    className={`cursor-pointer ${
                      selectedUnit === unit.id
                        ? "bg-[#0078d4] text-white"
                        : "hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-2 py-1 border border-[#d0d0d0]">{unit.unitNumber}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{unit.category || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{unit.unitType || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{unit.serial || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{unit.manufacturer || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{unit.status || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{unit.description || ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // Billing Tab Content
  const renderBillingTab = () => (
    <>
      <div className="bg-[#ffffcc] border border-[#d0d0d0] m-2 p-3 flex gap-6">
        {/* Left Column - Billing Address */}
        <div className="flex flex-col gap-2 min-w-[300px]">
          <div className="flex items-center gap-2">
            <label className="w-20 text-right text-[12px]">Customer</label>
            <button
              onClick={openCustomer}
              className="flex-1 px-2 py-1 text-[12px] text-[#0066cc] hover:underline text-left"
            >
              {account.customer?.name || ""}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-right text-[12px]">Address</label>
            <input
              type="text"
              value={formData.address || ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-right text-[12px]">City</label>
            <input
              type="text"
              value={formData.city || ""}
              onChange={(e) => handleInputChange("city", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-right text-[12px]">State/Zip</label>
            <select
              value={formData.state || ""}
              onChange={(e) => handleInputChange("state", e.target.value)}
              className="w-16 px-1 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            >
              <option value=""></option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
            <input
              type="text"
              value={formData.zipCode || ""}
              onChange={(e) => handleInputChange("zipCode", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-right text-[12px]">Attn</label>
            <input
              type="text"
              value={formData.contact || ""}
              onChange={(e) => handleInputChange("contact", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-right text-[12px]">Country</label>
            <input
              type="text"
              value={formData.country || "United States"}
              onChange={(e) => handleInputChange("country", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-4 mt-2">
            <button className="px-4 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
              Update
            </button>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="email-inv" className="w-3 h-3" />
              <label htmlFor="email-inv" className="text-[12px]">Email</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="print-inv" className="w-3 h-3" defaultChecked />
              <label htmlFor="print-inv" className="text-[12px]">Print</label>
            </div>
          </div>
        </div>

        {/* Right Column - Parts Markup Table */}
        <div className="flex flex-col gap-2 min-w-[200px]">
          <span className="text-[12px] font-medium">Parts Markup %</span>
          <div className="border border-[#a0a0a0] bg-white">
            <table className="w-full border-collapse text-[12px]">
              <thead className="bg-[#f0f0f0]">
                <tr>
                  <th className="px-2 py-1 text-left font-medium border-b border-[#c0c0c0]">Job Type</th>
                  <th className="px-2 py-1 text-right font-medium border-b border-[#c0c0c0]">%</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">Repair</td>
                  <td className="px-2 py-1 text-right border-b border-[#e0e0e0]">25.00</td>
                </tr>
                <tr>
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">Contract</td>
                  <td className="px-2 py-1 text-right border-b border-[#e0e0e0]">20.00</td>
                </tr>
                <tr>
                  <td className="px-2 py-1 border-b border-[#e0e0e0]">Modernization</td>
                  <td className="px-2 py-1 text-right border-b border-[#e0e0e0]">15.00</td>
                </tr>
                <tr>
                  <td className="px-2 py-1">Safety Test</td>
                  <td className="px-2 py-1 text-right">20.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );

  // Control Tab Content
  const renderControlTab = () => (
    <>
      <div className="bg-[#ffffcc] border border-[#d0d0d0] m-2 p-3 flex gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-2 min-w-[280px]">
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Type</label>
            <select
              value={formData.type || ""}
              onChange={(e) => handleInputChange("type", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            >
              <option value="">Select...</option>
              <option value="Contract">Contract</option>
              <option value="Non-Contract">Non-Contract</option>
              <option value="Modernization">Modernization</option>
              <option value="Inspection">Inspection</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Status</label>
            <select
              value={formData.isActive ? "Active" : "Inactive"}
              onChange={(e) => handleInputChange("isActive", e.target.value === "Active")}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Territory</label>
            <input
              type="text"
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Route</label>
            <input
              type="text"
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Contract Billing</label>
            <select className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white">
              <option value="">Select...</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Annual">Annual</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Terms</label>
            <select className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white">
              <option value="">Select...</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
              <option value="Due on Receipt">Due on Receipt</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Current Year Sales</label>
            <input
              type="text"
              value="$0.00"
              readOnly
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-[#f0f0f0] text-right"
            />
          </div>
        </div>

        {/* Middle Column */}
        <div className="flex flex-col gap-2 min-w-[280px]">
          <div className="flex items-center gap-2">
            <label className="w-24 text-right text-[12px]">Sales Tax 1</label>
            <input
              type="text"
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-right text-[12px]">Sales Tax 2</label>
            <input
              type="text"
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-right text-[12px]">Use Tax</label>
            <input
              type="text"
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-right text-[12px]">Zone</label>
            <input
              type="text"
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-right text-[12px]">Safety Test</label>
            <select className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white">
              <option value="">Select...</option>
              <option value="Annual">Annual</option>
              <option value="Semi-Annual">Semi-Annual</option>
              <option value="5 Year">5 Year</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-right text-[12px]">Price Level</label>
            <select className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white">
              <option value="">Select...</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Discount">Discount</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-right text-[12px]">Prior Year Sales</label>
            <input
              type="text"
              value="$0.00"
              readOnly
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-[#f0f0f0] text-right"
            />
          </div>
        </div>

        {/* Right Column - Checkboxes and Links */}
        <div className="flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="dispatch-alert" className="w-3 h-3" />
            <label htmlFor="dispatch-alert" className="text-[12px]">Dispatch Alert</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="credit-hold" className="w-3 h-3" />
            <label htmlFor="credit-hold" className="text-[12px]">Credit Hold</label>
          </div>
          <div className="mt-4 flex flex-col gap-1">
            <button className="text-left text-[12px] text-[#0066cc] hover:underline">
              Full Service Contract
            </button>
            <button className="text-left text-[12px] text-[#0066cc] hover:underline">
              Oil & Grease Contract
            </button>
            <button className="text-left text-[12px] text-[#0066cc] hover:underline">
              Inspection Contract
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // Custom Tab Content
  const renderCustomTab = () => (
    <>
      <div className="bg-[#ffffcc] border border-[#d0d0d0] m-2 p-3 flex gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-2 min-w-[280px]">
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">COLLECTOR</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">ROUTE</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">GROUPING</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Acct Rep</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">DWS</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Type Categories</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Pre Test</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
        </div>

        {/* Middle Column */}
        <div className="flex flex-col gap-2 min-w-[280px]">
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Resident Mech</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Grouping 2</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Proposal Rcvd</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">ViolationUpdate</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Custom 12</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Custom 13</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Custom 14</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-2 min-w-[200px]">
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">Supervisor</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-28 text-right text-[12px]">PREF-WITNESS</label>
            <input type="text" className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white" />
          </div>
        </div>
      </div>
    </>
  );

  // PM Contracts Tab Content
  const renderPMContractsTab = () => (
    <>
      <div className="flex-1 flex flex-col mx-2 mt-2 mb-2 overflow-hidden">
        {/* Buttons */}
        <div className="flex items-center gap-2 py-1 bg-[#f5f5f5]">
          <button className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
            Add
          </button>
          <button className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
            Edit
          </button>
        </div>

        {/* PM Contracts Grid */}
        <div className="flex-1 border border-[#a0a0a0] bg-white overflow-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead className="bg-[#f0f0f0] sticky top-0">
              <tr>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Job</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "25%" }}>Description</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Schedule</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Hours</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Billing Cycle</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Billing Amt</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Monthly Amt</th>
                <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "7%" }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {pmContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                    No PM contracts found
                  </td>
                </tr>
              ) : (
                pmContracts.map((contract) => (
                  <tr
                    key={contract.id}
                    onClick={() => setSelectedContract(contract.id)}
                    className={`cursor-pointer ${
                      selectedContract === contract.id
                        ? "bg-[#0078d4] text-white"
                        : "hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-2 py-1 border border-[#d0d0d0]">{contract.job}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{contract.description}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{contract.schedule}</td>
                    <td className="px-2 py-1 text-right border border-[#d0d0d0]">{contract.hours}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{contract.billingCycle}</td>
                    <td className="px-2 py-1 text-right border border-[#d0d0d0]">{contract.billingAmt}</td>
                    <td className="px-2 py-1 text-right border border-[#d0d0d0]">{contract.monthlyAmt}</td>
                    <td className="px-2 py-1 text-center border border-[#d0d0d0]">
                      <input type="checkbox" checked={contract.active} readOnly className="w-3 h-3" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // Contacts Tab Content
  const renderContactsTab = () => (
    <>
      <div className="flex-1 flex flex-col mx-2 mt-2 mb-2 overflow-hidden">
        {/* Buttons */}
        <div className="flex items-center gap-2 py-1 bg-[#f5f5f5]">
          <button className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
            Add
          </button>
          <button className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
            Edit
          </button>
          <button className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
            Delete
          </button>
        </div>

        {/* Contacts Grid */}
        <div className="flex-1 border border-[#a0a0a0] bg-white overflow-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead className="bg-[#f0f0f0] sticky top-0">
              <tr>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "18%" }}>Contact</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Title</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Phone</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Fax</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Mobile</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "18%" }}>Email</th>
                <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "4%" }}>Inv</th>
                <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "4%" }}>Tix</th>
                <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "4%" }}>Qte</th>
                <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "4%" }}>End</th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                    No contacts found
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr
                    key={contact.id}
                    onClick={() => setSelectedContact(contact.id)}
                    className={`cursor-pointer ${
                      selectedContact === contact.id
                        ? "bg-[#0078d4] text-white"
                        : "hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-2 py-1 border border-[#d0d0d0]">{contact.name}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{contact.title || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{contact.phone || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{contact.fax || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{contact.mobile || ""}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{contact.email || ""}</td>
                    <td className="px-2 py-1 text-center border border-[#d0d0d0]">
                      <input type="checkbox" checked={contact.inv} readOnly className="w-3 h-3" />
                    </td>
                    <td className="px-2 py-1 text-center border border-[#d0d0d0]">
                      <input type="checkbox" checked={false} readOnly className="w-3 h-3" />
                    </td>
                    <td className="px-2 py-1 text-center border border-[#d0d0d0]">
                      <input type="checkbox" checked={false} readOnly className="w-3 h-3" />
                    </td>
                    <td className="px-2 py-1 text-center border border-[#d0d0d0]">
                      <input type="checkbox" checked={contact.es} readOnly className="w-3 h-3" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // Remarks Tab Content
  const renderRemarksTab = () => (
    <>
      <div className="bg-[#ffffcc] border border-[#d0d0d0] m-2 p-3 flex gap-6">
        {/* Left Column - Account & Customer Remarks */}
        <div className="flex flex-col gap-4 flex-1">
          {/* Account Remarks */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium">Account Remarks</span>
              <button
                onClick={() => addDateToRemarks(setAccountRemarks)}
                className="text-[11px] text-[#0066cc] hover:underline"
              >
                Add Date
              </button>
            </div>
            <textarea
              value={accountRemarks}
              onChange={(e) => setAccountRemarks(e.target.value)}
              className="w-full h-32 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white resize-none"
              placeholder="Enter account remarks..."
            />
          </div>

          {/* Customer Remarks */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium">Customer Remarks</span>
              <button
                onClick={() => addDateToRemarks(setCustomerRemarks)}
                className="text-[11px] text-[#0066cc] hover:underline"
              >
                Add Date
              </button>
            </div>
            <textarea
              value={customerRemarks}
              onChange={(e) => setCustomerRemarks(e.target.value)}
              className="w-full h-32 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white resize-none"
              placeholder="Enter customer remarks..."
            />
          </div>
        </div>

        {/* Right Column - Collection Notes */}
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium">Collection Notes</span>
            <button
              onClick={() => addDateToRemarks(setCollectionNotes)}
              className="text-[11px] text-[#0066cc] hover:underline"
            >
              Add Date
            </button>
          </div>
          <textarea
            value={collectionNotes}
            onChange={(e) => setCollectionNotes(e.target.value)}
            className="w-full h-72 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white resize-none"
            placeholder="Enter collection notes..."
          />
        </div>
      </div>
    </>
  );

  // Sales Remarks Tab Content
  const renderSalesRemarksTab = () => (
    <>
      <div className="bg-[#ffffcc] border border-[#d0d0d0] m-2 p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium">Sales Remarks</span>
          <button
            onClick={() => addDateToRemarks(setSalesRemarks)}
            className="text-[11px] text-[#0066cc] hover:underline"
          >
            Add Date
          </button>
        </div>
        <textarea
          value={salesRemarks}
          onChange={(e) => setSalesRemarks(e.target.value)}
          className="w-full h-64 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white resize-none"
          placeholder="Enter sales remarks..."
        />
      </div>
    </>
  );

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "General":
        return renderGeneralTab();
      case "Billing":
        return renderBillingTab();
      case "Control":
        return renderControlTab();
      case "Custom":
        return renderCustomTab();
      case "PM Contracts":
        return renderPMContractsTab();
      case "Contacts":
        return renderContactsTab();
      case "Remarks":
        return renderRemarksTab();
      case "Sales Remarks":
        return renderSalesRemarksTab();
      default:
        return renderGeneralTab();
    }
  };

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

      {/* Tabs */}
      <div className="bg-[#f5f5f5] flex items-end px-2 pt-1 border-b border-[#d0d0d0]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-[12px] border-t border-l border-r rounded-t -mb-px ${
              activeTab === tab
                ? "bg-white border-[#a0a0a0] border-b-white z-10 font-medium"
                : "bg-[#e8e8e8] border-[#c0c0c0] text-[#606060] hover:bg-[#f0f0f0]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderTabContent()}
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center justify-between text-[11px]">
        <span>EDIT</span>
        <div className="flex gap-8">
          <span>{account.createdAt ? new Date(account.createdAt).toLocaleDateString() : ""}</span>
          <span>{account.updatedAt ? new Date(account.updatedAt).toLocaleDateString() : ""}</span>
        </div>
      </div>
    </div>
  );
}
