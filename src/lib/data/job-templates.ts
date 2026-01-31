/**
 * Job Templates Data Access Layer
 *
 * Fetches from SQL Server (Total Service) and mirrors to PostgreSQL (ZEUS)
 */

import prisma from "@/lib/db";
import sqlserver, { isSqlServerAvailable } from "@/lib/sqlserver";

/**
 * Fetch job templates from SQL Server
 */
export async function fetchJobTemplates() {
  if (!isSqlServerAvailable()) {
    console.log("SQL Server not available, reading from PostgreSQL only");
    return fetchJobTemplatesFromPostgres();
  }

  try {
    const query = `
      SELECT
        ID,
        Name,
        Type,
        fDesc,
        Budget,
        En,
        fCreated,
        fModified
      FROM JobTemp
      ORDER BY Name
    `;

    const templates: any[] = await sqlserver.$queryRawUnsafe(query);

    // Get job types for mapping
    const typeIds = [...new Set(templates.map(t => t.Type).filter(Boolean))];
    let jobTypes: any[] = [];
    if (typeIds.length > 0) {
      jobTypes = await sqlserver.$queryRawUnsafe(`SELECT * FROM JobType WHERE ID IN (${typeIds.join(",")})`);
    }
    const typeMap = new Map(jobTypes.map(jt => [jt.ID, jt.Type || jt.Name]));

    const mappedTemplates = templates.map(t => ({
      id: t.ID.toString(),
      name: t.Name || "",
      type: typeMap.get(t.Type) || "",
      typeId: t.Type,
      description: t.fDesc || "",
      budget: t.Budget,
      isActive: t.En === 1,
      createdAt: t.fCreated,
      updatedAt: t.fModified,
    }));

    return mappedTemplates;
  } catch (error) {
    console.error("Error fetching job templates from SQL Server:", error);
    return fetchJobTemplatesFromPostgres();
  }
}

async function fetchJobTemplatesFromPostgres() {
  const templates = await prisma.jobTemplate.findMany({
    orderBy: { name: "asc" },
  });

  return templates.map(t => ({
    id: t.id,
    name: t.name,
    type: t.jobType,
    description: t.description,
    isActive: t.isActive,
  }));
}

/**
 * Fetch job types from SQL Server
 */
export async function fetchJobTypes() {
  if (!isSqlServerAvailable()) {
    console.log("SQL Server not available, reading from PostgreSQL only");
    return fetchJobTypesFromPostgres();
  }

  try {
    const query = `
      SELECT
        ID,
        Type,
        Name,
        En,
        fCreated,
        fModified
      FROM JobType
      ORDER BY Type
    `;

    const types: any[] = await sqlserver.$queryRawUnsafe(query);

    const mappedTypes = types.map(t => ({
      id: t.ID.toString(),
      type: t.Type || t.Name || "",
      name: t.Name || t.Type || "",
      isActive: t.En === 1,
      createdAt: t.fCreated,
      updatedAt: t.fModified,
    }));

    return mappedTypes;
  } catch (error) {
    console.error("Error fetching job types from SQL Server:", error);
    return fetchJobTypesFromPostgres();
  }
}

async function fetchJobTypesFromPostgres() {
  const types = await prisma.jobType.findMany({
    orderBy: { name: "asc" },
  });

  return types.map(t => ({
    id: t.id,
    type: t.name,
    name: t.name,
    isActive: true,
  }));
}
