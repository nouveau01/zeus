import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

// GET /api/sqlserver/premises/[id] - Get single account/premises from SQL Server (READ ONLY)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const locId = parseInt(id);

    if (isNaN(locId)) {
      return NextResponse.json({ error: "Invalid premises ID" }, { status: 400 });
    }

    // Fetch loc using raw SQL for SQL Server 2008 compatibility
    const locs: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT * FROM Loc WHERE Loc = ${locId}`
    );

    if (locs.length === 0) {
      return NextResponse.json({ error: "Premises not found" }, { status: 404 });
    }

    const loc = locs[0];

    // Fetch Rol for name/address
    const rols: any[] = loc.Rol
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID = ${loc.Rol}`)
      : [];
    const rol = rols[0] || null;

    // Fetch Owner (customer)
    const owners: any[] = loc.Owner
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Owner WHERE ID = ${loc.Owner}`)
      : [];
    const owner = owners[0] || null;

    // Fetch Owner's Rol for name
    const ownerRols: any[] = owner?.Rol
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID = ${owner.Rol}`)
      : [];
    const ownerRol = ownerRols[0] || null;

    // Get count of units
    const elevCounts: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM Elev WHERE Loc = ${locId}`
    );

    // Get count of jobs
    const jobCounts: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM Job WHERE Loc = ${locId}`
    );

    // Get list of units (elevators) for this premises
    const elevs: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT TOP 100 * FROM Elev WHERE Loc = ${locId} ORDER BY ID`
    );

    // Get list of jobs for this premises
    const jobs: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT TOP 50 * FROM Job WHERE Loc = ${locId} ORDER BY ID DESC`
    );

    // Get JobType for job types
    const jobTypeIds = [...new Set(jobs.map(j => j.Type).filter(Boolean))];
    const jobTypes: any[] = jobTypeIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM JobType WHERE ID IN (${jobTypeIds.join(",")})`)
      : [];
    const jobTypeMap = new Map(jobTypes.map(t => [t.ID, t]));

    // Map to response format
    const response = {
      id: loc.Loc.toString(),
      premisesId: loc.ID || loc.Loc.toString(),
      name: loc.Tag || rol?.Name || "",
      tag: loc.Tag || "",
      address: rol?.Address || loc.Address || "",
      city: rol?.City || loc.City || null,
      state: rol?.State || loc.State || null,
      zipCode: rol?.Zip || loc.Zip || null,
      country: rol?.Country || null,
      type: loc.Type || null,
      isActive: loc.Status === 1,
      status: loc.Status,
      balance: loc.Balance || 0,
      contact: rol?.Contact || null,
      phone: rol?.Phone || null,
      fax: rol?.Fax || null,
      email: rol?.EMail || null,
      cellular: rol?.Cellular || null,
      website: rol?.Website || null,
      route: loc.Route,
      zone: loc.Zone,
      terr: loc.Terr,
      maint: loc.Maint,
      billing: loc.Billing,
      remarks: loc.Remarks || null,
      salesRemarks: rol?.SalesRemarks || null,
      careof: loc.Careof || null,
      latitude: loc.Latt,
      longitude: loc.fLong,
      custom1: loc.Custom1,
      custom2: loc.Custom2,
      custom3: loc.Custom3,
      custom4: loc.Custom4,
      custom5: loc.Custom5,
      custom6: loc.Custom6,
      custom7: loc.Custom7,
      custom8: loc.Custom8,
      custom9: loc.Custom9,
      custom10: loc.Custom10,
      createdAt: rol?.Since || null,
      updatedAt: rol?.Last || null,
      customerId: owner?.ID?.toString() || "",
      customer: owner ? {
        id: owner.ID.toString(),
        name: ownerRol?.Name || "",
      } : null,
      _count: {
        units: elevCounts[0]?.cnt || 0,
        jobs: jobCounts[0]?.cnt || 0,
      },
      // Include units list
      units: elevs.map(e => ({
        id: e.ID,
        unit: e.Unit || "",
        type: e.Type || "",
        category: e.Cat || "",
        manufacturer: e.Manuf || "",
        serial: e.Serial || "",
        building: e.Building || "",
        status: e.Status,
      })),
      // Include jobs list
      jobs: jobs.map(j => {
        const jType = j.Type ? jobTypeMap.get(j.Type) : null;
        return {
          id: j.ID,
          description: j.fDesc || "",
          type: jType?.Type || "",
          status: j.Status === 1 ? "Open" : j.Status === 2 ? "Closed" : `Status ${j.Status}`,
          date: j.fDate,
        };
      }),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching premises from SQL Server:", error);
    return NextResponse.json(
      { error: "Failed to fetch premises from SQL Server", details: String(error) },
      { status: 500 }
    );
  }
}
