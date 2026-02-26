// Central registry of all modules and their fields for the permissions system.
// When new modules or fields are added, update this registry.

export interface ModuleField {
  fieldName: string;
  label: string;
}

export interface ModuleDefinition {
  pageId: string;
  label: string;
  section: string; // Sidebar section name
  fields: ModuleField[];
}

export const MODULE_REGISTRY: ModuleDefinition[] = [
  // AR
  {
    pageId: "customers",
    label: "Customers",
    section: "AR",
    fields: [
      { fieldName: "name", label: "Name" },
      { fieldName: "type", label: "Type" },
      { fieldName: "status", label: "Status" },
      { fieldName: "accts", label: "Accts" },
      { fieldName: "units", label: "Units" },
      { fieldName: "balance", label: "Balance" },
    ],
  },
  {
    pageId: "accounts",
    label: "Accounts",
    section: "AR",
    fields: [
      { fieldName: "premisesId", label: "Account" },
      { fieldName: "address", label: "Address" },
      { fieldName: "city", label: "City" },
      { fieldName: "type", label: "Type" },
      { fieldName: "status", label: "Status" },
      { fieldName: "units", label: "Units" },
      { fieldName: "balance", label: "Balance" },
    ],
  },
  {
    pageId: "invoices",
    label: "Invoice Register",
    section: "AR",
    fields: [
      { fieldName: "invoiceNumber", label: "Inv #" },
      { fieldName: "postingDate", label: "Posted" },
      { fieldName: "date", label: "Date" },
      { fieldName: "type", label: "Type" },
      { fieldName: "account", label: "Account" },
      { fieldName: "job", label: "Job" },
      { fieldName: "total", label: "Total" },
      { fieldName: "status", label: "Status" },
    ],
  },
  {
    pageId: "cash-receipts",
    label: "Cash Receipts",
    section: "AR",
    fields: [
      { fieldName: "date", label: "Date" },
      { fieldName: "refNumber", label: "Ref" },
      { fieldName: "description", label: "Description" },
      { fieldName: "bankAccount", label: "Bank" },
      { fieldName: "amount", label: "Amount" },
    ],
  },
  {
    pageId: "collections",
    label: "Collections",
    section: "AR",
    fields: [
      { fieldName: "id", label: "ID" },
      { fieldName: "tag", label: "Tag" },
      { fieldName: "city", label: "City" },
      { fieldName: "status", label: "Status" },
      { fieldName: "balance", label: "Balance" },
      { fieldName: "age0_30", label: "0-30" },
      { fieldName: "age31_60", label: "31-60" },
      { fieldName: "age61_90", label: "61-90" },
      { fieldName: "age91Plus", label: "91 & Up" },
    ],
  },
  {
    pageId: "renew-escalate",
    label: "Renew/Escalate",
    section: "AR",
    fields: [
      { fieldName: "id", label: "ID" },
      { fieldName: "tag", label: "Tag" },
      { fieldName: "type", label: "Ty" },
      { fieldName: "bill", label: "Bill" },
      { fieldName: "esc", label: "Esc" },
      { fieldName: "lastEsc", label: "Last Esc" },
      { fieldName: "nextDue", label: "Next Due" },
      { fieldName: "prvYear", label: "Prv Year" },
      { fieldName: "total", label: "Total" },
      { fieldName: "current", label: "Current" },
      { fieldName: "new", label: "New" },
    ],
  },
  // AP
  {
    pageId: "vendors",
    label: "Vendors",
    section: "AP",
    fields: [
      { fieldName: "vendorId", label: "ID #" },
      { fieldName: "name", label: "Name" },
      { fieldName: "status", label: "Status" },
      { fieldName: "type", label: "Type" },
      { fieldName: "balance", label: "Balance" },
    ],
  },
  {
    pageId: "purchase-orders",
    label: "Purchase Orders",
    section: "AP",
    fields: [
      { fieldName: "poNumber", label: "PO #" },
      { fieldName: "date", label: "Date" },
      { fieldName: "desc", label: "Desc" },
      { fieldName: "vendorName", label: "Vendor" },
      { fieldName: "status", label: "Status" },
      { fieldName: "approved", label: "Approved" },
      { fieldName: "amount", label: "Amount" },
    ],
  },
  {
    pageId: "purchase-journal",
    label: "Purchase Journal",
    section: "AP",
    fields: [
      { fieldName: "date", label: "Date" },
      { fieldName: "ref", label: "Ref" },
      { fieldName: "desc", label: "Desc" },
      { fieldName: "vendorName", label: "Vendor" },
      { fieldName: "status", label: "Status" },
      { fieldName: "amount", label: "Amount" },
      { fieldName: "remaining", label: "Remaining" },
      { fieldName: "poNumber", label: "PO #" },
    ],
  },
  // Dispatch
  {
    pageId: "dispatch",
    label: "Dispatch Screen",
    section: "Dispatch",
    fields: [
      { fieldName: "ticketNumber", label: "Ticket #" },
      { fieldName: "woNumber", label: "W/O #" },
      { fieldName: "type", label: "Type" },
      { fieldName: "account", label: "Account" },
      { fieldName: "address", label: "Address" },
      { fieldName: "unit", label: "Unit" },
      { fieldName: "description", label: "Description" },
      { fieldName: "status", label: "Status" },
      { fieldName: "callDate", label: "Call Date" },
      { fieldName: "scheduled", label: "Scheduled" },
      { fieldName: "worker", label: "Worker" },
      { fieldName: "city", label: "City" },
      { fieldName: "state", label: "State" },
    ],
  },
  {
    pageId: "completed-tickets",
    label: "Completed Tickets",
    section: "Dispatch",
    fields: [
      { fieldName: "ticketNumber", label: "Tick #" },
      { fieldName: "workOrder", label: "W/O#" },
      { fieldName: "date", label: "Date" },
      { fieldName: "type", label: "Type" },
      { fieldName: "category", label: "Category" },
      { fieldName: "accountId", label: "ID" },
      { fieldName: "account", label: "Account" },
      { fieldName: "mechCrew", label: "Mech/Crew" },
      { fieldName: "bill", label: "Bill" },
      { fieldName: "reviewed", label: "Rw" },
      { fieldName: "pr", label: "PR" },
      { fieldName: "vd", label: "Vd" },
      { fieldName: "inv", label: "Inv" },
      { fieldName: "hours", label: "Hours" },
      { fieldName: "invoice", label: "Invoice" },
      { fieldName: "job", label: "Job" },
      { fieldName: "unit", label: "Unit" },
      { fieldName: "emailStatus", label: "Email Status" },
    ],
  },
  {
    pageId: "units",
    label: "Units",
    section: "Dispatch",
    fields: [
      { fieldName: "accountId", label: "Account Name" },
      { fieldName: "accountTag", label: "Account Tag" },
      { fieldName: "unitNumber", label: "Unit #" },
      { fieldName: "type", label: "Type" },
      { fieldName: "category", label: "Category" },
      { fieldName: "building", label: "Building" },
      { fieldName: "customerName", label: "Customer" },
      { fieldName: "status", label: "Status" },
      { fieldName: "stateNumber", label: "State #" },
    ],
  },
  {
    pageId: "routes",
    label: "Routes",
    section: "Dispatch Extras",
    fields: [
      { fieldName: "name", label: "Name" },
      { fieldName: "mechanic", label: "Mech" },
      { fieldName: "accountCount", label: "Loc" },
      { fieldName: "unitCount", label: "Elev" },
      { fieldName: "hours", label: "Hour" },
      { fieldName: "projectedRevenue", label: "Amount" },
      { fieldName: "remarks", label: "Remarks" },
    ],
  },
  {
    pageId: "violations",
    label: "Violations",
    section: "Dispatch Extras",
    fields: [
      { fieldName: "visibleId", label: "ID" },
      { fieldName: "violation", label: "Violation" },
      { fieldName: "date", label: "Date" },
      { fieldName: "accountId", label: "Account ID" },
      { fieldName: "accountTag", label: "Account" },
      { fieldName: "unit", label: "Unit" },
      { fieldName: "stateNumber", label: "State #" },
      { fieldName: "status", label: "Status" },
      { fieldName: "supervisor", label: "Supervisor" },
    ],
  },
  {
    pageId: "safety-tests",
    label: "Safety Tests",
    section: "Dispatch Extras",
    fields: [
      { fieldName: "testId", label: "Test ID" },
      { fieldName: "date", label: "Date" },
      { fieldName: "accountId", label: "Account ID" },
      { fieldName: "accountTag", label: "Account" },
      { fieldName: "unit", label: "Unit" },
      { fieldName: "testType", label: "Type" },
      { fieldName: "status", label: "Status" },
      { fieldName: "inspector", label: "Inspector" },
    ],
  },
  // Job Cost
  {
    pageId: "job-maintenance",
    label: "Job Maintenance",
    section: "Job Cost",
    fields: [
      { fieldName: "externalId", label: "Job #" },
      { fieldName: "date", label: "Date" },
      { fieldName: "template", label: "Template" },
      { fieldName: "accountTag", label: "Account Tag" },
      { fieldName: "description", label: "Description" },
      { fieldName: "type", label: "Type" },
      { fieldName: "status", label: "Status" },
    ],
  },
  {
    pageId: "job-results",
    label: "Job Results",
    section: "Job Cost",
    fields: [
      { fieldName: "jobNumber", label: "Job #" },
      { fieldName: "accountId", label: "Account" },
      { fieldName: "tag", label: "Tag" },
      { fieldName: "description", label: "Description" },
      { fieldName: "type", label: "Type" },
      { fieldName: "revenueBilled", label: "Revenue Billed" },
      { fieldName: "materials", label: "Materials" },
      { fieldName: "labor", label: "Labor" },
      { fieldName: "committed", label: "Committed" },
      { fieldName: "totalCost", label: "Total Cost" },
      { fieldName: "profit", label: "Profit" },
      { fieldName: "ratio", label: "Ratio" },
      { fieldName: "budget", label: "Budget" },
      { fieldName: "toBeBilled", label: "To Be Billed" },
      { fieldName: "billedPercent", label: "Billed %" },
      { fieldName: "address", label: "Address" },
    ],
  },
  // Sales
  {
    pageId: "estimates",
    label: "Estimates",
    section: "Sales",
    fields: [
      { fieldName: "estimateNumber", label: "Estimate #" },
      { fieldName: "customerName", label: "Customer" },
      { fieldName: "accountName", label: "Account" },
      { fieldName: "amount", label: "Amount" },
      { fieldName: "status", label: "Status" },
      { fieldName: "createdDate", label: "Created" },
      { fieldName: "expirationDate", label: "Expires" },
      { fieldName: "salesperson", label: "Salesperson" },
    ],
  },
  {
    pageId: "bid-results",
    label: "Bid Results",
    section: "Sales",
    fields: [
      { fieldName: "estimateNumber", label: "Estimate #" },
      { fieldName: "customerName", label: "Customer" },
      { fieldName: "projectName", label: "Project" },
      { fieldName: "type", label: "Type" },
      { fieldName: "ourBidAmount", label: "Our Bid" },
      { fieldName: "bidDate", label: "Bid Date" },
      { fieldName: "status", label: "Status" },
      { fieldName: "winningBidder", label: "Winner" },
      { fieldName: "winningAmount", label: "Win Amount" },
      { fieldName: "jobNumber", label: "Job #" },
    ],
  },
  {
    pageId: "quotes",
    label: "Quotes",
    section: "Sales",
    fields: [
      { fieldName: "quoteNumber", label: "Quote #" },
      { fieldName: "customerName", label: "Customer" },
      { fieldName: "subject", label: "Subject" },
      { fieldName: "contactName", label: "Contact" },
      { fieldName: "total", label: "Total" },
      { fieldName: "createdDate", label: "Created" },
      { fieldName: "expirationDate", label: "Expires" },
      { fieldName: "status", label: "Status" },
      { fieldName: "salesRep", label: "Sales Rep" },
    ],
  },
];

// Group modules by section for the UI
export function getModulesBySection(): Record<string, ModuleDefinition[]> {
  const grouped: Record<string, ModuleDefinition[]> = {};
  for (const mod of MODULE_REGISTRY) {
    if (!grouped[mod.section]) grouped[mod.section] = [];
    grouped[mod.section].push(mod);
  }
  return grouped;
}

// Get a single module definition by pageId
export function getModuleByPageId(pageId: string): ModuleDefinition | undefined {
  return MODULE_REGISTRY.find((m) => m.pageId === pageId);
}
