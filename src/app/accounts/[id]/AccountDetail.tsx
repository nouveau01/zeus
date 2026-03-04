"use client";

import { useState, useEffect, useCallback } from "react";
import { useTabs } from "@/context/TabContext";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/UnsavedChangesDialog";
import {
  FileText,
  Save,
  Undo2,
  Printer,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { getAccountById } from "@/lib/actions/accounts";
import { useOffices } from "@/context/OfficesContext";
import { useXPDialog } from "@/components/ui/XPDialog";
import { AddressAutocomplete, AddressSelection } from "@/components/ui/AddressAutocomplete";

interface Unit {
  id: string;
  unitNumber: string;
  unitType: string | null;
  cat: string | null;
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
  officeId: string | null;
  customer: {
    id: string;
    name: string;
  };
  units: Unit[];
  _count: {
    units: number;
    jobs: number;
  };
  remarks: string | null;
  colRemarks: string | null;
  salesRemarks: string | null;
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
  const { openTab, closeTab } = useTabs();
  const { offices, selectedOfficeIds } = useOffices();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();

  // Parse URL params for new account creation
  const isNew = accountId.startsWith("new");
  const urlParams = new URLSearchParams(accountId.replace("new?", "").replace("new", ""));
  const customerId = urlParams.get("customerId");
  const copyFromId = urlParams.get("copyFrom");

  const defaultOfficeId = selectedOfficeIds.length > 0 ? selectedOfficeIds[0] : null;

  const [account, setAccount] = useState<Account | null>(isNew ? {
    id: "",
    premisesId: null,
    name: null,
    address: "",
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
    type: "Non-Contract",
    isActive: true,
    balance: 0,
    customerId: customerId || "",
    officeId: defaultOfficeId,
    customer: { id: customerId || "", name: "" },
    remarks: null,
    colRemarks: null,
    salesRemarks: null,
    units: [],
    _count: { units: 0, jobs: 0 },
  } : null);
  const [loading, setLoading] = useState(!isNew);
  const [activeTab, setActiveTab] = useState("General");
  const [formData, setFormData] = useState<Partial<Account>>(isNew ? {
    customerId: customerId || "",
    officeId: defaultOfficeId,
    type: "Non-Contract",
    isActive: true,
    country: "United States",
  } : {});
  const [savingFromHook, setSavingFromHook] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customerId || "");

  // Add Unit Dialog state
  const [showAddUnitDialog, setShowAddUnitDialog] = useState(false);
  const [newUnit, setNewUnit] = useState({
    unitNumber: "",
    description: "",
    category: "CONSULTANT",
    unitType: "Elevator",
    manufacturer: "",
    serial: "",
    status: "Active",
  });

  // Remarks state
  const [accountRemarks, setAccountRemarks] = useState("");
  const [customerRemarks, setCustomerRemarks] = useState("");
  const [collectionNotes, setCollectionNotes] = useState("");
  const [salesRemarks, setSalesRemarks] = useState("");

  // Contacts data
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Add Contact Dialog state
  const [showAddContactDialog, setShowAddContactDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [newContact, setNewContact] = useState({
    name: "",
    title: "",
    phone: "",
    fax: "",
    mobile: "",
    email: "",
    inv: false,
    es: false,
  });

  // PM contracts data
  const [pmContracts, setPmContracts] = useState<any[]>([]);
  const [showAddContractDialog, setShowAddContractDialog] = useState(false);
  const [editingPMContract, setEditingPMContract] = useState<any>(null);
  const [newContract, setNewContract] = useState({
    job: "",
    description: "",
    schedule: "Monthly",
    hours: "",
    billingCycle: "Monthly",
    billingAmt: "",
    monthlyAmt: "",
    active: true,
  });

  // Save callback for the unsaved changes hook
  const handleSaveForHook = useCallback(async () => {
    if (!formData.address?.trim()) {
      throw new Error("Address is required");
    }
    setSavingFromHook(true);
    try {
      if (isNew) {
        const response = await fetch("/api/premises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, customerId: customerId || formData.customerId }),
        });
        if (!response.ok) throw new Error("Failed to create account");
        const created = await response.json();
        if (onClose) onClose();
        openTab(created.name || created.address, `/accounts/${created.id}`);
      } else {
        const response = await fetch(`/api/premises/${accountId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            remarks: accountRemarks,
            colRemarks: collectionNotes,
            salesRemarks: salesRemarks,
          }),
        });
        if (!response.ok) throw new Error("Failed to update account");
        const updated = await response.json();
        setAccount(updated);
        setFormData(updated);
      }
    } finally {
      setSavingFromHook(false);
    }
  }, [formData, isNew, customerId, accountId, onClose, openTab, accountRemarks, collectionNotes, salesRemarks]);

  // Unsaved changes hook
  const {
    isDirty,
    setIsDirty,
    markDirty,
    confirmNavigation,
    showDialog,
    handleDialogSave,
    handleDialogDiscard,
    handleDialogCancel,
  } = useUnsavedChanges({ onSave: handleSaveForHook });

  useEffect(() => {
    if (!isNew) {
      fetchAccount();
    } else if (copyFromId) {
      // Copy data from existing account
      fetchAccountToCopy();
    } else if (customerId) {
      // Fetch customer name for display
      fetchCustomerName();
    } else {
      // No customer pre-selected, fetch all customers for dropdown
      fetchCustomers();
    }
  }, [accountId, isNew, copyFromId, customerId]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  const fetchCustomerName = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`);
      if (response.ok) {
        const data = await response.json();
        setAccount(prev => prev ? { ...prev, customer: { id: customerId!, name: data.name } } : null);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  const fetchAccountToCopy = async () => {
    try {
      // Use Server Action - pulls from SQL Server and mirrors to PostgreSQL
      const data = await getAccountById(copyFromId!);
      if (data) {
        // Copy the data but keep it as a new record
        setFormData({
          ...data,
          id: undefined,
          premisesId: null, // Clear the ID so it gets a new one
          customerId: customerId || data.customerId,
        });
        setAccount(prev => prev ? {
          ...prev,
          ...data,
          id: "",
          premisesId: null,
          customerId: customerId || data.customerId,
        } : null);
      }
    } catch (error) {
      console.error("Error fetching account to copy:", error);
    }
  };

  const fetchAccount = async () => {
    setLoading(true);
    try {
      // Use Server Action - pulls from SQL Server and mirrors to PostgreSQL
      const data = await getAccountById(accountId);
      if (data) {
        setAccount(data);
        setFormData(data);
        // Load remarks from database
        setAccountRemarks(data.remarks || "");
        setCollectionNotes(data.colRemarks || "");
        setSalesRemarks(data.salesRemarks || "");
        // Fetch contacts for this customer
        if (data.customerId) {
          fetchContacts(data.customerId);
        }
        // Fetch PM contracts for this account
        fetchPMContracts();
      }
    } catch (error) {
      console.error("Error fetching account:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async (custId: string) => {
    try {
      const response = await fetch(`/api/contacts?customerId=${custId}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const fetchPMContracts = async () => {
    try {
      const response = await fetch(`/api/contracts?premisesId=${accountId}`);
      if (response.ok) {
        const data = await response.json();
        // Map API response to UI format
        const mapped = data.map((c: any) => ({
          id: c.id,
          job: c.job?.externalId || c.jobId || "",
          jobId: c.jobId,
          description: c.job?.jobName || "",
          schedule: c.sType || "Monthly",
          hours: c.hours?.toString() || "",
          billingCycle: getBillingCycleLabel(c.bCycle),
          billingAmt: c.bAmt?.toString() || "",
          monthlyAmt: calculateMonthlyAmt(c.bAmt, c.bCycle),
          active: c.status === 1,
        }));
        setPmContracts(mapped);
      }
    } catch (error) {
      console.error("Error fetching PM contracts:", error);
    }
  };

  const getBillingCycleLabel = (cycle: number | null) => {
    switch (cycle) {
      case 1: return "Monthly";
      case 3: return "Quarterly";
      case 6: return "Semi-Annual";
      case 12: return "Annual";
      default: return "Monthly";
    }
  };

  const getBillingCycleValue = (label: string) => {
    switch (label) {
      case "Monthly": return 1;
      case "Quarterly": return 3;
      case "Semi-Annual": return 6;
      case "Annual": return 12;
      default: return 1;
    }
  };

  const calculateMonthlyAmt = (bAmt: number | null, bCycle: number | null) => {
    if (!bAmt || !bCycle) return "";
    return (bAmt / bCycle).toFixed(2);
  };

  const handleInputChange = (field: keyof Account, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!formData.address?.trim()) {
      await xpAlert("Address is required");
      return;
    }

    const effectiveCustomerId = customerId || selectedCustomerId;
    if (isNew && !effectiveCustomerId) {
      await xpAlert("Please select a customer");
      return;
    }

    try {
      if (isNew) {
        const response = await fetch("/api/premises", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, customerId: effectiveCustomerId }),
        });
        if (response.ok) {
          const created = await response.json();
          setIsDirty(false);
          await xpAlert("Account created successfully");
          if (onClose) onClose();
          openTab(created.name || created.address, `/accounts/${created.id}`);
        } else {
          const error = await response.json();
          await xpAlert(error.error || "Failed to create account");
        }
      } else {
        const response = await fetch(`/api/premises/${accountId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            remarks: accountRemarks,
            colRemarks: collectionNotes,
            salesRemarks: salesRemarks,
          }),
        });
        if (response.ok) {
          const updated = await response.json();
          setAccount(updated);
          setFormData(updated);
          setIsDirty(false);
          await xpAlert("Account saved successfully");
        } else {
          const error = await response.json();
          await xpAlert(error.error || "Failed to update account");
        }
      }
    } catch (error) {
      console.error("Error saving account:", error);
      await xpAlert("Failed to save account");
    }
  };

  const openCustomer = () => {
    if (account?.customer) {
      openTab(account.customer.name, `/customers/${account.customer.id}`);
    }
  };

  const handleUndo = () => {
    if (account) {
      setFormData(account);
      setIsDirty(false);
    }
  };

  // Unit CRUD handlers
  const handleAddUnit = async () => {
    if (!newUnit.unitNumber.trim()) {
      await xpAlert("Unit # is required");
      return;
    }
    try {
      const response = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newUnit,
          premisesId: accountId,
        }),
      });
      if (response.ok) {
        const created = await response.json();
        // Refresh account data to get updated units list
        if (account) {
          setAccount({
            ...account,
            units: [...(account.units || []), created],
            _count: { ...account._count, units: (account._count?.units || 0) + 1 },
          });
        }
        setShowAddUnitDialog(false);
        setNewUnit({
          unitNumber: "",
          description: "",
          category: "CONSULTANT",
          unitType: "Elevator",
          manufacturer: "",
          serial: "",
          status: "Active",
        });
      }
    } catch (error) {
      console.error("Error adding unit:", error);
    }
  };

  const handleEditUnit = () => {
    if (selectedUnit) {
      const unit = account?.units?.find(u => u.id === selectedUnit);
      if (unit) {
        openTab(unit.unitNumber, `/units/${unit.id}`);
      }
    }
  };

  const handleDeleteUnit = async () => {
    if (!selectedUnit) return;
    if (!(await xpConfirm("Are you sure you want to delete this unit?"))) return;

    try {
      const response = await fetch(`/api/units/${selectedUnit}`, {
        method: "DELETE",
      });
      if (response.ok) {
        if (account) {
          setAccount({
            ...account,
            units: account.units?.filter(u => u.id !== selectedUnit) || [],
            _count: { ...account._count, units: Math.max(0, (account._count?.units || 0) - 1) },
          });
        }
        setSelectedUnit(null);
      }
    } catch (error) {
      console.error("Error deleting unit:", error);
    }
  };

  // Contact CRUD handlers
  const handleAddContact = async () => {
    if (!newContact.name.trim()) {
      await xpAlert("Contact name is required");
      return;
    }
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newContact,
          customerId: account?.customerId,
        }),
      });
      if (response.ok) {
        const created = await response.json();
        setContacts([...contacts, created]);
        setShowAddContactDialog(false);
        setNewContact({
          name: "",
          title: "",
          phone: "",
          fax: "",
          mobile: "",
          email: "",
          inv: false,
          es: false,
        });
      }
    } catch (error) {
      console.error("Error adding contact:", error);
    }
  };

  const handleEditContact = () => {
    if (selectedContact) {
      const contact = contacts.find(c => c.id === selectedContact);
      if (contact) {
        setEditingContact(contact);
        setNewContact({
          name: contact.name,
          title: contact.title || "",
          phone: contact.phone || "",
          fax: contact.fax || "",
          mobile: contact.mobile || "",
          email: contact.email || "",
          inv: contact.inv,
          es: contact.es,
        });
        setShowAddContactDialog(true);
      }
    }
  };

  const handleUpdateContact = async () => {
    if (!editingContact || !newContact.name.trim()) {
      await xpAlert("Contact name is required");
      return;
    }
    try {
      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });
      if (response.ok) {
        const updated = await response.json();
        setContacts(contacts.map(c => c.id === editingContact.id ? updated : c));
        setShowAddContactDialog(false);
        setEditingContact(null);
        setNewContact({
          name: "",
          title: "",
          phone: "",
          fax: "",
          mobile: "",
          email: "",
          inv: false,
          es: false,
        });
      }
    } catch (error) {
      console.error("Error updating contact:", error);
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;
    if (!(await xpConfirm("Are you sure you want to delete this contact?"))) return;

    try {
      const response = await fetch(`/api/contacts/${selectedContact}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setContacts(contacts.filter(c => c.id !== selectedContact));
        setSelectedContact(null);
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  // PM Contract CRUD handlers
  const handleAddPMContract = async () => {
    try {
      const response = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          premisesId: accountId,
          customerId: account?.customerId,
          sType: newContract.schedule,
          hours: newContract.hours ? parseFloat(newContract.hours) : 0,
          bCycle: getBillingCycleValue(newContract.billingCycle),
          bAmt: newContract.billingAmt ? parseFloat(newContract.billingAmt) : 0,
          status: newContract.active ? 1 : 0,
        }),
      });
      if (response.ok) {
        // Refresh contracts from database
        fetchPMContracts();
        setShowAddContractDialog(false);
        setEditingPMContract(null);
        setNewContract({
          job: "",
          description: "",
          schedule: "Monthly",
          hours: "",
          billingCycle: "Monthly",
          billingAmt: "",
          monthlyAmt: "",
          active: true,
        });
      }
    } catch (error) {
      console.error("Error creating contract:", error);
    }
  };

  const handleEditPMContract = () => {
    if (!selectedContract) return;
    const contract = pmContracts.find(c => c.id === selectedContract);
    if (contract) {
      setEditingPMContract(contract);
      setNewContract({
        job: contract.job || "",
        description: contract.description || "",
        schedule: contract.schedule || "Monthly",
        hours: contract.hours || "",
        billingCycle: contract.billingCycle || "Monthly",
        billingAmt: contract.billingAmt || "",
        monthlyAmt: contract.monthlyAmt || "",
        active: contract.active ?? true,
      });
      setShowAddContractDialog(true);
    }
  };

  const handleUpdatePMContract = async () => {
    if (!editingPMContract) return;
    try {
      const response = await fetch(`/api/contracts/${editingPMContract.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sType: newContract.schedule,
          hours: newContract.hours ? parseFloat(newContract.hours) : 0,
          bCycle: getBillingCycleValue(newContract.billingCycle),
          bAmt: newContract.billingAmt ? parseFloat(newContract.billingAmt) : 0,
          status: newContract.active ? 1 : 0,
        }),
      });
      if (response.ok) {
        // Refresh contracts from database
        fetchPMContracts();
        setShowAddContractDialog(false);
        setEditingPMContract(null);
        setNewContract({
          job: "",
          description: "",
          schedule: "Monthly",
          hours: "",
          billingCycle: "Monthly",
          billingAmt: "",
          monthlyAmt: "",
          active: true,
        });
      }
    } catch (error) {
      console.error("Error updating contract:", error);
    }
  };

  const handleDeletePMContract = async () => {
    if (!selectedContract) return;
    if (!(await xpConfirm("Delete this PM contract?"))) return;
    try {
      const response = await fetch(`/api/contracts/${selectedContract}`, {
        method: "DELETE",
      });
      if (response.ok) {
        fetchPMContracts();
        setSelectedContract(null);
      }
    } catch (error) {
      console.error("Error deleting contract:", error);
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

  if (loading && !isNew) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!account && !isNew) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <span className="text-red-500">Account not found</span>
      </div>
    );
  }

  // General Tab Content
  const renderGeneralTab = () => (
    <>
      {/* Form Section */}
      <div className="bg-white border border-[#d0d0d0] m-2 p-3 flex gap-6">
        {/* Left Column - Address Info */}
        <div className="flex flex-col gap-2 min-w-[280px]">
          {isNew && !customerId && (
            <div className="flex items-center gap-2">
              <label className="w-16 text-right text-[12px] text-red-600 font-bold">Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className={`flex-1 px-2 py-1 border text-[12px] bg-white ${!selectedCustomerId ? "border-red-500" : "border-[#a0a0a0]"}`}
                required
              >
                <option value="">Select Customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
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
            <label className={`w-16 text-right text-[12px] ${isNew ? "text-red-600 font-bold" : ""}`}>Address{isNew && " *"}</label>
            <AddressAutocomplete
              value={formData.address || ""}
              onChange={(val) => handleInputChange("address", val)}
              onAddressSelect={(addr) => {
                handleInputChange("address", addr.address);
                handleInputChange("city", addr.city);
                handleInputChange("state", addr.state);
                handleInputChange("zipCode", addr.zipCode);
                handleInputChange("country", addr.country);
              }}
              className={`flex-1 px-2 py-1 border text-[12px] bg-white ${isNew && !formData.address ? "border-red-500" : "border-[#a0a0a0]"}`}
              placeholder={isNew ? "Enter address..." : ""}
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
          {offices.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="w-16 text-right text-[12px]">Office</label>
              <select
                value={formData.officeId || ""}
                onChange={(e) => handleInputChange("officeId" as keyof Account, e.target.value || "")}
                className="flex-1 px-1 py-1 border border-[#a0a0a0] text-[12px] bg-white"
              >
                <option value="">-- None --</option>
                {offices.map((o) => (
                  <option key={o.id} value={o.id}>{o.name} ({o.code})</option>
                ))}
              </select>
            </div>
          )}
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
            onClick={() => account && openTab(`Jobs - ${account.name || account.premisesId}`, `/job-maintenance?premisesId=${account.id}`)}
            className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium"
          >
            Jobs
          </button>
          <button
            onClick={() => account && openTab(`Job Results - ${account.name || account.premisesId}`, `/job-results?premisesId=${account.id}`)}
            className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium"
          >
            Job Results
          </button>
          <button
            onClick={() => account && openTab(`Invoices - ${account.name || account.premisesId}`, `/invoices?premisesId=${account.id}`)}
            className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium"
          >
            Invoices
          </button>
          <button
            onClick={() => account && openTab(`Tickets - ${account.name || account.premisesId}`, `/completed-tickets?premisesId=${account.id}`)}
            className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium"
          >
            Completed Tickets
          </button>
          <button
            onClick={() => account && openTab(`Open Tickets - ${account.name || account.premisesId}`, `/open-tickets?premisesId=${account.id}`)}
            className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium"
          >
            Open Tickets
          </button>
          <button
            onClick={() => openTab("Quotes", "/quotes")}
            className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium"
          >
            Quotes
          </button>
          <button
            onClick={() => openTab("Estimates", "/estimates")}
            className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium"
          >
            Estimates
          </button>
          <button
            onClick={() => openTab("Violations", "/dispatch-extras/violations")}
            className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium"
          >
            Violations
          </button>
          <button
            onClick={() => openTab("Safety Tests", "/dispatch-extras/safety-tests")}
            className="text-left px-2 py-0.5 text-[12px] text-[#0066cc] hover:underline font-medium"
          >
            Safety Tests
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-6 px-4 py-2 bg-white">
        <div className="flex items-center gap-2">
          <label className="text-[12px]"># Units</label>
          <input
            type="text"
            value={account?._count?.units || 0}
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
            value={formatCurrency(Number(account?.balance || 0))}
            readOnly
            className="w-28 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-[#f0f0f0] text-right"
          />
        </div>
      </div>

      {/* Unit Listing Section */}
      <div className="flex-1 flex flex-col mx-2 mb-2 overflow-hidden">
        <div className="flex items-center gap-2 py-1 bg-white">
          <span className="text-[12px] font-medium">Unit Listing</span>
          <button
            onClick={() => setShowAddUnitDialog(true)}
            className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
          >
            Add
          </button>
          <button className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]">
            Rep
          </button>
          <button
            onClick={handleEditUnit}
            disabled={!selectedUnit}
            className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0] disabled:opacity-50"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteUnit}
            disabled={!selectedUnit}
            className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0] disabled:opacity-50"
          >
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
              {(account?.units?.length || 0) === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                    No units found
                  </td>
                </tr>
              ) : (
                account?.units?.map((unit) => (
                  <tr
                    key={unit.id}
                    onClick={() => setSelectedUnit(unit.id)}
                    onDoubleClick={() => openTab(unit.unitNumber, `/units/${unit.id}`)}
                    className={`cursor-pointer ${
                      selectedUnit === unit.id
                        ? "bg-[#0078d4] text-white"
                        : "hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-2 py-1 border border-[#d0d0d0]">{unit.unitNumber}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{unit.cat || ""}</td>
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
      <div className="bg-white border border-[#d0d0d0] m-2 p-3 flex gap-6">
        {/* Left Column - Billing Address */}
        <div className="flex flex-col gap-2 min-w-[300px]">
          <div className="flex items-center gap-2">
            <label className="w-20 text-right text-[12px]">Customer</label>
            <button
              onClick={openCustomer}
              className="flex-1 px-2 py-1 text-[12px] text-[#0066cc] hover:underline text-left"
            >
              {account?.customer?.name || ""}
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
      <div className="bg-white border border-[#d0d0d0] m-2 p-3 flex gap-6">
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
              <option value="S">S - Full Service</option>
              <option value="H">H - Hourly</option>
              <option value="MOD">MOD - Modernization</option>
              <option value="Resident Mech.">Resident Mech.</option>
              <option value="Non-Contract">Non-Contract</option>
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
      <div className="bg-white border border-[#d0d0d0] m-2 p-3 flex gap-6">
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
        <div className="flex items-center gap-2 py-1 bg-white">
          <button
            onClick={() => {
              setEditingPMContract(null);
              setNewContract({ job: "", description: "", schedule: "Monthly", hours: "", billingCycle: "Monthly", billingAmt: "", monthlyAmt: "", active: true });
              setShowAddContractDialog(true);
            }}
            className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
          >
            Add
          </button>
          <button
            onClick={handleEditPMContract}
            disabled={!selectedContract}
            className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0] disabled:opacity-50"
          >
            Edit
          </button>
          <button
            onClick={handleDeletePMContract}
            disabled={!selectedContract}
            className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0] disabled:opacity-50"
          >
            Delete
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
                    onDoubleClick={() => openTab(contract.description || contract.job, `/job-maintenance/${contract.jobId || contract.id}`)}
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
        <div className="flex items-center gap-2 py-1 bg-white">
          <button
            onClick={() => {
              setEditingContact(null);
              setNewContact({ name: "", title: "", phone: "", fax: "", mobile: "", email: "", inv: false, es: false });
              setShowAddContactDialog(true);
            }}
            className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
          >
            Add
          </button>
          <button
            onClick={handleEditContact}
            disabled={!selectedContact}
            className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0] disabled:opacity-50"
          >
            Edit
          </button>
          <button
            onClick={handleDeleteContact}
            disabled={!selectedContact}
            className="px-3 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0] disabled:opacity-50"
          >
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
      <div className="bg-white border border-[#d0d0d0] m-2 p-3 flex gap-6">
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
      <div className="bg-white border border-[#d0d0d0] m-2 p-3 flex flex-col gap-2">
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
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
        <span className="font-bold text-[13px]">
          {isNew ? "New Account" : `Editing Account '${account?.premisesId || account?.address || ""}'`}
        </span>
        <button onClick={() => confirmNavigation(() => onClose?.())} className="hover:bg-[#c0c0c0] hover:text-black px-2 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

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
          disabled={!isDirty}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Save"
        >
          <Save className="w-4 h-4" style={{ color: "#4a90d9" }} />
        </button>
        <button
          onClick={handleUndo}
          disabled={!isDirty}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Undo"
        >
          <Undo2 className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Print">
          <Printer className="w-4 h-4" style={{ color: "#333" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
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
          onClick={() => confirmNavigation(() => onClose?.())}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="Close"
        >
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
        {isDirty && (
          <span className="ml-4 text-[11px] text-[#c00]">Unsaved changes</span>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white flex items-end px-2 pt-1 border-b border-[#d0d0d0]">
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
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1 flex items-center justify-between text-[11px]">
        <span>EDIT</span>
        <div className="flex gap-8">
          <span>{account?.createdAt ? new Date(account.createdAt).toLocaleDateString() : ""}</span>
          <span>{account?.updatedAt ? new Date(account.updatedAt).toLocaleDateString() : ""}</span>
        </div>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showDialog}
        onSave={handleDialogSave}
        onDiscard={handleDialogDiscard}
        onCancel={handleDialogCancel}
        saving={savingFromHook}
      />

      {/* XP Alert/Confirm Dialog */}
      <XPDialogComponent />

      {/* Add Unit Dialog */}
      {showAddUnitDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] border-2 border-[#808080] shadow-lg" style={{ minWidth: "450px" }}>
            <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">Add New Unit</span>
              <button
                onClick={() => setShowAddUnitDialog(false)}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Unit #</label>
                  <input
                    type="text"
                    value={newUnit.unitNumber}
                    onChange={(e) => setNewUnit({ ...newUnit, unitNumber: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-[#ffffe1]"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Description</label>
                  <input
                    type="text"
                    value={newUnit.description}
                    onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Category</label>
                  <select
                    value={newUnit.category}
                    onChange={(e) => setNewUnit({ ...newUnit, category: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    <option value="CONSULTANT">CONSULTANT</option>
                    <option value="Public">Public</option>
                    <option value="Service">Service</option>
                    <option value="Private">Private</option>
                    <option value="N/A">N/A</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Type</label>
                  <select
                    value={newUnit.unitType}
                    onChange={(e) => setNewUnit({ ...newUnit, unitType: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    <option value="Elevator">Elevator</option>
                    <option value="Escalator">Escalator</option>
                    <option value="Dumbwaiter">Dumbwaiter</option>
                    <option value="Wheelchair Lift">Wheelchair Lift</option>
                    <option value="Moving Walk">Moving Walk</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Manufacturer</label>
                  <input
                    type="text"
                    value={newUnit.manufacturer}
                    onChange={(e) => setNewUnit({ ...newUnit, manufacturer: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Serial #</label>
                  <input
                    type="text"
                    value={newUnit.serial}
                    onChange={(e) => setNewUnit({ ...newUnit, serial: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Status</label>
                  <select
                    value={newUnit.status}
                    onChange={(e) => setNewUnit({ ...newUnit, status: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#808080]">
                <button
                  onClick={handleAddUnit}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  OK
                </button>
                <button
                  onClick={() => setShowAddUnitDialog(false)}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Contact Dialog */}
      {showAddContactDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] border-2 border-[#808080] shadow-lg" style={{ minWidth: "450px" }}>
            <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">{editingContact ? "Edit Contact" : "Add New Contact"}</span>
              <button
                onClick={() => {
                  setShowAddContactDialog(false);
                  setEditingContact(null);
                }}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-20 text-right text-[12px]">Name</label>
                  <input
                    type="text"
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-[#ffffe1]"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-right text-[12px]">Title</label>
                  <input
                    type="text"
                    value={newContact.title}
                    onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-right text-[12px]">Phone</label>
                  <input
                    type="text"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-right text-[12px]">Fax</label>
                  <input
                    type="text"
                    value={newContact.fax}
                    onChange={(e) => setNewContact({ ...newContact, fax: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-right text-[12px]">Mobile</label>
                  <input
                    type="text"
                    value={newContact.mobile}
                    onChange={(e) => setNewContact({ ...newContact, mobile: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-right text-[12px]">Email</label>
                  <input
                    type="text"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-4 ml-24">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="contact-inv"
                      checked={newContact.inv}
                      onChange={(e) => setNewContact({ ...newContact, inv: e.target.checked })}
                      className="w-3 h-3"
                    />
                    <label htmlFor="contact-inv" className="text-[12px]">Invoice</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="contact-es"
                      checked={newContact.es}
                      onChange={(e) => setNewContact({ ...newContact, es: e.target.checked })}
                      className="w-3 h-3"
                    />
                    <label htmlFor="contact-es" className="text-[12px]">End Statement</label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#808080]">
                <button
                  onClick={editingContact ? handleUpdateContact : handleAddContact}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  OK
                </button>
                <button
                  onClick={() => {
                    setShowAddContactDialog(false);
                    setEditingContact(null);
                  }}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit PM Contract Dialog */}
      {showAddContractDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] border-2 border-[#808080] shadow-lg" style={{ minWidth: "450px" }}>
            <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">{editingPMContract ? "Edit PM Contract" : "Add PM Contract"}</span>
              <button
                onClick={() => {
                  setShowAddContractDialog(false);
                  setEditingPMContract(null);
                }}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Job</label>
                  <input
                    type="text"
                    value={newContract.job}
                    onChange={(e) => setNewContract({ ...newContract, job: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-[#ffffe1]"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Description</label>
                  <input
                    type="text"
                    value={newContract.description}
                    onChange={(e) => setNewContract({ ...newContract, description: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Schedule</label>
                  <select
                    value={newContract.schedule}
                    onChange={(e) => setNewContract({ ...newContract, schedule: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semi-Annual">Semi-Annual</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Hours</label>
                  <input
                    type="text"
                    value={newContract.hours}
                    onChange={(e) => setNewContract({ ...newContract, hours: e.target.value })}
                    className="w-24 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Billing Cycle</label>
                  <select
                    value={newContract.billingCycle}
                    onChange={(e) => setNewContract({ ...newContract, billingCycle: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semi-Annual">Semi-Annual</option>
                    <option value="Annual">Annual</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Billing Amt</label>
                  <input
                    type="text"
                    value={newContract.billingAmt}
                    onChange={(e) => setNewContract({ ...newContract, billingAmt: e.target.value })}
                    className="w-32 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-24 text-right text-[12px]">Monthly Amt</label>
                  <input
                    type="text"
                    value={newContract.monthlyAmt}
                    onChange={(e) => setNewContract({ ...newContract, monthlyAmt: e.target.value })}
                    className="w-32 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 ml-24">
                  <input
                    type="checkbox"
                    id="contract-active"
                    checked={newContract.active}
                    onChange={(e) => setNewContract({ ...newContract, active: e.target.checked })}
                    className="w-3 h-3"
                  />
                  <label htmlFor="contract-active" className="text-[12px]">Active</label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#808080]">
                <button
                  onClick={editingPMContract ? handleUpdatePMContract : handleAddPMContract}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  OK
                </button>
                <button
                  onClick={() => {
                    setShowAddContractDialog(false);
                    setEditingPMContract(null);
                  }}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
