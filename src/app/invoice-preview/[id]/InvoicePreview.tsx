"use client";

import { useState, useEffect } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import InvoicePDF from "@/components/pdf/InvoicePDF";

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  description: string | null;
  tax: boolean;
  price: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: number;
  postingDate: string;
  date: string;
  status: string;
  terms: string | null;
  poNumber: string | null;
  description: string | null;
  premises: {
    id: string;
    address: string;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    customer: {
      id: string;
      name: string;
    } | null;
  } | null;
  items: InvoiceItem[];
}

interface InvoicePreviewProps {
  invoiceId: string;
  onClose: () => void;
}

export default function InvoicePreview({ invoiceId, onClose }: InvoicePreviewProps) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailSending, setEmailSending] = useState(false);

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
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const items = invoice?.items || [];
  const taxable = items.filter((i) => i.tax).reduce((sum, i) => sum + Number(i.amount), 0);
  const nonTaxable = items.filter((i) => !i.tax).reduce((sum, i) => sum + Number(i.amount), 0);
  const subTotal = taxable + nonTaxable;
  const salesTax = taxable * 0.08875;
  const total = subTotal + salesTax;

  const handleEmailToClient = () => {
    if (!invoice) return;
    setEmailSending(true);
    // Simulate email sending
    setTimeout(() => {
      setEmailSending(false);
      alert(`Invoice #${invoice.invoiceNumber} would be emailed to:\n\n${invoice.premises?.customer?.name || "Customer"}`);
    }, 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#c0c0c0]">
        <span className="text-[12px] text-[#606060]">Loading invoice...</span>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="h-full flex items-center justify-center bg-[#c0c0c0]">
        <span className="text-[12px] text-red-600">Invoice not found</span>
      </div>
    );
  }

  const pdfData = {
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.date,
    postingDate: invoice.postingDate,
    status: invoice.status,
    terms: invoice.terms,
    poNumber: invoice.poNumber,
    description: invoice.description,
    premises: invoice.premises,
    items: items,
    taxable: taxable,
    nonTaxable: nonTaxable,
    subTotal: subTotal,
    salesTax: salesTax,
    total: total,
  };

  return (
    <div className="h-full flex flex-col bg-[#f0f0f0]">
      {/* Toolbar */}
      <div className="bg-white border-b border-[#e0e0e0] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1e3a5f] rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#1e3a5f]">Invoice #{invoice.invoiceNumber}</div>
              <div className="text-[11px] text-[#666]">{invoice.premises?.customer?.name || "Customer"}</div>
            </div>
          </div>

          <div className="h-6 w-px bg-[#e0e0e0]" />

          <div className="flex items-center gap-2">
            <button
              onClick={handleEmailToClient}
              disabled={emailSending}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-[#1e3a5f] text-white rounded hover:bg-[#2d4a6f] disabled:opacity-50 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {emailSending ? "Sending..." : "Email"}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-white border border-[#d0d0d0] text-[#333] rounded hover:bg-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>

            <button
              onClick={() => {
                const blob = new Blob([], { type: 'application/pdf' });
                // For now just alert - actual download would need pdf blob
                alert("Download feature - would save PDF to your computer");
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] bg-white border border-[#d0d0d0] text-[#333] rounded hover:bg-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-[#888]">Total</div>
            <div className="text-[14px] font-semibold text-[#1e3a5f]">${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#666] hover:text-[#333] hover:bg-[#f0f0f0] rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 p-3">
        <div className="h-full rounded border border-[#d0d0d0] bg-white shadow-sm overflow-hidden">
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            <InvoicePDF invoice={pdfData} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}
