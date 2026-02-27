"use server";

/**
 * Server Actions for Tickets
 *
 * These are called directly from client components - no API routes needed
 */

import { fetchTickets as fetchTicketsData, fetchTicketById as fetchTicketByIdData } from "@/lib/data/tickets";

interface FetchTicketsParams {
  status?: "Open" | "Completed" | "All";
  type?: string;
  startDate?: string;
  endDate?: string;
  premisesId?: string;
  officeIds?: string[];
  limit?: number;
}

/**
 * Fetch tickets - called from client components
 */
export async function getTickets(params: FetchTicketsParams = {}) {
  return fetchTicketsData(params);
}

/**
 * Fetch a single ticket by ID
 */
export async function getTicketById(ticketId: string | number) {
  return fetchTicketByIdData(ticketId);
}

/**
 * Fetch call history for a premises (tickets associated with that location)
 */
export async function getCallHistory(premisesId: string) {
  const [openTickets, completedTickets] = await Promise.all([
    fetchTicketsData({ premisesId, status: "Open", limit: 20 }),
    fetchTicketsData({ premisesId, status: "Completed", limit: 20 }),
  ]);

  // Combine and sort by date
  const allTickets = [...openTickets, ...completedTickets].sort((a: any, b: any) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return allTickets.slice(0, 20);
}
