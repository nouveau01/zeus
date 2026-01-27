"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Folder,
  DollarSign,
  CreditCard,
  Package,
  BookOpen,
  Users,
  Truck,
  Settings,
  Briefcase,
  TrendingUp,
  Landmark,
  BarChart3,
  Phone,
  Cog,
} from "lucide-react";
import { useTabs } from "@/context/TabContext";

interface NavItem {
  name: string;
  href?: string;
}

interface NavSection {
  id: string;
  name: string;
  iconName: string;
  children: NavItem[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  DollarSign,
  CreditCard,
  Package,
  BookOpen,
  Users,
  Truck,
  Settings,
  Briefcase,
  TrendingUp,
  Landmark,
  BarChart3,
  Phone,
  Cog,
};

const navStructure: NavSection[] = [
  {
    id: "1",
    name: "AR",
    iconName: "DollarSign",
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
    iconName: "CreditCard",
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
    iconName: "Package",
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
    iconName: "BookOpen",
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
    iconName: "Users",
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
    iconName: "Truck",
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
    name: "Dispatch Extras",
    iconName: "Settings",
    children: [
      { name: "Routes", href: "/dispatch-extras/routes" },
      { name: "Route Planning", href: "/dispatch-extras/route-planning" },
      { name: "Tech Location", href: "/dispatch-extras/tech-location" },
      { name: "Violations", href: "/dispatch-extras/violations" },
      { name: "Safety Tests", href: "/dispatch-extras/safety-tests" },
      { name: "Call Codes", href: "/dispatch-extras/call-codes" },
      { name: "Resolution Codes", href: "/dispatch-extras/resolution-codes" },
      { name: "Unavailability", href: "/dispatch-extras/unavailability" },
      { name: "Dispatch Setup", href: "/dispatch-extras/dispatch-setup" },
      { name: "Forms Setup", href: "/dispatch-extras/forms-setup" },
    ],
  },
  {
    id: "8",
    name: "Job Cost",
    iconName: "Briefcase",
    children: [
      { name: "Job Templates", href: "/job-templates" },
      { name: "Job Maintenance", href: "/job-maintenance" },
      { name: "Post Item To Job", href: "/post-item-to-job" },
      { name: "Job Results", href: "/job-results" },
      { name: "Close Job", href: "/close-job" },
      { name: "Job Types", href: "/job-types" },
      { name: "Job Status", href: "/job-status" },
    ],
  },
  {
    id: "9",
    name: "Sales",
    iconName: "TrendingUp",
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
    id: "10",
    name: "Banking",
    iconName: "Landmark",
    children: [
      { name: "Bank Accounts", href: "/bank-accounts" },
      { name: "Bank Adjustments", href: "/bank-adjustments" },
      { name: "Bank Recons", href: "/bank-recons" },
    ],
  },
  {
    id: "11",
    name: "Reports",
    iconName: "BarChart3",
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
    id: "12",
    name: "Contact",
    iconName: "Phone",
    children: [
      { name: "Contact Listing", href: "/contact-listing" },
      { name: "Things To Do", href: "/things-to-do" },
      { name: "Completed Tasks", href: "/completed-tasks" },
      { name: "Text Message", href: "/text-message" },
      { name: "Custom Contacts", href: "/custom-contacts" },
    ],
  },
  {
    id: "13",
    name: "Control",
    iconName: "Cog",
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
  const [isHydrated, setIsHydrated] = useState(false);
  const [flyoutSection, setFlyoutSection] = useState<string | null>(null);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Load collapsed state from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
    setIsHydrated(true);
  }, []);

