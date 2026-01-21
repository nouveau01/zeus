"use client";

import { useTabs } from "@/context/TabContext";
import CustomersPage from "@/app/customers/page";
import CustomerDetail from "@/app/customers/[id]/CustomerDetail";
import AccountsPage from "@/app/accounts/page";
import AccountDetail from "@/app/accounts/[id]/AccountDetail";
import InvoicesPage from "@/app/invoices/page";
import InvoiceDetail from "@/app/invoices/[id]/InvoiceDetail";
import CompletedTicketsPage from "@/app/completed-tickets/page";
import CompletedTicketDetail from "@/app/completed-tickets/[id]/CompletedTicketDetail";
import JobMaintenancePage from "@/app/job-maintenance/page";
import JobDetail from "@/app/job-maintenance/[id]/JobDetail";
import JobResultsPage from "@/app/job-results/page";
import JobResultDetail from "@/app/job-results/[id]/JobResultDetail";

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

  // Check for account detail route pattern: /accounts/[id]
  const accountDetailMatch = activeTab.route.match(/^\/accounts\/(.+)$/);
  if (accountDetailMatch) {
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
    return <InvoicesPage premisesId={premisesId} />;
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
    return <CompletedTicketsPage premisesId={premisesId} />;
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
    return <JobMaintenancePage premisesId={premisesId} />;
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
    return <JobResultsPage premisesId={premisesId} />;
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
