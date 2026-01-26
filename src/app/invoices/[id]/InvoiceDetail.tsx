"use client";

import { useState, useEffect, useCallback } from "react";
import { useTabs } from "@/context/TabContext";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { UnsavedChangesDialog } from "@/components/ui/UnsavedChangesDialog";

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  description: string | null;
  tax: boolean;
  price: number;
  markupPercent: number;
  amount: number;
  measure: string | null;
  phase: number | null;
}

interface Invoice {
  id: string;
  invoiceNumber: number;
  postingDate: string;
  date: string;
  type: string;
  terms: string | null;
  priceLevel: string | null;
  poNumber: string | null;
  mechSales: string | null;
  creditReq: string | null;
  backup: string | null;
  status: string;
  description: string | null;
  jobRemarks: string | null;
  // Tax fields
  taxRegion1: string | null;
  taxRate1: number;
  taxRegion2: string | null;
  taxRate2: number;
  taxFactor: number;
  // Labor hours
  reg: number | null;
  ot: number | null;
  ot17: number | null;
  dt: number | null;
  tt: number | null;
  // Amounts
  taxable: number;
  nonTaxable: number;
  subTotal: number;
  salesTax: number;
  total: number;
  remainingUnpaid: number;
  emailSent: boolean;
  emailStatus: string | null;
  premises: {
    id: string;
    premisesId: string | null;
    address: string;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    customer: {
      id: string;
      name: string;
    } | null;
  } | null;
  job: {
    id: string;
    externalId: string | null;
    jobName: string;
  } | null;
  items: InvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
}

interface InvoiceDetailProps {
  invoiceId: string;
  onClose: () => void;
}

const TABS = ["Account/General", "Taxes/Job Remarks"];

