import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

// GET /api/sqlserver/units/[id] - Get single unit/elevator from SQL Server (READ ONLY)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const elevId = parseInt(id);

    if (isNaN(elevId)) {
      return NextResponse.json({ error: "Invalid unit ID" }, { status: 400 });
    }

    // Fetch elevator using raw SQL for SQL Server 2008 compatibility
    const elevs: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT * FROM Elev WHERE ID = ${elevId}`
    );

    if (elevs.length === 0) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const elev = elevs[0];

    // Fetch Loc for premises info
    const locs: any[] = elev.Loc
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Loc WHERE Loc = ${elev.Loc}`)
      : [];
    const loc = locs[0] || null;

    // Fetch Owner for customer info
    const owners: any[] = elev.Owner
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Owner WHERE ID = ${elev.Owner}`)
      : [];
    const owner = owners[0] || null;

    // Fetch Rol records for names
    const rolIds = [loc?.Rol, owner?.Rol].filter(Boolean);
    const rols: any[] = rolIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID IN (${rolIds.join(",")})`)
      : [];
    const rolMap = new Map(rols.map(r => [r.ID, r]));
    const locRol = loc?.Rol ? rolMap.get(loc.Rol) : null;
    const ownerRol = owner?.Rol ? rolMap.get(owner.Rol) : null;

    // Fetch ElevT (template) if exists
    const templates: any[] = elev.Template
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM ElevT WHERE ID = ${elev.Template}`)
      : [];
    const template = templates[0] || null;

    // Map to response format
    const response = {
      id: elev.ID.toString(),
      unitNumber: elev.Unit || "",
      unitType: elev.Type || "Elevator",
      cat: elev.Cat || "",
      category: elev.Cat || "",
      building: elev.Building || "",
      manufacturer: elev.Manuf || "",
      serial: elev.Serial || "",
      state: elev.State || "",
      status: elev.Status === 1 ? "Active" : "Inactive",
      statusId: elev.Status,
      description: elev.fDesc || "",
      group: elev.fGroup || "",
      week: elev.Week || "",
      price: elev.Price || 0,
      installDate: elev.Install,
      installBy: elev.InstallBy || "",
      since: elev.Since,
      last: elev.Last,
      remarks: elev.Remarks || "",
      template: template?.fDesc || null,
      templateId: elev.Template,
      premisesId: loc?.Loc?.toString() || "",
      premises: loc ? {
        id: loc.Loc.toString(),
        premisesId: loc.ID || loc.Loc.toString(),
        tag: loc.Tag || "",
        address: locRol?.Address || loc.Address || "",
        city: locRol?.City || "",
        state: locRol?.State || "",
        zip: locRol?.Zip || "",
      } : null,
      customerId: owner?.ID?.toString() || "",
      customer: owner ? {
        id: owner.ID.toString(),
        name: ownerRol?.Name || "",
      } : null,
      // Custom fields
      custom1: elev.Custom1,
      custom2: elev.Custom2,
      custom3: elev.Custom3,
      custom4: elev.Custom4,
      custom5: elev.Custom5,
      custom6: elev.Custom6,
      custom7: elev.Custom7,
      custom8: elev.Custom8,
      custom9: elev.Custom9,
      custom10: elev.Custom10,
      custom11: elev.Custom11,
      custom12: elev.Custom12,
      custom13: elev.Custom13,
      custom14: elev.Custom14,
      custom15: elev.Custom15,
      custom16: elev.Custom16,
      custom17: elev.Custom17,
      custom18: elev.Custom18,
      custom19: elev.Custom19,
      custom20: elev.Custom20,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching unit from SQL Server:", error);
    return NextResponse.json(
      { error: "Failed to fetch unit from SQL Server", details: String(error) },
      { status: 500 }
    );
  }
}
