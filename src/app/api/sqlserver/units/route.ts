import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

export const dynamic = "force-dynamic";

// GET /api/sqlserver/units - Get units/elevators from SQL Server (READ ONLY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const premisesId = searchParams.get("premisesId");
    const customerId = searchParams.get("customerId");
    const limit = parseInt(searchParams.get("limit") || "500");

    // Use raw SQL for SQL Server 2008 compatibility
    let query = `SELECT TOP ${limit} * FROM Elev`;
    const conditions: string[] = [];

    if (premisesId) {
      conditions.push(`Loc = ${parseInt(premisesId)}`);
    }
    if (customerId) {
      conditions.push(`Owner = ${parseInt(customerId)}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY ID DESC`;

    // Get elevators from SQL Server
    const elevs: any[] = await sqlserver.$queryRawUnsafe(query);

    // Get Loc records for premises info
    const locIds = [...new Set(elevs.map(e => e.Loc).filter(Boolean))];
    const locs: any[] = locIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Loc WHERE Loc IN (${locIds.join(",")})`)
      : [];

    // Get Owner records for customer info
    const ownerIds = [...new Set(elevs.map(e => e.Owner).filter(Boolean))];
    const owners: any[] = ownerIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Owner WHERE ID IN (${ownerIds.join(",")})`)
      : [];

    // Get Rol records for names
    const rolIds = [
      ...new Set([
        ...locs.map(l => l.Rol).filter(Boolean),
        ...owners.map(o => o.Rol).filter(Boolean),
      ])
    ];
    const rols: any[] = rolIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID IN (${rolIds.join(",")})`)
      : [];

    // Create lookup maps
    const locMap = new Map(locs.map(l => [l.Loc, l]));
    const ownerMap = new Map(owners.map(o => [o.ID, o]));
    const rolMap = new Map(rols.map(r => [r.ID, r]));

    // Map to response format matching Unit interface
    const response = elevs.map(elev => {
      const loc = elev.Loc ? locMap.get(elev.Loc) : null;
      const owner = elev.Owner ? ownerMap.get(elev.Owner) : null;
      const locRol = loc?.Rol ? rolMap.get(loc.Rol) : null;
      const ownerRol = owner?.Rol ? rolMap.get(owner.Rol) : null;

      return {
        id: elev.ID.toString(),
        unitNumber: elev.Unit || "",
        unitType: elev.Type || "Elevator",
        cat: elev.Cat || "",
        building: elev.Building || "",
        manufacturer: elev.Manuf || "",
        serial: elev.Serial || "",
        state: elev.State || "",
        status: elev.Status === 1 ? "Active" : "Inactive",
        statusId: elev.Status,
        description: elev.fDesc || "",
        group: elev.fGroup || "",
        price: elev.Price || 0,
        installDate: elev.Install,
        installBy: elev.InstallBy || "",
        remarks: elev.Remarks || "",
        premisesId: loc?.Loc?.toString() || "",
        premises: loc ? {
          id: loc.Loc.toString(),
          premisesId: loc.ID || loc.Loc.toString(),
          address: locRol?.Address || loc.Address || "",
          tag: loc.Tag || "",
          city: locRol?.City || "",
          state: locRol?.State || "",
          customer: owner ? {
            id: owner.ID.toString(),
            name: ownerRol?.Name || "",
          } : null,
        } : null,
        custom1: elev.Custom1,
        custom2: elev.Custom2,
        custom3: elev.Custom3,
        custom4: elev.Custom4,
        custom5: elev.Custom5,
        createdAt: elev.Since || null,
        updatedAt: elev.Last || null,
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching units from SQL Server:", error);
    return NextResponse.json(
      { error: "Failed to fetch units from SQL Server", details: String(error) },
      { status: 500 }
    );
  }
}
