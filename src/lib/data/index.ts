/**
 * Data Access Layer - Central Export
 *
 * All data fetching functions that pull from SQL Server and mirror to PostgreSQL
 */

// Tickets (Dispatch, Completed Tickets)
export { fetchTickets, fetchTicketById } from "./tickets";

// Customers
export { fetchCustomers, fetchCustomerById } from "./customers";

// Accounts (Premises)
export { fetchAccounts, fetchAccountById } from "./accounts";

// Units (Elevators)
export { fetchUnits, fetchUnitById } from "./units";

// Jobs
export { fetchJobs, fetchJobById } from "./jobs";

// Re-export types if needed
export type { } from "./tickets";
