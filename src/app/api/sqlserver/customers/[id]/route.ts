import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

// GET /api/sqlserver/customers/[id] - Get single customer from SQL Server (READ ONLY)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ownerId = parseInt(id);

    if (isNaN(ownerId)) {
      return NextResponse.json({ error: "Invalid customer ID" }, { status: 400 });
    }

    // Fetch owner using raw SQL for SQL Server 2008 compatibility
    const owners: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT * FROM Owner WHERE ID = ${ownerId}`
    );

    if (owners.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const owner = owners[0];

    // Fetch Rol for name/address
    const rols: any[] = owner.Rol
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID = ${owner.Rol}`)
      : [];

    const rol = rols[0] || null;

    // Get count of Locs (premises) for this owner
    const locCounts: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM Loc WHERE Owner = ${ownerId}`
    );

    // Get count of Jobs for this owner
    const jobCounts: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM Job WHERE Owner = ${ownerId}`
    );

    // Get list of premises for this customer
    const premises: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT TOP 100 * FROM Loc WHERE Owner = ${ownerId} ORDER BY Loc`
    );

    // Get Rol records for premises names
    const premisesRolIds = [...new Set(premises.map(p => p.Rol).filter(Boolean))];
    const premisesRols: any[] = premisesRolIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID IN (${premisesRolIds.join(",")})`)
      : [];
    const premisesRolMap = new Map(premisesRols.map(r => [r.ID, r]));

    // Get unit counts per premises
    const premisesLocIds = premises.map(p => p.Loc);
    const premisesElevCounts: any[] = premisesLocIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`
          SELECT Loc, COUNT(*) as cnt
          FROM Elev
          WHERE Loc IN (${premisesLocIds.join(",")})
          GROUP BY Loc
        `)
      : [];
    const premisesElevCountMap = new Map(premisesElevCounts.map(e => [e.Loc, e.cnt]));

    // Map to response format
    const response = {
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
      country: rol?.Country || null,
      contact: rol?.Contact || null,
      phone: rol?.Phone || null,
      fax: rol?.Fax || null,
      email: rol?.EMail || null,
      cellular: rol?.Cellular || null,
      website: rol?.Website || null,
      billing: owner.Billing,
      custom1: owner.Custom1,
      custom2: owner.Custom2,
      portalAccess: owner.Internet === 1,
      remarks: rol?.Remarks || null,
      salesRemarks: rol?.SalesRemarks || null,
      category: rol?.Category || null,
      position: rol?.Position || null,
      createdAt: rol?.Since || null,
      updatedAt: rol?.Last || null,
      // Portal settings
      ticketO: owner.TicketO === 1,
      ticketD: owner.TicketD === 1,
      ledger: owner.Ledger === 1,
      request: owner.Request === 1,
      statement: owner.Statement === 1,
      invoiceO: owner.InvoiceO === 1,
      quote: owner.Quote === 1,
      dispatch: owner.Dispatch === 1,
      service: owner.Service === 1,
      safety: owner.Safety === 1,
      approve: owner.Approve === 1,
      _count: {
        premises: locCounts[0]?.cnt || 0,
        jobs: jobCounts[0]?.cnt || 0,
      },
      // Include premises list
      premises: premises.map(p => {
        const pRol = p.Rol ? premisesRolMap.get(p.Rol) : null;
        return {
          id: p.Loc.toString(),
          premisesId: p.ID || p.Loc.toString(),
          tag: p.Tag || pRol?.Name || "",
          name: pRol?.Name || p.Tag || "",
          address: pRol?.Address || p.Address || "",
          city: pRol?.City || p.City || "",
          state: pRol?.State || p.State || "",
          zip: pRol?.Zip || p.Zip || "",
          type: p.Type || "",
          status: p.Status,
          isActive: p.Status === 1,
          balance: p.Balance || 0,
          units: premisesElevCountMap.get(p.Loc) || 0,
        };
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching customer from SQL Server:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer from SQL Server", details: String(error) },
      { status: 500 }
    );
  }
}
