"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Minus, Folder } from "lucide-react";
import { useTabs } from "@/context/TabContext";

interface NavItem {
  name: string;
  href?: string;
}

interface NavSection {
  id: string;
  name: string;
  children: NavItem[];
}

const navStructure: NavSection[] = [
  {
    id: "1",
    name: "AR",
    children: [
      { name: "Customers", href: "/customers" },
      { name: "Accounts", href: "/accounts" },
      { name: "Invoice Register", href: "/invoices" },
      { name: "Add Invoice", href: "/add-invoice" },
      { name: "Cash Receipts", href: "/cash-receipts" },
      { name: "Add Deposit", href: "/add-deposit" },
      { name: "Apply Payments", href: "/apply-payments" },
      { name: "Process Contracts", href: "/process-contracts" },
      { name: "Collections", href: "/collections" },
      { name: "Renew/Escalate", href: "/renew-escalate" },
      { name: "Charge Interest", href: "/charge-interest" },
      { name: "AR Setup", href: "/ar-setup" },
      { name: "Run Credit Card", href: "/run-credit-card" },
    ],
  },
  {
    id: "2",
    name: "AP",
    children: [
      { name: "Vendors", href: "/vendors" },
      { name: "Purchase Orders", href: "/purchase-orders" },
      { name: "Add New PO", href: "/add-new-po" },
      { name: "Receive Delivery", href: "/receive-delivery" },
      { name: "Purchase Journal", href: "/purchase-journal" },
      { name: "Add AP Invoice", href: "/add-ap-invoice" },
      { name: "Recurring Invoices", href: "/recurring-invoices" },
      { name: "Cash Disburs.", href: "/cash-disburs" },
      { name: "Manual Payment", href: "/manual-payment" },
      { name: "Auto Payment", href: "/auto-payment" },
      { name: "Generate Checks", href: "/generate-checks" },
      { name: "AP Setup", href: "/ap-setup" },
    ],
  },
  {
    id: "3",
    name: "Inventory",
    children: [
      { name: "Inventory Items", href: "/inventory-items" },
      { name: "Warehouses", href: "/warehouses" },
      { name: "Adjustments", href: "/adjustments" },
      { name: "Transfer Items", href: "/transfer-items" },
      { name: "Services", href: "/services" },
      { name: "Tools", href: "/tools" },
      { name: "Check Tool In", href: "/check-tool-in" },
      { name: "Check Tool Out", href: "/check-tool-out" },
      { name: "Tool TF History", href: "/tool-tf-history" },
      { name: "Vehicles", href: "/vehicles" },
      { name: "Update Vehicle", href: "/update-vehicle" },
      { name: "Flat Rates", href: "/flat-rates" },
      { name: "Inventory Types", href: "/inventory-types" },
    ],
  },
  {
    id: "4",
    name: "GL",
    children: [
      { name: "Chart", href: "/chart" },
      { name: "Budgets", href: "/budgets" },
      { name: "GL Adjustments", href: "/gl-adjustments" },
      { name: "Recurring Adjust", href: "/recurring-adjust" },
      { name: "Invoice Register", href: "/gl-invoice-register" },
      { name: "Cash Receipts", href: "/gl-cash-receipts" },
      { name: "Purchase Journal", href: "/gl-purchase-journal" },
      { name: "Cash Disburs.", href: "/gl-cash-disburs" },
    ],
  },
  {
    id: "5",
    name: "Payroll",
    children: [
      { name: "Employees", href: "/employees" },
      { name: "Crews", href: "/crews" },
      { name: "Wage Setup", href: "/wage-setup" },
      { name: "Deduction Setup", href: "/deduction-setup" },
      { name: "Process Payroll", href: "/process-payroll" },
      { name: "Remit Taxes", href: "/remit-taxes" },
      { name: "Payroll Register", href: "/payroll-register" },
      { name: "Year-End Closeout", href: "/year-end-closeout" },
      { name: "Payroll Reports", href: "/payroll-reports" },
      { name: "Time Card Input", href: "/time-card-input" },
      { name: "Manual Payroll", href: "/manual-payroll" },
    ],
  },
  {
    id: "6",
    name: "Dispatch",
    children: [
      { name: "Dispatch Screen", href: "/dispatch" },
      { name: "Resolve Ticket", href: "/resolve-ticket" },
      { name: "Completed Tickets", href: "/completed-tickets" },
      { name: "Create PM Tickets", href: "/create-pm-tickets" },
      { name: "Call Statistics", href: "/call-statistics" },
      { name: "Tablet Tickets", href: "/tablet-tickets" },
      { name: "Units", href: "/units" },
      { name: "Unit Templates", href: "/unit-templates" },
    ],
  },
  {
    id: "7",
    name: "Job Cost",
    children: [
      { name: "Projects", href: "/projects" },
      { name: "P.O. for Project", href: "/po-for-project" },
      { name: "Project Adjustmnt", href: "/project-adjustment" },
      { name: "Project Reports", href: "/project-reports" },
      { name: "Apply Labor", href: "/apply-labor" },
    ],
  },
  {
    id: "8",
    name: "Sales",
    children: [
      { name: "Prospects", href: "/prospects" },
      { name: "Leads", href: "/leads" },
      { name: "Convert Prospect", href: "/convert-prospect" },
      { name: "Estimates", href: "/estimates" },
      { name: "Award Job", href: "/award-job" },
      { name: "Bid Results", href: "/bid-results" },
      { name: "Quotes", href: "/quotes" },
      { name: "Competitors", href: "/competitors" },
      { name: "Territories", href: "/territories" },
      { name: "Sales Setup", href: "/sales-setup" },
    ],
  },
  {
    id: "9",
    name: "Banking",
    children: [
      { name: "Bank Accounts", href: "/bank-accounts" },
      { name: "Bank Adjustments", href: "/bank-adjustments" },
      { name: "Bank Recons", href: "/bank-recons" },
    ],
  },
  {
    id: "10",
    name: "Reports",
    children: [
      { name: "Report Generator", href: "/report-generator" },
      { name: "Aging Reports", href: "/aging-reports" },
      { name: "Balance Sheet", href: "/balance-sheet" },
      { name: "Income Statement", href: "/income-statement" },
      { name: "Comparatives", href: "/comparatives" },
      { name: "Comparative CC", href: "/comparative-cc" },
      { name: "Cost Centers", href: "/cost-centers" },
      { name: "13 Column Report", href: "/13-column-report" },
      { name: "Trial Balance", href: "/trial-balance" },
      { name: "General Ledger", href: "/general-ledger" },
      { name: "Digital Dashboard", href: "/digital-dashboard" },
    ],
  },
  {
    id: "11",
    name: "Contact",
    children: [
      { name: "Contact Listing", href: "/contact-listing" },
      { name: "Things To Do", href: "/things-to-do" },
      { name: "Completed Tasks", href: "/completed-tasks" },
      { name: "Text Message", href: "/text-message" },
      { name: "Custom Contacts", href: "/custom-contacts" },
    ],
  },
  {
    id: "12",
    name: "Control",
    children: [
      { name: "Users", href: "/users" },
      { name: "Zones", href: "/zones" },
      { name: "Sales Tax Regions", href: "/sales-tax-regions" },
      { name: "Indexes", href: "/indexes" },
      { name: "Quick Codes", href: "/quick-codes" },
      { name: "Events Log", href: "/events-log" },
      { name: "Holidays", href: "/holidays" },
      { name: "Control Panel", href: "/control-panel" },
      { name: "Period Closeout", href: "/period-closeout" },
      { name: "Set Custom Labels", href: "/set-custom-labels" },
      { name: "Support Request", href: "/support-request" },
      { name: "TFM-A Config", href: "/tfm-a-config" },
    ],
  },
];

