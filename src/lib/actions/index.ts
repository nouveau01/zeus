"use server";

/**
 * Server Actions - Central Export
 *
 * All server actions that client components can call directly
 */

// Tickets
export { getTickets, getTicketById, getCallHistory } from "./tickets";

// Customers
export { getCustomers, getCustomerById } from "./customers";

// Accounts
export { getAccounts, getAccountById } from "./accounts";

// Units
export { getUnits, getUnitById } from "./units";

// Jobs
export { getJobs, getJobById } from "./jobs";
