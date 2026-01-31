"use server";

import { fetchJobTemplates as fetchJobTemplatesData, fetchJobTypes as fetchJobTypesData } from "@/lib/data/job-templates";

export async function getJobTemplates() {
  return fetchJobTemplatesData();
}

export async function getJobTypes() {
  return fetchJobTypesData();
}
