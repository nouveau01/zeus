"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Check,
  Ban,
  RefreshCw,
  X,
  Users,
  ShieldAlert,
  Shield,
  User as UserIcon,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { AddressAutocomplete, AddressSelection } from "@/components/ui/AddressAutocomplete";

interface OfficeRecord {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  _count: { users: number; premises: number };
}

interface UserWithOffices {
  id: string;
  name: string;
  email: string;
  profile: string;
  avatar: string | null;
  officeIds: string[];
}

export function OfficesPanel() {
  const { data: session } = useSession();
  const currentProfile = (session?.user as any)?.profile;
  const isGodAdmin = currentProfile === "GodAdmin";

  const [activeTab, setActiveTab] = useState<"manage" | "access">("manage");

  return (
    <div className="h-full flex flex-col" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Tab Bar */}
      <div className="flex border-b border-[#d0d0d0] bg-[#f5f5f5] px-2 pt-2">
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-4 py-1.5 text-[12px] font-medium border border-b-0 rounded-t transition-colors ${
            activeTab === "manage"
              ? "bg-white border-[#d0d0d0] text-[#333] -mb-px"
              : "bg-[#e8e8e8] border-transparent text-[#666] hover:text-[#333]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Manage Offices
          </span>
        </button>
        <button
          onClick={() => setActiveTab("access")}
          className={`px-4 py-1.5 text-[12px] font-medium border border-b-0 rounded-t transition-colors ml-1 ${
            activeTab === "access"
              ? "bg-white border-[#d0d0d0] text-[#333] -mb-px"
              : "bg-[#e8e8e8] border-transparent text-[#666] hover:text-[#333]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            User Access
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "manage" ? (
          <ManageOfficesTab isGodAdmin={isGodAdmin} />
        ) : (
          <UserAccessTab isGodAdmin={isGodAdmin} />
        )}
      </div>
    </div>
  );
}

// ============================================
// TAB 1: MANAGE OFFICES
// ============================================

function ManageOfficesTab({ isGodAdmin }: { isGodAdmin: boolean }) {
  const [offices, setOffices] = useState<OfficeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dialogError, setDialogError] = useState("");

  // Form fields
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formZip, setFormZip] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");

  const resetForm = () => {
    setFormCode("");
    setFormName("");
    setFormAddress("");
    setFormCity("");
    setFormState("");
    setFormZip("");
    setFormPhone("");
    setFormEmail("");
    setDialogError("");
  };

  const fetchOffices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/offices");
      if (res.ok) setOffices(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOffices(); }, []);

  const handleAdd = async () => {
    setDialogError("");
    if (!formCode.trim() || !formName.trim()) {
      setDialogError("Code and name are required");
      return;
    }
    try {
      const res = await fetch("/api/offices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode,
          name: formName,
          address: formAddress,
          city: formCity,
          state: formState,
          zipCode: formZip,
          phone: formPhone,
          email: formEmail,
        }),
      });
      if (res.ok) {
        setShowAddDialog(false);
        resetForm();
        fetchOffices();
      } else {
        const data = await res.json();
        setDialogError(data.error || "Failed to create office");
      }
    } catch {
      setDialogError("Network error");
    }
  };

  const handleEdit = async () => {
    if (!selectedId) return;
    setDialogError("");
    try {
      const res = await fetch(`/api/offices/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formCode,
          name: formName,
          address: formAddress,
          city: formCity,
          state: formState,
          zipCode: formZip,
          phone: formPhone,
          email: formEmail,
        }),
      });
      if (res.ok) {
        setShowEditDialog(false);
        fetchOffices();
      } else {
        const data = await res.json();
        setDialogError(data.error || "Failed to update office");
      }
    } catch {
      setDialogError("Network error");
    }
  };

  const handleToggleActive = async (office: OfficeRecord) => {
    try {
      await fetch(`/api/offices/${office.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !office.isActive }),
      });
      fetchOffices();
    } catch {}
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setDialogError("");
    try {
      const res = await fetch(`/api/offices?id=${selectedId}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteConfirm(false);
        setSelectedId(null);
        fetchOffices();
      } else {
        const data = await res.json();
        setDialogError(data.error || "Failed to delete");
      }
    } catch {
      setDialogError("Network error");
    }
  };

  const openAddDialog = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const openEditDialog = () => {
    const office = offices.find((o) => o.id === selectedId);
    if (!office) return;
    setFormCode(office.code);
    setFormName(office.name);
    setFormAddress(office.address || "");
    setFormCity(office.city || "");
    setFormState(office.state || "");
    setFormZip(office.zipCode || "");
    setFormPhone(office.phone || "");
    setFormEmail(office.email || "");
    setDialogError("");
    setShowEditDialog(true);
  };

  const selectedOffice = offices.find((o) => o.id === selectedId);

  const formatLocation = (office: OfficeRecord) => {
    const parts = [office.city, office.state].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "";
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button
          className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px]"
          onClick={openAddDialog}
        >
          <Plus className="w-4 h-4 text-[#4a7c59]" />
          Add Office
        </button>
        <button
          className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={openEditDialog}
          disabled={!selectedId}
        >
          <Pencil className="w-4 h-4 text-[#d4a574]" />
          Edit
        </button>
        <button
          className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => selectedId && selectedOffice && handleToggleActive(selectedOffice)}
          disabled={!selectedId}
        >
          {selectedOffice?.isActive ? (
            <><Ban className="w-4 h-4 text-[#e67e22]" />Deactivate</>
          ) : (
            <><Check className="w-4 h-4 text-[#28a745]" />Activate</>
          )}
        </button>
        {isGodAdmin && (
          <button
            className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => selectedId && setShowDeleteConfirm(true)}
            disabled={!selectedId}
          >
            <Trash2 className="w-4 h-4 text-[#c45c5c]" />
            Delete
          </button>
        )}
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button
          className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px]"
          onClick={fetchOffices}
        >
          <RefreshCw className="w-4 h-4 text-[#e67e22]" />
          Refresh
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 bg-white border border-[#a0a0a0] mx-2 mb-2 mt-2 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#f0f0f0] border-b border-[#c0c0c0] flex-shrink-0">
          <div className="flex text-[12px]">
            <div className="px-2 py-1.5 font-medium text-[#333] border-r border-[#c0c0c0]" style={{ width: 80 }}>Code</div>
            <div className="px-2 py-1.5 font-medium text-[#333] border-r border-[#c0c0c0]" style={{ width: 160 }}>Name</div>
            <div className="px-2 py-1.5 font-medium text-[#333] border-r border-[#c0c0c0] flex-1">Location</div>
            <div className="px-2 py-1.5 font-medium text-[#333] border-r border-[#c0c0c0]" style={{ width: 120 }}>Phone</div>
            <div className="px-2 py-1.5 font-medium text-[#333] border-r border-[#c0c0c0] text-center" style={{ width: 60 }}>Users</div>
            <div className="px-2 py-1.5 font-medium text-[#333] border-r border-[#c0c0c0] text-center" style={{ width: 70 }}>Accounts</div>
            <div className="px-2 py-1.5 font-medium text-[#333] text-center" style={{ width: 70 }}>Status</div>
          </div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-[#808080]">Loading...</div>
          ) : offices.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">
              No offices configured. Click &quot;Add Office&quot; to create one.
            </div>
          ) : (
            offices.map((office) => (
              <div
                key={office.id}
                onClick={() => setSelectedId(office.id)}
                onDoubleClick={() => { setSelectedId(office.id); setTimeout(openEditDialog, 0); }}
                className={`flex text-[12px] cursor-pointer border-b border-[#d0d0d0] ${
                  selectedId === office.id
                    ? "bg-[#0078d4] text-white"
                    : office.isActive
                    ? "bg-white hover:bg-[#f0f8ff]"
                    : "bg-[#f5f5f5] text-[#999] hover:bg-[#eee]"
                }`}
              >
                <div className="px-2 py-1.5 border-r border-[#d0d0d0] font-mono font-medium" style={{ width: 80 }}>
                  {office.code}
                </div>
                <div className="px-2 py-1.5 border-r border-[#d0d0d0] truncate" style={{ width: 160 }}>
                  {office.name}
                </div>
                <div className="px-2 py-1.5 border-r border-[#d0d0d0] flex-1 truncate">
                  {formatLocation(office)}
                </div>
                <div className="px-2 py-1.5 border-r border-[#d0d0d0] truncate" style={{ width: 120 }}>
                  {office.phone || ""}
                </div>
                <div className="px-2 py-1.5 border-r border-[#d0d0d0] text-center" style={{ width: 60 }}>
                  {office._count.users}
                </div>
                <div className="px-2 py-1.5 border-r border-[#d0d0d0] text-center" style={{ width: 70 }}>
                  {office._count.premises}
                </div>
                <div className="px-2 py-1.5 text-center" style={{ width: 70 }}>
                  {office.isActive ? (
                    <span className={`text-[10px] font-medium ${selectedId === office.id ? "text-white" : "text-[#28a745]"}`}>Active</span>
                  ) : (
                    <span className={`text-[10px] font-medium ${selectedId === office.id ? "text-white" : "text-[#dc3545]"}`}>Inactive</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex-shrink-0">
        <span className="text-[11px] text-[#666]">
          {offices.length} office{offices.length !== 1 ? "s" : ""} &middot; {offices.filter(o => o.isActive).length} active
        </span>
      </div>

      {/* Add Dialog */}
      {showAddDialog && (
        <OfficeFormDialog
          title="Add Office"
          error={dialogError}
          code={formCode} onCodeChange={setFormCode}
          name={formName} onNameChange={setFormName}
          address={formAddress} onAddressChange={setFormAddress}
          city={formCity} onCityChange={setFormCity}
          state={formState} onStateChange={setFormState}
          zip={formZip} onZipChange={setFormZip}
          phone={formPhone} onPhoneChange={setFormPhone}
          email={formEmail} onEmailChange={setFormEmail}
          submitLabel="Add"
          onSubmit={handleAdd}
          onClose={() => setShowAddDialog(false)}
        />
      )}

      {/* Edit Dialog */}
      {showEditDialog && selectedOffice && (
        <OfficeFormDialog
          title="Edit Office"
          error={dialogError}
          code={formCode} onCodeChange={setFormCode}
          name={formName} onNameChange={setFormName}
          address={formAddress} onAddressChange={setFormAddress}
          city={formCity} onCityChange={setFormCity}
          state={formState} onStateChange={setFormState}
          zip={formZip} onZipChange={setFormZip}
          phone={formPhone} onPhoneChange={setFormPhone}
          email={formEmail} onEmailChange={setFormEmail}
          submitLabel="Save"
          onSubmit={handleEdit}
          onClose={() => setShowEditDialog(false)}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedOffice && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70]">
          <div className="bg-[#ece9d8] border border-[#808080] shadow-lg" style={{ width: "360px" }}>
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center justify-between">
              <span className="text-white font-bold text-[12px]">Confirm Delete</span>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-white hover:bg-[#c45c5c] px-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              {dialogError && <div className="p-2 mb-3 bg-red-100 border border-red-300 text-red-700 text-[11px] rounded">{dialogError}</div>}
              <div className="flex items-start gap-3 mb-4">
                <Trash2 className="w-5 h-5 text-[#c45c5c] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] mb-1">
                    Permanently delete office <strong>{selectedOffice.code}</strong> ({selectedOffice.name})?
                  </p>
                  <p className="text-[10px] text-[#c45c5c] mt-1">This will remove the office and all user assignments to it.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={handleDelete} className="px-4 py-1 text-[11px] bg-[#c45c5c] text-white border border-[#a03030] hover:bg-[#b04040] min-w-[70px]">
                  Delete
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]">
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

// ============================================
// SHARED: OFFICE FORM DIALOG
// ============================================

function OfficeFormDialog({
  title,
  error,
  code, onCodeChange,
  name, onNameChange,
  address, onAddressChange,
  city, onCityChange,
  state, onStateChange,
  zip, onZipChange,
  phone, onPhoneChange,
  email, onEmailChange,
  submitLabel,
  onSubmit,
  onClose,
}: {
  title: string;
  error: string;
  code: string; onCodeChange: (v: string) => void;
  name: string; onNameChange: (v: string) => void;
  address: string; onAddressChange: (v: string) => void;
  city: string; onCityChange: (v: string) => void;
  state: string; onStateChange: (v: string) => void;
  zip: string; onZipChange: (v: string) => void;
  phone: string; onPhoneChange: (v: string) => void;
  email: string; onEmailChange: (v: string) => void;
  submitLabel: string;
  onSubmit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70]">
      <div className="bg-[#ece9d8] border border-[#808080] shadow-lg" style={{ width: "440px" }}>
        <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center justify-between">
          <span className="text-white font-bold text-[12px]">{title}</span>
          <button onClick={onClose} className="text-white hover:bg-[#c45c5c] px-1 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {error && <div className="p-2 bg-red-100 border border-red-300 text-red-700 text-[11px] rounded">{error}</div>}

          {/* Row 1: Code + Name */}
          <div className="flex gap-3">
            <div className="w-[120px]">
              <label className="block text-[11px] font-medium mb-1">Office Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                placeholder="e.g. N-GA"
              />
              <div className="text-[10px] text-[#888] mt-0.5">Unique ID (uppercased)</div>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-medium mb-1">Office Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                placeholder="e.g. Nouveau Elevator - Georgia"
              />
            </div>
          </div>

          {/* Row 2: Address */}
          <div>
            <label className="block text-[11px] font-medium mb-1">Address</label>
            <AddressAutocomplete
              value={address}
              onChange={onAddressChange}
              onAddressSelect={(addr) => {
                onAddressChange(addr.address);
                onCityChange(addr.city);
                onStateChange(addr.state);
                onZipChange(addr.zipCode);
              }}
              className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
              placeholder="e.g. 123 Main Street"
            />
          </div>

          {/* Row 3: City, State, Zip */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-medium mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
                className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                placeholder="e.g. Atlanta"
              />
            </div>
            <div className="w-[80px]">
              <label className="block text-[11px] font-medium mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => onStateChange(e.target.value)}
                className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                placeholder="e.g. GA"
                maxLength={2}
              />
            </div>
            <div className="w-[90px]">
              <label className="block text-[11px] font-medium mb-1">Zip Code</label>
              <input
                type="text"
                value={zip}
                onChange={(e) => onZipChange(e.target.value)}
                className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                placeholder="e.g. 30301"
              />
            </div>
          </div>

          {/* Row 4: Phone + Email */}
          <div className="flex gap-3">
            <div className="w-[160px]">
              <label className="block text-[11px] font-medium mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                placeholder="e.g. (404) 555-1234"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-medium mb-1">Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                placeholder="e.g. georgia@nouveauelevator.com"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onSubmit}
              disabled={!code.trim() || !name.trim()}
              className="px-4 py-1 text-[11px] bg-[#316ac5] text-white border border-[#003c74] hover:bg-[#2a5db0] min-w-[70px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitLabel}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TAB 2: USER ACCESS MATRIX
// ============================================

function UserAccessTab({ isGodAdmin }: { isGodAdmin: boolean }) {
  const [offices, setOffices] = useState<OfficeRecord[]>([]);
  const [users, setUsers] = useState<UserWithOffices[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // userId being saved

  const fetchData = async () => {
    setLoading(true);
    try {
      const [officesRes, usersRes] = await Promise.all([
        fetch("/api/offices"),
        fetch("/api/offices/user-access"),
      ]);
      if (officesRes.ok) setOffices(await officesRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const activeOffices = offices.filter((o) => o.isActive);

  const toggleOffice = async (userId: string, officeId: string, currentIds: string[]) => {
    const newIds = currentIds.includes(officeId)
      ? currentIds.filter((id) => id !== officeId)
      : [...currentIds, officeId];

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, officeIds: newIds } : u))
    );

    setSaving(userId);
    try {
      await fetch("/api/offices/user-access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, officeIds: newIds }),
      });
    } catch {
      // Revert on error
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, officeIds: currentIds } : u))
      );
    } finally {
      setSaving(null);
    }
  };

  const toggleAllForUser = async (userId: string, currentIds: string[]) => {
    const allAssigned = activeOffices.every((o) => currentIds.includes(o.id));
    const newIds = allAssigned ? [] : activeOffices.map((o) => o.id);

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, officeIds: newIds } : u))
    );

    setSaving(userId);
    try {
      await fetch("/api/offices/user-access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, officeIds: newIds }),
      });
    } catch {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, officeIds: currentIds } : u))
      );
    } finally {
      setSaving(null);
    }
  };

  const toggleAllForOffice = async (officeId: string) => {
    // Check if all non-GodAdmin users have this office
    const nonGodAdmins = users.filter((u) => u.profile !== "GodAdmin");
    const allHaveIt = nonGodAdmins.every((u) => u.officeIds.includes(officeId));

    // Toggle for each non-GodAdmin user
    for (const user of nonGodAdmins) {
      const currentIds = user.officeIds;
      const newIds = allHaveIt
        ? currentIds.filter((id) => id !== officeId)
        : currentIds.includes(officeId) ? currentIds : [...currentIds, officeId];

      if (JSON.stringify(newIds) !== JSON.stringify(currentIds)) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, officeIds: newIds } : u))
        );
        try {
          await fetch("/api/offices/user-access", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, officeIds: newIds }),
          });
        } catch {}
      }
    }
  };

  const getProfileIcon = (profile: string) => {
    const display = profile === "GodAdmin" ? "Admin" : profile;
    switch (display) {
      case "Admin": return <Shield className="w-3 h-3 text-[#316ac5]" />;
      default: return <UserIcon className="w-3 h-3 text-[#666]" />;
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-[#808080]">Loading...</div>;
  }

  if (activeOffices.length === 0) {
    return (
      <div className="p-4 text-center text-[#808080]">
        No offices configured. Go to the &quot;Manage Offices&quot; tab to create offices first.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Info bar */}
      <div className="px-3 py-2 bg-[#e8f0fe] border-b border-[#b8daff] text-[11px] text-[#004085] flex items-center gap-2">
        <Building2 className="w-3.5 h-3.5" />
        Check the boxes to grant users access to each office&apos;s data. System administrators automatically have access to all offices.
      </div>

      {/* Matrix */}
      <div className="flex-1 overflow-auto m-2 border border-[#a0a0a0]">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-[#f0f0f0]">
              <th className="sticky left-0 z-10 bg-[#f0f0f0] border-b border-r border-[#c0c0c0] px-2 py-1.5 text-left font-medium" style={{ minWidth: 250 }}>
                User
              </th>
              {activeOffices.map((office) => {
                const nonGodAdmins = users.filter((u) => u.profile !== "GodAdmin");
                const allChecked = nonGodAdmins.length > 0 && nonGodAdmins.every((u) => u.officeIds.includes(office.id));
                return (
                  <th key={office.id} className="border-b border-r border-[#c0c0c0] px-1 py-1.5 text-center font-medium" style={{ minWidth: 60 }}>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-mono text-[10px]">{office.code}</span>
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={() => toggleAllForOffice(office.id)}
                        className="cursor-pointer"
                        title={`Toggle all users for ${office.code}`}
                      />
                    </div>
                  </th>
                );
              })}
              <th className="border-b border-[#c0c0c0] px-1 py-1.5 text-center font-medium" style={{ minWidth: 50 }}>
                All
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isGA = user.profile === "GodAdmin";
              const allAssigned = activeOffices.every((o) => user.officeIds.includes(o.id));
              return (
                <tr
                  key={user.id}
                  className="border-b border-[#e0e0e0] bg-white hover:bg-[#f0f8ff]"
                >
                  <td className="sticky left-0 z-10 border-r border-[#c0c0c0] px-2 py-1.5 bg-inherit">
                    <div className="flex items-center gap-2">
                      {user.avatar ? (
                        <img src={user.avatar} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-5 h-5 bg-[#ccc] rounded-full flex items-center justify-center text-[8px] text-white font-medium flex-shrink-0">
                          {user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          {getProfileIcon(user.profile)}
                          <span className="font-medium truncate">{user.name}</span>
                        </div>
                        <div className="text-[10px] text-[#888] truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  {activeOffices.map((office) => (
                    <td key={office.id} className="border-r border-[#e0e0e0] text-center px-1 py-1.5">
                      <input
                        type="checkbox"
                        checked={isGA ? true : user.officeIds.includes(office.id)}
                        disabled={isGA || saving === user.id}
                        onChange={() => toggleOffice(user.id, office.id, user.officeIds)}
                        className={`cursor-pointer ${isGA ? "opacity-60 cursor-not-allowed" : ""}`}
                      />
                    </td>
                  ))}
                  <td className="text-center px-1 py-1.5">
                    <input
                      type="checkbox"
                      checked={isGA ? true : allAssigned}
                      disabled={isGA || saving === user.id}
                      onChange={() => toggleAllForUser(user.id, user.officeIds)}
                      className={`cursor-pointer ${isGA ? "opacity-60 cursor-not-allowed" : ""}`}
                      title="Toggle all offices"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex-shrink-0">
        <span className="text-[11px] text-[#666]">
          {users.length} user{users.length !== 1 ? "s" : ""} &middot; {activeOffices.length} office{activeOffices.length !== 1 ? "s" : ""}
          {saving && " · Saving..."}
        </span>
      </div>
    </div>
  );
}