  // Persist collapsed state
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("sidebar-collapsed", String(isCollapsed));
    }
  }, [isCollapsed, isHydrated]);

  // Close flyout when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        flyoutRef.current &&
        !flyoutRef.current.contains(event.target as Node) &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setFlyoutSection(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((s) => s !== sectionId)
        : [...prev, sectionId]
    );
  };

  const handleItemClick = (name: string, href: string) => {
    openTab(name, href);
    setFlyoutSection(null);
  };

  // Check if a route is open in any tab
  const isActive = (href: string) => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    return activeTab?.route === href;
  };

  // Get the position for flyout menu
  const getFlyoutPosition = (sectionId: string) => {
    const index = navStructure.findIndex((s) => s.id === sectionId);
    return index * 42 + 32; // 42px per icon+label + 32px for expand button
  };

  // Collapsed view with icons and flyout
  if (isCollapsed) {
    const activeFlyoutSection = navStructure.find((s) => s.id === flyoutSection);

    return (
      <>
        <aside
          ref={sidebarRef}
          className="w-[72px] bg-[#d4d0c8] border-r border-[#808080] flex flex-col flex-shrink-0"
        >
          {/* Expand button at top - prominent styling */}
          <button
            onClick={() => setIsCollapsed(false)}
            className="flex items-center justify-center gap-1 py-2 mx-1 mt-1 mb-1 bg-[#316ac5] hover:bg-[#2a5db0] text-white text-[11px] font-medium rounded shadow-sm"
            title="Expand sidebar"
          >
            <span>Expand</span>
            <ChevronRight className="w-3 h-3" />
          </button>

          {/* Icon list with labels */}
          <div className="flex-1 py-1 flex flex-col gap-0.5 overflow-y-auto">
            {navStructure.map((section) => {
              const hasActiveChild = section.children?.some(
                (child) => child.href && isActive(child.href)
              );
              const isOpen = flyoutSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() =>
                    setFlyoutSection(isOpen ? null : section.id)
                  }
                  className={`mx-1 px-1 py-1 flex flex-col items-center justify-center rounded transition-colors text-[9px]
                    ${isOpen
                      ? "bg-[#316ac5] text-white"
                      : hasActiveChild
                      ? "bg-[#a0c0e8] text-[#000]"
                      : "hover:bg-[#c0c0c0] text-[#000]"
                    }
                  `}
                  title={`${section.id} - ${section.name}`}
                >
                  <div className="flex items-center">
                    {(() => {
                      const Icon = iconMap[section.iconName];
                      return Icon ? <Icon className="w-4 h-4" /> : null;
                    })()}
                    <ChevronRight className="w-3 h-3 text-[#000]" />
                  </div>
                  <span className="mt-0.5 leading-tight text-center whitespace-nowrap">
                    {section.id}-{section.name}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Flyout menu */}
        {flyoutSection && activeFlyoutSection && (
          <div
            ref={flyoutRef}
            className="fixed bg-white border border-[#808080] shadow-lg z-50 min-w-[160px] py-1"
            style={{
              left: "74px",
              top: `${getFlyoutPosition(flyoutSection) + 48}px`, // 48px for header
              maxHeight: "calc(100vh - 100px)",
              overflowY: "auto",
            }}
          >
            {/* Section header */}
            <div className="px-3 py-1.5 bg-[#ececec] border-b border-[#d4d4d4] text-[12px] font-medium text-[#333]">
              {activeFlyoutSection.id} - {activeFlyoutSection.name}
            </div>

            {/* Menu items */}
            {activeFlyoutSection.children.map((item) => (
              <button
                key={item.name}
                onClick={() => item.href && handleItemClick(item.name, item.href)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-[#316ac5] hover:text-white ${
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
      </>
    );
  }

  // Expanded view
  return (
    <aside className="w-44 bg-[#d4d0c8] border-r border-[#808080] flex flex-col flex-shrink-0 text-[12px]">
      {/* Collapse Button at top */}
      <button
        onClick={() => setIsCollapsed(true)}
        className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#d4d0c8] hover:bg-[#c0c0c0] border-b border-[#808080] text-[#000] text-[11px]"
        title="Collapse sidebar"
      >
        <ChevronLeft className="w-3 h-3" />
        <span>Collapse</span>
      </button>

      {/* Tree View */}
      <div className="flex-1 py-0.5 bg-white overflow-y-auto">
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (item.href) {
                          handleItemClick(item.name, item.href);
                        }
                      }}
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
