"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ActivityHistory } from "@/components/ActivityHistory";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import {
  Save,
  Printer,
  Undo2,
  X,
  Pencil,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/UnsavedChangesDialog";
import { useDetailLayout } from "@/hooks/useDetailLayout";
import { DetailLayout } from "@/components/detail/DetailLayout";
import { validateRequiredFields } from "@/lib/detail-registry/validation";
import { useXPDialog } from "@/components/ui/XPDialog";
import { AutocompleteInput, AutocompleteResult } from "@/components/AutocompleteInput";

interface AccountRow {
  id: string;
  premisesId: string | null;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  type: string | null;
  isActive: boolean;
  balance: number;
}

interface ContactData {
  id: string;
  name: string;
  title: string | null;
  phone: string | null;
  fax: string | null;
  mobile: string | null;
  email: string | null;
  linkedinUrl: string | null;
  inv: boolean;
  es: boolean;
  customerId: string;
  customerName: string;
  customer: { id: string; name: string } | null;
  accounts: AccountRow[];
  opportunities: OpportunityRow[];
  createdAt: string;
  updatedAt: string;
}

interface OpportunityRow {
  id: string;
  opportunityNumber: number;
  name: string;
  stage: string;
  type: string | null;
  estimatedValue: number | null;
  expectedCloseDate: string | null;
  owner: string | null;
  accountName: string;
}

const toolbarItems = [
  { icon: Pencil, color: "#5b7dab", title: "Edit" },
  { icon: Save, color: "#4a7c59", title: "Save" },
  { icon: Printer, color: "#6b8cae", title: "Print" },
  { icon: Undo2, color: "#d4a574", title: "Undo" },
  { separator: true },
  { icon: X, color: "#c45c5c", title: "Close" },
];

interface ContactDetailProps {
  contactId: string;
  onClose?: () => void;
}

