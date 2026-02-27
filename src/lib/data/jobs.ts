/**
 * Jobs Data Access Layer
 *
 * Fetches from SQL Server (Total Service) and mirrors to PostgreSQL (ZEUS)
 */

import prisma from "@/lib/db";
import sqlserver, { isSqlServerAvailable } from "@/lib/sqlserver";

interface FetchJobsOptions {
  search?: string;
  type?: string;
  status?: string;
  premisesId?: string;
  officeIds?: string[];
  limit?: number;
}

/**
 * Fetch jobs from SQL Server and mirror to PostgreSQL
 */
export async function fetchJobs(options: FetchJobsOptions = {}) {
  const { search, type, status, premisesId, limit = 500 } = options;

  if (!isSqlServerAvailable()) {
    console.log("SQL Server not available, reading from PostgreSQL only");
    return fetchJobsFromPostgres(options);
  }

  try {
    const conditions: string[] = [];

    if (search) {
      conditions.push(`(j.ID LIKE '%${search}%' OR j.fDesc LIKE '%${search}%')`);
    }
    if (type && type !== "All") {
      conditions.push(`jt.Type = '${type}'`);
    }
    if (status === "Open") {
      conditions.push(`j.Status = 0`);
    } else if (status === "Closed") {
      conditions.push(`j.Status = 1`);
    }
    if (premisesId) {
      conditions.push(`j.Loc = ${parseInt(premisesId)}`);
    }

    let query = `
      SELECT TOP ${limit}
        j.ID,
        j.Loc,
        j.Owner,
        j.Status,
        j.Type,
        j.fDesc,
        j.fDate,
        j.CDate,
        j.CBy,
        j.Mech,
        j.Super,
        j.Est,
        j.Budget,
        j.PO,
        j.Custom1,
        j.Custom2,
        j.Custom3,
        j.Remark,
        j.fCreated,
        j.fModified,
        jt.Type as TypeName,
        l.ID as LocDisplayId,
        l.Tag as LocTag,
        lr.Address as LocAddress,
        lr.City as LocCity,
        lr.State as LocState,
        o.ID as OwnerID,
        oRol.Name as OwnerName
      FROM Job j
      LEFT JOIN JobType jt ON j.Type = jt.ID
      LEFT JOIN Loc l ON j.Loc = l.Loc
      LEFT JOIN Rol lr ON l.Rol = lr.ID
      LEFT JOIN Owner o ON j.Owner = o.ID
      LEFT JOIN Rol oRol ON o.Rol = oRol.ID
    `;

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY j.ID DESC`;

    const jobs: any[] = await sqlserver.$queryRawUnsafe(query);

    // Map and mirror each job
    const mappedJobs = await Promise.all(jobs.map(async (j) => {
      const mappedJob = {
        id: j.ID.toString(),
        externalId: j.ID.toString(),
        jobName: j.fDesc || `Job ${j.ID}`,
        description: j.fDesc || "",
        status: j.Status === 0 ? "Open" : "Closed",
        type: j.TypeName || "",
        typeId: j.Type,
        jobDate: j.fDate,
        closedDate: j.CDate,
        closedBy: j.CBy || "",
        mechanic: j.Mech?.toString() || "",
        supervisor: j.Super?.toString() || "",
        estimate: j.Est,
        budget: j.Budget,
        poNumber: j.PO || "",
        custom1: j.Custom1 || "",
        custom2: j.Custom2 || "",
        custom3: j.Custom3 || "",
        remarks: j.Remark || "",
        createdAt: j.fCreated,
        updatedAt: j.fModified,
        premisesId: j.Loc?.toString() || null,
        accountDisplayId: j.LocDisplayId || "",
        premisesTag: j.LocTag || "",
        premisesAddress: j.LocAddress || "",
        premisesCity: j.LocCity || "",
        premisesState: j.LocState || "",
        customerId: j.OwnerID?.toString() || null,
        customerName: j.OwnerName || "",
      };

      // Mirror to PostgreSQL
      await mirrorJobToPostgres(mappedJob);

      return mappedJob;
    }));

    return mappedJobs;
  } catch (error) {
    console.error("Error fetching jobs from SQL Server:", error);
    return fetchJobsFromPostgres(options);
  }
}

/**
 * Mirror a job to PostgreSQL
 */
async function mirrorJobToPostgres(job: any) {
  try {
    await prisma.job.upsert({
      where: { id: job.id },
      update: {
        externalId: job.externalId,
        jobName: job.jobName,
        description: job.description,
        status: job.status,
        jobType: job.type,
        estimate: job.estimate,
        budget: job.budget,
        poNumber: job.poNumber,
        remarks: job.remarks,
      },
      create: {
        id: job.id,
        externalId: job.externalId,
        jobName: job.jobName,
        description: job.description,
        status: job.status,
        jobType: job.type,
        estimate: job.estimate,
        budget: job.budget,
        poNumber: job.poNumber,
        remarks: job.remarks,
        premisesId: job.premisesId,
        customerId: job.customerId,
      },
    });
  } catch (error) {
    console.error("Error mirroring job to PostgreSQL:", error);
  }
}

/**
 * Fallback: fetch from PostgreSQL only
 */
async function fetchJobsFromPostgres(options: FetchJobsOptions) {
  const { search, type, status, premisesId, officeIds, limit = 500 } = options;

  const where: any = {};

  if (search) {
    where.OR = [
      { externalId: { contains: search, mode: "insensitive" } },
      { jobName: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }
  if (type && type !== "All") {
    where.jobType = type;
  }
  if (status && status !== "All") {
    where.status = status;
  }
  if (premisesId) {
    where.premisesId = premisesId;
  }
  if (officeIds && officeIds.length > 0) {
    where.premises = { ...where.premises, OR: [{ officeId: { in: officeIds } }, { officeId: null }] };
  }

  const jobs = await prisma.job.findMany({
    where,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      premises: true,
      customer: true,
    },
  });

  return jobs.map(j => ({
    id: j.id,
    externalId: j.externalId,
    jobName: j.jobName,
    description: j.description,
    status: j.status,
    type: j.jobType,
    estimate: j.estimate,
    budget: j.budget,
    poNumber: j.poNumber,
    remarks: j.remarks,
    premisesId: j.premisesId,
    accountDisplayId: (j.premises as any)?.premisesId || (j.premises as any)?.locId || (j.premises as any)?.name || "",
    premisesTag: j.premises?.tag || "",
    premisesAddress: j.premises?.address || "",
    customerId: j.customerId,
    customerName: j.customer?.name || "",
  }));
}

/**
 * Get a single job by ID
 */
export async function fetchJobById(jobId: string) {
  if (!isSqlServerAvailable()) {
    return prisma.job.findUnique({
      where: { id: jobId },
      include: {
        premises: true,
        customer: true,
        tickets: true,
      },
    });
  }

  try {
    const query = `
      SELECT TOP 1
        j.ID,
        j.Loc,
        j.Owner,
        j.Status,
        j.Type,
        j.fDesc,
        j.fDate,
        j.CDate,
        j.CBy,
        j.Mech,
        j.Super,
        j.Est,
        j.Budget,
        j.PO,
        j.Custom1,
        j.Custom2,
        j.Custom3,
        j.Remark,
        j.fCreated,
        j.fModified,
        jt.Type as TypeName,
        l.ID as LocDisplayId,
        l.Tag as LocTag,
        lr.Address as LocAddress,
        lr.City as LocCity,
        lr.State as LocState,
        o.ID as OwnerID,
        oRol.Name as OwnerName
      FROM Job j
      LEFT JOIN JobType jt ON j.Type = jt.ID
      LEFT JOIN Loc l ON j.Loc = l.Loc
      LEFT JOIN Rol lr ON l.Rol = lr.ID
      LEFT JOIN Owner o ON j.Owner = o.ID
      LEFT JOIN Rol oRol ON o.Rol = oRol.ID
      WHERE j.ID = ${parseInt(jobId)}
    `;

    const jobs: any[] = await sqlserver.$queryRawUnsafe(query);

    if (jobs.length === 0) {
      return null;
    }

    const j = jobs[0];
    const mappedJob = {
      id: j.ID.toString(),
      externalId: j.ID.toString(),
      jobName: j.fDesc || `Job ${j.ID}`,
      description: j.fDesc || "",
      status: j.Status === 0 ? "Open" : "Closed",
      type: j.TypeName || "",
      typeId: j.Type,
      jobDate: j.fDate,
      closedDate: j.CDate,
      closedBy: j.CBy || "",
      mechanic: j.Mech?.toString() || "",
      supervisor: j.Super?.toString() || "",
      estimate: j.Est,
      budget: j.Budget,
      poNumber: j.PO || "",
      custom1: j.Custom1 || "",
      custom2: j.Custom2 || "",
      custom3: j.Custom3 || "",
      remarks: j.Remark || "",
      createdAt: j.fCreated,
      updatedAt: j.fModified,
      premisesId: j.Loc?.toString() || null,
      accountDisplayId: j.LocDisplayId || "",
      premisesTag: j.LocTag || "",
      premisesAddress: j.LocAddress || "",
      premisesCity: j.LocCity || "",
      premisesState: j.LocState || "",
      customerId: j.OwnerID?.toString() || null,
      customerName: j.OwnerName || "",
    };

    // Mirror to PostgreSQL
    await mirrorJobToPostgres(mappedJob);

    return mappedJob;
  } catch (error) {
    console.error("Error fetching job by ID from SQL Server:", error);
    return prisma.job.findUnique({
      where: { id: jobId },
      include: { premises: true, customer: true, tickets: true },
    });
  }
}
