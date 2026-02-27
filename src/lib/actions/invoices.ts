"use server";

import { fetchInvoices as fetchInvoicesData } from "@/lib/data/invoices";

interface FetchInvoicesParams {
  customerId?: string;
  premisesId?: string;
  officeIds?: string[];
  limit?: number;
}

export async function getInvoices(params: FetchInvoicesParams = {}) {
  return fetchInvoicesData(params);
}
