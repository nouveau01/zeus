"use client";

import { useState, useEffect } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import ProposalPDF from "@/components/pdf/ProposalPDF";
import { useXPDialog } from "@/components/ui/XPDialog";

interface ProposalPreviewProps {
  proposalId: string;
  onClose: () => void;
}

export default function ProposalPreview({ proposalId, onClose }: ProposalPreviewProps) {
  const { alert: xpAlert, DialogComponent: XPDialogComponent } = useXPDialog();
  const [proposal, setProposal] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [propRes, compRes] = await Promise.all([
          fetch(`/api/proposals/${proposalId}`),
          fetch("/api/company-settings"),
        ]);
        if (!propRes.ok) throw new Error("Not found");
        const data = await propRes.json();
        setProposal(data);
        if (compRes.ok) {
          setCompany(await compRes.json());
        }
      } catch {
        await xpAlert("Proposal not found.");
        onClose();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [proposalId]);

  if (loading) {
    return <div className="h-full flex items-center justify-center bg-[#c0c0c0] text-[#606060] text-sm">Loading proposal...</div>;
  }

  if (!proposal) return null;

  const customerName = proposal.opportunity?.customer?.name || "";
  const premises = proposal.opportunity?.premises;
  const premiseAddress = premises
    ? `${premises.address || ""}${premises.city ? `, ${premises.city}` : ""}${premises.state ? ` ${premises.state}` : ""}${premises.zipCode ? ` ${premises.zipCode}` : ""}`
    : "";

  return (
    <div className="h-full flex flex-col bg-[#c0c0c0]" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
      {/* Toolbar */}
      <div className="bg-white flex items-center px-3 py-2 border-b border-[#d0d0d0] gap-2">
        <button
          onClick={onClose}
          className="px-3 py-1 border border-[#c0c0c0] rounded text-[11px] bg-[#f0f0f0] hover:bg-[#e0e0e0]"
        >
          Back
        </button>
        <span className="text-[12px] font-semibold text-[#333]">
          Proposal #{proposal.proposalNumber} Preview
        </span>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1">
        <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
          <ProposalPDF
            proposal={proposal}
            customerName={customerName}
            premiseAddress={premiseAddress}
            company={company}
          />
        </PDFViewer>
      </div>
      <XPDialogComponent />
    </div>
  );
}