export default function ContactDetail({ contactId, onClose }: ContactDetailProps) {
  const { openTab, closeTab } = useTabs();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const isNew = contactId.startsWith("new");
  const urlParams = isNew ? new URLSearchParams(contactId.replace("new?", "").replace("new", "")) : null;

  const [contact, setContact] = useState<ContactData | null>(isNew ? {
    id: "",
    name: "",
    title: null,
    phone: null,
    fax: null,
    mobile: null,
    email: null,
    linkedinUrl: null,
    inv: false,
    es: false,
    customerId: urlParams?.get("customerId") || "",
    customerName: "",
    customer: null,
    accounts: [],
    opportunities: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } : null);
  const [loading, setLoading] = useState(!isNew);
  const [formData, setFormData] = useState<Record<string, any>>(isNew ? {
    name: "",
    title: "",
    phone: "",
    fax: "",
    mobile: "",
    email: "",
    linkedinUrl: "",
    inv: false,
    es: false,
    customerId: urlParams?.get("customerId") || "",
    customerName: "",
  } : {});
  const [isEditing, setIsEditing] = useState(isNew);
  const [inlineEditField, setInlineEditField] = useState<string | null>(null);
  const [originalFormData, setOriginalFormData] = useState<Record<string, any>>({});
  const [selectedOpp, setSelectedOpp] = useState<string | null>(null);
  const [selectedAcct, setSelectedAcct] = useState<string | null>(null);

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
  } = useDetailLayout("contacts-detail");

  // Unsaved changes handling
  const handleSaveForHook = useCallback(async () => {
    if (layout) {
      const missing = validateRequiredFields(layout, fieldDefs, formData);
      if (missing.length > 0) {
        throw new Error(`Please fill in required fields: ${missing.join(", ")}`);
      }
    }
    if (!formData.customerId) {
      throw new Error("Customer is required");
    }
    if (isNew) {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        if (onClose) onClose();
        openTab(data.name || "Contact", `/contact-listing/${data.id}`);
      }
    } else {
      const response = await fetch(`/api/contacts/${contact?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        setContact(data);
        setFormData(mapContactToForm(data));
        setIsEditing(false);
      }
    }
  }, [formData, isNew, contact?.id, onClose, openTab, layout, fieldDefs]);

  const {
    isDirty,
    setIsDirty,
    confirmNavigation,
    showDialog,
    handleDialogSave,
    handleDialogDiscard,
    handleDialogCancel,
  } = useUnsavedChanges({ onSave: handleSaveForHook });

  const mapContactToForm = (data: ContactData): Record<string, any> => ({
    name: data.name || "",
    title: data.title || "",
    phone: data.phone || "",
    fax: data.fax || "",
    mobile: data.mobile || "",
    email: data.email || "",
    linkedinUrl: data.linkedinUrl || "",
    inv: data.inv,
    es: data.es,
    customerId: data.customerId || "",
    customerName: data.customerName || data.customer?.name || "",
  });

  useEffect(() => {
    if (!isNew) {
      fetchContact();
    } else if (urlParams?.get("customerId")) {
      fetchCustomerName(urlParams.get("customerId")!);
    }
  }, [contactId, isNew]);

  const fetchCustomerName = async (custId: string) => {
    try {
      const res = await fetch(`/api/customers/${custId}`);
      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, customerName: data.name || "" }));
      }
    } catch {}
  };

  const fetchContact = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (res.ok) {
        const data = await res.json();
        setContact(data);
        const mapped = mapContactToForm(data);
        setFormData(mapped);
        setOriginalFormData(mapped);
      }
    } catch (error) {
      console.error("Error fetching contact:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
    setIsDirty(true);
  }, []);

  // Inline edit — double-click a field in view mode to edit just that field
  const handleFieldDoubleClick = useCallback((fieldName: string) => {
    if (isNew || isEditing) return;
    setOriginalFormData({ ...formData });
    setInlineEditField(fieldName);
  }, [isNew, isEditing, formData]);

  const saveInlineField = useCallback(async (fieldName: string) => {
    setInlineEditField(null);
    if (isNew || !contact?.id) return;
    const payload: Record<string, any> = { [fieldName]: formData[fieldName] };
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setContact(data);
        setFormData(mapContactToForm(data));
        setIsDirty(false);
      } else {
        // Revert on error
        setFormData((prev) => ({ ...prev, [fieldName]: originalFormData[fieldName] }));
      }
    } catch {
      setFormData((prev) => ({ ...prev, [fieldName]: originalFormData[fieldName] }));
    }
  }, [isNew, contact?.id, formData, originalFormData]);

  const cancelInlineEdit = useCallback(() => {
    if (!inlineEditField) return;
    setFormData((prev) => ({ ...prev, [inlineEditField]: originalFormData[inlineEditField] }));
    setInlineEditField(null);
  }, [inlineEditField, originalFormData]);

  const handleFieldBlur = useCallback((fieldName: string) => {
    if (inlineEditField === fieldName) saveInlineField(fieldName);
  }, [inlineEditField, saveInlineField]);

  const handleFieldKeyDown = useCallback((fieldName: string, e: React.KeyboardEvent) => {
    if (inlineEditField !== fieldName) return;
    if (e.key === "Enter" && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      saveInlineField(fieldName);
    }
    if (e.key === "Escape") cancelInlineEdit();
  }, [inlineEditField, saveInlineField, cancelInlineEdit]);

  const handleSave = async () => {
    if (layout) {
      const missing = validateRequiredFields(layout, fieldDefs, formData);
      if (missing.length > 0) {
        await xpAlert(`Please fill in required fields: ${missing.join(", ")}`);
        return;
      }
    }
    if (!formData.customerId) {
      await xpAlert("Customer is required");
      return;
    }

    try {
      if (isNew) {
        const response = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const data = await response.json();
          setIsDirty(false);
          await xpAlert(`Contact "${data.name}" created successfully`);
          if (onClose) onClose();
          openTab(data.name || "Contact", `/contact-listing/${data.id}`);
        } else {
          const error = await response.json();
          await xpAlert(error.error || "Failed to create contact");
        }
      } else {
        const response = await fetch(`/api/contacts/${contact?.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const data = await response.json();
          setContact(data);
          setFormData(mapContactToForm(data));
          setIsDirty(false);
          setIsEditing(false);
          await xpAlert("Contact saved successfully");
        } else {
          const error = await response.json();
          await xpAlert(error.error || "Failed to update contact");
        }
      }
    } catch (error) {
      console.error("Error saving contact:", error);
      await xpAlert("Failed to save contact");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US");
  };

  const formatCurrency = (amount: number | null) =>
    amount != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
      : "";

  // Custom tab content
  const renderTabContent = useCallback((tabId: string): React.ReactNode | null => {
    if (tabId === "accounts") {
      const accounts = contact?.accounts || [];
      return (
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2 py-1">
            <span className="text-[12px] font-medium">Accounts for {formData.customerName || "this customer"}</span>
          </div>
          <div className="bg-white border border-[#c0c0c0] flex-1 min-h-[120px] overflow-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-[#f0f0f0]">
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "12%" }}>Account ID</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "20%" }}>Name</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "22%" }}>Address</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "12%" }}>City</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "6%" }}>State</th>
                  <th className="px-2 py-1 text-left border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Type</th>
                  <th className="px-2 py-1 text-center border border-[#c0c0c0] font-medium" style={{ width: "8%" }}>Status</th>
                  <th className="px-2 py-1 text-right border border-[#c0c0c0] font-medium" style={{ width: "10%" }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {accounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0] bg-white">
                      No accounts found
                    </td>
                  </tr>
                ) : (
                  accounts.map((acct) => (
                    <tr
                      key={acct.id}
                      onClick={() => setSelectedAcct(acct.id)}
                      onDoubleClick={() => openTab(acct.premisesId || acct.name || acct.address || "Account", `/accounts/${acct.id}`)}
                      className={`cursor-pointer ${
                        selectedAcct === acct.id
                          ? "bg-[#0078d4] text-white"
                          : "bg-white hover:bg-[#f0f8ff]"
                      }`}
                    >
                      <td className="px-2 py-1 border border-[#d0d0d0] font-medium">{acct.premisesId || "-"}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{acct.name || "-"}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{acct.address || "-"}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{acct.city || "-"}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{acct.state || "-"}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0]">{acct.type || "-"}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-center">{acct.isActive ? "Active" : "Inactive"}</td>
                      <td className="px-2 py-1 border border-[#d0d0d0] text-right">{formatCurrency(acct.balance)}</td>
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
              onClick={() => !isNew && contact && openTab("New Opportunity", `/opportunities/new?contactId=${contact.id}&customerId=${contact.customerId}`)}
              disabled={isNew}
              className="px-3 py-1 bg-[#f0f0f0] border border-[#a0a0a0] text-[11px] hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              New Opportunity
            </button>
            <button
              onClick={fetchContact}
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
                {(contact?.opportunities || []).length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0] bg-white">
                      No opportunities found
                    </td>
                  </tr>
                ) : (
                  (contact?.opportunities || []).map((opp) => (
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
                        {formatCurrency(opp.estimatedValue)}
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
      return !isNew && contact?.id ? (
        <ActivityTimeline entityType="Contact" entityId={contact.id} />
      ) : (
        <div className="p-4 text-center text-[#808080] text-[12px]">Save the contact first to see activity history.</div>
      );
    }
    if (tabId === "activity") {
      return !isNew && contact?.id ? (
        <ActivityHistory entityType="Contact" entityId={contact.id} />
      ) : (
        <div className="p-4 text-center text-[#808080] text-[12px]">Save the contact first to see field history.</div>
      );
    }
    return null;
  }, [contact, selectedOpp, selectedAcct, isNew, formData.linkedinUrl, formData.name, formData.customerName]);

  // Inject custom tabs into layout if not already present
  const layoutWithTabs = useMemo(() => {
    if (!layout) return layout;
    const tabs = [...layout.tabs];
    if (!tabs.some(t => t.id === "accounts")) {
      tabs.splice(1, 0, { id: "accounts", label: "Accounts", visible: true, sections: [] });
    }
    if (!tabs.some(t => t.id === "opportunities")) {
      tabs.push({ id: "opportunities", label: "Opportunities", visible: true, sections: [] });
    }
    if (!tabs.some(t => t.id === "activity-history")) {
      tabs.push({ id: "activity-history", label: "Activity History", visible: true, sections: [] });
    }
    if (!tabs.some(t => t.id === "activity")) {
      tabs.push({ id: "activity", label: "Field History", visible: true, sections: [] });
    }
    return { ...layout, tabs };
  }, [layout]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!contact && !isNew) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-gray-500">Contact not found</span>
      </div>
    );
  }

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
              onClick={
                item.title === "Edit" ? () => setIsEditing(true) :
                item.title === "Save" ? handleSave :
                item.title === "Close" ? () => confirmNavigation(() => onClose?.()) :
                undefined
              }
            >
              <IconComponent className="w-4 h-4" style={{ color: item.color }} />
            </button>
          );
        })}
      </div>

      {/* Customer — hyperlink for existing, autocomplete for new */}
      <div className="bg-white px-4 py-2 border-b border-[#d0d0d0] flex items-center gap-3">
        <label className="text-[12px] font-medium w-[70px]">Customer:</label>
        {isNew ? (
          <div className="flex-1 max-w-[400px]">
            <AutocompleteInput
              value={formData.customerName || ""}
              onChange={(val) => {
                handleFieldChange("customerName", val);
                if (!val) handleFieldChange("customerId", "");
              }}
              onSelect={(result: AutocompleteResult) => {
                handleFieldChange("customerId", result.id);
                handleFieldChange("customerName", result.label);
              }}
              searchType="customers"
              placeholder="Search customers..."
            />
          </div>
        ) : (
          <span
            className="text-[#0000ff] text-[13px] cursor-pointer hover:underline font-medium"
            onClick={() => formData.customerId && openTab(formData.customerName, `/customers/${formData.customerId}`)}
          >
            {formData.customerName || "—"}
          </span>
        )}
      </div>

      {/* Main Content — DetailLayout */}
      {layoutWithTabs && (
        <DetailLayout
          layout={layoutWithTabs}
          fieldDefs={fieldDefs}
          formData={formData}
          onFieldChange={handleFieldChange}
          isEditing={isEditing}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          renderTabContent={renderTabContent}
          gridColumns={gridColumns}
          gridDefs={registry?.grids}
          onUpdateGridColumns={updateGridColumns}
          editingField={inlineEditField}
          onFieldDoubleClick={handleFieldDoubleClick}
          onFieldBlur={handleFieldBlur}
          onFieldKeyDown={handleFieldKeyDown}
        />
      )}

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1 flex items-center justify-between text-[11px]">
        <span className="font-medium">{isEditing ? (isDirty ? "EDIT*" : "EDIT") : "VIEW"}</span>
        {contact && !isNew && (
          <div className="flex items-center gap-6 text-[#666]">
            <span>Created: {formatDate(contact.createdAt)}</span>
            <span>Updated: {formatDate(contact.updatedAt)}</span>
          </div>
        )}
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showDialog}
        onSave={handleDialogSave}
        onDiscard={handleDialogDiscard}
        onCancel={handleDialogCancel}
        message="Do you want to save changes to this contact?"
      />

      {/* XP Alert/Confirm Dialog */}
      <XPDialogComponent />
    </div>
  );
}
