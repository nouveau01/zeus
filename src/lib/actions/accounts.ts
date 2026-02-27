"use server";

import { fetchAccounts as fetchAccountsData, fetchAccountById as fetchAccountByIdData } from "@/lib/data/accounts";

interface FetchAccountsParams {
  search?: string;
  customerId?: string;
  status?: string;
  officeIds?: string[];
  limit?: number;
}

export async function getAccounts(params: FetchAccountsParams = {}) {
  return fetchAccountsData(params);
}

export async function getAccountById(accountId: string) {
  return fetchAccountByIdData(accountId);
}
