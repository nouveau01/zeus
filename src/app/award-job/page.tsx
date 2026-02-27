"use client";

import { useState, useEffect } from "react";
import { useTabs } from "@/context/TabContext";
import { useXPDialog } from "@/components/ui/XPDialog";

interface Estimate {
  id: string;
  estimateNumber: string;
  customerId: string;
  customerName: string;
  accountId: string;
  accountName: string;
  name: string;
  description: string;
  type: string;
  category: string;
  tag: string;
  remarks: string;
  amount: number;
  bidDate: string;
  status: string;
}

interface CompetitorBid {
  id: string;
  company: string;
  amount: number;
  isAwarded: boolean;
  notes: string;
}

// Mock estimates data
const mockEstimates: Estimate[] = [
  {
    id: "est-001",
    estimateNumber: "EST-2024-001",
    customerId: "cust-001",
    customerName: "Empire State Building",
    accountId: "acc-001",
    accountName: "Empire State Realty Trust",
    name: "Elevator Modernization Phase 1",
    description: "Complete modernization of passenger elevators 1-4",
    type: "Modernization",
    category: "Capital Improvement",
    tag: "HIGH-PRIORITY",
    remarks: "Customer requested expedited timeline",
    amount: 450000,
    bidDate: "2024-01-15",
    status: "Sent",
  },
  {
    id: "est-002",
    estimateNumber: "EST-2024-002",
    customerId: "cust-002",
    customerName: "One World Trade Center",
    accountId: "acc-002",
    accountName: "Durst Organization",
    name: "Annual Maintenance Contract",
    description: "Full service maintenance for all 73 elevators",
    type: "Service Contract",
    category: "Maintenance",
    tag: "RENEWAL",
    remarks: "Existing customer - renewal bid",
    amount: 1200000,
    bidDate: "2024-01-20",
    status: "Sent",
  },
  {
    id: "est-003",
    estimateNumber: "EST-2024-003",
    customerId: "cust-003",
    customerName: "Chrysler Building",
    accountId: "acc-003",
    accountName: "RXR Acquisition",
    name: "Safety System Upgrade",
    description: "Upgrade safety systems on freight elevators",
    type: "Repair",
    category: "Safety Compliance",
    tag: "URGENT",
    remarks: "Required by DOB inspection findings",
    amount: 85000,
    bidDate: "2024-01-10",
    status: "Sent",
  },
];

// Mock competitor bids
const mockCompetitorBids: Record<string, CompetitorBid[]> = {
  "est-001": [
    { id: "bid-001", company: "Nouveau Elevator (Us)", amount: 450000, isAwarded: false, notes: "Our bid" },
    { id: "bid-002", company: "Otis Elevator Co.", amount: 485000, isAwarded: false, notes: "" },
    { id: "bid-003", company: "Schindler Elevator", amount: 472000, isAwarded: false, notes: "" },
    { id: "bid-004", company: "ThyssenKrupp", amount: 468000, isAwarded: false, notes: "" },
  ],
  "est-002": [
    { id: "bid-005", company: "Nouveau Elevator (Us)", amount: 1200000, isAwarded: false, notes: "Our bid" },
    { id: "bid-006", company: "KONE Corporation", amount: 1150000, isAwarded: false, notes: "Incumbent" },
    { id: "bid-007", company: "Otis Elevator Co.", amount: 1280000, isAwarded: false, notes: "" },
  ],
  "est-003": [
    { id: "bid-008", company: "Nouveau Elevator (Us)", amount: 85000, isAwarded: false, notes: "Our bid" },
    { id: "bid-009", company: "Local Elevator Services", amount: 78000, isAwarded: false, notes: "" },
  ],
};

// Job types and categories
const jobTypes = ["Modernization", "Repair", "Service Contract", "Installation", "Inspection", "Consultation"];
const jobCategories = ["Capital Improvement", "Maintenance", "Safety Compliance", "New Construction", "Emergency"];

