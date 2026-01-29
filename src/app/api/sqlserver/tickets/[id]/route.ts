import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

// GET /api/sqlserver/tickets/[id] - Get single ticket from SQL Server (READ ONLY)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "Open" or "Completed"
    const ticketId = parseInt(id);

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 });
    }

    // Try completed tickets first (TicketD), then open tickets (TicketO)
    let ticket: any = null;
    let isCompleted = status === "Completed";

    if (status === "Completed" || !status) {
      const completedTickets: any[] = await sqlserver.$queryRawUnsafe(
        `SELECT * FROM TicketD WHERE ID = ${ticketId}`
      );
      if (completedTickets.length > 0) {
        ticket = completedTickets[0];
        isCompleted = true;
      }
    }

    if (!ticket && (status === "Open" || !status)) {
      const openTickets: any[] = await sqlserver.$queryRawUnsafe(
        `SELECT * FROM TicketO WHERE ID = ${ticketId}`
      );
      if (openTickets.length > 0) {
        ticket = openTickets[0];
        isCompleted = false;
      }
    }

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Get related data
    const locId = isCompleted ? ticket.Loc : ticket.LID;
    const elevId = isCompleted ? ticket.Elev : ticket.LElev;

    const locs: any[] = locId
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Loc WHERE Loc = ${locId}`)
      : [];
    const loc = locs[0] || null;

    const elevs: any[] = elevId
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Elev WHERE ID = ${elevId}`)
      : [];
    const elev = elevs[0] || null;

    const owners: any[] = ticket.Owner
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Owner WHERE ID = ${ticket.Owner}`)
      : [];
    const owner = owners[0] || null;

    // Get Rol records
    const rolIds = [loc?.Rol, owner?.Rol].filter(Boolean);
    const rols: any[] = rolIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID IN (${rolIds.join(",")})`)
      : [];
    const rolMap = new Map(rols.map(r => [r.ID, r]));
    const locRol = loc?.Rol ? rolMap.get(loc.Rol) : null;
    const ownerRol = owner?.Rol ? rolMap.get(owner.Rol) : null;

    // Get job if exists
    const jobs: any[] = ticket.Job
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Job WHERE ID = ${ticket.Job}`)
      : [];
    const job = jobs[0] || null;

    // Map type int to string
    const typeNames: Record<number, string> = {
      1: "Service",
      2: "Repair",
      3: "Maintenance",
      4: "PM",
    };

    // Calculate total hours for completed tickets
    const hours = isCompleted
      ? (parseFloat(ticket.Reg || 0) + parseFloat(ticket.OT || 0) + parseFloat(ticket.DT || 0) + parseFloat(ticket.TT || 0))
      : 0;

    // Map to response format
    const response = {
      id: ticket.ID.toString(),
      ticketNumber: ticket.ID,
      workOrderNumber: ticket.WorkOrder ? parseInt(ticket.WorkOrder) : null,
      workOrder: ticket.WorkOrder || "",
      date: ticket.CDate,
      dispatchDate: ticket.DDate,
      endDate: ticket.EDate,
      type: typeNames[ticket.Type] || `Type ${ticket.Type}`,
      typeId: ticket.Type,
      category: ticket.Cat || null,
      status: isCompleted ? "Completed" : "Open",
      level: ticket.Level,
      estimate: ticket.Est,
      description: ticket.fDesc || "",
      resolution: isCompleted ? (ticket.DescRes || "") : null,
      who: ticket.Who || "",
      createdBy: ticket.fBy || "",
      accountId: loc?.ID || locId?.toString() || null,
      mechCrew: ticket.fWork?.toString() || null,
      bill: isCompleted ? (ticket.Charge === 1) : false,
      chargeable: isCompleted ? (ticket.Charge === 1) : true,
      reviewed: isCompleted ? (ticket.BReview === 1) : false,
      pr: isCompleted ? (ticket.ClearPR === 1) : false,
      clearCheck: isCompleted ? (ticket.ClearCheck === 1) : false,
      inv: isCompleted ? (ticket.Invoice != null) : false,
      invoiceId: isCompleted ? ticket.Invoice : null,
      hours: hours,
      reg: isCompleted ? ticket.Reg : null,
      ot: isCompleted ? ticket.OT : null,
      dt: isCompleted ? ticket.DT : null,
      tt: isCompleted ? ticket.TT : null,
      nt: isCompleted ? ticket.NT : null,
      total: isCompleted ? ticket.Total : null,
      mileage: isCompleted ? ticket.Mileage : null,
      toll: isCompleted ? ticket.Toll : null,
      zone: isCompleted ? ticket.Zone : null,
      otherExpense: isCompleted ? ticket.OtherE : null,
      unitName: elev?.Unit || null,
      unitId: elevId,
      unit: elev ? {
        id: elev.ID,
        unit: elev.Unit || "",
        type: elev.Type || "",
        building: elev.Building || "",
      } : null,
      jobId: ticket.Job,
      job: job ? {
        id: job.ID,
        description: job.fDesc || "",
      } : null,
      phone: ticket.Phone || ticket.CPhone || null,
      phone2: ticket.Phone2 || null,
      notes: ticket.Notes || null,
      billingRemarks: ticket.BRemarks || null,
      group: ticket.fGroup || null,
      source: ticket.Source || null,
      causeId: isCompleted ? ticket.CauseID : null,
      causeDesc: isCompleted ? ticket.CauseDesc : null,
      timeRoute: ticket.TimeRoute,
      timeSite: ticket.TimeSite,
      timeComp: ticket.TimeComp,
      premises: loc ? {
        id: loc.Loc.toString(),
        premisesId: loc.ID || loc.Loc.toString(),
        tag: loc.Tag || "",
        address: locRol?.Address || loc.Address || "",
        city: locRol?.City || loc.City || null,
        state: locRol?.State || loc.State || null,
        zip: locRol?.Zip || loc.Zip || null,
      } : null,
      customer: owner ? {
        id: owner.ID.toString(),
        name: ownerRol?.Name || "",
      } : null,
      custom1: ticket.Custom1,
      custom2: ticket.Custom2,
      custom3: ticket.Custom3,
      custom4: ticket.Custom4,
      custom5: ticket.Custom5,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching ticket from SQL Server:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket from SQL Server", details: String(error) },
      { status: 500 }
    );
  }
}
