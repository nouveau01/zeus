import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

// GET /api/sqlserver/customers - Get customers from SQL Server (READ ONLY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "500");

    // Use raw SQL for SQL Server 2008 compatibility
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

    // Map to response format matching Customer interface
    const response = owners.map(owner => {
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching customers from SQL Server:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers from SQL Server", details: String(error) },
      { status: 500 }
    );
  }
}
