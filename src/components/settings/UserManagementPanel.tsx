"use client";

import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Shield,
  ShieldAlert,
  User,
  UserPlus,
  Trash2,
  Check,
  Ban,
} from "lucide-react";
import { useSession } from "next-auth/react";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type SortField = "name" | "email" | "role" | "isActive" | "createdAt";
type SortDirection = "asc" | "desc";

export function UserManagementPanel() {
  const { data: session } = useSession();
  const currentRole = (session?.user as any)?.role;
  const currentId = (session?.user as any)?.id;
  const isGodAdmin = currentRole === "GodAdmin";

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dialogError, setDialogError] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("User");

  // Column widths
  const [columnWidths, setColumnWidths] = useState<number[]>([50, 200, 280, 120, 80, 160]);

  const columns = [
    { field: null, label: "", sortable: false },
    { field: "name" as SortField, label: "Name", sortable: true },
    { field: "email" as SortField, label: "Email", sortable: true },
    { field: "role" as SortField, label: "Role", sortable: true },
    { field: "isActive" as SortField, label: "Status", sortable: true },
    { field: "createdAt" as SortField, label: "Created", sortable: true },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aVal: string | boolean;
    let bVal: string | boolean;

    switch (sortField) {
      case "name": aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
      case "email": aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase(); break;
      case "role": aVal = a.role; bVal = b.role; break;
      case "isActive": aVal = a.isActive ? "active" : "inactive"; bVal = b.isActive ? "active" : "inactive"; break;
      case "createdAt": aVal = a.createdAt; bVal = b.createdAt; break;
      default: return 0;
    }

    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Resize handler
  const handleResizeStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[index];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(40, startWidth + diff);
      setColumnWidths(prev => {
        const updated = [...prev];
        updated[index] = newWidth;
        return updated;
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "GodAdmin": return <ShieldAlert className="w-3.5 h-3.5 text-[#d4a017]" />;
      case "Admin": return <Shield className="w-3.5 h-3.5 text-[#316ac5]" />;
      default: return <User className="w-3.5 h-3.5 text-[#666]" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "GodAdmin": return "bg-[#fff3cd] text-[#856404] border-[#ffc107]";
      case "Admin": return "bg-[#cce5ff] text-[#004085] border-[#b8daff]";
      default: return "bg-[#f0f0f0] text-[#333] border-[#ccc]";
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Add user
  const handleAdd = async () => {
    setDialogError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formEmail, name: formName, role: formRole }),
      });
      if (res.ok) {
        setShowAddDialog(false);
        setFormName(""); setFormEmail(""); setFormRole("User");
        fetchUsers();
      } else {
        const data = await res.json();
        setDialogError(data.error || "Failed to create user");
      }
    } catch {
      setDialogError("Network error");
    }
  };

  // Edit user
  const handleEdit = async () => {
    if (!selectedRow) return;
    setDialogError("");
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedRow, name: formName, role: formRole }),
      });
      if (res.ok) {
        setShowEditDialog(false);
        fetchUsers();
      } else {
        const data = await res.json();
        setDialogError(data.error || "Failed to update user");
      }
    } catch {
      setDialogError("Network error");
    }
  };

  // Toggle active
  const handleToggleActive = async (user: UserRecord) => {
    try {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      fetchUsers();
    } catch (error) {
      console.error("Error toggling user:", error);
    }
  };

  // Delete user
  const handleDelete = async () => {
    if (!selectedRow) return;
    setDialogError("");
    try {
      const res = await fetch(`/api/users?id=${selectedRow}`, { method: "DELETE" });
      if (res.ok) {
        setShowDeleteConfirm(false);
        setSelectedRow(null);
        fetchUsers();
      } else {
        const data = await res.json();
        setDialogError(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setDialogError("Network error");
    }
  };

  const openEditDialog = () => {
    const user = users.find(u => u.id === selectedRow);
    if (!user) return;
    setFormName(user.name);
    setFormRole(user.role);
    setDialogError("");
    setShowEditDialog(true);
  };

  const openAddDialog = () => {
    setFormName(""); setFormEmail(""); setFormRole("User");
    setDialogError("");
    setShowAddDialog(true);
  };

  const selectedUser = users.find(u => u.id === selectedRow);

  const availableRoles = isGodAdmin ? ["GodAdmin", "Admin", "User"] : ["Admin", "User"];

  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button
          className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px]"
          title="Add User"
          onClick={openAddDialog}
        >
          <UserPlus className="w-4 h-4 text-[#4a7c59]" />
          Add User
        </button>
        <button
          className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
          title="Edit User"
          onClick={openEditDialog}
          disabled={!selectedRow}
        >
          <Pencil className="w-4 h-4 text-[#d4a574]" />
          Edit
        </button>
        <button
          className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
          title={selectedUser?.isActive ? "Deactivate User" : "Activate User"}
          onClick={() => selectedRow && selectedUser && selectedRow !== currentId && handleToggleActive(selectedUser)}
          disabled={!selectedRow || selectedRow === currentId || (selectedUser?.role === "GodAdmin" && !isGodAdmin)}
        >
          {selectedUser?.isActive ? (
            <><Ban className="w-4 h-4 text-[#e67e22]" />Deactivate</>
          ) : (
            <><Check className="w-4 h-4 text-[#28a745]" />Activate</>
          )}
        </button>
        {isGodAdmin && (
          <button
            className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
            title="Permanently Delete User"
            onClick={() => selectedRow && selectedRow !== currentId && setShowDeleteConfirm(true)}
            disabled={!selectedRow || selectedRow === currentId}
          >
            <Trash2 className="w-4 h-4 text-[#c45c5c]" />
            Delete
          </button>
        )}
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button
          className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px]"
          title="Refresh"
          onClick={fetchUsers}
        >
          <RefreshCw className="w-4 h-4 text-[#e67e22]" />
          Refresh
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 bg-white border border-[#a0a0a0] mx-2 mb-2 mt-2 flex flex-col overflow-hidden">
        {/* Column Headers */}
        <div className="bg-[#f0f0f0] border-b border-[#c0c0c0] flex-shrink-0">
          <div className="flex text-[12px]">
            {columns.map((col, index) => (
              <div
                key={col.label || index}
                className="relative flex-shrink-0 border-r border-[#c0c0c0] last:border-r-0"
                style={{ width: columnWidths[index] }}
              >
                <div
                  className={`px-2 py-1.5 font-medium text-[#333] select-none text-center truncate ${
                    col.sortable ? "cursor-pointer hover:bg-[#e0e0e0]" : ""
                  }`}
                  onClick={() => col.sortable && col.field && handleSort(col.field)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="truncate">{col.label}</span>
                    {col.sortable && col.field && sortField === col.field && (
                      sortDirection === "asc"
                        ? <ChevronUp className="w-3 h-3" />
                        : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </div>
                {/* Resize handle */}
                <div
                  className="absolute top-0 right-[-4px] w-[9px] h-full cursor-col-resize z-10 group"
                  onMouseDown={(e) => handleResizeStart(index, e)}
                >
                  <div className="absolute top-0 left-[4px] w-[1px] h-full bg-transparent group-hover:bg-[#0078d4]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Rows */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-[#808080]">Loading...</div>
          ) : sortedUsers.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">No users found</div>
          ) : (
            sortedUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => setSelectedRow(user.id)}
                onDoubleClick={() => { setSelectedRow(user.id); openEditDialog(); }}
                className={`flex text-[12px] cursor-pointer border-b border-[#d0d0d0] ${
                  selectedRow === user.id
                    ? "bg-[#0078d4] text-white"
                    : user.isActive
                    ? "bg-white hover:bg-[#f0f8ff]"
                    : "bg-[#f5f5f5] text-[#999] hover:bg-[#eee]"
                }`}
              >
                {/* Avatar */}
                <div className="px-2 py-1 border-r border-[#d0d0d0] flex-shrink-0 flex items-center justify-center" style={{ width: columnWidths[0] }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 bg-[#ccc] rounded-full flex items-center justify-center text-[9px] text-white font-medium">
                      {user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                  )}
                </div>
                {/* Name */}
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 flex items-center gap-1.5" style={{ width: columnWidths[1] }}>
                  {user.name}
                  {user.id === currentId && (
                    <span className="text-[9px] bg-[#e8f4fc] text-[#0066cc] px-1 rounded border border-[#b8daff]">you</span>
                  )}
                </div>
                {/* Email */}
                <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[2] }}>
                  {user.email}
                </div>
                {/* Role */}
                <div className="px-2 py-1 border-r border-[#d0d0d0] flex-shrink-0 flex items-center justify-center" style={{ width: columnWidths[3] }}>
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${
                    selectedRow === user.id ? "bg-white/20 text-white border-white/30" : getRoleBadgeClass(user.role)
                  }`}>
                    {getRoleIcon(user.role)}
                    {user.role}
                  </span>
                </div>
                {/* Status */}
                <div className="px-2 py-1 border-r border-[#d0d0d0] flex-shrink-0 flex items-center justify-center" style={{ width: columnWidths[4] }}>
                  {user.isActive ? (
                    <span className={`text-[10px] font-medium ${selectedRow === user.id ? "text-white" : "text-[#28a745]"}`}>Active</span>
                  ) : (
                    <span className={`text-[10px] font-medium ${selectedRow === user.id ? "text-white" : "text-[#dc3545]"}`}>Inactive</span>
                  )}
                </div>
                {/* Created */}
                <div className="px-2 py-1 truncate flex-shrink-0" style={{ width: columnWidths[5] }}>
                  {formatDate(user.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        <span className="text-[11px] text-[#666]">
          {users.length} user{users.length !== 1 ? "s" : ""} &middot; {users.filter(u => u.isActive).length} active
        </span>
        <span className="text-[11px] text-[#666] flex items-center gap-1">
          Your role: <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${getRoleBadgeClass(currentRole || "User")}`}>
            {getRoleIcon(currentRole || "User")}
            {currentRole || "User"}
          </span>
        </span>
      </div>

      {/* Add User Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70]">
          <div className="bg-[#ece9d8] border border-[#808080] shadow-lg" style={{ width: "400px", fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "11px" }}>
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center justify-between">
              <span className="text-white font-bold text-[12px]">Add New User</span>
              <button onClick={() => setShowAddDialog(false)} className="text-white hover:bg-[#c45c5c] px-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {dialogError && (
                <div className="p-2 bg-red-100 border border-red-300 text-red-700 text-[11px] rounded">{dialogError}</div>
              )}
              <div>
                <label className="block text-[11px] font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                  placeholder="jsmith@nouveauelevator.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                >
                  {availableRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleAdd}
                  disabled={!formName.trim() || !formEmail.trim()}
                  className="px-4 py-1 text-[11px] bg-[#316ac5] text-white border border-[#003c74] hover:bg-[#2a5db0] min-w-[70px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add User
                </button>
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Dialog */}
      {showEditDialog && selectedUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70]">
          <div className="bg-[#ece9d8] border border-[#808080] shadow-lg" style={{ width: "400px", fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "11px" }}>
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center justify-between">
              <span className="text-white font-bold text-[12px]">Edit User</span>
              <button onClick={() => setShowEditDialog(false)} className="text-white hover:bg-[#c45c5c] px-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {dialogError && (
                <div className="p-2 bg-red-100 border border-red-300 text-red-700 text-[11px] rounded">{dialogError}</div>
              )}
              <div className="flex items-center gap-3 pb-2 border-b border-[#c0c0c0]">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 bg-[#ccc] rounded-full flex items-center justify-center text-[11px] text-white font-medium">
                    {selectedUser.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div>
                  <div className="text-[12px] font-medium">{selectedUser.email}</div>
                  <div className="text-[10px] text-[#666]">ID: {selectedUser.id}</div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white"
                  disabled={selectedUser.role === "GodAdmin" && !isGodAdmin}
                >
                  {availableRoles.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium">Status:</label>
                <button
                  onClick={() => handleToggleActive(selectedUser)}
                  disabled={selectedUser.id === currentId}
                  className={`px-2 py-0.5 text-[10px] rounded border font-medium ${
                    selectedUser.isActive
                      ? "bg-[#d4edda] text-[#155724] border-[#c3e6cb] hover:bg-[#c3e6cb]"
                      : "bg-[#f8d7da] text-[#721c24] border-[#f5c6cb] hover:bg-[#f5c6cb]"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {selectedUser.isActive ? "Active — Click to Deactivate" : "Inactive — Click to Activate"}
                </button>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleEdit}
                  disabled={!formName.trim()}
                  className="px-4 py-1 text-[11px] bg-[#316ac5] text-white border border-[#003c74] hover:bg-[#2a5db0] min-w-[70px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowEditDialog(false)}
                  className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70]">
          <div className="bg-[#ece9d8] border border-[#808080] shadow-lg" style={{ width: "360px", fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "11px" }}>
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center justify-between">
              <span className="text-white font-bold text-[12px]">Confirm Delete</span>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-white hover:bg-[#c45c5c] px-1 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              {dialogError && (
                <div className="p-2 mb-3 bg-red-100 border border-red-300 text-red-700 text-[11px] rounded">{dialogError}</div>
              )}
              <div className="flex items-start gap-3 mb-4">
                <Trash2 className="w-5 h-5 text-[#c45c5c] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] mb-1">
                    Permanently delete user <strong>{selectedUser.name}</strong>?
                  </p>
                  <p className="text-[10px] text-[#666]">{selectedUser.email}</p>
                  <p className="text-[10px] text-[#c45c5c] mt-1">This permanently erases the user and all their data. This cannot be undone.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleDelete}
                  className="px-4 py-1 text-[11px] bg-[#c45c5c] text-white border border-[#a03030] hover:bg-[#b04040] min-w-[70px]"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]"
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
