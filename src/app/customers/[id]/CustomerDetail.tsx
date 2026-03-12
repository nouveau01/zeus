"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ActivityHistory } from "@/components/ActivityHistory";
import { ActivityTimeline } from "@/components/ActivityTimeline";
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
import { getCustomerById } from "@/lib/actions/customers";
import { useDetailLayout } from "@/hooks/useDetailLayout";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { validateRequiredFields } from "@/lib/detail-registry/validation";
import { useXPDialog } from "@/components/ui/XPDialog";
import { ClickToCall } from "@/components/ui/ClickToCall";
import { usePermissions } from "@/context/PermissionsContext";

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
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const { canAccessPage } = usePermissions();
  const canManagePortalUsers = canAccessPage("portal-users");
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
  const [formData, setFormData] = useState<Partial<Customer>>(isNew ? {
    name: "",
    type: "General",
    isActive: true,
    billing: "Individual",
    country: "United States",
  } : {});
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [customerOpportunities, setCustomerOpportunities] = useState<any[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<string | null>(null);
  const [portalUsers, setPortalUsers] = useState<any[]>([]);
  const [showAddPortalUser, setShowAddPortalUser] = useState(false);
  const [newPortalUser, setNewPortalUser] = useState({ email: "", name: "", phone: "", title: "" });
  const [portalUserMsg, setPortalUserMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedPortalUsers, setSelectedPortalUsers] = useState<Set<string>>(new Set());

  // Detail layout system
  const {
    layout,
    registry,
    fieldDefs,
    isLoading: layoutLoading,
    activeTab,
    setActiveTab,
    gridColumns,
    updateGridColumns,
  } = useDetailLayout("customers-detail");

  // Unsaved changes handling
  const handleSaveForHook = useCallback(async () => {
    if (layout) {
      const missing = validateRequiredFields(layout, fieldDefs, formData as Record<string, any>);
      if (missing.length > 0) {
        throw new Error(`Please fill in required fields: ${missing.join(", ")}`);
      }
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
  }, [formData, isNew, customerId, onClose, openTab, layout, fieldDefs]);

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
      fetchCustomerOpportunities();
      fetchPortalUsers();
    }
  }, [customerId, isNew]);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const data = await getCustomerById(customerId);
      if (data) {
        setCustomer(data);
        setFormData(data);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerOpportunities = async () => {
    try {
      const response = await fetch(`/api/opportunities?customerId=${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setCustomerOpportunities(data);
      }
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    }
  };

  const fetchPortalUsers = async () => {
    try {
      const response = await fetch(`/api/portal-users?customerId=${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setPortalUsers(data);
      }
    } catch (error) {
      console.error("Error fetching portal users:", error);
    }
  };

  const handleCreatePortalUser = async () => {
    if (!newPortalUser.email || !newPortalUser.name) {
      setPortalUserMsg({ type: "error", text: "Email and name are required" });
      return;
    }
    try {
      const res = await fetch("/api/portal-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, ...newPortalUser }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPortalUserMsg({ type: "error", text: data.error || "Failed to create user" });
        return;
      }
      setPortalUserMsg({ type: "success", text: data.emailSent ? "User created! Welcome email sent." : "User created! (Email not configured — set up SMTP in Settings)" });
      setShowAddPortalUser(false);
      setNewPortalUser({ email: "", name: "", phone: "", title: "" });
      fetchPortalUsers();
      // Refresh customer data so Portal Access flips to Yes
      if (customerId) {
        const custRes = await fetch(`/api/customers/${customerId}`);
        if (custRes.ok) {
          const custData = await custRes.json();
          setFormData(custData);
        }
      }
    } catch (error) {
      setPortalUserMsg({ type: "error", text: "Failed to create user" });
    }
  };

  const handleTogglePortalUser = async (userId: string, isActive: boolean) => {
    try {
      await fetch("/api/portal-users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, isActive: !isActive }),
      });
      fetchPortalUsers();
    } catch (error) {
      console.error("Error toggling portal user:", error);
    }
  };

  const handleResetPortalPassword = async (userId: string) => {
    try {
      const res = await fetch("/api/portal-users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, resetPassword: true }),
      });
      if (res.ok) {
        setPortalUserMsg({ type: "success", text: "Password reset! Email sent with new credentials." });
      }
    } catch (error) {
      console.error("Error resetting password:", error);
    }
  };

  const handleDeletePortalUsers = async () => {
    if (selectedPortalUsers.size === 0) return;
    const count = selectedPortalUsers.size;
    if (!confirm(`Delete ${count} portal user${count > 1 ? "s" : ""}? This cannot be undone.`)) return;
    try {
      for (const userId of selectedPortalUsers) {
        await fetch(`/api/portal-users?id=${userId}`, { method: "DELETE" });
      }
      setSelectedPortalUsers(new Set());
      setPortalUserMsg({ type: "success", text: `${count} user${count > 1 ? "s" : ""} deleted.` });
      fetchPortalUsers();
    } catch (error) {
      setPortalUserMsg({ type: "error", text: "Failed to delete users" });
    }
  };

  const handleInputChange = (field: keyof Customer, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Field change handler with boolean conversions for select fields
  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    if (fieldName === "isActive") {
      handleInputChange("isActive", value === "Active");
    } else if (fieldName === "portalAccess") {
      handleInputChange("portalAccess", value === "Yes");
    } else {
      handleInputChange(fieldName as keyof Customer, value);
    }
  }, []);

  // Autocomplete select handler — auto-fill related fields when Primary Contact is selected
  const handleAutocompleteSelect = useCallback((fieldName: string, result: any) => {
    if (fieldName === "contact" && result.data) {
      const c = result.data;
      handleInputChange("contact", c.name || result.label);
      if (c.phone) handleInputChange("phone", c.phone);
      if (c.fax) handleInputChange("fax", c.fax);
      if (c.mobile) handleInputChange("cellular", c.mobile);
      if (c.email) handleInputChange("email", c.email);
    }
  }, []);

  const handleSave = async () => {
    if (layout) {
      const missing = validateRequiredFields(layout, fieldDefs, formData as Record<string, any>);
      if (missing.length > 0) {
        await xpAlert(`Please fill in required fields: ${missing.join(", ")}`);
        return;
      }
    }

    try {
      if (isNew) {
        const response = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const data = await response.json();
          setIsDirty(false);
          await xpAlert(`Customer "${data.name}" created successfully`);
          if (onClose) onClose();
          openTab(data.name, `/customers/${data.id}`);
        } else {
          const error = await response.json();
          await xpAlert(error.error || "Failed to create customer");
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
          setIsDirty(false);
          await xpAlert("Customer saved successfully");
        } else {
          const error = await response.json();
          await xpAlert(error.error || "Failed to update customer");
        }
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      await xpAlert("Failed to save customer");
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

  // Custom tab content — Contacts tab renders its own grid
  const renderTabContent = useCallback((tabId: string): React.ReactNode | null => {
    if (tabId === "contacts") {
      return (
        <div className="flex-1 flex flex-col gap-2">
          {/* Contacts Buttons */}
          <div className="flex items-center gap-2 py-1">
            <button
              onClick={() => !isNew && openTab("New Contact", `/contact-listing/new?customerId=${customerId}`)}
              disabled={isNew}
              className="px-6 py-1 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              Add
            </button>
            <button
              onClick={() => selectedContact && openTab("Contact", `/contact-listing/${selectedContact}`)}
              disabled={!selectedContact}
              className="px-6 py-1 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={async () => {
                if (!selectedContact) return;
                const ok = await xpConfirm("Are you sure you want to delete this contact?");
                if (!ok) return;
                const res = await fetch(`/api/contacts/${selectedContact}`, { method: "DELETE" });
                if (res.ok) {
                  setSelectedContact(null);
                  fetchCustomer();
                  await xpAlert("Contact deleted successfully");
                }
              }}
              disabled={!selectedContact}
              className="px-6 py-1 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              Delete
            </button>
          </div>

          {/* Contacts Grid */}
          <div className="bg-white border border-[#c0c0c0] flex-1 min-h-[120px] overflow-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-white">
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
                {(customer?.contacts || []).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0] bg-white">
                      No contacts found
                    </td>
                  </tr>
                ) : (
                  (customer?.contacts || []).map((contact) => (
                    <tr
                      key={contact.id}
                      onClick={() => setSelectedContact(contact.id)}
                      onDoubleClick={() => openTab(contact.name || "Contact", `/contact-listing/${contact.id}`)}
                      className={`cursor-pointer ${
                        selectedContact === contact.id
                          ? "bg-[#0078d4] text-white"
                          : "bg-white hover:bg-[#f0f8ff]"
                      }`}
                    >
                      <td className="px-2 py-1 border border-[#d0d0d0]">{contact.name}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{contact.title || ""}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]"><span className="inline-flex items-center">{contact.phone || ""}<ClickToCall number={contact.phone} /></span></td>
                      <td className="px-2 py-1 border border-[#d0d0d0]"><span className="inline-flex items-center">{contact.fax || ""}<ClickToCall number={contact.fax} /></span></td>
                      <td className="px-2 py-1 border border-[#d0d0d0]"><span className="inline-flex items-center">{contact.mobile || ""}<ClickToCall number={contact.mobile} /></span></td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{contact.email || ""}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-center">{contact.inv ? "Y" : ""}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-center">{contact.es ? "Y" : ""}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    if (tabId === "opportunities") {
      return (
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2 py-1">
            <button
              onClick={() => !isNew && openTab("New Opportunity", `/opportunities/new?customerId=${customerId}`)}
              disabled={isNew}
              className="px-3 py-1 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              New Opportunity
            </button>
            <button
              onClick={() => fetchCustomerOpportunities()}
              className="px-3 py-1 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0]"
            >
              Refresh
            </button>
          </div>
          <div className="bg-white border border-[#c0c0c0] flex-1 min-h-[120px] overflow-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#f0f0f0]">
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "8%" }}>Opp #</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "22%" }}>Name</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "15%" }}>Account</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "12%" }}>Stage</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Type</th>
                  <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium" style={{ width: "13%" }}>Est. Value</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Close Date</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Owner</th>
                </tr>
              </thead>
              <tbody>
                {customerOpportunities.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0] bg-white">
                      No opportunities found
                    </td>
                  </tr>
                ) : (
                  customerOpportunities.map((opp) => (
                    <tr
                      key={opp.id}
                      onClick={() => setSelectedOpp(opp.id)}
                      onDoubleClick={() => openTab(opp.name || `Opp #${opp.opportunityNumber}`, `/opportunities/${opp.id}`)}
                      className={`cursor-pointer ${
                        selectedOpp === opp.id
                          ? "bg-[#0078d4] text-white"
                          : "bg-white hover:bg-[#f0f8ff]"
                      }`}
                    >
                      <td className="px-2 py-1 border border-[#d0d0d0]">{opp.opportunityNumber}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{opp.name}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{opp.accountName || ""}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{opp.stage}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{opp.type}</td>
                      <td className="px-2 py-1 text-right border border-[#d0d0d0]">
                        {opp.estimatedValue != null ? `$${Number(opp.estimatedValue).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : ""}
                      </td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">
                        {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : ""}
                      </td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{opp.owner}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    if (tabId === "activity-history") {
      return !isNew && customer ? (
        <ActivityTimeline entityType="Customer" entityId={customer.id} />
      ) : null;
    }
    if (tabId === "activity") {
      return !isNew && customer ? (
        <ActivityHistory entityType="Customer" entityId={customer.id} />
      ) : null;
    }
    if (tabId === "portal-users") {
      return (
        <div className="flex-1 flex flex-col gap-2">
          {portalUserMsg && (
            <div className={`px-3 py-2 text-[11px] rounded ${portalUserMsg.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {portalUserMsg.text}
              <button onClick={() => setPortalUserMsg(null)} className="ml-2 font-bold">&times;</button>
            </div>
          )}
          <div className="flex items-center gap-2 py-1">
            <button
              onClick={() => setShowAddPortalUser(!showAddPortalUser)}
              disabled={isNew}
              className="px-3 py-1 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              {showAddPortalUser ? "Cancel" : "Add Portal User"}
            </button>
            {selectedPortalUsers.size > 0 && (
              <button onClick={handleDeletePortalUsers} className="px-3 py-1 bg-[#dc2626] text-white border border-[#b91c1c] text-[11px] hover:bg-[#b91c1c]">
                Delete ({selectedPortalUsers.size})
              </button>
            )}
            <button onClick={fetchPortalUsers} className="px-3 py-1 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0]">
              Refresh
            </button>
          </div>
          {showAddPortalUser && (
            <div className="bg-[#f8f8f8] border border-[#c0c0c0] p-3 flex flex-wrap gap-2 items-end text-[11px]">
              <div>
                <label className="block mb-0.5 font-medium">Email *</label>
                <input type="email" value={newPortalUser.email} onChange={(e) => setNewPortalUser(p => ({ ...p, email: e.target.value }))}
                  className="border border-[#a0a0a0] px-2 py-1 w-48" />
              </div>
              <div>
                <label className="block mb-0.5 font-medium">Name *</label>
                <input value={newPortalUser.name} onChange={(e) => setNewPortalUser(p => ({ ...p, name: e.target.value }))}
                  className="border border-[#a0a0a0] px-2 py-1 w-40" />
              </div>
              <div>
                <label className="block mb-0.5 font-medium">Phone</label>
                <input value={newPortalUser.phone} onChange={(e) => setNewPortalUser(p => ({ ...p, phone: e.target.value }))}
                  className="border border-[#a0a0a0] px-2 py-1 w-32" />
              </div>
              <div>
                <label className="block mb-0.5 font-medium">Title</label>
                <input value={newPortalUser.title} onChange={(e) => setNewPortalUser(p => ({ ...p, title: e.target.value }))}
                  className="border border-[#a0a0a0] px-2 py-1 w-32" />
              </div>
              <button onClick={handleCreatePortalUser} className="px-4 py-1 bg-[#0078d4] text-white border border-[#005a9e] hover:bg-[#005a9e]">
                Create
              </button>
            </div>
          )}
          <div className="bg-white border border-[#c0c0c0] flex-1 min-h-[120px] overflow-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#f0f0f0]">
                  <th className="px-1 py-1 text-center border border-[#c0c0c0] font-medium" style={{ width: "30px" }}>
                    <input
                      type="checkbox"
                      checked={portalUsers.length > 0 && selectedPortalUsers.size === portalUsers.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPortalUsers(new Set(portalUsers.map((pu: any) => pu.id)));
                        } else {
                          setSelectedPortalUsers(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "20%" }}>Name</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "20%" }}>Email</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "12%" }}>Phone</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Title</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Status</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "12%" }}>Last Login</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "12%" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {portalUsers.length === 0 ? (
                  <tr><td colSpan={8} className="px-2 py-4 text-center text-[#808080]">No portal users</td></tr>
                ) : (
                  portalUsers.map((pu) => (
                    <tr key={pu.id} className={`hover:bg-[#e8f4fc] ${selectedPortalUsers.has(pu.id) ? "bg-[#cce5ff]" : ""}`}>
                      <td className="px-1 py-1 border border-[#d0d0d0] text-center">
                        <input
                          type="checkbox"
                          checked={selectedPortalUsers.has(pu.id)}
                          onChange={(e) => {
                            setSelectedPortalUsers(prev => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(pu.id);
                              else next.delete(pu.id);
                              return next;
                            });
                          }}
                        />
                      </td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{pu.name}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{pu.email}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{pu.phone || "-"}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{pu.title || "-"}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${pu.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {pu.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">
                        {pu.lastLogin ? new Date(pu.lastLogin).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">
                        <div className="flex gap-1">
                          <button onClick={() => handleTogglePortalUser(pu.id, pu.isActive)}
                            className="px-1.5 py-0.5 text-[10px] bg-[#f0f0f0] border border-[#a0a0a0] hover:bg-[#e0e0e0]">
                            {pu.isActive ? "Disable" : "Enable"}
                          </button>
                          <button onClick={() => handleResetPortalPassword(pu.id)}
                            className="px-1.5 py-0.5 text-[10px] bg-[#f0f0f0] border border-[#a0a0a0] hover:bg-[#e0e0e0]">
                            Reset PW
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
    return null;
  }, [customer?.contacts, selectedContact, isNew, customer, customerOpportunities, selectedOpp, portalUsers, showAddPortalUser, newPortalUser, portalUserMsg, selectedPortalUsers]);

  // Tab header — Add Date buttons for remarks tabs
  const renderTabHeader = useCallback((tabId: string): React.ReactNode | null => {
    if (tabId === "remarks") {
      return (
        <div className="flex items-center mb-1">
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
      );
    }
    if (tabId === "salesRemarks") {
      return (
        <div className="flex items-center gap-4 mb-1">
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
      );
    }
    return null;
  }, [formData.remarks, formData.salesRemarks]);

  // Get cell value for a premises field
  const getCellValue = useCallback((premises: Premises, fieldName: string): React.ReactNode => {
    switch (fieldName) {
      case "premisesId": return premises.premisesId || "-";
      case "name": return premises.name || premises.address;
      case "city": return premises.city || "-";
      case "type": return premises.type || "Non-Contract";
      case "isActive": return premises.isActive ? "Active" : "Inactive";
      case "unitCount": return premises._count?.units || 0;
      case "balance": return formatCurrency(Number(premises.balance));
      case "address": return premises.address || "-";
      case "state": return premises.state || "-";
      case "zipCode": return premises.zipCode || "-";
      case "phone": return (premises as any).phone || "-";
      case "email": return (premises as any).email || "-";
      case "route": return (premises as any).route || "-";
      case "zone": return (premises as any).zone || "-";
      case "contact": return (premises as any).contact || "-";
      case "fax": return (premises as any).fax || "-";
      default: return (premises as any)[fieldName] || "-";
    }
  }, []);

  // Get visible account listing columns from grid config
  const accountColumns = useMemo(() => {
    return gridColumns["account-listing"]?.filter(c => c.visible) || [];
  }, [gridColumns]);

  // Get alignment for a column from registry defs
  const getColumnAlign = useCallback((fieldName: string): string => {
    const def = registry?.grids?.["account-listing"]?.find(d => d.fieldName === fieldName);
    return def?.align || "left";
  }, [registry]);

  // Inject Opportunities + Activity History + Field History tabs into layout if not already present
  const layoutWithActivity = useMemo(() => {
    if (!layout) return layout;
    const tabs = [...layout.tabs];
    if (!tabs.some(t => t.id === "opportunities")) {
      tabs.push({ id: "opportunities", label: "Opportunities", visible: true, sections: [] });
    }
    if (!tabs.some(t => t.id === "activity-history")) {
      tabs.push({ id: "activity-history", label: "Activity History", visible: true, sections: [] });
    }
    if (!tabs.some(t => t.id === "activity")) {
      tabs.push({ id: "activity", label: "Field History", visible: true, sections: [] });
    }
    if (canManagePortalUsers && !tabs.some(t => t.id === "portal-users")) {
      tabs.push({ id: "portal-users", label: "Portal Users", visible: true, sections: [] });
    }
    return { ...layout, tabs };
  }, [layout, canManagePortalUsers]);

  // Account listing grid — shared across all tabs
  const renderAccountListing = () => (
    <div className="flex-1 flex flex-col min-h-0 mt-2">
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
            if (selectedAccount && (await xpConfirm("Delete this account?"))) {
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

      {/* Account Grid — dynamic columns from grid config */}
      <div className="flex-1 border border-[#808080] bg-white overflow-auto">
        <table className="w-full border-collapse text-[12px]">
          <thead>
            <tr className="bg-[#f0f0f0]">
              {accountColumns.map((col) => (
                <th
                  key={col.fieldName}
                  className={`px-2 py-1 border border-[#c0c0c0] font-medium ${
                    getColumnAlign(col.fieldName) === "right" ? "text-right" :
                    getColumnAlign(col.fieldName) === "center" ? "text-center" : "text-left"
                  }`}
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(customer?.premises || []).length === 0 ? (
              <tr>
                <td colSpan={accountColumns.length || 1} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                  No accounts found
                </td>
              </tr>
            ) : (
              (customer?.premises || []).map((premises) => (
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
                  {accountColumns.map((col) => (
                    <td
                      key={col.fieldName}
                      className={`px-2 py-1 border border-[#d0d0d0] ${
                        getColumnAlign(col.fieldName) === "right" ? "text-right" :
                        getColumnAlign(col.fieldName) === "center" ? "text-center" : ""
                      }`}
                    >
                      {getCellValue(premises, col.fieldName)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-gray-500">Customer not found</span>
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

      {/* Main Content — DetailLayout with Account Listing as children */}
      {layoutWithActivity && (
        <DetailLayout
          layout={layoutWithActivity}
          fieldDefs={fieldDefs}
          formData={formData as Record<string, any>}
          onFieldChange={handleFieldChange}
          isEditing={true}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          renderTabContent={renderTabContent}
          renderTabHeader={renderTabHeader}
          gridColumns={gridColumns}
          gridDefs={registry?.grids}
          onUpdateGridColumns={updateGridColumns}
          onAutocompleteSelect={handleAutocompleteSelect}
        >
          {renderAccountListing()}
        </DetailLayout>
      )}

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1 flex items-center justify-between text-[11px]">
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

      {/* XP Alert/Confirm Dialog */}
      <XPDialogComponent />
    </div>
  );
}
