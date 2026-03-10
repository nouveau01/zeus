"use client";

import { useState, useEffect, useCallback } from "react";
import { ActivityHistory } from "@/components/ActivityHistory";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/UnsavedChangesDialog";
import { useXPDialog } from "@/components/ui/XPDialog";
import { AddressAutocomplete, AddressSelection } from "@/components/ui/AddressAutocomplete";
import { validateRequiredFields } from "@/lib/detail-registry/validation";
import { useRequiredFields } from "@/hooks/useRequiredFields";
import { ClickToCall } from "@/components/ui/ClickToCall";
import {
  FileText,
  Save,
  Undo,
  DollarSign,
  Printer,
  Home,
  HelpCircle,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  Trash2,
} from "lucide-react";

interface Vendor {
  id: string;
  vendorId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  contact: string;
  phone: string;
  fax: string;
  cellular: string;
  email: string;
  webSite: string;
  remitTo: string;
  createdAt: string;
  updatedAt: string;
}

interface Contact {
  id: string;
  name: string;
  title: string;
  phone: string;
  fax: string;
  mobile: string;
  email: string;
  isPOContact: boolean;
}

interface VendorDetailProps {
  vendorId: string;
  onClose: () => void;
}

const TABS = ["1 General", "2 Control", "3 Contacts", "4 Custom", "5 ACH", "Field History"];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function VendorDetail({ vendorId, onClose }: VendorDetailProps) {
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();

  // Load saved layout from DB (for required field config + asterisks)
  const { layout: vendorLayout, fieldDefs: vendorFieldDefs, reqMark } = useRequiredFields("vendors-detail");

  const [activeTab, setActiveTab] = useState("1 General");
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(true);
  const [savingFromHook, setSavingFromHook] = useState(false);

  // Form state - General tab
  const [formData, setFormData] = useState({
    vendorId: "",
    name: "",
    address: "",
    city: "",
    state: "NY",
    zip: "",
    country: "United States",
    contact: "",
    phone: "(718) 000-0000",
    fax: "(718) 000-0000",
    cellular: "(718) 000-0000",
    email: "",
    webSite: "",
    remitTo: "",
  });

  // Form state - Control tab
  const [controlData, setControlData] = useState({
    status: "Active",
    type: "Cost of Sales",
    creditLimit: "0.00",
    is1099: false,
    box1099: "7",
    is1099MISC: false,
    is1099NEC: false,
    fedId: "",
    acctNumber: "",
    balance: "0.00",
    shipVia: "UPS",
    defaultAcct: "OTHER INCOME & EXPENSES",
    payStyle: "Normal",
    desiredBank: "",
    terms: "Net 30 Days",
    discount: "0.00",
    ifPaidIn: "10",
  });

  // Contacts state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Custom fields state
  const [customData, setCustomData] = useState({
    custom1: "",
    custom2: "",
    custom3: "",
    custom4: "",
    custom5: "",
    custom6: "",
    custom7: "",
    custom8: "",
    custom9: "",
    custom10: "",
    notes: "",
  });

  // ACH fields state
  const [achData, setACHData] = useState({
    bankAccountNumber: "",
    bankRouteNumber: "",
    bankAcctType: "Checking",
  });

  // Save callback for the unsaved changes hook
  const handleSaveForHook = useCallback(async () => {
    const allFormData = { ...formData, ...controlData, ...achData, ...customData };
    const missing = vendorLayout ? validateRequiredFields(vendorLayout, vendorFieldDefs, allFormData) : [];
    if (missing.length > 0) {
      throw new Error(`Please fill in required fields: ${missing.join(", ")}`);
    }
    setSavingFromHook(true);
    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ...controlData,
          ...achData,
          ...customData,
        }),
      });
      if (!response.ok) throw new Error("Failed to save vendor");
    } finally {
      setSavingFromHook(false);
    }
  }, [vendorId, formData, controlData, achData, customData]);

  // Unsaved changes hook
  const {
    isDirty: hasChanges,
    setIsDirty: setHasChanges,
    markDirty,
    confirmNavigation,
    showDialog,
    handleDialogSave,
    handleDialogDiscard,
    handleDialogCancel,
  } = useUnsavedChanges({ onSave: handleSaveForHook });

  // Fetch vendor from API
  const fetchVendor = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/vendors/${vendorId}`);
      if (response.ok) {
        const data = await response.json();
        setVendor({
          id: data.id,
          vendorId: data.acct || "",
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "NY",
          zip: data.zipCode || "",
          country: "United States",
          contact: data.contact || "",
          phone: data.phone || "",
          fax: data.fax || "",
          cellular: "",
          email: data.email || "",
          webSite: data.website || "",
          remitTo: data.remitAddress || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        setFormData({
          vendorId: data.acct || "",
          name: data.name || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "NY",
          zip: data.zipCode || "",
          country: "United States",
          contact: data.contact || "",
          phone: data.phone || "",
          fax: data.fax || "",
          cellular: "",
          email: data.email || "",
          webSite: data.website || "",
          remitTo: data.remitAddress || "",
        });
        // Map control data
        setControlData({
          status: data.isActive ? "Active" : "Inactive",
          type: data.type || "Cost of Sales",
          creditLimit: data.creditLimit?.toString() || "0.00",
          is1099: data.is1099 === 1,
          box1099: data.intBox?.toString() || "7",
          is1099MISC: data.misc1099Rpt === 1,
          is1099NEC: data.nec1099Rpt === 1,
          fedId: data.fid || "",
          acctNumber: data.acctNumber || "",
          balance: data.balance?.toString() || "0.00",
          shipVia: data.shipVia || "UPS",
          defaultAcct: "OTHER INCOME & EXPENSES",
          payStyle: "Normal",
          desiredBank: data.defaultBank || "",
          terms: "Net 30 Days",
          discount: data.discPercent?.toString() || "0.00",
          ifPaidIn: data.discDays?.toString() || "10",
        });
        // Map ACH data
        setACHData({
          bankAccountNumber: data.bankAcctNo || "",
          bankRouteNumber: data.routeNo || "",
          bankAcctType: data.transCode === 2 ? "Savings" : "Checking",
        });
        // Map custom data
        setCustomData({
          custom1: data.custom1 || "",
          custom2: data.custom2 || "",
          custom3: data.custom3 || "",
          custom4: data.custom4 || "",
          custom5: data.custom5 || "",
          custom6: data.custom6 || "",
          custom7: data.custom7 || "",
          custom8: "",
          custom9: "",
          custom10: "",
          notes: "",
        });
      }
    } catch (error) {
      console.error("Error fetching vendor:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId && vendorId !== "new") {
      fetchVendor();
    } else {
      setLoading(false);
    }
  }, [vendorId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleControlChange = (field: string, value: string | boolean) => {
    setControlData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleCustomChange = (field: string, value: string) => {
    setCustomData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleACHChange = (field: string, value: string) => {
    setACHData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  // Save handler
  const handleSave = async () => {
    const allFormData = { ...formData, ...controlData, ...achData, ...customData };
    const missing = vendorLayout ? validateRequiredFields(vendorLayout, vendorFieldDefs, allFormData) : [];
    if (missing.length > 0) {
      await xpAlert(`Please fill in required fields: ${missing.join(", ")}`);
      return;
    }

    try {
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ...controlData,
          ...achData,
          ...customData,
        }),
      });
      if (response.ok) {
        setHasChanges(false);
        const updated = await response.json();
        // Update vendor state with saved data
        setVendor(prev => prev ? {
          ...prev,
          vendorId: updated.acct || formData.vendorId,
          name: updated.name || formData.name,
          updatedAt: updated.updatedAt,
        } : null);
        await xpAlert("Vendor saved successfully");
      } else {
        await xpAlert("Failed to save vendor");
      }
    } catch (error) {
      console.error("Error saving vendor:", error);
      await xpAlert("Error saving vendor");
    }
  };

  // Undo handler
  const handleUndo = async () => {
    if (await xpConfirm("Discard all changes?")) {
      // Reset to original data
      if (vendor) {
        setFormData({
          vendorId: vendor.vendorId,
          name: vendor.name,
          address: vendor.address,
          city: vendor.city,
          state: vendor.state,
          zip: vendor.zip,
          country: vendor.country,
          contact: vendor.contact,
          phone: vendor.phone,
          fax: vendor.fax,
          cellular: vendor.cellular,
          email: vendor.email,
          webSite: vendor.webSite,
          remitTo: vendor.remitTo,
        });
      }
      setHasChanges(false);
    }
  };

  // Contact handlers
  const handleAddContact = () => {
    setEditingContact({
      id: "",
      name: "",
      title: "",
      phone: "",
      fax: "",
      mobile: "",
      email: "",
      isPOContact: false,
    });
    setShowContactDialog(true);
  };

  const handleEditContact = () => {
    if (selectedContact) {
      setEditingContact({ ...selectedContact });
      setShowContactDialog(true);
    }
  };

  const handleDeleteContact = async () => {
    if (selectedContact && (await xpConfirm("Delete this contact?"))) {
      setContacts(contacts.filter(c => c.id !== selectedContact.id));
      setSelectedContact(null);
      setHasChanges(true);
    }
  };

  const handleSaveContact = async () => {
    if (!editingContact) return;

    if (!editingContact.name) {
      await xpAlert("Contact name is required");
      return;
    }

    if (editingContact.id) {
      // Edit existing
      setContacts(contacts.map(c => c.id === editingContact.id ? editingContact : c));
    } else {
      // Add new
      const newContact = { ...editingContact, id: String(Date.now()) };
      setContacts([...contacts, newContact]);
    }

    setShowContactDialog(false);
    setEditingContact(null);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-[12px]">Loading...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">PIM</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Move</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="New">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Save"
        >
          <Save className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button
          onClick={handleUndo}
          disabled={!hasChanges}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Undo"
        >
          <Undo className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[11px] font-bold text-red-500">✓</span>
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[11px] font-bold text-green-500">✓</span>
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <DollarSign className="w-4 h-4" style={{ color: "#27ae60" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[10px]" style={{ color: "#e74c3c" }}>ABC</span>
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Print">
          <Printer className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Home className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        {/* Navigation */}
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="First">
          <ChevronsLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Previous">
          <ChevronLeft className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Next">
          <ChevronRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Last">
          <ChevronsRight className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button
          onClick={() => confirmNavigation(() => onClose())}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="Close"
        >
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-[#d4d0c8] px-2 pt-2">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-1.5 text-[12px] border-t border-l border-r -mb-px ${
                activeTab === tab
                  ? "bg-white border-[#808080] border-b-[#f5f5f5] z-10"
                  : "bg-[#d4d0c8] border-[#808080] text-[#000000] hover:bg-[#e8e8e8]"
              }`}
              style={{
                borderTopLeftRadius: "2px",
                borderTopRightRadius: "2px",
                textDecoration: activeTab === tab ? "underline" : "none",
                textUnderlineOffset: "2px"
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-white border-t border-[#808080]">
        {activeTab === "1 General" && (
          <div className="p-4 flex gap-8">
            {/* Left Column */}
            <div className="flex flex-col gap-3 min-w-[300px]">
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">ID #{reqMark("vendorId")}</label>
                <input
                  type="text"
                  value={formData.vendorId}
                  readOnly
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-[#f0f0f0]"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Name{reqMark("name")}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Address{reqMark("address")}</label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(val) => handleInputChange("address", val)}
                  onAddressSelect={(addr) => {
                    handleInputChange("address", addr.address);
                    handleInputChange("city", addr.city);
                    handleInputChange("state", addr.state);
                    handleInputChange("zip", addr.zipCode);
                    handleInputChange("country", addr.country);
                  }}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">City{reqMark("city")}</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">State{reqMark("state")}</label>
                <select
                  value={formData.state}
                  onChange={(e) => handleInputChange("state", e.target.value)}
                  className="w-20 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                >
                  {US_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <label className="text-[12px] ml-2">Zip{reqMark("zip")}</label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => handleInputChange("zip", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Country{reqMark("country")}</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-3 min-w-[300px]">
              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Contact{reqMark("contact")}</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => handleInputChange("contact", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Phone{reqMark("phone")}</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  placeholder="(718) 000-0000"
                />
                <ClickToCall number={formData.phone} />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Fax{reqMark("fax")}</label>
                <input
                  type="text"
                  value={formData.fax}
                  onChange={(e) => handleInputChange("fax", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  placeholder="(718) 000-0000"
                />
                <ClickToCall number={formData.fax} />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Cellular{reqMark("cellular")}</label>
                <input
                  type="text"
                  value={formData.cellular}
                  onChange={(e) => handleInputChange("cellular", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  placeholder="(718) 000-0000"
                />
                <ClickToCall number={formData.cellular} />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">e-mail{reqMark("email")}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-20 text-[12px]">Web Site{reqMark("webSite")}</label>
                <input
                  type="text"
                  value={formData.webSite}
                  onChange={(e) => handleInputChange("webSite", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-start gap-2">
                <label className="w-20 text-[12px] pt-1">Remit To{reqMark("remitTo")}</label>
                <textarea
                  value={formData.remitTo}
                  onChange={(e) => handleInputChange("remitTo", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white h-16 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "2 Control" && (
          <div className="p-4 flex gap-12">
            {/* Left Column */}
            <div className="flex flex-col gap-3 min-w-[280px]">
              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Status{reqMark("status")}</label>
                <select
                  value={controlData.status}
                  onChange={(e) => handleControlChange("status", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Type{reqMark("type")}</label>
                <select
                  value={controlData.type}
                  onChange={(e) => handleControlChange("type", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                >
                  <option value="Cost of Sales">Cost of Sales</option>
                  <option value="Overhead">Overhead</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Credit Limit{reqMark("creditLimit")}</label>
                <input
                  type="text"
                  value={`$${controlData.creditLimit}`}
                  onChange={(e) => handleControlChange("creditLimit", e.target.value.replace("$", ""))}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">1099{reqMark("is1099")}</label>
                <input
                  type="checkbox"
                  checked={controlData.is1099}
                  onChange={(e) => handleControlChange("is1099", e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-[12px] ml-2">1099 Box</span>
                <div className="flex items-center border border-[#7f9db9] bg-white">
                  <input
                    type="text"
                    value={controlData.box1099}
                    onChange={(e) => handleControlChange("box1099", e.target.value)}
                    className="w-12 px-2 py-1 text-[12px] border-none text-right"
                  />
                  <div className="flex flex-col border-l border-[#7f9db9]">
                    <button
                      onClick={() => handleControlChange("box1099", String(parseInt(controlData.box1099) + 1))}
                      className="px-1 py-0 text-[10px] hover:bg-[#e0e0e0] border-b border-[#7f9db9]"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleControlChange("box1099", String(Math.max(0, parseInt(controlData.box1099) - 1)))}
                      className="px-1 py-0 text-[10px] hover:bg-[#e0e0e0]"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 ml-[104px]">
                <label className="flex items-center gap-1 text-[12px]">
                  <input
                    type="checkbox"
                    checked={controlData.is1099MISC}
                    onChange={(e) => handleControlChange("is1099MISC", e.target.checked)}
                    className="w-4 h-4"
                  />
                  1099 MISC
                </label>
                <label className="flex items-center gap-1 text-[12px]">
                  <input
                    type="checkbox"
                    checked={controlData.is1099NEC}
                    onChange={(e) => handleControlChange("is1099NEC", e.target.checked)}
                    className="w-4 h-4"
                  />
                  1099 NEC
                </label>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Fed ID#{reqMark("fedId")}</label>
                <input
                  type="text"
                  value={controlData.fedId}
                  onChange={(e) => handleControlChange("fedId", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Acct #{reqMark("acctNumber")}</label>
                <input
                  type="text"
                  value={controlData.acctNumber}
                  onChange={(e) => handleControlChange("acctNumber", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Balance</label>
                <input
                  type="text"
                  value={`$${controlData.balance}`}
                  readOnly
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-[#f0f0f0]"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-3 min-w-[300px]">
              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Ship Via{reqMark("shipVia")}</label>
                <input
                  type="text"
                  value={controlData.shipVia}
                  onChange={(e) => handleControlChange("shipVia", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Default Acct{reqMark("defaultAcct")}</label>
                <div className="flex-1 flex">
                  <select
                    value={controlData.defaultAcct}
                    onChange={(e) => handleControlChange("defaultAcct", e.target.value)}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    <option value="OTHER INCOME & EXPENSES">OTHER INCOME & EXPENSES</option>
                    <option value="COST OF GOODS SOLD">COST OF GOODS SOLD</option>
                    <option value="OPERATING EXPENSES">OPERATING EXPENSES</option>
                  </select>
                  <button className="px-2 border border-l-0 border-[#7f9db9] bg-[#f0f0f0] hover:bg-[#e0e0e0]">...</button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Pay Style{reqMark("payStyle")}</label>
                <select
                  value={controlData.payStyle}
                  onChange={(e) => handleControlChange("payStyle", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                >
                  <option value="Normal">Normal</option>
                  <option value="Hold">Hold</option>
                  <option value="Priority">Priority</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Desired Bank{reqMark("desiredBank")}</label>
                <div className="flex-1 flex">
                  <select
                    value={controlData.desiredBank}
                    onChange={(e) => handleControlChange("desiredBank", e.target.value)}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    <option value="">Select Bank...</option>
                    <option value="Chase">Chase</option>
                    <option value="Bank of America">Bank of America</option>
                    <option value="Wells Fargo">Wells Fargo</option>
                  </select>
                  <button className="px-2 border border-l-0 border-[#7f9db9] bg-[#f0f0f0] hover:bg-[#e0e0e0]">...</button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">Terms{reqMark("terms")}</label>
                <select
                  value={controlData.terms}
                  onChange={(e) => handleControlChange("terms", e.target.value)}
                  className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
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
                <label className="w-24 text-[12px]">Discount{reqMark("discount")}</label>
                <input
                  type="text"
                  value={controlData.discount}
                  onChange={(e) => handleControlChange("discount", e.target.value)}
                  className="w-20 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white text-right"
                />
                <span className="text-[12px]">%</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-24 text-[12px]">If Paid In{reqMark("ifPaidIn")}</label>
                <input
                  type="text"
                  value={controlData.ifPaidIn}
                  onChange={(e) => handleControlChange("ifPaidIn", e.target.value)}
                  className="w-20 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white text-right"
                />
                <span className="text-[12px]">Days</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === "3 Contacts" && (
          <div className="p-4 flex flex-col h-full">
            {/* Action Buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleAddContact}
                className="px-6 py-1.5 text-[12px] border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
              >
                Add
              </button>
              <button
                onClick={handleEditContact}
                disabled={!selectedContact}
                className="px-6 py-1.5 text-[12px] border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0] disabled:opacity-50"
              >
                Edit
              </button>
              <button
                onClick={handleDeleteContact}
                disabled={!selectedContact}
                className="px-6 py-1.5 text-[12px] border border-[#808080] bg-[#f0f0f0] hover:bg-[#e0e0e0] disabled:opacity-50"
              >
                Delete
              </button>
            </div>

            {/* Contacts Table */}
            <div className="flex-1 border border-[#808080] bg-white overflow-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead className="bg-[#f0f0f0] sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "18%" }}>Contact</th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Title</th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "15%" }}>Phone</th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "15%" }}>Fax</th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "15%" }}>Mobile</th>
                    <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "18%" }}>Email</th>
                    <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "7%" }}>PO</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`cursor-pointer ${selectedContact?.id === contact.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"}`}
                    >
                      <td className="px-2 py-1 border border-[#e0e0e0]">{contact.name}</td>
                      <td className="px-2 py-1 border border-[#e0e0e0]">{contact.title}</td>
                      <td className="px-2 py-1 border border-[#e0e0e0]"><span className="inline-flex items-center">{contact.phone}<ClickToCall number={contact.phone} /></span></td>
                      <td className="px-2 py-1 border border-[#e0e0e0]"><span className="inline-flex items-center">{contact.fax}<ClickToCall number={contact.fax} /></span></td>
                      <td className="px-2 py-1 border border-[#e0e0e0]"><span className="inline-flex items-center">{contact.mobile}<ClickToCall number={contact.mobile} /></span></td>
                      <td className="px-2 py-1 border border-[#e0e0e0]">{contact.email}</td>
                      <td className="px-2 py-1 border border-[#e0e0e0] text-center">{contact.isPOContact ? "✓" : ""}</td>
                    </tr>
                  ))}
                  {contacts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-2 py-4 text-center text-[#808080] border border-[#e0e0e0]">
                        No contacts. Click Add to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "4 Custom" && (
          <div className="p-4 flex flex-col h-full">
            {/* Custom Fields Grid */}
            <div className="flex gap-8 mb-4">
              {/* Column 1 */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Custom1{reqMark("custom1")}</label>
                  <input
                    type="text"
                    value={customData.custom1}
                    onChange={(e) => handleCustomChange("custom1", e.target.value)}
                    className="w-40 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Custom2{reqMark("custom2")}</label>
                  <input
                    type="text"
                    value={customData.custom2}
                    onChange={(e) => handleCustomChange("custom2", e.target.value)}
                    className="w-40 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Custom3{reqMark("custom3")}</label>
                  <input
                    type="text"
                    value={customData.custom3}
                    onChange={(e) => handleCustomChange("custom3", e.target.value)}
                    className="w-40 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Custom4{reqMark("custom4")}</label>
                  <input
                    type="text"
                    value={customData.custom4}
                    onChange={(e) => handleCustomChange("custom4", e.target.value)}
                    className="w-40 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Custom5{reqMark("custom5")}</label>
                  <input
                    type="text"
                    value={customData.custom5}
                    onChange={(e) => handleCustomChange("custom5", e.target.value)}
                    className="w-44 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Custom6{reqMark("custom6")}</label>
                  <input
                    type="text"
                    value={customData.custom6}
                    onChange={(e) => handleCustomChange("custom6", e.target.value)}
                    className="w-44 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Custom7{reqMark("custom7")}</label>
                  <input
                    type="text"
                    value={customData.custom7}
                    onChange={(e) => handleCustomChange("custom7", e.target.value)}
                    className="w-44 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Custom8{reqMark("custom8")}</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={customData.custom8}
                      onChange={(e) => handleCustomChange("custom8", e.target.value)}
                      className="w-36 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                    />
                    <button className="px-2 border border-l-0 border-[#7f9db9] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px]">...</button>
                  </div>
                </div>
              </div>

              {/* Column 3 */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Custom9{reqMark("custom9")}</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={customData.custom9}
                      onChange={(e) => handleCustomChange("custom9", e.target.value)}
                      className="w-32 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                    />
                    <button className="px-2 border border-l-0 border-[#7f9db9] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px]">...</button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Custom10{reqMark("custom10")}</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={customData.custom10}
                      onChange={(e) => handleCustomChange("custom10", e.target.value)}
                      className="w-32 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                    />
                    <button className="px-2 border border-l-0 border-[#7f9db9] bg-[#f0f0f0] hover:bg-[#e0e0e0] text-[12px]">...</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Large Notes Area */}
            <div className="flex-1">
              <label className="text-[12px] font-medium mb-1 block">Notes</label>
              <textarea
                value={customData.notes}
                onChange={(e) => handleCustomChange("notes", e.target.value)}
                className="w-full h-full px-2 py-1 border border-[#7f9db9] text-[12px] bg-white resize-none"
                style={{ minHeight: "150px" }}
              />
            </div>
          </div>
        )}

        {activeTab === "5 ACH" && (
          <div className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <label className="w-28 text-[12px]">Bank Account #{reqMark("bankAccountNumber")}</label>
                <input
                  type="text"
                  value={achData.bankAccountNumber}
                  onChange={(e) => handleACHChange("bankAccountNumber", e.target.value)}
                  className="w-80 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-28 text-[12px]">Bank Route #{reqMark("bankRouteNumber")}</label>
                <input
                  type="text"
                  value={achData.bankRouteNumber}
                  onChange={(e) => handleACHChange("bankRouteNumber", e.target.value)}
                  className="w-80 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-28 text-[12px]">Bank Acct Type{reqMark("bankAcctType")}</label>
                <select
                  value={achData.bankAcctType}
                  onChange={(e) => handleACHChange("bankAcctType", e.target.value)}
                  className="w-80 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                >
                  <option value="Checking">Checking</option>
                  <option value="Savings">Savings</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Field History" && (
          <div className="flex-1 overflow-auto">
            {vendor && <ActivityHistory entityType="Vendor" entityId={vendor.id} />}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#808080] px-2 py-1 flex items-center text-[11px]">
        <span className="px-2 border-r border-[#808080] font-medium">{editMode ? "EDIT" : "VIEW"}</span>
        <span className="px-2 border-r border-[#808080]">{hasChanges ? "Modified" : ""}</span>
        <span className="flex-1" />
        <span className="px-2 border-l border-[#808080]">{vendor ? formatDate(vendor.createdAt) : ""}</span>
        <span className="px-2 border-l border-[#808080]">{vendor ? formatDate(vendor.updatedAt) : ""}</span>
      </div>

      {/* Contact Dialog */}
      {showContactDialog && editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] border-2 border-[#808080] shadow-lg" style={{ minWidth: "400px" }}>
            <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">{editingContact.id ? "Edit Contact" : "Add Contact"}</span>
              <button
                onClick={() => { setShowContactDialog(false); setEditingContact(null); }}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Name</label>
                  <input
                    type="text"
                    value={editingContact.name}
                    onChange={(e) => setEditingContact({ ...editingContact, name: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Title</label>
                  <input
                    type="text"
                    value={editingContact.title}
                    onChange={(e) => setEditingContact({ ...editingContact, title: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Phone</label>
                  <input
                    type="text"
                    value={editingContact.phone}
                    onChange={(e) => setEditingContact({ ...editingContact, phone: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Fax</label>
                  <input
                    type="text"
                    value={editingContact.fax}
                    onChange={(e) => setEditingContact({ ...editingContact, fax: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Mobile</label>
                  <input
                    type="text"
                    value={editingContact.mobile}
                    onChange={(e) => setEditingContact({ ...editingContact, mobile: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]">Email</label>
                  <input
                    type="text"
                    value={editingContact.email}
                    onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-16 text-[12px]"></label>
                  <label className="flex items-center gap-1 text-[12px]">
                    <input
                      type="checkbox"
                      checked={editingContact.isPOContact}
                      onChange={(e) => setEditingContact({ ...editingContact, isPOContact: e.target.checked })}
                      className="w-4 h-4"
                    />
                    PO Contact
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#808080]">
                <button
                  onClick={handleSaveContact}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  OK
                </button>
                <button
                  onClick={() => { setShowContactDialog(false); setEditingContact(null); }}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showDialog}
        onSave={handleDialogSave}
        onDiscard={handleDialogDiscard}
        onCancel={handleDialogCancel}
        saving={savingFromHook}
      />
      <XPDialogComponent />
    </div>
  );
}
