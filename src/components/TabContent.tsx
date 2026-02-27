"use client";

import { useTabs } from "@/context/TabContext";
import { usePermissions } from "@/context/PermissionsContext";
import { ShieldX } from "lucide-react";
import CustomersPage from "@/app/customers/page";
import CustomerDetail from "@/app/customers/[id]/CustomerDetail";
import AccountsPage from "@/app/accounts/page";
import AccountDetail from "@/app/accounts/[id]/AccountDetail";
import InvoicesView from "@/app/invoices/InvoicesView";
import InvoiceDetail from "@/app/invoices/[id]/InvoiceDetail";
import CompletedTicketsView from "@/app/completed-tickets/CompletedTicketsView";
import CompletedTicketDetail from "@/app/completed-tickets/[id]/CompletedTicketDetail";
import JobMaintenanceView from "@/app/job-maintenance/JobMaintenanceView";
import JobDetail from "@/app/job-maintenance/[id]/JobDetail";
import JobResultsView from "@/app/job-results/JobResultsView";
import JobResultDetail from "@/app/job-results/[id]/JobResultDetail";
import CashReceiptsPage from "@/app/cash-receipts/page";
import CashReceiptDetail from "@/app/cash-receipts/[id]/CashReceiptDetail";
import ApplyPaymentsPage from "@/app/apply-payments/page";
import ProcessContractsPage from "@/app/process-contracts/page";
import CollectionsPage from "@/app/collections/page";
import RenewEscalatePage from "@/app/renew-escalate/page";
import VendorsPage from "@/app/vendors/page";
import VendorDetail from "@/app/vendors/[id]/VendorDetail";
import PurchaseOrdersPage from "@/app/purchase-orders/page";
import PurchaseOrderDetail from "@/app/purchase-orders/[id]/PurchaseOrderDetail";
import PurchaseJournalPage from "@/app/purchase-journal/page";
import JournalEntryDetail from "@/app/purchase-journal/[id]/JournalEntryDetail";
import UnitsPage from "@/app/units/page";
import UnitDetail from "@/app/units/[id]/UnitDetail";
import DispatchPage from "@/app/dispatch/page";
import ViolationsPage from "@/app/dispatch-extras/violations/page";
import ViolationDetail from "@/app/dispatch-extras/violations/[id]/ViolationDetail";
import SafetyTestsPage from "@/app/dispatch-extras/safety-tests/page";
import SafetyTestDetail from "@/app/dispatch-extras/safety-tests/[id]/SafetyTestDetail";
import RoutesPage from "@/app/dispatch-extras/routes/page";
import EstimatesPage from "@/app/estimates/page";
import EstimateDetail from "@/app/estimates/[id]/EstimateDetail";
import AwardJobPage from "@/app/award-job/page";
import BidResultsPage from "@/app/bid-results/page";
import QuotesPage from "@/app/quotes/page";
import QuoteDetail from "@/app/quotes/[id]/QuoteDetail";
import InvoicePreview from "@/app/invoice-preview/[id]/InvoicePreview";
import JobTemplatesPage from "@/app/job-templates/page";
import AIReportsView from "@/app/ai-reports/AIReportsView";
import EmailTemplatesView from "@/app/automation/emails/EmailTemplatesView";
import SettingsPage from "@/app/settings/page";

