/**
 * Invoices Data Access Layer
 *
 * Fetches from SQL Server (Total Service) and mirrors to PostgreSQL (ZEUS)
 * Uses exact same query pattern as /api/sqlserver/invoices
 */

import prisma from "@/lib/db";
import sqlserver, { isSqlServerAvailable } from "@/lib/sqlserver";

interface FetchInvoicesParams {
  customerId?: string;
  premisesId?: string;
  startDate?: string;
  endDate?: string;
  unpaidOnly?: boolean;
  officeIds?: string[];
  limit?: number;
}

/**
 * Fetch invoices from SQL Server
 * Matches /api/sqlserver/invoices/route.ts exactly
 */
export async function fetchInvoices(params: FetchInvoicesParams = {}) {
  const { customerId, premisesId, startDate, endDate, unpaidOnly, limit = 100 } = params;

  if (!isSqlServerAvailable()) {
    console.log("SQL Server not available, reading from PostgreSQL only");
    return fetchInvoicesFromPostgres(params);
  }

  try {
    // Build query - Invoice table in Total Service (exact same as API route)
    let query = `SELECT TOP ${limit} * FROM Invoice`;
    const conditions: string[] = [];

    if (customerId) {
      conditions.push(`Owner = ${parseInt(customerId)}`);
    }
    if (premisesId) {
      conditions.push(`Loc = ${parseInt(premisesId)}`);
    }
    if (startDate) {
      conditions.push(`IDate >= '${startDate}'`);
    }
    if (endDate) {
      conditions.push(`IDate <= '${endDate} 23:59:59'`);
    }
    if (unpaidOnly) {
      conditions.push(`Paid = 0`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY IDate DESC`;

    // Get invoices from SQL Server
    const invoices: any[] = await sqlserver.$queryRawUnsafe(query);

    // Get related location data
    const locIds = [...new Set(invoices.map(i => i.Loc).filter(Boolean))];
    const locs: any[] = locIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Loc WHERE Loc IN (${locIds.join(",")})`)
      : [];

    // Get Rol records for location names
    const rolIds = [...new Set(locs.map(l => l.Rol).filter(Boolean))];
    const rols: any[] = rolIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID IN (${rolIds.join(",")})`)
      : [];

    // Create lookup maps
    const locMap = new Map(locs.map(l => [l.Loc, l]));
    const rolMap = new Map(rols.map(r => [r.ID, r]));

    // Map to response format - exact same as API route
    const mappedInvoices = invoices.map(inv => {
      const loc = inv.Loc ? locMap.get(inv.Loc) : null;
      const locRol = loc?.Rol ? rolMap.get(loc.Rol) : null;

      return {
        id: inv.ID.toString(),
        invoiceNumber: inv.Inv?.toString() || inv.ID.toString(),
        invoiceDate: inv.IDate,
        date: inv.IDate,
        dueDate: inv.DueDate,
        type: inv.Type || "Invoice",
        description: inv.fDesc || inv.Desc || "",
        amount: parseFloat(inv.Amount || 0),
        taxable: parseFloat(inv.Taxable || 0),
        salesTax: parseFloat(inv.Tax || 0),
        total: parseFloat(inv.Total || inv.Amount || 0),
        paid: inv.Paid === 1,
        paidAmount: parseFloat(inv.PaidAmt || 0),
        balance: parseFloat(inv.Balance || inv.Total || inv.Amount || 0),
        poNumber: inv.PO || null,
        terms: inv.Terms || null,
        customerId: inv.Owner?.toString() || null,
        premisesId: loc?.ID || inv.Loc?.toString() || null,
        premisesTag: loc?.Tag || "",
        premises: loc ? {
          id: loc.Loc.toString(),
          premisesId: loc.ID || loc.Loc.toString(),
          tag: loc.Tag || "",
          address: locRol?.Address || loc.Address || "",
        } : null,
      };
    });

    return mappedInvoices;
  } catch (error) {
    console.error("Error fetching invoices from SQL Server:", error);
    return fetchInvoicesFromPostgres(params);
  }
}

async function fetchInvoicesFromPostgres(params: FetchInvoicesParams = {}) {
  const { customerId, premisesId, officeIds, limit = 100 } = params;

  const where: any = {};
  if (customerId) where.customerId = customerId;
  if (premisesId) where.premisesId = premisesId;
  if (officeIds && officeIds.length > 0) {
    where.premises = { ...where.premises, OR: [{ officeId: { in: officeIds } }, { officeId: null }] };
  }

  const invoices = await prisma.invoice.findMany({
    where,
    take: limit,
    orderBy: { date: "desc" },
    include: {
      customer: { select: { name: true } },
      premises: { select: { id: true, premisesId: true, locId: true, tag: true, name: true, address: true, city: true } },
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
    premisesId: inv.premises?.premisesId || inv.premises?.locId || inv.premisesId || "",
    premisesTag: inv.premises?.tag || "",
    premises: inv.premises ? {
      id: inv.premises.id,
      premisesId: inv.premises.premisesId || inv.premises.locId || "",
      tag: inv.premises.tag || "",
      address: inv.premises.address || "",
    } : null,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  }));
}
