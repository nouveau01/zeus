import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

export const dynamic = "force-dynamic";

// GET /api/sqlserver/invoices - Get invoices/ledger from SQL Server (READ ONLY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const premisesId = searchParams.get("premisesId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const unpaidOnly = searchParams.get("unpaidOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "100");

    // Build query - Invoice table in Total Service
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

    // Map to response format
    const response = invoices.map(inv => {
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
        premisesId: inv.Loc?.toString() || null,
        premises: loc ? {
          id: loc.Loc.toString(),
          tag: loc.Tag || "",
          address: locRol?.Address || loc.Address || "",
        } : null,
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching invoices from SQL Server:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices from SQL Server", details: String(error) },
      { status: 500 }
    );
  }
}
