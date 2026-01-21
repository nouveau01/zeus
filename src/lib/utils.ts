import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Format date with time
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Format currency
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// Generate job number
export function generateJobNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `JOB-${year}-${random}`;
}

// Generate change order number
export function generateChangeOrderNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `CO-${year}-${random}`;
}

// Status colors mapping
export const statusColors: Record<string, string> = {
  // Job statuses - Bidding Phase
  BID_SUBMITTED: "bg-amber-100 text-amber-800",
  BID_ACCEPTED: "bg-blue-100 text-blue-800",
  CONTRACT_SIGNED: "bg-indigo-100 text-indigo-800",

  // Job statuses - Survey & Engineering Phase
  SURVEY_SCHEDULED: "bg-cyan-100 text-cyan-800",
  SURVEY_COMPLETED: "bg-teal-100 text-teal-800",
  ENGINEERING: "bg-violet-100 text-violet-800",

  // Job statuses - Procurement Phase
  REQS_SUBMITTED: "bg-purple-100 text-purple-800",
  PROCUREMENT_PENDING: "bg-fuchsia-100 text-fuchsia-800",

  // Job statuses - Execution Phase
  READY_TO_INSTALL: "bg-lime-100 text-lime-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  ON_HOLD: "bg-gray-100 text-gray-800",

  // Job statuses - Completion Phase
  COMPLETED: "bg-green-100 text-green-800",
  PUNCH_LIST: "bg-yellow-100 text-yellow-800",
  INVOICED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-gray-100 text-gray-600",

  // Change order statuses
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-amber-100 text-amber-800",
  UNDER_REVIEW: "bg-purple-100 text-purple-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  REVISION_REQUESTED: "bg-orange-100 text-orange-800",

  // Purchase Order statuses
  PENDING_APPROVAL: "bg-amber-100 text-amber-800",
  ORDERED: "bg-blue-100 text-blue-800",
  PARTIALLY_RECEIVED: "bg-yellow-100 text-yellow-800",
  RECEIVED: "bg-green-100 text-green-800",

  // Account statuses
  ACTIVE: "bg-green-100 text-green-800",
  INACTIVE: "bg-gray-100 text-gray-600",

  // Priority
  LOW: "bg-gray-100 text-gray-600",
  NORMAL: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

// Human-readable labels
export const statusLabels: Record<string, string> = {
  // Job statuses - Bidding Phase
  BID_SUBMITTED: "Bid Submitted",
  BID_ACCEPTED: "Bid Accepted",
  CONTRACT_SIGNED: "Contract Signed",

  // Job statuses - Survey & Engineering Phase
  SURVEY_SCHEDULED: "Survey Scheduled",
  SURVEY_COMPLETED: "Survey Completed",
  ENGINEERING: "Engineering",

  // Job statuses - Procurement Phase
  REQS_SUBMITTED: "Reqs Submitted",
  PROCUREMENT_PENDING: "Procurement Pending",

  // Job statuses - Execution Phase
  READY_TO_INSTALL: "Ready to Install",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",

  // Job statuses - Completion Phase
  COMPLETED: "Completed",
  PUNCH_LIST: "Punch List",
  INVOICED: "Invoiced",
  CANCELLED: "Cancelled",

  // Change order statuses
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REVISION_REQUESTED: "Revision Requested",

  // Purchase Order statuses
  PENDING_APPROVAL: "Pending Approval",
  ORDERED: "Ordered",
  PARTIALLY_RECEIVED: "Partially Received",
  RECEIVED: "Received",

  // Job types
  SERVICE_CALL: "Service Call",
  MAINTENANCE: "Maintenance",
  INSPECTION: "Inspection",
  MODERNIZATION: "Modernization",
  INSTALLATION: "Installation",
  EMERGENCY: "Emergency",

  // Priority
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",

  // Account types
  CUSTOMER: "Customer",
  PROSPECT: "Prospect",
  VENDOR: "Vendor",
  PARTNER: "Partner",

  // Account status
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

// External form URLs (JotForm links)
export const externalForms = {
  materialRequisition: "https://nouveauelevator.com", // Placeholder - replace with actual JotForm URL
  changeOrder: "https://nouveauelevator.com", // Placeholder - replace with actual JotForm URL
};