export default function InvoiceDetail({ invoiceId, onClose }: InvoiceDetailProps) {
  const { openTab } = useTabs();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Account/General");
  const [formData, setFormData] = useState<Partial<Invoice>>({});
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [savingFromHook, setSavingFromHook] = useState(false);

  // Taxes/Job Remarks state
  const [taxRegion1, setTaxRegion1] = useState("");
  const [taxRate1, setTaxRate1] = useState("0.0000");
  const [taxRegion2, setTaxRegion2] = useState("");
  const [taxRate2, setTaxRate2] = useState("0.0000");
  const [taxFactor, setTaxFactor] = useState("100.00");
  const [jobRemarks, setJobRemarks] = useState("");
  const [regHours, setRegHours] = useState("");
  const [otHours, setOtHours] = useState("");
  const [ot17Hours, setOt17Hours] = useState("");
  const [dtHours, setDtHours] = useState("");
  const [ttHours, setTtHours] = useState("");

  // Save callback for the unsaved changes hook (will be set after fetchInvoice)
  const handleSaveForHook = useCallback(async () => {
    setSavingFromHook(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items,
          taxRegion1: taxRegion1 || null,
          taxRate1: parseFloat(taxRate1) || 0,
          taxRegion2: taxRegion2 || null,
          taxRate2: parseFloat(taxRate2) || 0,
          taxFactor: parseFloat(taxFactor) || 100,
          jobRemarks: jobRemarks || null,
          reg: regHours ? parseFloat(regHours) : null,
          ot: otHours ? parseFloat(otHours) : null,
          ot17: ot17Hours ? parseFloat(ot17Hours) : null,
          dt: dtHours ? parseFloat(dtHours) : null,
          tt: ttHours ? parseFloat(ttHours) : null,
        }),
      });
      if (!response.ok) throw new Error("Failed to save invoice");
      const updated = await response.json();
      setInvoice(updated);
      setFormData(updated);
      setItems(updated.items || []);
    } finally {
      setSavingFromHook(false);
    }
  }, [invoiceId, formData, items, taxRegion1, taxRate1, taxRegion2, taxRate2, taxFactor, jobRemarks, regHours, otHours, ot17Hours, dtHours, ttHours]);

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
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
        setFormData(data);
        setItems(data.items || []);
        // Set Taxes/Job Remarks state
        setTaxRegion1(data.taxRegion1 || "");
        setTaxRate1(data.taxRate1?.toFixed(4) || "0.0000");
        setTaxRegion2(data.taxRegion2 || "");
        setTaxRate2(data.taxRate2?.toFixed(4) || "0.0000");
        setTaxFactor(data.taxFactor?.toFixed(2) || "100.00");
        setJobRemarks(data.jobRemarks || "");
        setRegHours(data.reg?.toString() || "");
        setOtHours(data.ot?.toString() || "");
        setOt17Hours(data.ot17?.toString() || "");
        setDtHours(data.dt?.toString() || "");
        setTtHours(data.tt?.toString() || "");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Invoice, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items,
          taxRegion1: taxRegion1 || null,
          taxRate1: parseFloat(taxRate1) || 0,
          taxRegion2: taxRegion2 || null,
          taxRate2: parseFloat(taxRate2) || 0,
          taxFactor: parseFloat(taxFactor) || 100,
          jobRemarks: jobRemarks || null,
          reg: regHours ? parseFloat(regHours) : null,
          ot: otHours ? parseFloat(otHours) : null,
          ot17: ot17Hours ? parseFloat(ot17Hours) : null,
          dt: dtHours ? parseFloat(dtHours) : null,
          tt: ttHours ? parseFloat(ttHours) : null,
        }),
      });
      if (response.ok) {
        const updated = await response.json();
        setInvoice(updated);
        setFormData(updated);
        setItems(updated.items || []);
        setIsDirty(false);
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
    }
  };

  const openAccount = () => {
    if (invoice?.premises) {
      openTab(invoice.premises.address, `/accounts/${invoice.premises.id}`);
    }
  };

  const openJob = () => {
    if (invoice?.job) {
      openTab(invoice.job.jobName, `/jobs/${invoice.job.id}`);
    }
  };

  const formatCurrency = (amount: number) => {
    const value = Number(amount);
    if (value < 0) {
      return `($${Math.abs(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f5]">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="h-full flex items-center justify-center bg-[#f5f5f5]">
        <span className="text-red-500">Invoice not found</span>
      </div>
    );
  }

  // Calculate totals from items
  const taxable = items.filter((i) => i.tax).reduce((sum, i) => sum + Number(i.amount), 0);
  const nonTaxable = items.filter((i) => !i.tax).reduce((sum, i) => sum + Number(i.amount), 0);
  const subTotal = taxable + nonTaxable;
  const salesTax = taxable * 0.08875;
  const totalInvoice = subTotal + salesTax;

  // Open PDF preview in new tab
  const handleGeneratePDF = () => {
    openTab(`Invoice #${invoice.invoiceNumber} Preview`, `/invoice-preview/${invoice.id}`);
  };

  // Account/General Tab Content
  const renderAccountGeneralTab = () => (
    <>
      <div className="bg-[#ffffcc] border border-[#d0d0d0] m-2 p-3 flex gap-6">
        {/* Left Section - Account Info */}
        <div className="flex flex-col gap-2 min-w-[220px]">
          <button
            onClick={openAccount}
            className="text-left text-[12px] text-[#0066cc] hover:underline font-medium"
          >
            Account
          </button>
          <select
            value={invoice.premises?.id || ""}
            className="px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
          >
            <option value={invoice.premises?.id || ""}>
              {invoice.premises?.premisesId || invoice.premises?.address || "Select Account"}
            </option>
          </select>

          {/* Address Block */}
          <div className="bg-white border border-[#a0a0a0] p-2 text-[11px] min-h-[80px]">
            {invoice.premises && (
              <>
                <div>{invoice.premises.address}</div>
                {invoice.premises.city && (
                  <div>
                    {invoice.premises.city}
                    {invoice.premises.state ? `, ${invoice.premises.state}` : ""}
                    {invoice.premises.zipCode ? ` ${invoice.premises.zipCode}` : ""}
                  </div>
                )}
                {invoice.premises.customer && <div>{invoice.premises.customer.name}</div>}
              </>
            )}
          </div>
        </div>

        {/* Middle Section - Fields */}
        <div className="flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Posting</label>
            <input
              type="date"
              value={formatDateForInput(formData.postingDate as string)}
              onChange={(e) => handleInputChange("postingDate", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Date</label>
            <input
              type="date"
              value={formatDateForInput(formData.date as string)}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openJob}
              className="w-16 text-right text-[12px] text-[#0066cc] hover:underline"
            >
              Job
            </button>
            <input
              type="text"
              value={invoice.job?.externalId || "0"}
              readOnly
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-[#f0f0f0]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Type</label>
            <select
              value={formData.type || "Other"}
              onChange={(e) => handleInputChange("type", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            >
              <option value="Other">Other</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Modernization">Modernization</option>
              <option value="Repair">Repair</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Terms</label>
            <select
              value={formData.terms || "Net 30 Days"}
              onChange={(e) => handleInputChange("terms", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            >
              <option value="Net 30 Days">Net 30 Days</option>
              <option value="Net 45 Days">Net 45 Days</option>
              <option value="Net 60 Days">Net 60 Days</option>
              <option value="Due on Receipt">Due on Receipt</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-16 text-right text-[12px]">Inv. Price</label>
            <select
              value={formData.priceLevel || "Price Level"}
              onChange={(e) => handleInputChange("priceLevel", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            >
              <option value="Price Level">Price Level</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Discount">Discount</option>
            </select>
          </div>
        </div>

        {/* Right-Middle Section - More Fields */}
        <div className="flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-2">
            <label className="w-20 text-right text-[12px]">PO #</label>
            <input
              type="text"
              value={formData.poNumber || ""}
              onChange={(e) => handleInputChange("poNumber", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-right text-[12px]">Mech/Sales</label>
            <select
              value={formData.mechSales || ""}
              onChange={(e) => handleInputChange("mechSales", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            >
              <option value=""></option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-right text-[12px]">Credit Req</label>
            <input
              type="text"
              value={formData.creditReq || ""}
              onChange={(e) => handleInputChange("creditReq", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-right text-[12px]">Status</label>
            <input
              type="text"
              value=""
              readOnly
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-20 text-right text-[12px]">Backup</label>
            <input
              type="text"
              value={formData.backup || ""}
              onChange={(e) => handleInputChange("backup", e.target.value)}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white"
            />
          </div>
        </div>

        {/* Right Section - Invoice # and Status */}
        <div className="flex flex-col gap-2 min-w-[140px]">
          <div className="border border-[#a0a0a0] bg-white p-2 text-center">
            <div className="text-[11px] text-[#606060]">Invoice #</div>
            <div className="text-[16px] font-bold">{invoice.invoiceNumber}</div>
          </div>

          {/* Paid/Open Status Stamp */}
          {invoice.status === "Paid" && (
            <div className="mt-4 text-center">
              <span className="text-[24px] font-bold text-red-600 border-b-4 border-red-600 px-4">
                PAID
              </span>
            </div>
          )}
          {invoice.status === "Open" && (
            <div className="mt-4 text-center">
              <span className="text-[18px] font-bold text-orange-600">
                UNPAID
              </span>
            </div>
          )}
          {invoice.status === "Void" && (
            <div className="mt-4 text-center">
              <span className="text-[18px] font-bold text-gray-500">
                VOID
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Description */}
      <div className="mx-2 mb-2">
        <label className="text-[12px] font-medium">Invoice Description</label>
        <textarea
          value={formData.description || ""}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className="w-full h-20 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white resize-none mt-1"
          placeholder="Enter invoice description..."
        />
      </div>

      {/* Line Items Grid */}
      <div className="flex-1 flex flex-col mx-2 mb-2 overflow-hidden">
        <div className="flex-1 border border-[#a0a0a0] bg-white overflow-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead className="bg-[#f0f0f0] sticky top-0">
              <tr>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Name</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Quan</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "15%" }}>Description</th>
                <th className="px-2 py-1 text-center font-medium border border-[#c0c0c0]" style={{ width: "5%" }}>Tax</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Price</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Mark Up %</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "12%" }}>Amount</th>
                <th className="px-2 py-1 text-left font-medium border border-[#c0c0c0]" style={{ width: "10%" }}>Measure</th>
                <th className="px-2 py-1 text-right font-medium border border-[#c0c0c0]" style={{ width: "8%" }}>Phase</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-2 py-4 text-center text-[#808080] border border-[#d0d0d0]">
                    No line items
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`cursor-pointer ${
                      selectedItemId === item.id
                        ? "bg-[#0078d4] text-white"
                        : "hover:bg-[#f0f8ff]"
                    }`}
                  >
                    <td className="px-2 py-1 border border-[#d0d0d0]">{item.name}</td>
                    <td className="px-2 py-1 text-right border border-[#d0d0d0]">{Number(item.quantity).toFixed(2)}</td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{item.description || ""}</td>
                    <td className="px-2 py-1 text-center border border-[#d0d0d0]">
                      <input type="checkbox" checked={item.tax} readOnly className="w-3 h-3" />
                    </td>
                    <td className={`px-2 py-1 text-right border border-[#d0d0d0] ${Number(item.price) < 0 && selectedItemId !== item.id ? "text-red-600" : ""}`}>
                      {Number(item.price).toFixed(2)}
                    </td>
                    <td className="px-2 py-1 text-right border border-[#d0d0d0]">{Number(item.markupPercent)}</td>
                    <td className={`px-2 py-1 text-right border border-[#d0d0d0] ${Number(item.amount) < 0 && selectedItemId !== item.id ? "text-red-600" : ""}`}>
                      {formatCurrency(Number(item.amount))}
                    </td>
                    <td className="px-2 py-1 border border-[#d0d0d0]">{item.measure || "Each"}</td>
                    <td className="px-2 py-1 text-right border border-[#d0d0d0]">{item.phase || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  // Taxes/Job Remarks Tab Content
  const renderTaxesJobRemarksTab = () => (
    <>
      <div className="bg-[#ffffcc] border border-[#d0d0d0] m-2 p-3 flex gap-6">
        {/* Left Column - Tax Fields */}
        <div className="flex flex-col gap-2 min-w-[180px]">
          <div className="flex items-center gap-2">
            <label className="w-24 text-right text-[12px]">Tax Region 1</label>
            <input
              type="text"
              value={taxRegion1}
              onChange={(e) => { setTaxRegion1(e.target.value); setIsDirty(true); }}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-24"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-right text-[12px]">Tax Rate 1</label>
            <input
              type="text"
              value={taxRate1}
              onChange={(e) => { setTaxRate1(e.target.value); setIsDirty(true); }}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-24"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-right text-[12px]">Tax Region 2</label>
            <input
              type="text"
              value={taxRegion2}
              onChange={(e) => { setTaxRegion2(e.target.value); setIsDirty(true); }}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-24"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-right text-[12px]">Tax Rate 2</label>
            <input
              type="text"
              value={taxRate2}
              onChange={(e) => { setTaxRate2(e.target.value); setIsDirty(true); }}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-24"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-24 text-right text-[12px]">Tax Factor</label>
            <input
              type="text"
              value={taxFactor}
              onChange={(e) => { setTaxFactor(e.target.value); setIsDirty(true); }}
              className="flex-1 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white w-24"
            />
          </div>
        </div>

        {/* Middle Column - Job Remarks */}
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[12px] font-medium">Job Remarks</label>
          <textarea
            value={jobRemarks}
            onChange={(e) => { setJobRemarks(e.target.value); setIsDirty(true); }}
            className="w-full h-40 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white resize-none"
            placeholder="Enter job remarks..."
          />
        </div>

        {/* Right Column - Hours */}
        <div className="flex flex-col gap-2 min-w-[100px]">
          <div className="flex items-center gap-2">
            <label className="w-10 text-right text-[12px]">Reg</label>
            <input
              type="text"
              value={regHours}
              onChange={(e) => { setRegHours(e.target.value); setIsDirty(true); }}
              className="w-16 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white text-right"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-10 text-right text-[12px]">OT</label>
            <input
              type="text"
              value={otHours}
              onChange={(e) => { setOtHours(e.target.value); setIsDirty(true); }}
              className="w-16 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white text-right"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-10 text-right text-[12px]">1.7</label>
            <input
              type="text"
              value={ot17Hours}
              onChange={(e) => { setOt17Hours(e.target.value); setIsDirty(true); }}
              className="w-16 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white text-right"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-10 text-right text-[12px]">DT</label>
            <input
              type="text"
              value={dtHours}
              onChange={(e) => { setDtHours(e.target.value); setIsDirty(true); }}
              className="w-16 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white text-right"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="w-10 text-right text-[12px]">TT</label>
            <input
              type="text"
              value={ttHours}
              onChange={(e) => { setTtHours(e.target.value); setIsDirty(true); }}
              className="w-16 px-2 py-1 border border-[#a0a0a0] text-[12px] bg-white text-right"
            />
          </div>
        </div>
      </div>
    </>
  );

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "Account/General":
        return renderAccountGeneralTab();
      case "Taxes/Job Remarks":
        return renderTaxesJobRemarksTab();
      default:
        return renderAccountGeneralTab();
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

      {/* Toolbar */}
      <div className="bg-[#f5f5f5] flex items-center gap-1 px-2 py-1 border-b border-[#d0d0d0]">
        <button className="p-1 hover:bg-[#e0e0e0] rounded" title="New">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button className="p-1 hover:bg-[#e0e0e0] rounded" title="Save" onClick={handleSave}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <button className="p-1 hover:bg-[#e0e0e0] rounded" title="Print">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </button>
        <button
          onClick={handleGeneratePDF}
          className="p-1 hover:bg-[#e0e0e0] rounded"
          title="Generate PDF"
        >
          <svg className="w-4 h-4" fill="none" stroke="#dc2626" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-6 4h4" />
          </svg>
        </button>
        <div className="w-px h-5 bg-[#c0c0c0] mx-1" />
        <span className="px-2 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0]">Print on Save</span>
        <span className="px-2 py-1 text-[11px] border border-[#a0a0a0] bg-[#f0f0f0]">Email on Save</span>
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

      {/* Totals Row */}
      <div className="bg-[#e0e8f0] border-t border-[#a0a0a0] px-2 py-2 flex items-center gap-4">
        <div className="flex items-center gap-1">
          <span className="text-[11px] w-16">Taxable</span>
          <span className="px-2 py-1 bg-white border border-[#a0a0a0] text-[11px] min-w-[80px] text-right">
            {formatCurrency(taxable)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] w-20">Non-Taxable</span>
          <span className={`px-2 py-1 bg-white border border-[#a0a0a0] text-[11px] min-w-[80px] text-right ${nonTaxable < 0 ? "text-red-600" : ""}`}>
            {formatCurrency(nonTaxable)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] w-16">Sub-Total</span>
          <span className={`px-2 py-1 bg-white border border-[#a0a0a0] text-[11px] min-w-[80px] text-right ${subTotal < 0 ? "text-red-600" : ""}`}>
            {formatCurrency(subTotal)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] w-16">Sales Tax</span>
          <span className="px-2 py-1 bg-white border border-[#a0a0a0] text-[11px] min-w-[80px] text-right">
            {formatCurrency(salesTax)}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] w-20">Total Invoice</span>
          <span className={`px-2 py-1 bg-white border border-[#a0a0a0] text-[11px] min-w-[80px] text-right ${totalInvoice < 0 ? "text-red-600" : ""}`}>
            {formatCurrency(totalInvoice)}
          </span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#f5f5f5] border-t border-[#d0d0d0] px-2 py-1 flex items-center justify-between text-[11px]">
        <span>{invoice.emailSent ? "Email sent" : "No E-mail sent"}</span>
        <span>EDIT</span>
      </div>

      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        isOpen={showDialog}
        onSave={handleDialogSave}
        onDiscard={handleDialogDiscard}
        onCancel={handleDialogCancel}
        saving={savingFromHook}
      />
    </div>
  );
}
