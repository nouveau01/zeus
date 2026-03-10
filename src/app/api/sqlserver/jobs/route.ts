import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

export const dynamic = "force-dynamic";

// GET /api/sqlserver/jobs - Get jobs directly from SQL Server (READ ONLY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Use raw SQL for SQL Server 2008 compatibility (no OFFSET support)
    let query = `SELECT TOP ${limit} * FROM Job`;
    if (status && status !== "all") {
      query += ` WHERE Status = ${parseInt(status)}`;
    }
    query += ` ORDER BY ID DESC`;

    // Get jobs from SQL Server using raw query
    const jobs: any[] = await sqlserver.$queryRawUnsafe(query);

    // Get related data for each job
    const locIds = [...new Set(jobs.map(j => j.Loc).filter(Boolean))];
    const ownerIds = [...new Set(jobs.map(j => j.Owner).filter(Boolean))];
    const typeIds = [...new Set(jobs.map(j => j.Type).filter(Boolean))];
    const templateIds = [...new Set(jobs.map(j => j.Template).filter(Boolean))];
    const elevIds = [...new Set(jobs.map(j => j.Elev).filter(Boolean))];
    const statusIds = [...new Set(jobs.map(j => j.Status).filter(Boolean))];
    const glIds = [...new Set([...jobs.map(j => j.GL), ...jobs.map(j => j.GLRev)].filter(Boolean))];

    // Fetch related records using raw SQL for SQL Server 2008 compatibility
    const locs: any[] = locIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Loc WHERE Loc IN (${locIds.join(",")})`)
      : [];

    const owners: any[] = ownerIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Owner WHERE ID IN (${ownerIds.join(",")})`)
      : [];

    const jobTypes: any[] = typeIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM JobType WHERE ID IN (${typeIds.join(",")})`)
      : [];

    const templates: any[] = templateIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM JobT WHERE ID IN (${templateIds.join(",")})`)
      : [];

    const elevs: any[] = elevIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Elev WHERE ID IN (${elevIds.join(",")})`)
      : [];

    const jobStatuses: any[] = statusIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Job_Status WHERE ID IN (${statusIds.join(",")})`)
      : [];

    const gls: any[] = glIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM GL WHERE ID IN (${glIds.join(",")})`)
      : [];

    // Get Rol records for names (Owner.Rol and Loc.Rol point to Rol.ID)
    const rolIds = [
      ...new Set([
        ...owners.map(o => o.Rol).filter(Boolean),
        ...locs.map(l => l.Rol).filter(Boolean),
      ])
    ];

    const rols: any[] = rolIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID IN (${rolIds.join(",")})`)
      : [];

    // Create lookup maps
    const locMap = new Map(locs.map(l => [l.Loc, l]));
    const ownerMap = new Map(owners.map(o => [o.ID, o]));
    const typeMap = new Map(jobTypes.map(t => [t.ID, t]));
    const templateMap = new Map(templates.map(t => [t.ID, t]));
    const elevMap = new Map(elevs.map(e => [e.ID, e]));
    const statusMap = new Map(jobStatuses.map(s => [s.ID, s]));
    const glMap = new Map(gls.map(g => [g.ID, g]));
    const rolMap = new Map(rols.map(r => [r.ID, r]));

    // Map to response format
    const response = jobs.map(job => {
      const loc = job.Loc ? locMap.get(job.Loc) : null;
      const owner = job.Owner ? ownerMap.get(job.Owner) : null;
      const jobType = job.Type ? typeMap.get(job.Type) : null;
      const template = job.Template ? templateMap.get(job.Template) : null;
      const elev = job.Elev ? elevMap.get(job.Elev) : null;
      const jobStatus = job.Status ? statusMap.get(job.Status) : null;
      const gl = job.GL ? glMap.get(job.GL) : null;
      const glRev = job.GLRev ? glMap.get(job.GLRev) : null;

      // Get names from Rol table
      const ownerRol = owner?.Rol ? rolMap.get(owner.Rol) : null;
      const locRol = loc?.Rol ? rolMap.get(loc.Rol) : null;

      return {
        id: job.ID,
        jobNumber: job.ID.toString(),
        description: job.fDesc || "",
        type: jobType?.Type || "",
        typeId: job.Type,
        status: jobStatus?.Status || (job.Status === 1 ? "Open" : job.Status === 2 ? "Closed" : `Status ${job.Status}`),
        statusId: job.Status,
        template: template?.fDesc || "",
        templateId: job.Template,
        contractType: job.CType || "",
        poNumber: job.PO || "",
        remarks: job.Remarks || "",
        sRemarks: job.SRemarks || "",
        date: job.fDate,
        closeDate: job.CloseDate,
        // Financial
        revenue: job.Rev,
        materials: job.Mat,
        labor: job.Labor,
        cost: job.Cost,
        profit: job.Profit,
        // Budget
        budgetRevenue: job.BRev,
        budgetMaterials: job.BMat,
        budgetLabor: job.BLabor,
        budgetCost: job.BCost,
        budgetProfit: job.BProfit,
        // Hours
        regularHours: job.Reg,
        overtimeHours: job.OT,
        doubleTimeHours: job.DT,
        travelHours: job.TT,
        totalHours: job.Hour,
        // Related data - get name from Rol table
        premises: loc ? {
          id: loc.Loc,
          locId: loc.ID,
          name: loc.Tag || locRol?.Name || "",
          address: locRol?.Address || loc.Address,
          city: locRol?.City || loc.City,
          state: locRol?.State || loc.State,
          zip: locRol?.Zip || loc.Zip,
        } : null,
        customer: owner ? {
          id: owner.ID,
          name: ownerRol?.Name || "",
        } : null,
        elevator: elev ? {
          id: elev.ID,
          unit: elev.Unit || "",
          type: elev.Type || "",
          manufacturer: elev.Manuf || "",
          serial: elev.Serial || "",
          building: elev.Building || "",
        } : null,
        gl: gl ? {
          id: gl.ID,
          name: gl.Name || gl.fDesc || "",
          code: gl.Code || "",
        } : null,
        glRev: glRev ? {
          id: glRev.ID,
          name: glRev.Name || glRev.fDesc || "",
          code: glRev.Code || "",
        } : null,
        // Additional fields
        level: job.Level,
        chargeable: job.Charge === 1,
        certified: job.Certified === 1,
        apprentice: job.Apprentice === 1,
        group: job.fGroup || "",
        // Custom fields
        custom1: job.Custom1,
        custom2: job.Custom2,
        custom3: job.Custom3,
        custom4: job.Custom4,
        custom5: job.Custom5,
        custom6: job.Custom6,
        custom7: job.Custom7,
        custom8: job.Custom8,
        custom9: job.Custom9,
        custom10: job.Custom10,
      };
    });

    return NextResponse.json({
      data: response,
      total: response.length,
      source: "sqlserver"
    });
  } catch (error) {
    console.error("Error fetching jobs from SQL Server:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs from SQL Server", details: String(error) },
      { status: 500 }
    );
  }
}
