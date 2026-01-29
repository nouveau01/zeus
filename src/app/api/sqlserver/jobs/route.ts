import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

// GET /api/sqlserver/jobs - Get jobs directly from SQL Server (READ ONLY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");

    // Build where clause
    const where: any = {};

    // Status filter (1 = Open, 2 = Closed, etc. - adjust based on your data)
    if (status && status !== "all") {
      where.Status = parseInt(status);
    }

    // Get jobs from SQL Server
    const jobs = await sqlserver.job.findMany({
      where,
      take: limit,
      orderBy: { ID: "desc" },
    });

    // Get related data (Loc, Owner, JobType, Rol) for each job
    const locIds = [...new Set(jobs.map(j => j.Loc).filter(Boolean))];
    const ownerIds = [...new Set(jobs.map(j => j.Owner).filter(Boolean))];
    const typeIds = [...new Set(jobs.map(j => j.Type).filter(Boolean))];

    // Fetch related records
    const [locs, owners, jobTypes] = await Promise.all([
      locIds.length > 0
        ? sqlserver.loc.findMany({ where: { Loc: { in: locIds as number[] } } })
        : [],
      ownerIds.length > 0
        ? sqlserver.owner.findMany({ where: { ID: { in: ownerIds as number[] } } })
        : [],
      typeIds.length > 0
        ? sqlserver.jobType.findMany({ where: { ID: { in: typeIds as number[] } } })
        : [],
    ]);

    // Get Rol records for names (Owner.Rol and Loc.Rol point to Rol.ID)
    const rolIds = [
      ...new Set([
        ...owners.map(o => o.Rol).filter(Boolean),
        ...locs.map(l => l.Rol).filter(Boolean),
      ])
    ];

    const rols = rolIds.length > 0
      ? await sqlserver.rol.findMany({ where: { ID: { in: rolIds as number[] } } })
      : [];

    // Create lookup maps
    const locMap = new Map(locs.map(l => [l.Loc, l]));
    const ownerMap = new Map(owners.map(o => [o.ID, o]));
    const typeMap = new Map(jobTypes.map(t => [t.ID, t]));
    const rolMap = new Map(rols.map(r => [r.ID, r]));

    // Map to response format
    const response = jobs.map(job => {
      const loc = job.Loc ? locMap.get(job.Loc) : null;
      const owner = job.Owner ? ownerMap.get(job.Owner) : null;
      const jobType = job.Type ? typeMap.get(job.Type) : null;

      // Get names from Rol table
      const ownerRol = owner?.Rol ? rolMap.get(owner.Rol) : null;
      const locRol = loc?.Rol ? rolMap.get(loc.Rol) : null;

      return {
        id: job.ID,
        jobNumber: job.ID.toString(),
        description: job.fDesc || "",
        type: jobType?.Type || "",
        typeId: job.Type,
        status: job.Status === 1 ? "Open" : job.Status === 2 ? "Closed" : `Status ${job.Status}`,
        statusId: job.Status,
        poNumber: job.PO || "",
        remarks: job.Remarks || "",
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
        // Custom fields
        custom1: job.Custom1,
        custom2: job.Custom2,
        custom3: job.Custom3,
        custom4: job.Custom4,
        custom5: job.Custom5,
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