export default function AwardJobPage() {
  const { openTab } = useTabs();
  const { alert: xpAlert, confirm: xpConfirm, DialogComponent: XPDialogComponent } = useXPDialog();
  const [selectedEstimateId, setSelectedEstimateId] = useState<string>("");
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [competitorBids, setCompetitorBids] = useState<CompetitorBid[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form fields (editable copy of estimate data)
  const [formData, setFormData] = useState({
    bidDate: "",
    name: "",
    description: "",
    type: "",
    category: "",
    jobId: "",
    tag: "",
    remarks: "",
  });

  // Load estimate data when selection changes
  useEffect(() => {
    if (selectedEstimateId) {
      setIsLoading(true);
      // Simulate API call
      setTimeout(() => {
        const estimate = mockEstimates.find((e) => e.id === selectedEstimateId);
        if (estimate) {
          setSelectedEstimate(estimate);
          setFormData({
            bidDate: estimate.bidDate,
            name: estimate.name,
            description: estimate.description,
            type: estimate.type,
            category: estimate.category,
            jobId: "", // Auto-generated on award
            tag: estimate.tag,
            remarks: estimate.remarks,
          });
          setCompetitorBids(mockCompetitorBids[estimate.id] || []);
        }
        setIsLoading(false);
      }, 300);
    } else {
      setSelectedEstimate(null);
      setCompetitorBids([]);
      setFormData({
        bidDate: "",
        name: "",
        description: "",
        type: "",
        category: "",
        jobId: "",
        tag: "",
        remarks: "",
      });
    }
  }, [selectedEstimateId]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAwardToggle = (bidId: string) => {
    setCompetitorBids((prev) =>
      prev.map((bid) => ({
        ...bid,
        isAwarded: bid.id === bidId ? !bid.isAwarded : false, // Only one can be awarded
      }))
    );
  };

  const handleAddCompetitor = () => {
    const newBid: CompetitorBid = {
      id: `bid-new-${Date.now()}`,
      company: "",
      amount: 0,
      isAwarded: false,
      notes: "",
    };
    setCompetitorBids((prev) => [...prev, newBid]);
  };

  const handleCompetitorChange = (bidId: string, field: keyof CompetitorBid, value: string | number) => {
    setCompetitorBids((prev) =>
      prev.map((bid) => (bid.id === bidId ? { ...bid, [field]: value } : bid))
    );
  };

  const handleDeleteCompetitor = (bidId: string) => {
    setCompetitorBids((prev) => prev.filter((bid) => bid.id !== bidId));
  };

  const handleAwardJob = async () => {
    const awardedBid = competitorBids.find((b) => b.isAwarded);
    if (!awardedBid) {
      await xpAlert("Please select which company won the bid before awarding the job.");
      return;
    }
    if (!selectedEstimate) {
      await xpAlert("Please select an estimate first.");
      return;
    }

    // Generate job ID
    const jobId = `JOB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    const isOurWin = awardedBid.company.toLowerCase().includes("nouveau") || awardedBid.company.toLowerCase().includes("us");

    if (isOurWin) {
      await xpAlert(`Job ${jobId} has been created!\n\nEstimate: ${selectedEstimate.estimateNumber}\nCustomer: ${selectedEstimate.customerName}\nAmount: $${awardedBid.amount.toLocaleString()}\n\nThe job will now appear in Job Maintenance.`);
      // In real app, would navigate to the new job
      openTab("Job Maintenance", "/job-maintenance");
    } else {
      await xpAlert(`Bid result recorded.\n\nEstimate: ${selectedEstimate.estimateNumber}\nAwarded to: ${awardedBid.company}\nAmount: $${awardedBid.amount.toLocaleString()}\n\nThis estimate has been marked as lost.`);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter to only show estimates that can be awarded (Sent status)
  const awardableEstimates = mockEstimates.filter((e) => e.status === "Sent");

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0]">
      {/* Header */}
      <div className="bg-[#d4d0c8] border-b border-[#808080] px-3 py-1.5 flex items-center justify-between">
        <h1 className="text-[13px] font-bold text-[#000]">Award Job</h1>
        <div className="flex gap-1">
          <button
            onClick={handleAwardJob}
            disabled={!selectedEstimate || !competitorBids.some((b) => b.isAwarded)}
            className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
          >
            Award Job
          </button>
          <button
            className="px-3 py-1 text-[11px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8]"
            style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-3 overflow-auto">
        <div className="flex gap-4">
          {/* Left Panel - Estimate Details Form */}
          <div
            className="w-[400px] flex-shrink-0 bg-white border border-[#808080] p-3"
            style={{ boxShadow: "inset -1px -1px 0 #fff, inset 1px 1px 0 #404040" }}
          >
            {/* Estimate Selection */}
            <div className="mb-3 pb-3 border-b border-[#c0c0c0]">
              <label className="block text-[11px] font-bold text-[#000] mb-1">
                Select Estimate:
              </label>
              <select
                value={selectedEstimateId}
                onChange={(e) => setSelectedEstimateId(e.target.value)}
                className="w-full px-2 py-1 text-[11px] border border-[#808080] bg-white"
              >
                <option value="">-- Select an Estimate --</option>
                {awardableEstimates.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.estimateNumber} - {est.customerName} ({formatCurrency(est.amount)})
                  </option>
                ))}
              </select>
            </div>

            {selectedEstimate && (
              <>
                {/* Links to Customer and Account */}
                <div className="mb-3 pb-3 border-b border-[#c0c0c0]">
                  <div className="flex gap-4 text-[11px]">
                    <div>
                      <span className="text-[#606060]">Customer: </span>
                      <button
                        onClick={() => openTab(selectedEstimate.customerName, `/customers/${selectedEstimate.customerId}`)}
                        className="text-[#0066cc] hover:underline"
                      >
                        {selectedEstimate.customerName}
                      </button>
                    </div>
                    <div>
                      <span className="text-[#606060]">Account: </span>
                      <button
                        onClick={() => openTab(selectedEstimate.accountName, `/accounts/${selectedEstimate.accountId}`)}
                        className="text-[#0066cc] hover:underline"
                      >
                        {selectedEstimate.accountName}
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 text-[11px]">
                    <span className="text-[#606060]">Estimate: </span>
                    <button
                      onClick={() => openTab(`Estimate ${selectedEstimate.estimateNumber}`, `/estimates/${selectedEstimate.id}`)}
                      className="text-[#0066cc] hover:underline"
                    >
                      {selectedEstimate.estimateNumber}
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-2">
                  <div className="flex items-center">
                    <label className="w-24 text-[11px] text-[#000]">Bid Date:</label>
                    <input
                      type="date"
                      value={formData.bidDate}
                      onChange={(e) => handleFieldChange("bidDate", e.target.value)}
                      className="flex-1 px-2 py-0.5 text-[11px] border border-[#808080]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-24 text-[11px] text-[#000]">Name:</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      className="flex-1 px-2 py-0.5 text-[11px] border border-[#808080]"
                    />
                  </div>

                  <div className="flex items-start">
                    <label className="w-24 text-[11px] text-[#000] pt-1">Description:</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleFieldChange("description", e.target.value)}
                      rows={2}
                      className="flex-1 px-2 py-0.5 text-[11px] border border-[#808080] resize-none"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-24 text-[11px] text-[#000]">Type:</label>
                    <select
                      value={formData.type}
                      onChange={(e) => handleFieldChange("type", e.target.value)}
                      className="flex-1 px-2 py-0.5 text-[11px] border border-[#808080]"
                    >
                      <option value="">-- Select --</option>
                      {jobTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="w-24 text-[11px] text-[#000]">Category:</label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleFieldChange("category", e.target.value)}
                      className="flex-1 px-2 py-0.5 text-[11px] border border-[#808080]"
                    >
                      <option value="">-- Select --</option>
                      {jobCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="w-24 text-[11px] text-[#000]">Job ID:</label>
                    <input
                      type="text"
                      value={formData.jobId}
                      placeholder="(Auto-generated on award)"
                      disabled
                      className="flex-1 px-2 py-0.5 text-[11px] border border-[#808080] bg-[#e8e8e8]"
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="w-24 text-[11px] text-[#000]">Tag:</label>
                    <input
                      type="text"
                      value={formData.tag}
                      onChange={(e) => handleFieldChange("tag", e.target.value)}
                      className="flex-1 px-2 py-0.5 text-[11px] border border-[#808080]"
                    />
                  </div>

                  <div className="flex items-start">
                    <label className="w-24 text-[11px] text-[#000] pt-1">Remarks:</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => handleFieldChange("remarks", e.target.value)}
                      rows={3}
                      className="flex-1 px-2 py-0.5 text-[11px] border border-[#808080] resize-none"
                    />
                  </div>
                </div>

                {/* Estimate Amount Summary */}
                <div className="mt-3 pt-3 border-t border-[#c0c0c0]">
                  <div className="flex justify-between text-[11px]">
                    <span className="font-bold">Our Bid Amount:</span>
                    <span className="font-bold">{formatCurrency(selectedEstimate.amount)}</span>
                  </div>
                </div>
              </>
            )}

            {!selectedEstimate && !isLoading && (
              <div className="text-center text-[11px] text-[#606060] py-8">
                Select an estimate to view details and award the job.
              </div>
            )}

            {isLoading && (
              <div className="text-center text-[11px] text-[#606060] py-8">
                Loading estimate...
              </div>
            )}
          </div>

          {/* Right Panel - Competitor Bids */}
          <div
            className="flex-1 bg-white border border-[#808080] flex flex-col"
            style={{ boxShadow: "inset -1px -1px 0 #fff, inset 1px 1px 0 #404040" }}
          >
            <div className="bg-[#d4d0c8] px-3 py-1.5 border-b border-[#808080] flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#000]">Competitor Bids</span>
              <button
                onClick={handleAddCompetitor}
                disabled={!selectedEstimate}
                className="px-2 py-0.5 text-[10px] bg-[#d4d0c8] border border-[#808080] hover:bg-[#e8e8e8] disabled:opacity-50"
                style={{ boxShadow: "inset 1px 1px 0 #fff, inset -1px -1px 0 #404040" }}
              >
                + Add Competitor
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-[11px]">
                <thead className="bg-[#d4d0c8] sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1 border-b border-r border-[#808080] font-normal">
                      Company
                    </th>
                    <th className="text-right px-2 py-1 border-b border-r border-[#808080] font-normal w-28">
                      Amount
                    </th>
                    <th className="text-center px-2 py-1 border-b border-r border-[#808080] font-normal w-16">
                      Award
                    </th>
                    <th className="text-left px-2 py-1 border-b border-r border-[#808080] font-normal w-32">
                      Notes
                    </th>
                    <th className="text-center px-2 py-1 border-b border-[#808080] font-normal w-12">

                    </th>
                  </tr>
                </thead>
                <tbody>
                  {competitorBids.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-[#606060]">
                        {selectedEstimate
                          ? "No competitor bids recorded. Click '+ Add Competitor' to add bids."
                          : "Select an estimate to view and manage competitor bids."}
                      </td>
                    </tr>
                  ) : (
                    competitorBids.map((bid, index) => {
                      const isOurs = bid.company.toLowerCase().includes("nouveau") || bid.company.toLowerCase().includes("us");
                      return (
                        <tr
                          key={bid.id}
                          className={`${index % 2 === 0 ? "bg-white" : "bg-white"} ${
                            bid.isAwarded ? "bg-[#d4edda]" : ""
                          } ${isOurs ? "font-semibold" : ""}`}
                        >
                          <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">
                            <input
                              type="text"
                              value={bid.company}
                              onChange={(e) => handleCompetitorChange(bid.id, "company", e.target.value)}
                              className={`w-full px-1 py-0.5 border border-[#c0c0c0] text-[11px] ${
                                isOurs ? "bg-[#fff3cd]" : ""
                              }`}
                              placeholder="Company name"
                            />
                          </td>
                          <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">
                            <input
                              type="number"
                              value={bid.amount || ""}
                              onChange={(e) =>
                                handleCompetitorChange(bid.id, "amount", parseFloat(e.target.value) || 0)
                              }
                              className="w-full px-1 py-0.5 border border-[#c0c0c0] text-[11px] text-right"
                              placeholder="0"
                            />
                          </td>
                          <td className="px-2 py-1 border-b border-r border-[#e0e0e0] text-center">
                            <input
                              type="checkbox"
                              checked={bid.isAwarded}
                              onChange={() => handleAwardToggle(bid.id)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-2 py-1 border-b border-r border-[#e0e0e0]">
                            <input
                              type="text"
                              value={bid.notes}
                              onChange={(e) => handleCompetitorChange(bid.id, "notes", e.target.value)}
                              className="w-full px-1 py-0.5 border border-[#c0c0c0] text-[11px]"
                              placeholder="Notes"
                            />
                          </td>
                          <td className="px-2 py-1 border-b border-[#e0e0e0] text-center">
                            <button
                              onClick={() => handleDeleteCompetitor(bid.id)}
                              className="text-[#cc0000] hover:underline text-[10px]"
                            >
                              Del
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            {competitorBids.length > 0 && (
              <div className="bg-[#d4d0c8] px-3 py-2 border-t border-[#808080]">
                <div className="flex justify-between text-[11px]">
                  <div>
                    <span className="text-[#606060]">Total Bids: </span>
                    <span className="font-bold">{competitorBids.length}</span>
                  </div>
                  <div>
                    <span className="text-[#606060]">Lowest Bid: </span>
                    <span className="font-bold">
                      {formatCurrency(Math.min(...competitorBids.filter((b) => b.amount > 0).map((b) => b.amount)))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#606060]">Highest Bid: </span>
                    <span className="font-bold">
                      {formatCurrency(Math.max(...competitorBids.map((b) => b.amount)))}
                    </span>
                  </div>
                  {competitorBids.some((b) => b.isAwarded) && (
                    <div>
                      <span className="text-[#606060]">Awarded To: </span>
                      <span className="font-bold text-[#28a745]">
                        {competitorBids.find((b) => b.isAwarded)?.company}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="bg-[#d4d0c8] border-t border-[#808080] px-3 py-1.5">
        <p className="text-[10px] text-[#606060]">
          Select an estimate, add competitor bids, check the "Award" box for the winning company, then click "Award Job" to create the job or record the loss.
        </p>
      </div>
      <XPDialogComponent />
    </div>
  );
}
