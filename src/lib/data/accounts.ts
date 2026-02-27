/**
 * Accounts (Premises) Data Access Layer
 *
 * Fetches from SQL Server (Total Service) and mirrors to PostgreSQL (ZEUS)
 * Uses exact same query pattern as /api/sqlserver/premises
 */

import prisma from "@/lib/db";
import sqlserver, { isSqlServerAvailable } from "@/lib/sqlserver";

interface FetchAccountsOptions {
  search?: string;
  filter?: string;
  customerId?: string;
  officeIds?: string[];
  limit?: number;
}

/**
 * Fetch accounts/premises from SQL Server
 * Matches /api/sqlserver/premises/route.ts exactly
 */
export async function fetchAccounts(options: FetchAccountsOptions = {}) {
  const { search, filter, customerId, limit = 500 } = options;

  if (!isSqlServerAvailable()) {
    console.log("SQL Server not available, reading from PostgreSQL only");
    return fetchAccountsFromPostgres(options);
  }

  try {
    // Use raw SQL for SQL Server 2008 compatibility - exact same as API route
    let query = `SELECT TOP ${limit} * FROM Loc`;
    const conditions: string[] = [];

    if (search) {
      const escaped = search.replace(/'/g, "''");
      conditions.push(`(Tag LIKE '%${escaped}%' OR ID LIKE '%${escaped}%' OR Address LIKE '%${escaped}%' OR City LIKE '%${escaped}%')`);
    }
    if (filter && filter !== "All") {
      conditions.push(`Type = '${filter.replace(/'/g, "''")}'`);
    }
    if (customerId) {
      conditions.push(`Owner = ${parseInt(customerId)}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY Loc DESC`;

    // Get locs (premises/accounts) from SQL Server
    const locs: any[] = await sqlserver.$queryRawUnsafe(query);

    // Get Rol records for names/addresses
    const rolIds = [...new Set(locs.map(l => l.Rol).filter(Boolean))];
    const rols: any[] = rolIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID IN (${rolIds.join(",")})`)
      : [];

    // Get Owner records for customer names
    const ownerIds = [...new Set(locs.map(l => l.Owner).filter(Boolean))];
    const owners: any[] = ownerIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Owner WHERE ID IN (${ownerIds.join(",")})`)
      : [];

    // Get Rol records for owner names
    const ownerRolIds = [...new Set(owners.map(o => o.Rol).filter(Boolean))];
    const ownerRols: any[] = ownerRolIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID IN (${ownerRolIds.join(",")})`)
      : [];

    // Get count of Elevs (units) per loc
    const locIds = locs.map(l => l.Loc);
    const elevCounts: any[] = locIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`
          SELECT Loc, COUNT(*) as cnt
          FROM Elev
          WHERE Loc IN (${locIds.join(",")})
          GROUP BY Loc
        `)
      : [];

    // Get count of Jobs per loc
    const jobCounts: any[] = locIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`
          SELECT Loc, COUNT(*) as cnt
          FROM Job
          WHERE Loc IN (${locIds.join(",")})
          GROUP BY Loc
        `)
      : [];

    // Create lookup maps
    const rolMap = new Map(rols.map(r => [r.ID, r]));
    const ownerMap = new Map(owners.map(o => [o.ID, o]));
    const ownerRolMap = new Map(ownerRols.map(r => [r.ID, r]));
    const elevCountMap = new Map(elevCounts.map(e => [e.Loc, e.cnt]));
    const jobCountMap = new Map(jobCounts.map(j => [j.Loc, j.cnt]));

    // Map to response format matching Account interface - exact same as API route
    const mappedAccounts = locs.map(loc => {
      const rol = loc.Rol ? rolMap.get(loc.Rol) : null;
      const owner = loc.Owner ? ownerMap.get(loc.Owner) : null;
      const ownerRol = owner?.Rol ? ownerRolMap.get(owner.Rol) : null;

      return {
        id: loc.Loc.toString(),
        premisesId: loc.ID || loc.Loc.toString(),
        name: loc.Tag || rol?.Name || "",
        address: rol?.Address || loc.Address || "",
        city: rol?.City || loc.City || null,
        state: rol?.State || loc.State || null,
        zipCode: rol?.Zip || loc.Zip || null,
        type: loc.Type || null,
        isActive: loc.Status === 1,
        status: loc.Status,
        balance: loc.Balance || 0,
        contact: rol?.Contact || null,
        phone: rol?.Phone || null,
        fax: rol?.Fax || null,
        email: rol?.EMail || null,
        route: loc.Route,
        zone: loc.Zone,
        terr: loc.Terr,
        maint: loc.Maint,
        billing: loc.Billing,
        remarks: loc.Remarks || rol?.Remarks || null,
        custom1: loc.Custom1,
        custom2: loc.Custom2,
        custom3: loc.Custom3,
        custom4: loc.Custom4,
        custom5: loc.Custom5,
        createdAt: rol?.Since || null,
        updatedAt: rol?.Last || null,
        customerId: owner?.ID?.toString() || "",
        customer: owner ? {
          id: owner.ID.toString(),
          name: ownerRol?.Name || "",
        } : { id: "", name: "" },
        _count: {
          units: elevCountMap.get(loc.Loc) || 0,
          jobs: jobCountMap.get(loc.Loc) || 0,
        },
      };
    });

    return mappedAccounts;
  } catch (error) {
    console.error("Error fetching accounts from SQL Server:", error);
    return fetchAccountsFromPostgres(options);
  }
}

/**
 * Fallback: fetch from PostgreSQL only
 */
async function fetchAccountsFromPostgres(options: FetchAccountsOptions) {
  const { filter, customerId, officeIds, limit = 500 } = options;

  const where: any = {};
  if (filter && filter !== "All") {
    where.type = filter;
  }
  if (customerId) {
    where.customerId = customerId;
  }
  if (officeIds && officeIds.length > 0) {
    where.OR = [{ officeId: { in: officeIds } }, { officeId: null }];
  }

  const accounts = await prisma.premises.findMany({
    where,
    take: limit,
    orderBy: { id: "desc" },
    include: {
      customer: true,
      _count: {
        select: { units: true },
      },
    },
  });

  return accounts.map(a => ({
    id: a.id,
    premisesId: a.premisesId,
    name: a.tag || a.name || "",
    address: a.address || "",
    city: a.city,
    state: a.state,
    zipCode: a.zip,
    type: a.type,
    isActive: a.isActive,
    status: a.isActive ? 1 : 0,
    balance: a.balance || 0,
    contact: a.contact,
    phone: a.phone,
    fax: a.fax,
    email: a.email,
    route: a.route,
    zone: a.zone,
    terr: a.terr,
    remarks: a.remarks,
    customerId: a.customerId || "",
    customer: a.customer ? {
      id: a.customer.id,
      name: a.customer.name || "",
    } : { id: "", name: "" },
    _count: {
      units: a._count.units,
      jobs: 0,
    },
  }));
}

/**
 * Get a single account by ID
 */
export async function fetchAccountById(accountId: string) {
  if (!isSqlServerAvailable()) {
    return prisma.premises.findUnique({
      where: { id: accountId },
      include: { customer: true, units: true },
    });
  }

  try {
    const locs: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT * FROM Loc WHERE Loc = ${parseInt(accountId)}`
    );

    if (locs.length === 0) {
      return null;
    }

    const loc = locs[0];

    // Get Rol record
    let rol: any = null;
    if (loc.Rol) {
      const rols: any[] = await sqlserver.$queryRawUnsafe(
        `SELECT * FROM Rol WHERE ID = ${loc.Rol}`
      );
      rol = rols[0] || null;
    }

    // Get Owner record
    let owner: any = null;
    let ownerRol: any = null;
    if (loc.Owner) {
      const owners: any[] = await sqlserver.$queryRawUnsafe(
        `SELECT * FROM Owner WHERE ID = ${loc.Owner}`
      );
      owner = owners[0] || null;
      if (owner?.Rol) {
        const ownerRols: any[] = await sqlserver.$queryRawUnsafe(
          `SELECT * FROM Rol WHERE ID = ${owner.Rol}`
        );
        ownerRol = ownerRols[0] || null;
      }
    }

    // Get units (Elev) for this location
    const elevs: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT * FROM Elev WHERE Loc = ${loc.Loc}`
    );

    return {
      id: loc.Loc.toString(),
      premisesId: loc.ID || loc.Loc.toString(),
      name: loc.Tag || rol?.Name || "",
      address: rol?.Address || loc.Address || "",
      city: rol?.City || loc.City || null,
      state: rol?.State || loc.State || null,
      zipCode: rol?.Zip || loc.Zip || null,
      type: loc.Type || null,
      isActive: loc.Status === 1,
      status: loc.Status,
      balance: loc.Balance || 0,
      contact: rol?.Contact || null,
      phone: rol?.Phone || null,
      fax: rol?.Fax || null,
      email: rol?.EMail || null,
      route: loc.Route,
      zone: loc.Zone,
      terr: loc.Terr,
      maint: loc.Maint,
      billing: loc.Billing,
      remarks: loc.Remarks || rol?.Remarks || null,
      colRemarks: loc.ColRemarks || null,
      salesRemarks: loc.SalesRemarks || null,
      custom1: loc.Custom1,
      custom2: loc.Custom2,
      custom3: loc.Custom3,
      custom4: loc.Custom4,
      custom5: loc.Custom5,
      createdAt: rol?.Since || null,
      updatedAt: rol?.Last || null,
      customerId: owner?.ID?.toString() || "",
      customer: owner ? {
        id: owner.ID.toString(),
        name: ownerRol?.Name || "",
      } : { id: "", name: "" },
      units: elevs.map(e => ({
        id: e.Elev?.toString() || "",
        unitNumber: e.ID || "",
        unitType: e.Type || null,
        cat: e.Cat || null,
        serial: e.Serial || null,
        manufacturer: e.Manuf || null,
        status: e.Status === 1 ? "Active" : "Inactive",
        description: e.Desc || null,
      })),
      _count: {
        units: elevs.length,
        jobs: 0,
      },
    };
  } catch (error) {
    console.error("Error fetching account by ID from SQL Server:", error);
    return prisma.premises.findUnique({
      where: { id: accountId },
      include: { customer: true, units: true },
    });
  }
}
