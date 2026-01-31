/**
 * Invoices Data Access Layer
 *
 * Fetches from SQL Server (Total Service) and mirrors to PostgreSQL (ZEUS)
 */

import prisma from "@/lib/db";
import sqlserver, { isSqlServerAvailable } from "@/lib/sqlserver";

interface FetchInvoicesParams {
  customerId?: string;
  premisesId?: string;
  limit?: number;
}

/**
 * Fetch invoices from SQL Server
 */
export async function fetchInvoices(params: FetchInvoicesParams = {}) {
  const { customerId, premisesId, limit = 100 } = params;

  if (!isSqlServerAvailable()) {
    console.log("SQL Server not available, reading from PostgreSQL only");
    return fetchInvoicesFromPostgres(params);
  }

  try {
    let whereConditions: string[] = [];

    if (customerId) {
      whereConditions.push(`i.Owner = ${parseInt(customerId)}`);
    }
    if (premisesId) {
      whereConditions.push(`i.Loc = ${parseInt(premisesId)}`);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    const query = `
      SELECT TOP ${limit}
        i.ID,
        i.InvNo,
        i.fDate,
        i.Total,
        i.Bal,
        i.fDesc,
        i.Owner,
        i.Loc,
        i.fCreated,
        i.fModified,
        l.Tag as PremisesTag,
        o.Name as CustomerName
      FROM InvO i
      LEFT JOIN Loc l ON i.Loc = l.ID
      LEFT JOIN Owner o ON i.Owner = o.ID
      ${whereClause}
      ORDER BY i.fDate DESC
    `;

    const invoices: any[] = await sqlserver.$queryRawUnsafe(query);

    const mappedInvoices = invoices.map(inv => ({
      id: inv.ID.toString(),
      invoiceNumber: inv.InvNo?.toString() || "",
      date: inv.fDate,
      total: parseFloat(inv.Total) || 0,
      balance: parseFloat(inv.Bal) || 0,
      description: inv.fDesc || "",
      customerId: inv.Owner?.toString() || null,
      customerName: inv.CustomerName || "",
      premisesId: inv.Loc?.toString() || null,
      premisesTag: inv.PremisesTag || "",
      createdAt: inv.fCreated,
      updatedAt: inv.fModified,
    }));

    return mappedInvoices;
  } catch (error) {
    console.error("Error fetching invoices from SQL Server:", error);
    return fetchInvoicesFromPostgres(params);
  }
}

async function fetchInvoicesFromPostgres(params: FetchInvoicesParams = {}) {
  const { customerId, premisesId, limit = 100 } = params;

  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (premisesId) where.premisesId = premisesId;

  const invoices = await prisma.invoice.findMany({
    where,
    take: limit,
    orderBy: { date: "desc" },
    include: {
      customer: { select: { name: true } },
      premises: { select: { tag: true } },
    },
  });

  return invoices.map(inv => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber || "",
    date: inv.date,
    total: inv.total || 0,
    balance: inv.balance || 0,
    description: inv.description || "",
    customerId: inv.customerId,
    customerName: inv.customer?.name || "",
    premisesId: inv.premisesId,
    premisesTag: inv.premises?.tag || "",
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  }));
}