// Map routes to module pageIds for permission checks
// Detail routes (e.g. /customers/123) inherit from their parent module
function getPageIdFromRoute(route: string): string | null {
  // Strip query params for matching
  const path = route.split("?")[0];

  // Direct route mappings
  const routeMap: Record<string, string> = {
    "/customers": "customers",
    "/accounts": "accounts",
    "/invoices": "invoices",
    "/cash-receipts": "cash-receipts",
    "/collections": "collections",
    "/renew-escalate": "renew-escalate",
    "/vendors": "vendors",
    "/purchase-orders": "purchase-orders",
    "/purchase-journal": "purchase-journal",
    "/dispatch": "dispatch",
    "/completed-tickets": "completed-tickets",
    "/open-tickets": "completed-tickets",
    "/units": "units",
    "/dispatch-extras/routes": "routes",
    "/dispatch-extras/violations": "violations",
    "/dispatch-extras/safety-tests": "safety-tests",
    "/job-maintenance": "job-maintenance",
    "/job-results": "job-results",
    "/estimates": "estimates",
    "/bid-results": "bid-results",
    "/quotes": "quotes",
    "/automation/email-templates": "email-templates",
    "/automation/email-sequences": "email-sequences",
  };

  if (routeMap[path]) return routeMap[path];

  // Detail route patterns — inherit from parent module
  if (path.startsWith("/customers/")) return "customers";
  if (path.startsWith("/accounts/")) return "accounts";
  if (path.startsWith("/invoices/")) return "invoices";
  if (path.startsWith("/cash-receipts/")) return "cash-receipts";
  if (path.startsWith("/vendors/")) return "vendors";
  if (path.startsWith("/purchase-orders/")) return "purchase-orders";
  if (path.startsWith("/purchase-journal/")) return "purchase-journal";
  if (path.startsWith("/completed-tickets/")) return "completed-tickets";
  if (path.startsWith("/units/")) return "units";
  if (path.startsWith("/dispatch-extras/violations/")) return "violations";
  if (path.startsWith("/dispatch-extras/safety-tests/")) return "safety-tests";
  if (path.startsWith("/job-maintenance/")) return "job-maintenance";
  if (path.startsWith("/job-results/")) return "job-results";
  if (path.startsWith("/estimates/")) return "estimates";
  if (path.startsWith("/quotes/")) return "quotes";

  return null; // No permission check needed (settings, ai-reports, etc.)
}

