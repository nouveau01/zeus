"use client";

import { useTabs } from "@/context/TabContext";
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
import EstimatesPage from "@/app/estimates/page";
import EstimateDetail from "@/app/estimates/[id]/EstimateDetail";
import AwardJobPage from "@/app/award-job/page";
import BidResultsPage from "@/app/bid-results/page";
import QuotesPage from "@/app/quotes/page";
import QuoteDetail from "@/app/quotes/[id]/QuoteDetail";
import InvoicePreview from "@/app/invoice-preview/[id]/InvoicePreview";
import JobTemplatesPage from "@/app/job-templates/page";

export function TabContent() {
  const { tabs, activeTabId, closeTab } = useTabs();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  // No tabs open - show blank gray screen
  if (!activeTab || activeTab.route === "") {
    return (
      <div className="flex-1 h-full bg-[#c0c0c0]">
        {/* Blank gray screen like Total Service */}
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