export function Sidebar() {
  const { tabs, activeTabId, openTab } = useTabs();
  const [expandedSections, setExpandedSections] = useState<string[]>(["1"]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleItemClick = (name: string, href: string) => {
    openTab(name, href);
  };

  // Check if a route is open in any tab
  const isActive = (href: string) => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    return activeTab?.route === href;
  };

  if (isCollapsed) {
    return (
      <aside className="w-8 bg-[#d4d0c8] border-r border-[#808080] flex flex-col flex-shrink-0">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-[#c0c0c0] text-[#000] flex items-center justify-center"
          title="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-52 bg-[#d4d0c8] border-r border-[#808080] flex flex-col flex-shrink-0 overflow-y-auto text-[13px]">
      {/* Collapse button */}
      <div className="flex items-center justify-end px-1 py-0.5 border-b border-[#808080] bg-[#d4d0c8]">
        <button
          onClick={() => setIsCollapsed(true)}
          className="px-1 hover:bg-[#c0c0c0] text-[#000]"
          title="Collapse sidebar"
        >
          <Minus className="w-3 h-3" />
        </button>
      </div>

      {/* Tree View */}
      <div className="flex-1 py-0.5 bg-white">
        {navStructure.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const hasActiveChild = section.children?.some((child) => child.href && isActive(child.href));

          return (
            <div key={section.id}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center gap-1 px-1 py-0.5 text-left hover:bg-[#316ac5] hover:text-white ${
                  hasActiveChild && !isExpanded ? "bg-[#316ac5] text-white" : "text-[#000]"
                }`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                )}
                <span className="font-normal">{section.id} - {section.name}</span>
              </button>

              {/* Section Children */}
              {isExpanded && section.children && (
                <div className="ml-3 flex flex-col">
                  {section.children.map((item) => (
                    <button
                      key={item.name}
                      onClick={() => item.href && handleItemClick(item.name, item.href)}
                      className={`flex items-center gap-1 px-1 py-0.5 text-left hover:bg-[#316ac5] hover:text-white ${
                        item.href && isActive(item.href)
                          ? "bg-[#316ac5] text-white"
                          : "text-[#000]"
                      }`}
                    >
                      <Folder className="w-4 h-4 text-[#e8c56c] flex-shrink-0" />
                      <span className="whitespace-nowrap">{item.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
