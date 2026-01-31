"use server";

import { fetchJobs as fetchJobsData, fetchJobById as fetchJobByIdData } from "@/lib/data/jobs";

interface FetchJobsParams {
  search?: string;
  type?: string;
  status?: string;
  premisesId?: string;
  limit?: number;
}

export async function getJobs(params: FetchJobsParams = {}) {
  return fetchJobsData(params);
}

export async function getJobById(jobId: string) {
  return fetchJobByIdData(jobId);
}
