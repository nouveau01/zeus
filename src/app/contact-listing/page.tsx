"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Pencil,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";
import { usePermissions } from "@/context/PermissionsContext";
import { useXPDialog } from "@/components/ui/XPDialog";

interface ContactRow {
  id: string;
  name: string;
  title: string | null;
  phone: string | null;
  fax: string | null;
  mobile: string | null;
  email: string | null;
  inv: boolean;
  es: boolean;
  customerId: string;
  customerName: string;
}

type SortField = "name" | "title" | "customerName" | "phone" | "email" | "mobile" | "inv" | "es";
type SortDirection = "asc" | "desc";

const columns: { field: SortField; label: string; width: number }[] = [
  { field: "name", label: "Name", width: 200 },
  { field: "title", label: "Title", width: 150 },
  { field: "customerName", label: "Customer", width: 160 },
  { field: "phone", label: "Phone", width: 120 },
  { field: "email", label: "Email", width: 200 },
  { field: "mobile", label: "Mobile", width: 120 },
  { field: "inv", label: "Inv", width: 50 },
  { field: "es", label: "ES", width: 50 },
];

export default function ContactListingPage() {
  const { openTab } = useTabs();
  const { isFieldAllowed } = usePermissions();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [columnWidths, setColumnWidths] = useState<number[]>(columns.map((c) => c.width));

  const handleResizeStart = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = columnWidths[index];
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(30, startWidth + diff);
      setColumnWidths((prev) => {
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

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleDoubleClick = (contact: ContactRow) => {
    openTab(contact.name || "Contact", `/contact-listing/${contact.id}`);
  };

  const handleNew = () => {
    openTab("New Contact", "/contact-listing/new");
  };

  const handleEdit = () => {
    if (selectedRow) {
      const contact = contacts.find((c) => c.id === selectedRow);
      if (contact) openTab(contact.name || "Contact", `/contact-listing/${contact.id}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedRow) return;
    const contact = contacts.find((c) => c.id === selectedRow);
    if (!contact) return;
    if (!(await xpConfirm(`Delete contact "${contact.name}"?`))) return;
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      if (res.ok) {
        await xpAlert(`Contact "${contact.name}" deleted successfully.`);
        setSelectedRow(null);
        fetchContacts();
      } else {
        await xpAlert("Failed to delete contact.");
      }
    } catch {
      await xpAlert("Failed to delete contact.");
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleCustomerClick = (contact: ContactRow, e: React.MouseEvent) => {
    e.stopPropagation();
    if (contact.customerId) openTab(contact.customerName, `/customers/${contact.customerId}`);
  };

  // Filter
  const filtered = contacts.filter((c) => {
    if (searchTerm === "") return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      (c.title || "").toLowerCase().includes(term) ||
      c.customerName.toLowerCase().includes(term) ||
      (c.phone || "").toLowerCase().includes(term) ||
      (c.email || "").toLowerCase().includes(term) ||
      (c.mobile || "").toLowerCase().includes(term)
    );
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;
    switch (sortField) {
      case "inv":
        aVal = a.inv ? 1 : 0;
        bVal = b.inv ? 1 : 0;
        break;
      case "es":
        aVal = a.es ? 1 : 0;
        bVal = b.es ? 1 : 0;
        break;
      default:
        aVal = ((a as any)[sortField] || "").toString().toLowerCase();
        bVal = ((b as any)[sortField] || "").toString().toLowerCase();
    }
    if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-gray-400" />;
    return sortDirection === "asc" ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  const getCellValue = (contact: ContactRow, field: SortField) => {
    switch (field) {
      case "customerName":
        return (
          <span
            className={selectedRow !== contact.id && contact.customerId ? "text-[#0000ff] cursor-pointer hover:underline" : ""}
            onClick={(e) => selectedRow !== contact.id && handleCustomerClick(contact, e)}
          >
            {contact.customerName}
          </span>
        );
      case "inv":
        return contact.inv ? "Y" : "";
      case "es":
        return contact.es ? "Y" : "";
      default:
        return (contact as any)[field] || "";
    }
  };

  return (
    <div className="h-full flex flex-col bg-white" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">View</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-white flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button onClick={handleNew} className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="New Contact">
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button onClick={handleEdit} disabled={!selectedRow} className={`w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] ${!selectedRow ? "opacity-50" : ""}`} title="Edit">
          <Pencil className="w-4 h-4" style={{ color: "#d4a574" }} />
        </button>
        <button onClick={handleDelete} disabled={!selectedRow} className={`w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] ${!selectedRow ? "opacity-50" : ""}`} title="Delete">
          <X className="w-4 h-4" style={{ color: "#c45c5c" }} />
        </button>
        <button onClick={fetchContacts} className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]" title="Refresh">
          <RefreshCw className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>

        <div className="ml-4 flex items-center gap-2">
          <span className="text-[11px]">Search:</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Name, customer, email..."
            className="border border-[#c0c0c0] px-2 py-0.5 text-[11px] w-[200px] rounded"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 bg-white border border-[#a0a0a0] mx-2 mb-2 mt-2 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex bg-[#f0f0f0] border-b border-[#999] text-[12px] font-medium">
          {columns.map((col, index) => {
            if (!isFieldAllowed("contacts", col.field)) return null;
            return (
              <div
                key={col.field}
                className="relative flex items-center px-2 py-1.5 border-r border-[#c0c0c0] cursor-pointer hover:bg-[#e0e0e0] select-none"
                style={{ width: columnWidths[index], minWidth: columnWidths[index] }}
                onClick={() => handleSort(col.field)}
              >
                <div className={`flex items-center gap-1 ${col.field === "inv" || col.field === "es" ? "mx-auto" : ""}`}>
                  {col.label}
                  <SortIcon field={col.field} />
                </div>
                {/* Resize handle */}
                <div
                  className="absolute top-0 right-[-4px] w-[9px] h-full cursor-col-resize z-10 group"
                  onMouseDown={(e) => { e.stopPropagation(); handleResizeStart(index, e); }}
                >
                  <div className="absolute top-0 left-[4px] w-[1px] h-full bg-transparent group-hover:bg-[#0078d4]" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Rows */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-[#808080]">Loading...</div>
          ) : sorted.length === 0 ? (
            <div className="p-4 text-center text-[#808080]">No contacts found</div>
          ) : (
            sorted.map((contact) => (
              <div
                key={contact.id}
                onClick={() => setSelectedRow(contact.id)}
                onDoubleClick={() => handleDoubleClick(contact)}
                className={`flex text-[12px] cursor-pointer border-b border-[#e0e0e0] ${
                  selectedRow === contact.id ? "bg-[#0078d4] text-white" : "bg-white hover:bg-[#f0f8ff]"
                }`}
              >
                {columns.map((col, index) => {
                  if (!isFieldAllowed("contacts", col.field)) return null;
                  return (
                    <div
                      key={col.field}
                      className={`px-2 py-1 border-r border-[#e0e0e0] truncate ${col.field === "inv" || col.field === "es" ? "text-center" : ""} ${col.field === "name" ? "font-medium" : ""}`}
                      style={{ width: columnWidths[index], minWidth: columnWidths[index] }}
                    >
                      {getCellValue(contact, col.field)}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-[#d0d0d0] px-2 py-1.5 flex items-center justify-between">
        <div className="text-[11px] text-[#333]">
          <strong>Count:</strong> {sorted.length}
        </div>
      </div>
      <XPDialogComponent />
    </div>
  );
}
