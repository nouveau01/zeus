"use client";

import { useTabs } from "@/context/TabContext";
import CustomersPage from "@/app/customers/page";
import CustomerDetail from "@/app/customers/[id]/CustomerDetail";
import AccountsPage from "@/app/accounts/page";
import AccountDetail from "@/app/accounts/[id]/AccountDetail";

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
