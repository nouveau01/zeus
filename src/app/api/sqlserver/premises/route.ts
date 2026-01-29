import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

// GET /api/sqlserver/premises - Get accounts/premises from SQL Server (READ ONLY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter");
    const customerId = searchParams.get("customerId");
    const limit = parseInt(searchParams.get("limit") || "500");

    // Use raw SQL for SQL Server 2008 compatibility
    let query = `SELECT TOP ${limit} * FROM Loc`;
    const conditions: string[] = [];

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

    // Map to response format matching Account interface
    const response = locs.map(loc => {
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching premises from SQL Server:", error);
    return NextResponse.json(
      { error: "Failed to fetch premises from SQL Server", details: String(error) },
      { status: 500 }
    );
  }
}
