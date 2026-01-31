"use server";

import { fetchUnits as fetchUnitsData, fetchUnitById as fetchUnitByIdData } from "@/lib/data/units";

interface FetchUnitsParams {
  search?: string;
  premisesId?: string;
  status?: string;
  limit?: number;
}

export async function getUnits(params: FetchUnitsParams = {}) {
  return fetchUnitsData(params);
}

export async function getUnitById(unitId: string) {
  return fetchUnitByIdData(unitId);
}
