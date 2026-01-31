/**
 * Accounts (Premises) Data Access Layer
 *
 * Fetches from SQL Server (Total Service) and mirrors to PostgreSQL (ZEUS)
 */

import prisma from "@/lib/db";
import sqlserver, { isSqlServerAvailable } from "@/lib/sqlserver";

interface FetchAccountsOptions {
  search?: string;
  customerId?: string;
  status?: string;
  limit?: number;
}

/**
 * Fetch accounts/premises from SQL Server and mirror to PostgreSQL
 */
export async function fetchAccounts(options: FetchAccountsOptions = {}) {
  const { search, customerId, status, limit = 500 } = options;

  if (!isSqlServerAvailable()) {
    console.log("SQL Server not available, reading from PostgreSQL only");
    return fetchAccountsFromPostgres(options);
  }

  try {
    const conditions: string[] = [];

    if (search) {
      conditions.push(`(r.Name LIKE '%${search}%' OR r.Address LIKE '%${search}%' OR l.Tag LIKE '%${search}%')`);
    }
    if (customerId) {
      conditions.push(`l.Owner = ${parseInt(customerId)}`);
    }
    if (status === "Active") {
      conditions.push(`l.En = 1`);
    } else if (status === "Inactive") {
      conditions.push(`l.En = 0`);
    }

    let query = `
      SELECT TOP ${limit}
        l.Loc,
        l.ID,
        l.Tag,
        l.Owner,
        l.Route,
        l.Zone,
        l.Terr as Territory,
        l.En,
        l.Rol,
        l.Type,
        l.PriceL,
        l.Remark,
        l.fCreated,
        l.fModified,
        r.Name,
        r.Address,
        r.City,
        r.State,
        r.Zip,
        r.Country,
        r.Phone,
        r.Fax,
        r.Mobile,
        r.Contact,
        r.Email,
        o.ID as OwnerID,
        oRol.Name as OwnerName
      FROM Loc l
      LEFT JOIN Rol r ON l.Rol = r.ID
      LEFT JOIN Owner o ON l.Owner = o.ID
      LEFT JOIN Rol oRol ON o.Rol = oRol.ID
    `;

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY l.Tag`;

    const accounts: any[] = await sqlserver.$queryRawUnsafe(query);

    // Get unit counts
    const locIds = accounts.map(a => a.Loc);
    let unitCounts: any[] = [];

    if (locIds.length > 0) {
      unitCounts = await sqlserver.$queryRawUnsafe(`
        SELECT Loc, COUNT(*) as count FROM Elev WHERE Loc IN (${locIds.join(",")}) GROUP BY Loc
      `);
    }

    const unitCountMap = new Map(unitCounts.map(u => [u.Loc, u.count]));

    // Map and mirror each account
    const mappedAccounts = await Promise.all(accounts.map(async (a) => {
      const mappedAccount = {
        id: a.Loc.toString(),
        premisesId: a.ID || a.Loc.toString(),
        tag: a.Tag || "",
        name: a.Name || "",
        address: a.Address || "",
        city: a.City || "",
        state: a.State || "",
        zip: a.Zip || "",
        country: a.Country || "United States",
        phone: a.Phone || "",
        fax: a.Fax || "",
        mobile: a.Mobile || "",
        contact: a.Contact || "",
        email: a.Email || "",
        isActive: a.En === 1,
        route: a.Route,
        zone: a.Zone,
        territory: a.Territory,
        type: a.Type,
        priceLevel: a.PriceL,
        remarks: a.Remark || "",
        createdAt: a.fCreated,
        updatedAt: a.fModified,
        customerId: a.OwnerID?.toString() || null,
        customerName: a.OwnerName || "",
        unitCount: unitCountMap.get(a.Loc) || 0,
      };

      // Mirror to PostgreSQL
      await mirrorAccountToPostgres(mappedAccount);

      return mappedAccount;
    }));

    return mappedAccounts;
  } catch (error) {
    console.error("Error fetching accounts from SQL Server:", error);
    return fetchAccountsFromPostgres(options);
  }
}

/**
 * Mirror an account to PostgreSQL
 */
async function mirrorAccountToPostgres(account: any) {
  try {
    await prisma.premises.upsert({
      where: { id: account.id },
      update: {
        premisesId: account.premisesId,
        tag: account.tag,
        name: account.name,
        address: account.address,
        city: account.city,
        state: account.state,
        zip: account.zip,
        country: account.country,
        phone: account.phone,
        fax: account.fax,
        mobile: account.mobile,
        contact: account.contact,
        email: account.email,
        isActive: account.isActive,
        route: account.route?.toString(),
        zone: account.zone?.toString(),
        terr: account.territory?.toString(),
        type: account.type,
        remarks: account.remarks,
      },
      create: {
        id: account.id,
        premisesId: account.premisesId,
        tag: account.tag,
        name: account.name,
        address: account.address,
        city: account.city,
        state: account.state,
        zip: account.zip,
        country: account.country,
        phone: account.phone,
        fax: account.fax,
        mobile: account.mobile,
        contact: account.contact,
        email: account.email,
        isActive: account.isActive,
        route: account.route?.toString(),
        zone: account.zone?.toString(),
        terr: account.territory?.toString(),
        type: account.type,
        remarks: account.remarks,
        customerId: account.customerId,
      },
    });
  } catch (error) {
    console.error("Error mirroring account to PostgreSQL:", error);
  }
}

/**
 * Fallback: fetch from PostgreSQL only
 */
async function fetchAccountsFromPostgres(options: FetchAccountsOptions) {
  const { search, customerId, status, limit = 500 } = options;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
      { tag: { contains: search, mode: "insensitive" } },
    ];
  }
  if (customerId) {
    where.customerId = customerId;
  }
  if (status === "Active") {
    where.isActive = true;
  } else if (status === "Inactive") {
    where.isActive = false;
  }

  const accounts = await prisma.premises.findMany({
    where,
    take: limit,
    orderBy: { tag: "asc" },
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
    tag: a.tag,
    name: a.name,
    address: a.address,
    city: a.city,
    state: a.state,
    zip: a.zip,
    country: a.country,
    phone: a.phone,
    fax: a.fax,
    mobile: a.mobile,
    contact: a.contact,
    email: a.email,
    isActive: a.isActive,
    route: a.route,
    zone: a.zone,
    territory: a.terr,
    remarks: a.remarks,
    customerId: a.customerId,
    customerName: a.customer?.name || "",
    unitCount: a._count.units,
  }));
}

/**
 * Get a single account by ID
 */
export async function fetchAccountById(accountId: string) {
  if (!isSqlServerAvailable()) {
    return prisma.premises.findUnique({
      where: { id: accountId },
      include: {
        customer: true,
        units: true,
      },
    });
  }

  const accounts = await fetchAccounts({ limit: 1000 });
  return accounts.find(a => a.id === accountId);
}
