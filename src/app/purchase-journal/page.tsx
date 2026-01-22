"use client";

import { useState, useEffect } from "react";
import { useTabs } from "@/context/TabContext";
import {
  FileText,
  Pencil,
  Trash2,
  X,
  Filter,
  Scissors,
  Check,
  Printer,
  Grid3X3,
  Plus,
  Home,
  HelpCircle,
} from "lucide-react";

interface JournalEntry {
  id: string;
  date: string;
  ref: string;
  desc: string;
  vendorId: string;
  vendorName: string;
  status: "Open" | "Closed";
  amount: number;
  remaining: number;
  poNumber: string;
  invoiceDate: string;
}

interface NewEntryForm {
  date: string;
  ref: string;
  desc: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  poNumber: string;
}

export default function PurchaseJournalPage() {
  const { openTab } = useTabs();
  const [catalogue, setCatalogue] = useState("None");

  // Date filters
  const [postingStartDate, setPostingStartDate] = useState("2026-01-18");
  const [postingEndDate, setPostingEndDate] = useState("2026-01-24");
  const [invoiceStartDate, setInvoiceStartDate] = useState("2026-01-01");
  const [invoiceEndDate, setInvoiceEndDate] = useState("2026-01-31");

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTotals1, setShowTotals1] = useState(false);
  const [showTotals2, setShowTotals2] = useState(false);
  const [showNewEntryDialog, setShowNewEntryDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newEntry, setNewEntry] = useState<NewEntryForm>({
    date: new Date().toISOString().split("T")[0],
    ref: "",
    desc: "",
    vendorId: "",
    vendorName: "",
    amount: 0,
    poNumber: "",
  });

  // Mock vendors
  const vendors = [
    { id: "1", name: "JOINT EMPLOYMENT OFFICE" },
    { id: "2", name: "TREASURER STATE OF N.J." },
    { id: "3", name: "VERIZON" },
    { id: "4", name: "AMS RISK MANAGEMENT & CONSULTING" },
    { id: "5", name: "GRACIE SQUARE HOSPITAL" },
    { id: "6", name: "CORNELL CLUB OF N.Y." },
    { id: "7", name: "DANIEL E. SMITH" },
    { id: "8", name: "SAMSARA INC" },
    { id: "9", name: "CENTURY INDUSTRIAL SUPPLY NY LLC" },
    { id: "10", name: "MOTION AI" },
    { id: "11", name: "GLEASON PAINTS" },
    { id: "12", name: "MIDTOWN ELECTRIC SUPPLY" },
    { id: "13", name: "WAYLAND LLC" },
    { id: "14", name: "GRAINGER" },
    { id: "15", name: "A & D ENTRANCES INC" },
    { id: "16", name: "TRI-CITY WASTE OIL CORP." },
    { id: "17", name: "BSIS, INC" },
    { id: "18", name: "PAUL R. OTTO" },
    { id: "19", name: "VANTAGE ELEVATION LLC" },
    { id: "20", name: "EIC, INC" },
    { id: "21", name: "ZO AIR" },
    { id: "22", name: "WESCO DISTRIBUTION INC." },
    { id: "23", name: "TANNER BOLT & NUT, INC" },
  ];

  // Mock data matching the screenshot
  const mockEntries: JournalEntry[] = [
    { id: "1", date: "2026-01-20", ref: "Apprentice", desc: "Apprentice", vendorId: "1", vendorName: "JOINT EMPLOYMENT OFFICE", status: "Closed", amount: 100.00, remaining: 0.00, poNumber: "0", invoiceDate: "2026-01-20" },
    { id: "2", date: "2026-01-20", ref: "Permit", desc: "Jack Permit", vendorId: "2", vendorName: "TREASURER STATE OF N.J.", status: "Closed", amount: 408.40, remaining: 0.00, poNumber: "0", invoiceDate: "2026-01-20" },
    { id: "3", date: "2026-01-20", ref: "7199375850", desc: "557-356-689-0001-75", vendorId: "3", vendorName: "VERIZON", status: "Closed", amount: 130.81, remaining: 0.00, poNumber: "0", invoiceDate: "2026-01-20" },
    { id: "4", date: "2026-01-20", ref: "16841", desc: "January Retainer 2026", vendorId: "4", vendorName: "AMS RISK MANAGEMENT & CONSULTING", status: "Open", amount: 3910.00, remaining: 3910.00, poNumber: "0", invoiceDate: "2026-01-20" },
    { id: "5", date: "2026-01-20", ref: "Donation - 01.09.2026 CORP", desc: "Invoice- created from voided check #16705", vendorId: "5", vendorName: "GRACIE SQUARE HOSPITAL", status: "Closed", amount: 200.00, remaining: 0.00, poNumber: "0", invoiceDate: "2026-01-20" },
    { id: "6", date: "2026-01-20", ref: "S2840", desc: "RMS", vendorId: "6", vendorName: "CORNELL CLUB OF N.Y.", status: "Closed", amount: 165.98, remaining: 0.00, poNumber: "0", invoiceDate: "2026-01-20" },
    { id: "7", date: "2026-01-20", ref: "1215", desc: "Invoice", vendorId: "7", vendorName: "DANIEL E. SMITH", status: "Open", amount: 150.00, remaining: 150.00, poNumber: "0", invoiceDate: "2026-01-20" },
    { id: "8", date: "2026-01-20", ref: "310519554668190", desc: "Invoice", vendorId: "8", vendorName: "SAMSARA INC", status: "Open", amount: 8622.90, remaining: 8622.90, poNumber: "0", invoiceDate: "2026-01-20" },
    { id: "9", date: "2026-01-21", ref: "1156", desc: "149001 - VAN 125 - FD", vendorId: "9", vendorName: "CENTURY INDUSTRIAL SUPPLY NY LLC", status: "Open", amount: 496.06, remaining: 496.06, poNumber: "81179920", invoiceDate: "2026-01-21" },
    { id: "10", date: "2026-01-21", ref: "STD0805460", desc: "209702 - 25 CLAREMONT AVE - FD", vendorId: "10", vendorName: "MOTION AI", status: "Open", amount: 463.00, remaining: 463.00, poNumber: "81179995", invoiceDate: "2026-01-21" },
    { id: "11", date: "2026-01-21", ref: "STD0805584", desc: "209915 - 141 DOSORIS LANE - FD", vendorId: "10", vendorName: "MOTION AI", status: "Open", amount: 398.00, remaining: 398.00, poNumber: "81180006", invoiceDate: "2026-01-21" },
    { id: "12", date: "2026-01-21", ref: "180660/1", desc: "178979 - 50 WEST 34TH - FD", vendorId: "11", vendorName: "GLEASON PAINTS", status: "Open", amount: 59.94, remaining: 59.94, poNumber: "81179895", invoiceDate: "2026-01-21" },
    { id: "13", date: "2026-01-21", ref: "180662/1", desc: "195489 - MAINTENANCE STOCK - IW", vendorId: "11", vendorName: "GLEASON PAINTS", status: "Open", amount: 239.76, remaining: 239.76, poNumber: "81179893", invoiceDate: "2026-01-21" },
    { id: "14", date: "2026-01-21", ref: "180713/1", desc: "195489 - MAINTENANCE STOCK - IW", vendorId: "11", vendorName: "GLEASON PAINTS", status: "Open", amount: 599.16, remaining: 599.16, poNumber: "81179911", invoiceDate: "2026-01-21" },
    { id: "15", date: "2026-01-21", ref: "180837/1", desc: "166509 - 150 55TH ST - FD", vendorId: "11", vendorName: "GLEASON PAINTS", status: "Open", amount: 79.95, remaining: 79.95, poNumber: "81179987", invoiceDate: "2026-01-21" },
    { id: "16", date: "2026-01-21", ref: "629375-00", desc: "159226 - 866 3RD AVE - FD", vendorId: "12", vendorName: "MIDTOWN ELECTRIC SUPPLY", status: "Open", amount: 204.43, remaining: 204.43, poNumber: "81179909", invoiceDate: "2026-01-21" },
    { id: "17", date: "2026-01-21", ref: "629437-00", desc: "199281 - 564 RIVERSIDE DRIVE - FD", vendorId: "12", vendorName: "MIDTOWN ELECTRIC SUPPLY", status: "Open", amount: 251.92, remaining: 251.92, poNumber: "81179921", invoiceDate: "2026-01-21" },
    { id: "18", date: "2026-01-21", ref: "629482-00", desc: "185904 - 61-35 JUNCTION BLVD - FD", vendorId: "12", vendorName: "MIDTOWN ELECTRIC SUPPLY", status: "Open", amount: 579.42, remaining: 579.42, poNumber: "81179928", invoiceDate: "2026-01-21" },
    { id: "19", date: "2026-01-21", ref: "6029479", desc: "198129 - 52 EAST 41ST - FD", vendorId: "23", vendorName: "TANNER BOLT & NUT, INC", status: "Open", amount: -20.69, remaining: -20.69, poNumber: "81179661", invoiceDate: "2026-01-21" },
    { id: "20", date: "2026-01-21", ref: "11044973", desc: "209520 - 5959 PALISADES - RR", vendorId: "13", vendorName: "WAYLAND LLC", status: "Open", amount: 3787.20, remaining: 3787.20, poNumber: "81179923", invoiceDate: "2026-01-21" },
    { id: "21", date: "2026-01-21", ref: "11044978", desc: "209424 - 4761 BROADWAY - FD", vendorId: "13", vendorName: "WAYLAND LLC", status: "Open", amount: 470.00, remaining: 470.00, poNumber: "81179947", invoiceDate: "2026-01-21" },
    { id: "22", date: "2026-01-21", ref: "11045011", desc: "203142 - 59 MAIDEN LANE - FD", vendorId: "13", vendorName: "WAYLAND LLC", status: "Open", amount: 10257.00, remaining: 10257.00, poNumber: "81180011", invoiceDate: "2026-01-21" },
    { id: "23", date: "2026-01-21", ref: "9757824827", desc: "178979 - 50 WEST 34TH - FD", vendorId: "14", vendorName: "GRAINGER", status: "Open", amount: 315.58, remaining: 315.58, poNumber: "81179899", invoiceDate: "2026-01-21" },
    { id: "24", date: "2026-01-21", ref: "88215", desc: "202825 - 22 EAST 29TH ST - ZOILA", vendorId: "15", vendorName: "A & D ENTRANCES INC", status: "Open", amount: 4950.70, remaining: 4950.70, poNumber: "81174742", invoiceDate: "2026-01-21" },
    { id: "25", date: "2026-01-21", ref: "48841", desc: "195489 - MAINTENANCE STOCK - IW", vendorId: "16", vendorName: "TRI-CITY WASTE OIL CORP.", status: "Open", amount: 240.00, remaining: 240.00, poNumber: "81179994", invoiceDate: "2026-01-21" },
    { id: "26", date: "2026-01-21", ref: "2026-039", desc: "195333 - 111 8TH - ZOILA", vendorId: "17", vendorName: "BSIS, INC", status: "Open", amount: 130000.00, remaining: 130000.00, poNumber: "81174697", invoiceDate: "2026-01-21" },
    { id: "27", date: "2026-01-21", ref: "1495DX", desc: "131767 - 1 BROADWAY - TK", vendorId: "18", vendorName: "PAUL R. OTTO", status: "Open", amount: 425.00, remaining: 425.00, poNumber: "81173776", invoiceDate: "2026-01-21" },
    { id: "28", date: "2026-01-21", ref: "1495DZ", desc: "176669 - 121 WEST 28TH - TK", vendorId: "18", vendorName: "PAUL R. OTTO", status: "Open", amount: 425.00, remaining: 425.00, poNumber: "81173772", invoiceDate: "2026-01-21" },
    { id: "29", date: "2026-01-21", ref: "1495EB", desc: "131767 - 1 BROADWAY - TK", vendorId: "18", vendorName: "PAUL R. OTTO", status: "Open", amount: 425.00, remaining: 425.00, poNumber: "81173773", invoiceDate: "2026-01-21" },
    { id: "30", date: "2026-01-21", ref: "1495EC", desc: "32868 - 375 PARK AVE - TK", vendorId: "18", vendorName: "PAUL R. OTTO", status: "Open", amount: 250.00, remaining: 250.00, poNumber: "81145516", invoiceDate: "2026-01-21" },
    { id: "31", date: "2026-01-21", ref: "NE13816", desc: "194450 57e57 sz", vendorId: "19", vendorName: "VANTAGE ELEVATION LLC", status: "Open", amount: 248.00, remaining: 248.00, poNumber: "81180697", invoiceDate: "2026-01-21" },
    { id: "32", date: "2026-01-21", ref: "74837", desc: "196977 - 808 COLUMBUS AVE - TK", vendorId: "20", vendorName: "EIC, INC", status: "Open", amount: 705.00, remaining: 705.00, poNumber: "81173794", invoiceDate: "2026-01-21" },
    { id: "33", date: "2026-01-21", ref: "74854", desc: "175306 - 247 WEST 30TH - TK", vendorId: "20", vendorName: "EIC, INC", status: "Open", amount: 495.00, remaining: 495.00, poNumber: "81173799", invoiceDate: "2026-01-21" },
    { id: "34", date: "2026-01-22", ref: "597249", desc: "195489 - MAINTENANCE STOCK - MA", vendorId: "21", vendorName: "ZO AIR", status: "Open", amount: 2606.97, remaining: 2606.97, poNumber: "81179768", invoiceDate: "2026-01-22" },
    { id: "35", date: "2026-01-22", ref: "364302", desc: "195489 - MAINTENANCE STOCK - IW", vendorId: "22", vendorName: "WESCO DISTRIBUTION INC.", status: "Open", amount: 865.00, remaining: 865.00, poNumber: "81179912", invoiceDate: "2026-01-22" },
    { id: "36", date: "2026-01-22", ref: "365710", desc: "195489 - MAINTENANCE STOCK - IW", vendorId: "22", vendorName: "WESCO DISTRIBUTION INC.", status: "Open", amount: 173.00, remaining: 173.00, poNumber: "81179941", invoiceDate: "2026-01-22" },
    { id: "37", date: "2026-01-22", ref: "369163", desc: "165343 - 1275 LINDEN BLVD - JH", vendorId: "22", vendorName: "WESCO DISTRIBUTION INC.", status: "Open", amount: 209.69, remaining: 209.69, poNumber: "81179981", invoiceDate: "2026-01-22" },
    { id: "38", date: "2026-01-22", ref: "369165", desc: "203252 - 530 5TH AVE - FD", vendorId: "22", vendorName: "WESCO DISTRIBUTION INC.", status: "Open", amount: 52.16, remaining: 52.16, poNumber: "81179982", invoiceDate: "2026-01-22" },
    { id: "39", date: "2026-01-22", ref: "369167", desc: "166509 - 150 55TH ST - FD", vendorId: "22", vendorName: "WESCO DISTRIBUTION INC.", status: "Open", amount: 212.57, remaining: 212.57, poNumber: "81179986", invoiceDate: "2026-01-22" },
    { id: "40", date: "2026-01-22", ref: "372163", desc: "179629 - 1133 BROADWAY - FD", vendorId: "22", vendorName: "WESCO DISTRIBUTION INC.", status: "Open", amount: 124.16, remaining: 124.16, poNumber: "81180015", invoiceDate: "2026-01-22" },
  ];

  useEffect(() => {
    setEntries(mockEntries);
    setFilteredEntries(mockEntries);
    setSelectedEntry(mockEntries[0]);
    setLoading(false);
  }, []);

  // Filter by date ranges
  useEffect(() => {
    const postStart = new Date(postingStartDate);
    const postEnd = new Date(postingEndDate);
    const invStart = new Date(invoiceStartDate);
    const invEnd = new Date(invoiceEndDate);

    const filtered = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const entryInvDate = new Date(entry.invoiceDate);
      return entryDate >= postStart && entryDate <= postEnd &&
             entryInvDate >= invStart && entryInvDate <= invEnd;
    });
    setFilteredEntries(filtered);
  }, [postingStartDate, postingEndDate, invoiceStartDate, invoiceEndDate, entries]);

  const setDateRange = (range: string) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (range) {
      case "Day":
        start = today;
        end = today;
        break;
      case "Week":
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case "Month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "Quarter":
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        end = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        break;
      case "Year":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
    }

    setPostingStartDate(start.toISOString().split("T")[0]);
    setPostingEndDate(end.toISOString().split("T")[0]);
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

  const formatCurrency = (amount: number) => {
    const formatted = Math.abs(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return amount < 0 ? `($${formatted})` : `$${formatted}`;
  };

  const handleRowClick = (entry: JournalEntry) => {
    setSelectedEntry(entry);
  };

  const handleRowDoubleClick = (entry: JournalEntry) => {
    openTab(`Journal ${entry.ref}`, `/purchase-journal/${entry.id}`);
  };

  // Calculate totals
  const calculateTotals = () => {
    const count = filteredEntries.length;
    const totalAmount = filteredEntries.reduce((sum, e) => sum + e.amount, 0);
    const totalRemaining = filteredEntries.reduce((sum, e) => sum + e.remaining, 0);
    return { count, totalAmount, totalRemaining };
  };

  const totals = calculateTotals();

  // New entry handlers
  const handleNewEntry = () => {
    setNewEntry({
      date: new Date().toISOString().split("T")[0],
      ref: "",
      desc: "",
      vendorId: "",
      vendorName: "",
      amount: 0,
      poNumber: "",
    });
    setShowNewEntryDialog(true);
  };

  const handleCreateEntry = () => {
    if (!newEntry.vendorId || !newEntry.ref) {
      alert("Please select a vendor and enter a reference");
      return;
    }

    const entry: JournalEntry = {
      id: String(entries.length + 1),
      date: newEntry.date,
      ref: newEntry.ref,
      desc: newEntry.desc,
      vendorId: newEntry.vendorId,
      vendorName: newEntry.vendorName,
      status: "Open",
      amount: newEntry.amount,
      remaining: newEntry.amount,
      poNumber: newEntry.poNumber || "0",
      invoiceDate: newEntry.date,
    };

    setEntries([...entries, entry]);
    setShowNewEntryDialog(false);
    setSelectedEntry(entry);
  };

  // Edit handler
  const handleEditEntry = () => {
    if (selectedEntry) {
      openTab(`Journal ${selectedEntry.ref}`, `/purchase-journal/${selectedEntry.id}`);
    }
  };

  // Delete handler
  const handleDeleteEntry = () => {
    if (selectedEntry) {
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = () => {
    if (selectedEntry) {
      const updated = entries.filter(e => e.id !== selectedEntry.id);
      setEntries(updated);
      setSelectedEntry(updated[0] || null);
      setShowDeleteConfirm(false);
    }
  };


  return (
    <div className="h-full flex flex-col bg-[#f5f5f5]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif", fontSize: "12px" }}>
      {/* Menu Bar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0]">
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">File</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Edit</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Pim</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Tools</span>
        <span className="px-3 py-1 hover:bg-[#e5e5e5] cursor-pointer rounded">Help</span>
      </div>

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center px-2 py-1 border-b border-[#d0d0d0] gap-0.5">
        <button
          onClick={handleNewEntry}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="New Entry"
        >
          <FileText className="w-4 h-4" style={{ color: "#4a7c59" }} />
        </button>
        <button
          onClick={handleEditEntry}
          disabled={!selectedEntry}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Edit Entry"
        >
          <Pencil className="w-4 h-4" style={{ color: "#f39c12" }} />
        </button>
        <button
          onClick={handleDeleteEntry}
          disabled={!selectedEntry}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0] disabled:opacity-50"
          title="Delete Entry"
        >
          <Trash2 className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <X className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Filter className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Scissors className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Check className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Check className="w-4 h-4" style={{ color: "#5cb85c" }} />
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <span className="text-[11px] font-bold" style={{ color: "#3498db" }}>Σ</span>
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Printer className="w-4 h-4" style={{ color: "#9b59b6" }} />
        </button>
        <button
          onClick={handleNewEntry}
          className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]"
          title="Add"
        >
          <Plus className="w-4 h-4" style={{ color: "#27ae60" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <Home className="w-4 h-4" style={{ color: "#e74c3c" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <HelpCircle className="w-4 h-4" style={{ color: "#3498db" }} />
        </button>
        <button className="w-[26px] h-[26px] flex items-center justify-center hover:bg-[#e0e0e0] rounded border border-transparent hover:border-[#c0c0c0]">
          <X className="w-4 h-4" style={{ color: "#95a5a6" }} />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#f5f5f5] px-4 py-2 border-b border-[#d0d0d0]">
        {/* F&S Catalogue */}
        <div className="flex items-center gap-2 mb-2">
          <label className="text-[12px]">F&S Catalogue</label>
          <select
            value={catalogue}
            onChange={(e) => setCatalogue(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white min-w-[100px]"
          >
            <option value="None">None</option>
            <option value="Parts">Parts</option>
            <option value="Labor">Labor</option>
          </select>
        </div>

        {/* Date Filters Row */}
        <div className="flex items-center gap-6">
          {/* Posting Date */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] w-16">Posting Date</span>
            <label className="text-[12px]">Start Date</label>
            <input
              type="date"
              value={postingStartDate}
              onChange={(e) => setPostingStartDate(e.target.value)}
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-[#ffff00] w-[100px]"
            />
            <label className="text-[12px]">End Date</label>
            <input
              type="date"
              value={postingEndDate}
              onChange={(e) => setPostingEndDate(e.target.value)}
              className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[100px]"
            />
            {/* Quick Date Buttons */}
            <div className="flex items-center gap-1 ml-2">
              {["Day", "Week", "Month", "Quarter", "Year"].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className="px-2 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoice Date Row */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[12px] w-16">Invoice Date</span>
          <input
            type="date"
            value={invoiceStartDate}
            onChange={(e) => setInvoiceStartDate(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[100px]"
          />
          <input
            type="date"
            value={invoiceEndDate}
            onChange={(e) => setInvoiceEndDate(e.target.value)}
            className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-[100px]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse text-[12px]">
          <thead className="bg-[#f0f0f0] sticky top-0">
            <tr>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "9%" }}>Date</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Ref</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "24%" }}>Desc</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "22%" }}>Vendor</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "7%" }}>Status</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Amount</th>
              <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Remaining</th>
              <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "9%" }}>PO #</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry) => (
              <tr
                key={entry.id}
                onClick={() => handleRowClick(entry)}
                onDoubleClick={() => handleRowDoubleClick(entry)}
                className={`cursor-pointer ${
                  selectedEntry?.id === entry.id ? "bg-[#316ac5] text-white" : "hover:bg-[#f0f8ff]"
                }`}
              >
                <td className="px-2 py-1 border border-[#e0e0e0]">{formatDate(entry.date)}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{entry.ref}</td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{entry.desc}</td>
                <td
                  className={`px-2 py-1 border border-[#e0e0e0] ${selectedEntry?.id !== entry.id ? "text-[#0000ff] cursor-pointer hover:underline" : ""}`}
                  onClick={(e) => {
                    if (selectedEntry?.id !== entry.id) {
                      e.stopPropagation();
                      openTab(entry.vendorName, `/vendors/${entry.vendorId}`);
                    }
                  }}
                >
                  {entry.vendorName}
                </td>
                <td className="px-2 py-1 border border-[#e0e0e0]">{entry.status}</td>
                <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(entry.amount)}</td>
                <td className="px-2 py-1 text-right border border-[#e0e0e0]">{formatCurrency(entry.remaining)}</td>
                <td
                  className={`px-2 py-1 border border-[#e0e0e0] ${entry.poNumber !== "0" && selectedEntry?.id !== entry.id ? "text-[#0000ff] cursor-pointer hover:underline" : ""}`}
                  onClick={(e) => {
                    if (entry.poNumber !== "0" && selectedEntry?.id !== entry.id) {
                      e.stopPropagation();
                      openTab(`PO# ${entry.poNumber}`, `/purchase-orders/${entry.poNumber}`);
                    }
                  }}
                >
                  {entry.poNumber}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center text-[11px]">
        <span className="px-2">{selectedEntry ? formatDate(selectedEntry.date) : ""}</span>
        <span className="px-2 flex-1">{selectedEntry?.vendorName || ""}</span>
        <button
          onClick={() => setShowTotals1(!showTotals1)}
          className="px-2 border-l border-[#c0c0c0] hover:bg-[#e0e0e0] cursor-pointer"
        >
          {showTotals1 ? `${totals.count} entries` : "Totals Off"}
        </button>
        <button
          onClick={() => setShowTotals2(!showTotals2)}
          className="px-2 border-l border-[#c0c0c0] hover:bg-[#e0e0e0] cursor-pointer"
        >
          {showTotals2 ? formatCurrency(totals.totalAmount) : "Totals Off"}
        </button>
      </div>

      {/* New Entry Dialog */}
      {showNewEntryDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] border-2 border-[#808080] shadow-lg" style={{ minWidth: "450px" }}>
            <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">New Purchase Journal Entry</span>
              <button
                onClick={() => setShowNewEntryDialog(false)}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Vendor</label>
                  <select
                    value={newEntry.vendorId}
                    onChange={(e) => {
                      const vendor = vendors.find(v => v.id === e.target.value);
                      setNewEntry({
                        ...newEntry,
                        vendorId: e.target.value,
                        vendorName: vendor?.name || "",
                      });
                    }}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  >
                    <option value="">Select Vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Date</label>
                  <input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Reference</label>
                  <input
                    type="text"
                    value={newEntry.ref}
                    onChange={(e) => setNewEntry({ ...newEntry, ref: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                    placeholder="Invoice #"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Description</label>
                  <input
                    type="text"
                    value={newEntry.desc}
                    onChange={(e) => setNewEntry({ ...newEntry, desc: e.target.value })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">Amount</label>
                  <input
                    type="number"
                    value={newEntry.amount}
                    onChange={(e) => setNewEntry({ ...newEntry, amount: parseFloat(e.target.value) || 0 })}
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white text-right"
                    step="0.01"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="w-20 text-[12px]">PO #</label>
                  <input
                    type="text"
                    value={newEntry.poNumber}
                    onChange={(e) => setNewEntry({ ...newEntry, poNumber: e.target.value })}
                    placeholder="Optional"
                    className="flex-1 px-2 py-1 border border-[#7f9db9] text-[12px] bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-[#808080]">
                <button
                  onClick={handleCreateEntry}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  OK
                </button>
                <button
                  onClick={() => setShowNewEntryDialog(false)}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#f0f0f0] border-2 border-[#808080] shadow-lg" style={{ minWidth: "300px" }}>
            <div className="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
              <span className="text-[12px] font-bold">Confirm Delete</span>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-white hover:bg-[#c0c0c0] hover:text-black px-1"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <p className="text-[12px] mb-4">
                Are you sure you want to delete journal entry "{selectedEntry.ref}"?
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={confirmDelete}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-1 bg-[#f0f0f0] border border-[#808080] hover:bg-[#e0e0e0] text-[12px]"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