export function TabContent() {
  const { tabs, activeTabId, closeTab } = useTabs();
  const { canAccessPage, isLoading: permissionsLoading } = usePermissions();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // No tabs open or blank tab - show welcome screen
  if (!activeTab || activeTab.route === "") {
    return (
      <div className="flex-1 h-full bg-[#c0c0c0] flex flex-col items-center justify-center">
        <div className="text-center">
          <h2
            className="text-3xl font-bold mb-2"
            style={{
              fontFamily: "'SF Pro Display', 'Inter', system-ui, sans-serif",
              color: "#1e3a5f",
            }}
          >
            Z.E.U.S.
          </h2>
          <p className="text-[#606060] text-sm">
            Select a module from the sidebar to get started
          </p>
        </div>
      </div>
    );
  }

  // Check page-level access permission
  const pageId = getPageIdFromRoute(activeTab.route);
  if (pageId && !permissionsLoading && !canAccessPage(pageId)) {
    return (
      <div className="flex-1 h-full bg-[#c0c0c0] flex items-center justify-center">
        <div className="bg-white border-2 border-[#808080] shadow-md p-6 max-w-sm text-center" style={{ fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
          <div className="w-12 h-12 bg-[#fee2e2] rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldX className="w-6 h-6 text-[#dc2626]" />
          </div>
          <h2 className="text-[14px] font-semibold text-[#333] mb-2">Access Denied</h2>
          <p className="text-[12px] text-[#666]">
            Your role does not have permission to access this module. Contact your administrator to request access.
          </p>
        </div>
      </div>
    );
  }

  // Check for customer detail route pattern: /customers/[id]
  const customerDetailMatch = activeTab.route.match(/^\/customers\/(.+)$/);
  if (customerDetailMatch) {
    const customerId = customerDetailMatch[1];
    return (
      <CustomerDetail
        customerId={customerId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for account detail route pattern: /accounts/[id] or /accounts/new?customerId=xxx
  const accountDetailMatch = activeTab.route.match(/^\/accounts\/(.+)$/);
  if (accountDetailMatch) {
    // Pass the full path including query params for new accounts
    const accountId = accountDetailMatch[1];
    return (
      <AccountDetail
        accountId={accountId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for invoices route with optional premisesId filter (before invoice detail check)
  // This handles /invoices and /invoices?premisesId=xxx
  if (activeTab.route === "/invoices" || activeTab.route.startsWith("/invoices?")) {
    const url = new URL(activeTab.route, "http://localhost");
    const premisesId = url.searchParams.get("premisesId");
    return <InvoicesView premisesId={premisesId} />;
  }

  // Check for invoice detail route pattern: /invoices/[id]
  const invoiceDetailMatch = activeTab.route.match(/^\/invoices\/([^?]+)$/);
  if (invoiceDetailMatch) {
    const invoiceId = invoiceDetailMatch[1];
    return (
      <InvoiceDetail
        invoiceId={invoiceId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for completed-tickets route with optional premisesId filter (before ticket detail check)
  // This handles /completed-tickets and /completed-tickets?premisesId=xxx
  if (activeTab.route === "/completed-tickets" || activeTab.route.startsWith("/completed-tickets?")) {
    const url = new URL(activeTab.route, "http://localhost");
    const premisesId = url.searchParams.get("premisesId");
    return <CompletedTicketsView premisesId={premisesId} />;
  }

  // Check for open-tickets route with optional premisesId filter
  // This handles /open-tickets and /open-tickets?premisesId=xxx
  if (activeTab.route === "/open-tickets" || activeTab.route.startsWith("/open-tickets?")) {
    const url = new URL(activeTab.route, "http://localhost");
    const premisesId = url.searchParams.get("premisesId");
    return <CompletedTicketsView premisesId={premisesId} defaultStatus="Open" />;
  }

  // Check for completed ticket detail route pattern: /completed-tickets/[id]
  const ticketDetailMatch = activeTab.route.match(/^\/completed-tickets\/([^?]+)$/);
  if (ticketDetailMatch) {
    const ticketId = ticketDetailMatch[1];
    return (
      <CompletedTicketDetail
        ticketId={ticketId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for job-maintenance route with optional premisesId filter (before job detail check)
  // This handles /job-maintenance and /job-maintenance?premisesId=xxx
  if (activeTab.route === "/job-maintenance" || activeTab.route.startsWith("/job-maintenance?")) {
    const url = new URL(activeTab.route, "http://localhost");
    const premisesId = url.searchParams.get("premisesId");
    return <JobMaintenanceView premisesId={premisesId} />;
  }

  // Check for job detail route pattern: /job-maintenance/[id]
  const jobDetailMatch = activeTab.route.match(/^\/job-maintenance\/([^?]+)$/);
  if (jobDetailMatch) {
    const jobId = jobDetailMatch[1];
    return (
      <JobDetail
        jobId={jobId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for job-results route with optional premisesId filter
  // This handles /job-results and /job-results?premisesId=xxx
  if (activeTab.route === "/job-results" || activeTab.route.startsWith("/job-results?")) {
    const url = new URL(activeTab.route, "http://localhost");
    const premisesId = url.searchParams.get("premisesId");
    return <JobResultsView premisesId={premisesId} />;
  }

  // Check for job-results detail route pattern: /job-results/[id]
  const jobResultDetailMatch = activeTab.route.match(/^\/job-results\/([^?]+)$/);
  if (jobResultDetailMatch) {
    const jobId = jobResultDetailMatch[1];
    return (
      <JobResultDetail
        jobId={jobId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for cash-receipts route
  if (activeTab.route === "/cash-receipts") {
    return <CashReceiptsPage />;
  }

  // Check for cash-receipts detail route pattern: /cash-receipts/[id]
  const cashReceiptDetailMatch = activeTab.route.match(/^\/cash-receipts\/([^?]+)$/);
  if (cashReceiptDetailMatch) {
    const depositId = cashReceiptDetailMatch[1];
    return (
      <CashReceiptDetail
        depositId={depositId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for apply-payments route
  if (activeTab.route === "/apply-payments") {
    return <ApplyPaymentsPage />;
  }

  // Check for process-contracts route
  if (activeTab.route === "/process-contracts") {
    return <ProcessContractsPage />;
  }

  // Check for collections route
  if (activeTab.route === "/collections") {
    return <CollectionsPage />;
  }

  // Check for renew-escalate route
  if (activeTab.route === "/renew-escalate") {
    return <RenewEscalatePage />;
  }

  // Check for vendors route
  if (activeTab.route === "/vendors") {
    return <VendorsPage />;
  }

  // Check for vendor detail route pattern: /vendors/[id]
  const vendorDetailMatch = activeTab.route.match(/^\/vendors\/([^?]+)$/);
  if (vendorDetailMatch) {
    const vendorId = vendorDetailMatch[1];
    return (
      <VendorDetail
        vendorId={vendorId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for purchase-orders route
  if (activeTab.route === "/purchase-orders") {
    return <PurchaseOrdersPage />;
  }

  // Check for purchase-journal route
  if (activeTab.route === "/purchase-journal") {
    return <PurchaseJournalPage />;
  }

  // Check for purchase-journal detail route pattern: /purchase-journal/[id]
  const journalDetailMatch = activeTab.route.match(/^\/purchase-journal\/([^?]+)$/);
  if (journalDetailMatch) {
    const entryId = journalDetailMatch[1];
    return (
      <JournalEntryDetail
        entryId={entryId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for purchase-order detail route pattern: /purchase-orders/[id]
  const poDetailMatch = activeTab.route.match(/^\/purchase-orders\/([^?]+)$/);
  if (poDetailMatch) {
    const poId = poDetailMatch[1];
    return (
      <PurchaseOrderDetail
        poId={poId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for units route
  if (activeTab.route === "/units") {
    return <UnitsPage />;
  }

  // Check for unit detail route pattern: /units/[id]
  const unitDetailMatch = activeTab.route.match(/^\/units\/([^?]+)$/);
  if (unitDetailMatch) {
    const unitId = unitDetailMatch[1];
    return (
      <UnitDetail
        unitId={unitId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for dispatch route
  if (activeTab.route === "/dispatch") {
    return <DispatchPage />;
  }

  // Check for violations route
  if (activeTab.route === "/violations" || activeTab.route === "/dispatch-extras/violations") {
    return <ViolationsPage />;
  }

  // Check for violation detail route pattern: /dispatch-extras/violations/[id]
  const violationDetailMatch = activeTab.route.match(/^\/dispatch-extras\/violations\/([^?]+)$/);
  if (violationDetailMatch) {
    const violationId = violationDetailMatch[1];
    return (
      <ViolationDetail
        violationId={violationId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for safety-tests route
  if (activeTab.route === "/dispatch-extras/safety-tests") {
    return <SafetyTestsPage />;
  }

  // Check for safety-test detail route pattern: /dispatch-extras/safety-tests/[id]
  const safetyTestDetailMatch = activeTab.route.match(/^\/dispatch-extras\/safety-tests\/([^?]+)$/);
  if (safetyTestDetailMatch) {
    const testId = safetyTestDetailMatch[1];
    return (
      <SafetyTestDetail
        testId={testId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for routes (maintenance routes) page
  if (activeTab.route === "/dispatch-extras/routes") {
    return <RoutesPage />;
  }

  // Check for estimates route
  if (activeTab.route === "/estimates") {
    return <EstimatesPage />;
  }

  // Check for estimate detail route pattern: /estimates/[id]
  const estimateDetailMatch = activeTab.route.match(/^\/estimates\/([^?]+)$/);
  if (estimateDetailMatch) {
    const estimateId = estimateDetailMatch[1];
    return (
      <EstimateDetail
        estimateId={estimateId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for award-job route
  if (activeTab.route === "/award-job") {
    return <AwardJobPage />;
  }

  // Check for bid-results route
  if (activeTab.route === "/bid-results") {
    return <BidResultsPage />;
  }

  // Check for job-templates route
  if (activeTab.route === "/job-templates") {
    return <JobTemplatesPage />;
  }

  // Check for quotes route
  if (activeTab.route === "/quotes") {
    return <QuotesPage />;
  }

  // Check for quote detail route pattern: /quotes/[id]
  const quoteDetailMatch = activeTab.route.match(/^\/quotes\/([^?]+)$/);
  if (quoteDetailMatch) {
    const quoteId = quoteDetailMatch[1];
    return (
      <QuoteDetail
        quoteId={quoteId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for invoice preview route pattern: /invoice-preview/[id]
  const invoicePreviewMatch = activeTab.route.match(/^\/invoice-preview\/([^?]+)$/);
  if (invoicePreviewMatch) {
    const invoiceId = invoicePreviewMatch[1];
    return (
      <InvoicePreview
        invoiceId={invoiceId}
        onClose={() => closeTab(activeTab.id)}
      />
    );
  }

  // Check for ai-reports / report-generator route
  if (activeTab.route === "/ai-reports" || activeTab.route === "/report-generator") {
    return <AIReportsView />;
  }

  // Check for automation routes
  if (activeTab.route === "/automation/email-templates") {
    return <EmailTemplatesView />;
  }

  // Check for settings route
  if (activeTab.route === "/settings") {
    return <SettingsPage />;
  }

  // Render based on route
  switch (activeTab.route) {
    case "/customers":
      return <CustomersPage />;
    case "/accounts":
      return <AccountsPage />;
    default:
      return (
        <div className="flex-1 h-full bg-[#c0c0c0] flex items-center justify-center">
          <span className="text-[#606060] text-sm">
            {activeTab.title} - Coming soon
          </span>
        </div>
      );
  }
}
