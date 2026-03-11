"use client";

import { useState, useEffect, useMemo } from "react";
import {
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
  ArrowLeft,
  Building2,
  Save,
  Mail,
  Calendar,
  Search,
  Phone,
  Clock,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useOffices } from "@/context/OfficesContext";
import { useXPDialog } from "@/components/ui/XPDialog";
import { KeyRound } from "lucide-react";

// ============================================
// TYPES
// ============================================

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  title: string | null;
  department: string | null;
  phone: string | null;
  extension: string | null;
  lastLogin: string | null;
  isActive: boolean;
  primaryOfficeId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OfficeRecord {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

type SortField = "name" | "email" | "role" | "title" | "department" | "office" | "isActive" | "lastLogin";
type SortDirection = "asc" | "desc";

// ============================================
// MAIN COMPONENT
// ============================================

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
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dialogError, setDialogError] = useState("");

  // Add form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("User");

  const { offices } = useOffices();

  // Build office lookup map
  const officeMap = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    offices.forEach(o => map.set(o.id, { code: o.code, name: o.name }));
    return map;
  }, [offices]);

  // Column widths: avatar, name, email, title, department, office, role, status, last login
  const [columnWidths, setColumnWidths] = useState<number[]>([40, 170, 240, 140, 120, 110, 90, 70, 130]);

  const columns: { field: SortField | null; label: string; sortable: boolean }[] = [
    { field: null, label: "", sortable: false },
    { field: "name", label: "Name", sortable: true },
    { field: "email", label: "Email", sortable: true },
    { field: "title", label: "Title", sortable: true },
    { field: "department", label: "Department", sortable: true },
    { field: "office", label: "Office", sortable: true },
    { field: "role", label: "Role", sortable: true },
    { field: "isActive", label: "Status", sortable: true },
    { field: "lastLogin", label: "Last Login", sortable: true },
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsers(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.title && u.title.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const getOfficeCode = (user: UserRecord) => {
    if (!user.primaryOfficeId) return "";
    return officeMap.get(user.primaryOfficeId)?.code || "";
  };

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aVal: string;
      let bVal: string;
      switch (sortField) {
        case "name": aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
        case "email": aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase(); break;
        case "title": aVal = (a.title || "").toLowerCase(); bVal = (b.title || "").toLowerCase(); break;
        case "department": aVal = (a.department || "").toLowerCase(); bVal = (b.department || "").toLowerCase(); break;
        case "office": aVal = getOfficeCode(a).toLowerCase(); bVal = getOfficeCode(b).toLowerCase(); break;
        case "role": aVal = a.role; bVal = b.role; break;
        case "isActive": aVal = a.isActive ? "active" : "inactive"; bVal = b.isActive ? "active" : "inactive"; break;
        case "lastLogin": aVal = a.lastLogin || ""; bVal = b.lastLogin || ""; break;
        default: return 0;
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredUsers, sortField, sortDirection, officeMap]);

  const handleResizeStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[index];
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      setColumnWidths(prev => { const u = [...prev]; u[index] = Math.max(40, startWidth + diff); return u; });
    };
    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // GodAdmin displays as "Admin" everywhere in the UI
  const getDisplayRole = (role: string) => role === "GodAdmin" ? "Admin" : role;

  const getRoleIcon = (role: string) => {
    switch (getDisplayRole(role)) {
      case "Admin": return <Shield className="w-3.5 h-3.5 text-[#316ac5]" />;
      default: return <User className="w-3.5 h-3.5 text-[#666]" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (getDisplayRole(role)) {
      case "Admin": return "bg-[#cce5ff] text-[#004085] border-[#b8daff]";
      default: return "bg-[#f0f0f0] text-[#333] border-[#ccc]";
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  // Add user — GodAdmin is never an option
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

  const handleToggleActive = async (user: UserRecord) => {
    try {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
      });
      fetchUsers();
    } catch {}
  };

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
        setDialogError(data.error || "Failed to delete");
      }
    } catch {
      setDialogError("Network error");
    }
  };

  const openAddDialog = () => {
    setFormName(""); setFormEmail(""); setFormRole("User");
    setDialogError("");
    setShowAddDialog(true);
  };

  const selectedUser = users.find(u => u.id === selectedRow);
  const viewingUser = users.find(u => u.id === viewingUserId);

  // ============================================
  // DETAIL VIEW
  // ============================================

  if (viewingUserId && viewingUser) {
    return (
      <UserDetailView
        user={viewingUser}
        currentId={currentId}
        isGodAdmin={isGodAdmin}
        offices={offices}
        getRoleIcon={getRoleIcon}
        getRoleBadgeClass={getRoleBadgeClass}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        onBack={() => { setViewingUserId(null); fetchUsers(); }}
        onRefresh={fetchUsers}
      />
    );
  }

  // ============================================
  // LIST VIEW
  // ============================================

  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px]" onClick={openAddDialog}>
          <UserPlus className="w-4 h-4 text-[#4a7c59]" />
          Add User
        </button>
        <button
          className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => selectedRow && setViewingUserId(selectedRow)}
          disabled={!selectedRow}
        >
          <Pencil className="w-4 h-4 text-[#d4a574]" />
          Open Profile
        </button>
        <button
          className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
          onClick={() => selectedRow && selectedUser && selectedRow !== currentId && handleToggleActive(selectedUser)}
          disabled={!selectedRow || selectedRow === currentId || (selectedUser?.role === "GodAdmin" && !isGodAdmin)}
        >
          {selectedUser?.isActive ? <><Ban className="w-4 h-4 text-[#e67e22]" />Deactivate</> : <><Check className="w-4 h-4 text-[#28a745]" />Activate</>}
        </button>
        {isGodAdmin && (
          <button
            className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => selectedRow && selectedRow !== currentId && setShowDeleteConfirm(true)}
            disabled={!selectedRow || selectedRow === currentId}
          >
            <Trash2 className="w-4 h-4 text-[#c45c5c]" />
            Delete
          </button>
        )}
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="h-[26px] flex items-center gap-1 px-2 hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] text-[11px]" onClick={fetchUsers}>
          <RefreshCw className="w-4 h-4 text-[#e67e22]" />
          Refresh
        </button>

        {/* Search */}
        <div className="ml-auto flex items-center">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="h-[26px] pl-7 pr-2 w-[200px] border border-[#a0a0a0] text-[11px] bg-white rounded focus:outline-none focus:border-[#0078d4]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#333]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 bg-white border border-[#a0a0a0] mx-2 mb-2 mt-2 flex flex-col overflow-hidden">
        {/* Headers */}
        <div className="bg-[#f0f0f0] border-b border-[#c0c0c0] flex-shrink-0">
          <div className="flex text-[12px]">
            {columns.map((col, index) => (
              <div key={col.label || index} className="relative flex-shrink-0 border-r border-[#c0c0c0] last:border-r-0" style={{ width: columnWidths[index] }}>
                <div
                  className={`px-2 py-1.5 font-medium text-[#333] select-none text-center truncate ${col.sortable ? "cursor-pointer hover:bg-[#e0e0e0]" : ""}`}
                  onClick={() => col.sortable && col.field && handleSort(col.field)}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span className="truncate">{col.label}</span>
                    {col.sortable && col.field && sortField === col.field && (
                      sortDirection === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </div>
                <div className="absolute top-0 right-[-4px] w-[9px] h-full cursor-col-resize z-10 group" onMouseDown={(e) => handleResizeStart(index, e)}>
                  <div className="absolute top-0 left-[4px] w-[1px] h-full bg-transparent group-hover:bg-[#0078d4]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-[#808080]">Loading...</div>
          ) : sortedUsers.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">
              {searchQuery ? "No users match your search" : "No users found"}
            </div>
          ) : (
            sortedUsers.map((user) => {
              const isSelected = selectedRow === user.id;
              const officeCode = getOfficeCode(user);
              return (
                <div
                  key={user.id}
                  onClick={() => setSelectedRow(user.id)}
                  onDoubleClick={() => { setSelectedRow(user.id); setViewingUserId(user.id); }}
                  className={`flex text-[12px] cursor-pointer border-b border-[#d0d0d0] ${
                    isSelected ? "bg-[#0078d4] text-white" : user.isActive ? "bg-white hover:bg-[#f0f8ff]" : "bg-[#f5f5f5] text-[#999] hover:bg-[#eee]"
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
                    {user.id === currentId && <span className="text-[9px] bg-[#e8f4fc] text-[#0066cc] px-1 rounded border border-[#b8daff]">you</span>}
                  </div>
                  {/* Email */}
                  <div className="px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0" style={{ width: columnWidths[2] }}>{user.email}</div>
                  {/* Title */}
                  <div className={`px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 ${!user.title && !isSelected ? "text-[#bbb]" : ""}`} style={{ width: columnWidths[3] }}>
                    {user.title || "—"}
                  </div>
                  {/* Department */}
                  <div className={`px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 ${!user.department && !isSelected ? "text-[#bbb]" : ""}`} style={{ width: columnWidths[4] }}>
                    {user.department || "—"}
                  </div>
                  {/* Office */}
                  <div className={`px-2 py-1 border-r border-[#d0d0d0] truncate flex-shrink-0 ${!officeCode && !isSelected ? "text-[#bbb]" : ""}`} style={{ width: columnWidths[5] }}>
                    {officeCode || "—"}
                  </div>
                  {/* Role */}
                  <div className="px-2 py-1 border-r border-[#d0d0d0] flex-shrink-0 flex items-center justify-center" style={{ width: columnWidths[6] }}>
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${isSelected ? "bg-white/20 text-white border-white/30" : getRoleBadgeClass(user.role)}`}>
                      {getRoleIcon(user.role)} {getDisplayRole(user.role)}
                    </span>
                  </div>
                  {/* Status */}
                  <div className="px-2 py-1 border-r border-[#d0d0d0] flex-shrink-0 flex items-center justify-center" style={{ width: columnWidths[7] }}>
                    {user.isActive ? (
                      <span className={`text-[10px] font-medium ${isSelected ? "text-white" : "text-[#28a745]"}`}>Active</span>
                    ) : (
                      <span className={`text-[10px] font-medium ${isSelected ? "text-white" : "text-[#dc3545]"}`}>Inactive</span>
                    )}
                  </div>
                  {/* Last Login */}
                  <div className={`px-2 py-1 truncate flex-shrink-0 text-[11px] ${!user.lastLogin && !isSelected ? "text-[#bbb]" : ""}`} style={{ width: columnWidths[8] }}>
                    {user.lastLogin ? formatDateTime(user.lastLogin) : "Never"}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        <span className="text-[11px] text-[#666]">
          {filteredUsers.length === users.length
            ? <>{users.length} user{users.length !== 1 ? "s" : ""} &middot; {users.filter(u => u.isActive).length} active</>
            : <>{filteredUsers.length} of {users.length} users shown</>
          }
        </span>
        <span className="text-[11px] text-[#666] flex items-center gap-1">
          Your role: <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium ${getRoleBadgeClass(currentRole || "User")}`}>
            {getRoleIcon(currentRole || "User")} {currentRole || "User"}
          </span>
        </span>
      </div>

      {/* Add User Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[70]">
          <div className="bg-[#ece9d8] border border-[#808080] shadow-lg" style={{ width: "400px", fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "11px" }}>
            <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] px-2 py-1 flex items-center justify-between">
              <span className="text-white font-bold text-[12px]">Add New User</span>
              <button onClick={() => setShowAddDialog(false)} className="text-white hover:bg-[#c45c5c] px-1 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              {dialogError && <div className="p-2 bg-red-100 border border-red-300 text-red-700 text-[11px] rounded">{dialogError}</div>}
              <div>
                <label className="block text-[11px] font-medium mb-1">Full Name</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white" placeholder="John Smith" />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Email</label>
                <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white" placeholder="jsmith@nouveauelevator.com" />
              </div>
              <div>
                <label className="block text-[11px] font-medium mb-1">Role</label>
                <select value={formRole} onChange={(e) => setFormRole(e.target.value)} className="w-full px-2 py-1 border border-[#a0a0a0] text-[11px] bg-white">
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={handleAdd} disabled={!formName.trim() || !formEmail.trim()} className="px-4 py-1 text-[11px] bg-[#316ac5] text-white border border-[#003c74] hover:bg-[#2a5db0] min-w-[70px] disabled:opacity-50 disabled:cursor-not-allowed">Add User</button>
                <button onClick={() => setShowAddDialog(false)} className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]">Cancel</button>
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
              <button onClick={() => setShowDeleteConfirm(false)} className="text-white hover:bg-[#c45c5c] px-1 rounded"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4">
              {dialogError && <div className="p-2 mb-3 bg-red-100 border border-red-300 text-red-700 text-[11px] rounded">{dialogError}</div>}
              <div className="flex items-start gap-3 mb-4">
                <Trash2 className="w-5 h-5 text-[#c45c5c] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[12px] mb-1">Permanently delete user <strong>{selectedUser.name}</strong>?</p>
                  <p className="text-[10px] text-[#666]">{selectedUser.email}</p>
                  <p className="text-[10px] text-[#c45c5c] mt-1">This permanently erases the user and all their data. This cannot be undone.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={handleDelete} className="px-4 py-1 text-[11px] bg-[#c45c5c] text-white border border-[#a03030] hover:bg-[#b04040] min-w-[70px]">Delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-1 text-[11px] bg-[#e0e0e0] border border-[#808080] hover:bg-[#d0d0d0] min-w-[70px]">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// USER DETAIL / PROFILE VIEW
// ============================================

function UserDetailView({
  user,
  currentId,
  isGodAdmin,
  offices,
  getRoleIcon,
  getRoleBadgeClass,
  formatDate,
  formatDateTime,
  onBack,
  onRefresh,
}: {
  user: UserRecord;
  currentId: string;
  isGodAdmin: boolean;
  offices: { id: string; code: string; name: string }[];
  getRoleIcon: (role: string) => React.ReactNode;
  getRoleBadgeClass: (role: string) => string;
  formatDate: (d: string) => string;
  formatDateTime: (d: string | null) => string;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [editName, setEditName] = useState(user.name);
  const [editRole, setEditRole] = useState(user.role);
  const [editTitle, setEditTitle] = useState(user.title || "");
  const [editDepartment, setEditDepartment] = useState(user.department || "");
  const [editPhone, setEditPhone] = useState(user.phone || "");
  const [editExtension, setEditExtension] = useState(user.extension || "");
  const [editPrimaryOffice, setEditPrimaryOffice] = useState(user.primaryOfficeId || "");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [allOffices, setAllOffices] = useState<OfficeRecord[]>([]);
  const [userOfficeIds, setUserOfficeIds] = useState<string[]>([]);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [savingOffice, setSavingOffice] = useState(false);
  const [authMode, setAuthMode] = useState<string>("");
  const [sendingReset, setSendingReset] = useState(false);
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();

  // Fetch auth mode for conditional UI
  useEffect(() => {
    fetch("/api/auth-mode")
      .then((r) => r.json())
      .then((d) => setAuthMode(d.mode || ""))
      .catch(() => {});
  }, []);

  const isSelf = user.id === currentId;
  const isUserGodAdmin = false; // GodAdmin role is never revealed in UI

  // Fetch all offices and user's office assignments
  useEffect(() => {
    const fetchOfficeData = async () => {
      setLoadingOffices(true);
      try {
        const [officesRes, accessRes] = await Promise.all([
          fetch("/api/offices"),
          fetch("/api/offices/user-access"),
        ]);
        if (officesRes.ok) {
          const data = await officesRes.json();
          setAllOffices(data);
        }
        if (accessRes.ok) {
          const usersData = await accessRes.json();
          const thisUser = usersData.find((u: any) => u.id === user.id);
          if (thisUser) {
            setUserOfficeIds(thisUser.officeIds || []);
          }
        }
      } catch {} finally {
        setLoadingOffices(false);
      }
    };
    fetchOfficeData();
  }, [user.id]);

  const activeOffices = allOffices.filter((o) => o.isActive);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: editName,
          role: editRole,
          title: editTitle,
          department: editDepartment,
          phone: editPhone,
          extension: editExtension,
          primaryOfficeId: editPrimaryOffice || null,
        }),
      });
      if (res.ok) {
        setSaveMessage("Saved");
        onRefresh();
        setTimeout(() => setSaveMessage(""), 2000);
      } else {
        const data = await res.json();
        setSaveMessage(data.error || "Failed to save");
      }
    } catch {
      setSaveMessage("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    const confirmed = await xpConfirm(`Send a temporary password to ${user.email}?`);
    if (!confirmed) return;

    setSendingReset(true);
    try {
      const res = await fetch("/api/users/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.emailSent) {
          await xpAlert(`Temporary password sent to ${user.email}. They will be prompted to set a new password on login.`);
        } else {
          // Email failed — show temp password for manual sharing
          await xpAlert(`Email could not be sent. Share this temporary password manually:\n\n${data.tempPassword}\n\nThe user will be prompted to change it on first login.`);
        }
      } else {
        await xpAlert(data.error || "Failed to send password reset.");
      }
    } catch {
      await xpAlert("Network error. Please try again.");
    } finally {
      setSendingReset(false);
    }
  };

  const toggleOffice = async (officeId: string) => {
    const newIds = userOfficeIds.includes(officeId)
      ? userOfficeIds.filter((id) => id !== officeId)
      : [...userOfficeIds, officeId];

    // Optimistic update
    setUserOfficeIds(newIds);
    setSavingOffice(true);

    try {
      await fetch("/api/offices/user-access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, officeIds: newIds }),
      });
    } catch {
      // Revert on error
      setUserOfficeIds(userOfficeIds);
    } finally {
      setSavingOffice(false);
    }
  };

  const toggleAllOffices = async () => {
    const allAssigned = activeOffices.every((o) => userOfficeIds.includes(o.id));
    const newIds = allAssigned ? [] : activeOffices.map((o) => o.id);

    setUserOfficeIds(newIds);
    setSavingOffice(true);

    try {
      await fetch("/api/offices/user-access", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, officeIds: newIds }),
      });
    } catch {
      setUserOfficeIds(userOfficeIds);
    } finally {
      setSavingOffice(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-auto" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      <XPDialogComponent />
      {/* Back bar */}
      <div className="bg-white flex items-center px-3 py-2 border-b border-[#d0d0d0] gap-2 flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#0078d4] hover:text-[#005a9e] text-[12px] font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Profile Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] border-b border-[#d0d0d0]">
          <div className="flex items-center gap-4">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-16 h-16 rounded-full border-2 border-white shadow" />
            ) : (
              <div className="w-16 h-16 bg-[#1a73e8] rounded-full flex items-center justify-center text-white text-xl font-semibold border-2 border-white shadow">
                {user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
            )}
            <div>
              <h2 className="text-[18px] font-bold text-[#333]">{user.name}</h2>
              {(user.title || user.department) && (
                <div className="text-[13px] text-[#555] mt-0.5">
                  {user.title}{user.title && user.department ? " — " : ""}{user.department}
                </div>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                <Mail className="w-3.5 h-3.5 text-[#888]" />
                <span className="text-[13px] text-[#666]">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] font-medium ${getRoleBadgeClass(user.role)}`}>
                  {getRoleIcon(user.role)} {user.role === "GodAdmin" ? "Admin" : user.role}
                </span>
                {user.isActive ? (
                  <span className="text-[11px] font-medium text-[#28a745]">Active</span>
                ) : (
                  <span className="text-[11px] font-medium text-[#dc3545]">Inactive</span>
                )}
                {isSelf && <span className="text-[10px] bg-[#e8f4fc] text-[#0066cc] px-1.5 py-0.5 rounded border border-[#b8daff]">you</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Details Section */}
          <div className="border border-[#d0d0d0] rounded">
            <div className="px-4 py-2 bg-[#f5f5f5] border-b border-[#d0d0d0] flex items-center justify-between">
              <span className="font-semibold text-[12px] text-[#333]">Profile Details</span>
              <div className="flex items-center gap-2">
                {saveMessage && (
                  <span className={`text-[11px] ${saveMessage === "Saved" ? "text-[#28a745]" : "text-[#dc3545]"}`}>
                    {saveMessage}
                  </span>
                )}
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1 text-[11px] bg-[#316ac5] text-white border border-[#003c74] hover:bg-[#2a5db0] rounded disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-[#666] mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#666] mb-1">Email</label>
                <input
                  type="text"
                  value={user.email}
                  disabled
                  className="w-full px-2 py-1.5 border border-[#d0d0d0] text-[12px] bg-[#f5f5f5] rounded text-[#888]"
                />
                <div className="text-[10px] text-[#aaa] mt-0.5">
                  {authMode === "manual" ? "Used for email/password login" : "Managed by Google OAuth"}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#666] mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
                  placeholder="e.g. Service Manager"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#666] mb-1">Department</label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
                  placeholder="e.g. Operations"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#666] mb-1">Phone</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
                  placeholder="e.g. (212) 555-1234"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#666] mb-1">Extension</label>
                <input
                  type="text"
                  value={editExtension}
                  onChange={(e) => setEditExtension(e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
                  placeholder="e.g. 4201"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#666] mb-1">Role</label>
                {isUserGodAdmin ? (
                  <div className="px-2 py-1.5 border border-[#d0d0d0] text-[12px] bg-[#fff8e1] rounded text-[#856404] font-medium">
                    GodAdmin (permanent)
                  </div>
                ) : (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
                  >
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#666] mb-1">Home Office</label>
                <select
                  value={editPrimaryOffice}
                  onChange={(e) => setEditPrimaryOffice(e.target.value)}
                  className="w-full px-2 py-1.5 border border-[#a0a0a0] text-[12px] bg-white rounded"
                >
                  <option value="">-- None --</option>
                  {offices.map(o => (
                    <option key={o.id} value={o.id}>{o.code} — {o.name}</option>
                  ))}
                </select>
                <div className="text-[10px] text-[#aaa] mt-0.5">Default office filter when this user logs in</div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#666] mb-1">Created</label>
                <div className="flex items-center gap-1.5 px-2 py-1.5 border border-[#d0d0d0] text-[12px] bg-[#f5f5f5] rounded text-[#888]">
                  <Calendar className="w-3 h-3" />
                  {formatDate(user.createdAt)}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#666] mb-1">Last Login</label>
                <div className="flex items-center gap-1.5 px-2 py-1.5 border border-[#d0d0d0] text-[12px] bg-[#f5f5f5] rounded text-[#888]">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(user.lastLogin)}
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-[#666] mb-1">Status</label>
                {isSelf ? (
                  <div className="px-2 py-1.5 border border-[#d0d0d0] text-[12px] bg-[#f5f5f5] rounded text-[#888]">
                    Active (cannot deactivate yourself)
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      fetch("/api/users", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: user.id, isActive: !user.isActive }),
                      }).then(() => onBack());
                    }}
                    className={`w-full px-2 py-1.5 text-[12px] rounded border font-medium text-left ${
                      user.isActive
                        ? "bg-[#d4edda] text-[#155724] border-[#c3e6cb] hover:bg-[#c3e6cb]"
                        : "bg-[#f8d7da] text-[#721c24] border-[#f5c6cb] hover:bg-[#f5c6cb]"
                    }`}
                  >
                    {user.isActive ? "Active — Click to Deactivate" : "Inactive — Click to Activate"}
                  </button>
                )}
              </div>

              {/* Send Password Reset — only in manual auth mode */}
              {authMode === "manual" && !isSelf && (
                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-[#666] mb-1">Password Credentials</label>
                  <button
                    onClick={handleSendPasswordReset}
                    disabled={sendingReset || !user.isActive}
                    className="flex items-center gap-2 px-3 py-1.5 text-[12px] bg-[#f0f0f0] border border-[#a0a0a0] rounded hover:bg-[#e0e0e0] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {sendingReset ? "Sending..." : "Send Password Reset"}
                  </button>
                  <div className="text-[10px] text-[#aaa] mt-0.5">
                    Generates a temporary password and emails it to this user.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Office Access Section */}
          <div className="border border-[#d0d0d0] rounded">
            <div className="px-4 py-2 bg-[#f5f5f5] border-b border-[#d0d0d0] flex items-center justify-between">
              <span className="font-semibold text-[12px] text-[#333] flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Office Access
              </span>
              {savingOffice && <span className="text-[10px] text-[#888]">Saving...</span>}
            </div>

            {isUserGodAdmin ? (
              <div className="p-4 text-[12px] text-[#666] bg-[#fff8e1]">
                GodAdmin has automatic access to all offices. No configuration needed.
              </div>
            ) : loadingOffices ? (
              <div className="p-4 text-[12px] text-[#888]">Loading offices...</div>
            ) : activeOffices.length === 0 ? (
              <div className="p-4 text-[12px] text-[#888]">No offices configured. Create offices in the Offices section first.</div>
            ) : (
              <div className="p-4">
                <div className="text-[11px] text-[#666] mb-3">
                  Select which offices this user can access. They will only see data from checked offices.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Select All */}
                  <label className="col-span-2 flex items-center gap-2 px-3 py-2 border border-[#d0d0d0] rounded bg-[#f8f9fa] cursor-pointer hover:bg-[#e9ecef]">
                    <input
                      type="checkbox"
                      checked={activeOffices.every((o) => userOfficeIds.includes(o.id))}
                      onChange={toggleAllOffices}
                      className="cursor-pointer"
                    />
                    <span className="text-[12px] font-semibold text-[#333]">All Offices</span>
                  </label>

                  {activeOffices.map((office) => (
                    <label
                      key={office.id}
                      className={`flex items-center gap-2 px-3 py-2 border rounded cursor-pointer transition-colors ${
                        userOfficeIds.includes(office.id)
                          ? "border-[#1a73e8] bg-[#e8f0fe]"
                          : "border-[#d0d0d0] bg-white hover:bg-[#f5f5f5]"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={userOfficeIds.includes(office.id)}
                        onChange={() => toggleOffice(office.id)}
                        className="cursor-pointer"
                      />
                      <span className="font-mono text-[11px] font-medium text-[#333]">{office.code}</span>
                      <span className="text-[11px] text-[#666] truncate">{office.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
