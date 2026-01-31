/**
 * Customers Data Access Layer
 *
 * Fetches from SQL Server (Total Service) and mirrors to PostgreSQL (ZEUS)
 * Uses exact same query pattern as /api/sqlserver/customers
 */

import prisma from "@/lib/db";
import sqlserver, { isSqlServerAvailable } from "@/lib/sqlserver";

interface FetchCustomersOptions {
  search?: string;
  type?: string;
  limit?: number;
}

/**
 * Fetch customers from SQL Server and mirror to PostgreSQL
 * Matches /api/sqlserver/customers/route.ts exactly
 */
export async function fetchCustomers(options: FetchCustomersOptions = {}) {
  const { type, limit = 500 } = options;

  if (!isSqlServerAvailable()) {
    console.log("SQL Server not available, reading from PostgreSQL only");
    return fetchCustomersFromPostgres(options);
  }

  try {
    // Use raw SQL for SQL Server 2008 compatibility - exact same as API route
    let query = `SELECT TOP ${limit} * FROM Owner`;
    if (type && type !== "All") {
      query += ` WHERE Type = '${type.replace(/'/g, "''")}'`;
    }
    query += ` ORDER BY ID DESC`;

    // Get owners (customers) from SQL Server
    const owners: any[] = await sqlserver.$queryRawUnsafe(query);

    // Get Rol records for names/addresses
    const rolIds = [...new Set(owners.map(o => o.Rol).filter(Boolean))];
    const rols: any[] = rolIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID IN (${rolIds.join(",")})`)
      : [];

    // Get count of Locs (premises) per owner
    const ownerIds = owners.map(o => o.ID);
    const locCounts: any[] = ownerIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`
          SELECT Owner, COUNT(*) as cnt
          FROM Loc
          WHERE Owner IN (${ownerIds.join(",")})
          GROUP BY Owner
        `)
      : [];

    // Get count of Jobs per owner
    const jobCounts: any[] = ownerIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`
          SELECT Owner, COUNT(*) as cnt
          FROM Job
          WHERE Owner IN (${ownerIds.join(",")})
          GROUP BY Owner
        `)
      : [];

    // Create lookup maps
    const rolMap = new Map(rols.map(r => [r.ID, r]));
    const locCountMap = new Map(locCounts.map(l => [l.Owner, l.cnt]));
    const jobCountMap = new Map(jobCounts.map(j => [j.Owner, j.cnt]));

    // Map to response format matching Customer interface - exact same as API route
    const mappedCustomers = owners.map(owner => {
      const rol = owner.Rol ? rolMap.get(owner.Rol) : null;

      return {
        id: owner.ID.toString(),
        name: rol?.Name || "",
        accountNumber: owner.ID.toString(),
        type: owner.Type || "",
        isActive: owner.Status === 1,
        status: owner.Status,
        balance: owner.Balance || 0,
        address: rol?.Address || null,
        city: rol?.City || null,
        state: rol?.State || null,
        zipCode: rol?.Zip || null,
        contact: rol?.Contact || null,
        phone: rol?.Phone || null,
        fax: rol?.Fax || null,
        email: rol?.EMail || null,
        billing: owner.Billing,
        custom1: owner.Custom1,
        custom2: owner.Custom2,
        portalAccess: owner.Internet === 1,
        remarks: rol?.Remarks || null,
        website: rol?.Website || null,
        cellular: rol?.Cellular || null,
        category: rol?.Category || null,
        createdAt: rol?.Since || null,
        updatedAt: rol?.Last || null,
        _count: {
          premises: locCountMap.get(owner.ID) || 0,
          jobs: jobCountMap.get(owner.ID) || 0,
        },
      };
    });

    return mappedCustomers;
  } catch (error) {
    console.error("Error fetching customers from SQL Server:", error);
    return fetchCustomersFromPostgres(options);
  }
}

/**
 * Fallback: fetch from PostgreSQL only
 */
async function fetchCustomersFromPostgres(options: FetchCustomersOptions) {
  const { type, limit = 500 } = options;

  const where: any = {};
  if (type && type !== "All") {
    where.type = type;
  }

  const customers = await prisma.customer.findMany({
    where,
    take: limit,
    orderBy: { id: "desc" },
    include: {
      _count: {
        select: { premises: true },
      },
    },
  });

  return customers.map(c => ({
    id: c.id,
    name: c.name || "",
    accountNumber: c.id,
    type: c.type || "",
    isActive: c.isActive,
    status: c.isActive ? 1 : 0,
    balance: c.balance || 0,
    address: c.address,
    city: c.city,
    state: c.state,
    zipCode: c.zip,
    contact: c.contact,
    phone: c.phone,
    fax: c.fax,
    email: c.email,
    billing: c.billing,
    custom1: c.custom1,
    custom2: c.custom2,
    remarks: c.remarks,
    _count: {
      premises: c._count.premises,
      jobs: 0,
    },
  }));
}

/**
 * Get a single customer by ID
 */
export async function fetchCustomerById(customerId: string) {
  if (!isSqlServerAvailable()) {
    return prisma.customer.findUnique({
      where: { id: customerId },
      include: { premises: true },
    });
  }

  try {
    const owners: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT * FROM Owner WHERE ID = ${parseInt(customerId)}`
    );

    if (owners.length === 0) {
      return null;
    }

    const owner = owners[0];

    // Get Rol record
    let rol: any = null;
    if (owner.Rol) {
      const rols: any[] = await sqlserver.$queryRawUnsafe(
        `SELECT * FROM Rol WHERE ID = ${owner.Rol}`
      );
      rol = rols[0] || null;
    }

    return {
      id: owner.ID.toString(),
      name: rol?.Name || "",
      accountNumber: owner.ID.toString(),
      type: owner.Type || "",
      isActive: owner.Status === 1,
      status: owner.Status,
      balance: owner.Balance || 0,
      address: rol?.Address || null,
      city: rol?.City || null,
      state: rol?.State || null,
      zipCode: rol?.Zip || null,
      contact: rol?.Contact || null,
      phone: rol?.Phone || null,
      fax: rol?.Fax || null,
      email: rol?.EMail || null,
      billing: owner.Billing,
      custom1: owner.Custom1,
      custom2: owner.Custom2,
      portalAccess: owner.Internet === 1,
      remarks: rol?.Remarks || null,
      website: rol?.Website || null,
      cellular: rol?.Cellular || null,
      createdAt: rol?.Since || null,
      updatedAt: rol?.Last || null,
    };
  } catch (error) {
    console.error("Error fetching customer by ID from SQL Server:", error);
    return prisma.customer.findUnique({
      where: { id: customerId },
      include: { premises: true },
    });
  }
}
