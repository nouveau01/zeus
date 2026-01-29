import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

// GET /api/sqlserver/jobs/[id] - Get single job from SQL Server (READ ONLY)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const jobId = parseInt(id);

    if (isNaN(jobId)) {
      return NextResponse.json({ error: "Invalid job ID" }, { status: 400 });
    }

    // Fetch job using raw SQL for SQL Server 2008 compatibility
    const jobs: any[] = await sqlserver.$queryRawUnsafe(
      `SELECT * FROM Job WHERE ID = ${jobId}`
    );

    if (jobs.length === 0) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const job = jobs[0];

    // Fetch related data
    const locs: any[] = job.Loc
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Loc WHERE Loc = ${job.Loc}`)
      : [];

    const owners: any[] = job.Owner
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Owner WHERE ID = ${job.Owner}`)
      : [];

    const jobTypes: any[] = job.Type
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM JobType WHERE ID = ${job.Type}`)
      : [];

    const templates: any[] = job.Template
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM JobT WHERE ID = ${job.Template}`)
      : [];

    // Get Rol records for names
    const rolIds = [
      ...(owners.length > 0 && owners[0].Rol ? [owners[0].Rol] : []),
      ...(locs.length > 0 && locs[0].Rol ? [locs[0].Rol] : []),
    ].filter(Boolean);

    const rols: any[] = rolIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID IN (${rolIds.join(",")})`)
      : [];

    const rolMap = new Map(rols.map(r => [r.ID, r]));
    const loc = locs[0] || null;
    const owner = owners[0] || null;
    const jobType = jobTypes[0] || null;
    const template = templates[0] || null;

    const ownerRol = owner?.Rol ? rolMap.get(owner.Rol) : null;
    const locRol = loc?.Rol ? rolMap.get(loc.Rol) : null;

    // Map to response format matching Job interface
    const response = {
      id: job.ID,
      externalId: job.ID.toString(),
      jobName: job.fDesc || "",
      jobDescription: job.fDesc || "",
      description: job.fDesc || "",
      type: jobType?.Type || "",
      typeId: job.Type,
      status: job.Status === 1 ? "Open" : job.Status === 2 ? "Closed" : `Status ${job.Status}`,
      statusId: job.Status,
      contractType: job.CType || null,
      template: template?.fDesc || null,
      templateId: job.Template,
      poNumber: job.PO || "",
      remarks: job.Remarks || "",
      sRemarks: job.Remarks || "",
      customerRemarks: null,
      comments: null,
      date: job.fDate,
      dueDate: job.CloseDate,
      scheduleDate: null,
      compDate: job.CloseDate,
      level: null,
      supervisor: null,
      projectManager: null,
      billingTerms: null,
      chargeable: true,
      // Hours
      reg: job.Reg,
      ot: job.OT,
      ot17: null,
      dt: job.DT,
      tt: job.TT,
      totalHours: job.Hour,
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
      // Related data
      premises: loc ? {
        id: loc.Loc,
        premisesId: loc.Loc?.toString(),
        locId: loc.ID,
        name: loc.Tag || locRol?.Name || "",
        address: locRol?.Address || loc.Address || "",
        city: locRol?.City || "",
        state: locRol?.State || "",
        zip: locRol?.Zip || "",
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

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching job from SQL Server:", error);
    return NextResponse.json(
      { error: "Failed to fetch job from SQL Server", details: String(error) },
      { status: 500 }
    );
  }
}
