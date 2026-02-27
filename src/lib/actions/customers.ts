"use server";

import { fetchCustomers as fetchCustomersData, fetchCustomerById as fetchCustomerByIdData } from "@/lib/data/customers";

interface FetchCustomersParams {
  search?: string;
  status?: string;
  officeIds?: string[];
  limit?: number;
}

export async function getCustomers(params: FetchCustomersParams = {}) {
  return fetchCustomersData(params);
}

export async function getCustomerById(customerId: string) {
  return fetchCustomerByIdData(customerId);
}
