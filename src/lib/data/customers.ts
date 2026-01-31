/**
 * Customers Data Access Layer
 *
 * Fetches from SQL Server (Total Service) and mirrors to PostgreSQL (ZEUS)
 */

import prisma from "@/lib/db";
import sqlserver, { isSqlServerAvailable } from "@/lib/sqlserver";

interface FetchCustomersOptions {
  search?: string;
  status?: string;
  limit?: number;
}

/**
 * Fetch customers from SQL Server and mirror to PostgreSQL
 */
export async function fetchCustomers(options: FetchCustomersOptions = {}) {
  const { search, status, limit = 500 } = options;

  if (!isSqlServerAvailable()) {
    console.log("SQL Server not available, reading from PostgreSQL only");
    return fetchCustomersFromPostgres(options);
  }

  try {
    // Build query
    const conditions: string[] = [];

    if (search) {
      conditions.push(`(r.Name LIKE '%${search}%' OR r.Address LIKE '%${search}%')`);
    }
    if (status === "Active") {
      conditions.push(`o.En = 1`);
    } else if (status === "Inactive") {
      conditions.push(`o.En = 0`);
    }

    let query = `
      SELECT TOP ${limit}
        o.ID,
        o.Rol,
        o.En,
        o.Billing,
        o.Type,
        o.Custom1,
        o.Custom2,
        o.Remark,
        o.fCreated,
        o.fModified,
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
        r.Email
      FROM Owner o
      LEFT JOIN Rol r ON o.Rol = r.ID
    `;

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY r.Name`;

    const customers: any[] = await sqlserver.$queryRawUnsafe(query);

    // Get account and unit counts
    const customerIds = customers.map(c => c.ID);

    let accountCounts: any[] = [];
    let unitCounts: any[] = [];

    if (customerIds.length > 0) {
      accountCounts = await sqlserver.$queryRawUnsafe(`
        SELECT Owner, COUNT(*) as count FROM Loc WHERE Owner IN (${customerIds.join(",")}) GROUP BY Owner
      `);

      unitCounts = await sqlserver.$queryRawUnsafe(`
        SELECT l.Owner, COUNT(*) as count
        FROM Elev e
        JOIN Loc l ON e.Loc = l.Loc
        WHERE l.Owner IN (${customerIds.join(",")})
        GROUP BY l.Owner
      `);
    }

    const accountCountMap = new Map(accountCounts.map(a => [a.Owner, a.count]));
    const unitCountMap = new Map(unitCounts.map(u => [u.Owner, u.count]));

    // Map and mirror each customer
    const mappedCustomers = await Promise.all(customers.map(async (c) => {
      const mappedCustomer = {
        id: c.ID.toString(),
        name: c.Name || "",
        address: c.Address || "",
        city: c.City || "",
        state: c.State || "",
        zip: c.Zip || "",
        country: c.Country || "United States",
        phone: c.Phone || "",
        fax: c.Fax || "",
        mobile: c.Mobile || "",
        contact: c.Contact || "",
        email: c.Email || "",
        isActive: c.En === 1,
        billing: c.Billing,
        type: c.Type || "",
        custom1: c.Custom1 || "",
        custom2: c.Custom2 || "",
        remarks: c.Remark || "",
        createdAt: c.fCreated,
        updatedAt: c.fModified,
        accountCount: accountCountMap.get(c.ID) || 0,
        unitCount: unitCountMap.get(c.ID) || 0,
      };

      // Mirror to PostgreSQL
      await mirrorCustomerToPostgres(mappedCustomer);

      return mappedCustomer;
    }));

    return mappedCustomers;
  } catch (error) {
    console.error("Error fetching customers from SQL Server:", error);
    return fetchCustomersFromPostgres(options);
  }
}

/**
 * Mirror a customer to PostgreSQL
 */
async function mirrorCustomerToPostgres(customer: any) {
  try {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: {
        name: customer.name,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        country: customer.country,
        phone: customer.phone,
        fax: customer.fax,
        mobile: customer.mobile,
        contact: customer.contact,
        email: customer.email,
        isActive: customer.isActive,
        billing: customer.billing,
        type: customer.type,
        custom1: customer.custom1,
        custom2: customer.custom2,
        remarks: customer.remarks,
      },
      create: {
        id: customer.id,
        name: customer.name,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        country: customer.country,
        phone: customer.phone,
        fax: customer.fax,
        mobile: customer.mobile,
        contact: customer.contact,
        email: customer.email,
        isActive: customer.isActive,
        billing: customer.billing,
        type: customer.type,
        custom1: customer.custom1,
        custom2: customer.custom2,
        remarks: customer.remarks,
      },
    });
  } catch (error) {
    console.error("Error mirroring customer to PostgreSQL:", error);
  }
}

/**
 * Fallback: fetch from PostgreSQL only
 */
async function fetchCustomersFromPostgres(options: FetchCustomersOptions) {
  const { search, status, limit = 500 } = options;

  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
    ];
  }
  if (status === "Active") {
    where.isActive = true;
  } else if (status === "Inactive") {
    where.isActive = false;
  }

  const customers = await prisma.customer.findMany({
    where,
    take: limit,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { premises: true },
      },
    },
  });

  return customers.map(c => ({
    id: c.id,
    name: c.name,
    address: c.address,
    city: c.city,
    state: c.state,
    zip: c.zip,
    country: c.country,
    phone: c.phone,
    fax: c.fax,
    mobile: c.mobile,
    contact: c.contact,
    email: c.email,
    isActive: c.isActive,
    billing: c.billing,
    type: c.type,
    custom1: c.custom1,
    custom2: c.custom2,
    remarks: c.remarks,
    accountCount: c._count.premises,
    unitCount: 0, // Would need separate query
  }));
}

/**
 * Get a single customer by ID
 */
export async function fetchCustomerById(customerId: string) {
  if (!isSqlServerAvailable()) {
    return prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        premises: true,
      },
    });
  }

  try {
    const query = `
      SELECT TOP 1
        o.ID,
        o.Rol,
        o.En,
        o.Billing,
        o.Type,
        o.Custom1,
        o.Custom2,
        o.Remark,
        o.fCreated,
        o.fModified,
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
        r.Email
      FROM Owner o
      LEFT JOIN Rol r ON o.Rol = r.ID
      WHERE o.ID = ${parseInt(customerId)}
    `;

    const customers: any[] = await sqlserver.$queryRawUnsafe(query);

    if (customers.length === 0) {
      return null;
    }

    const c = customers[0];
    const mappedCustomer = {
      id: c.ID.toString(),
      name: c.Name || "",
      address: c.Address || "",
      city: c.City || "",
      state: c.State || "",
      zip: c.Zip || "",
      country: c.Country || "United States",
      phone: c.Phone || "",
      fax: c.Fax || "",
      mobile: c.Mobile || "",
      contact: c.Contact || "",
      email: c.Email || "",
      isActive: c.En === 1,
      billing: c.Billing,
      type: c.Type || "",
      custom1: c.Custom1 || "",
      custom2: c.Custom2 || "",
      remarks: c.Remark || "",
      createdAt: c.fCreated,
      updatedAt: c.fModified,
    };

    // Mirror to PostgreSQL
    await mirrorCustomerToPostgres(mappedCustomer);

    return mappedCustomer;
  } catch (error) {
    console.error("Error fetching customer by ID from SQL Server:", error);
    // Fallback to PostgreSQL
    return prisma.customer.findUnique({
      where: { id: customerId },
      include: { premises: true },
    });
  }
}
