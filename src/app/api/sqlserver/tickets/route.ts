import { NextRequest, NextResponse } from "next/server";
import sqlserver from "@/lib/sqlserver";

// GET /api/sqlserver/tickets - Get tickets from SQL Server (READ ONLY)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "Open" or "Completed"
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const premisesId = searchParams.get("premisesId");
    const limit = parseInt(searchParams.get("limit") || "500");

    // Determine which table to query based on status
    const isCompleted = status === "Completed";
    const table = isCompleted ? "TicketD" : "TicketO";
    const locField = isCompleted ? "Loc" : "LID"; // Different field names

    // Build query
    let query = `SELECT TOP ${limit} * FROM ${table}`;
    const conditions: string[] = [];

    if (startDate) {
      conditions.push(`CDate >= '${startDate}'`);
    }
    if (endDate) {
      conditions.push(`CDate <= '${endDate} 23:59:59'`);
    }
    if (type && type !== "All") {
      // Type is stored as int, need to map
      const typeMap: Record<string, number> = {
        "Service": 1,
        "Repair": 2,
        "Maintenance": 3,
        "PM": 4,
      };
      if (typeMap[type]) {
        conditions.push(`Type = ${typeMap[type]}`);
      }
    }
    if (premisesId) {
      conditions.push(`${locField} = ${parseInt(premisesId)}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY ID DESC`;

    // Get tickets from SQL Server
    const tickets: any[] = await sqlserver.$queryRawUnsafe(query);

    // Get related data
    const locIds = [...new Set(tickets.map(t => isCompleted ? t.Loc : t.LID).filter(Boolean))];
    const elevIds = [...new Set(tickets.map(t => isCompleted ? t.Elev : t.LElev).filter(Boolean))];
    const ownerIds = [...new Set(tickets.map(t => t.Owner).filter(Boolean))];
    const jobIds = [...new Set(tickets.map(t => t.Job).filter(Boolean))];

    // Fetch related records
    const locs: any[] = locIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Loc WHERE Loc IN (${locIds.join(",")})`)
      : [];

    const elevs: any[] = elevIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Elev WHERE ID IN (${elevIds.join(",")})`)
      : [];

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

    // Get JobType records for type names (don't filter out 0 since it's a valid type ID)
    const typeIds = [...new Set(tickets.map(t => t.Type).filter(t => t !== null && t !== undefined))];
    const jobTypes: any[] = typeIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM JobType WHERE ID IN (${typeIds.join(",")})`)
      : [];

    // Create lookup maps
    const locMap = new Map(locs.map(l => [l.Loc, l]));
    const elevMap = new Map(elevs.map(e => [e.ID, e]));
    const ownerMap = new Map(owners.map(o => [o.ID, o]));
    const rolMap = new Map(rols.map(r => [r.ID, r]));
    const jobTypeMap = new Map(jobTypes.map(jt => [jt.ID, jt.Type || jt.Name || `Type ${jt.ID}`]));

    // Map to response format
    const response = tickets.map(ticket => {
      const locId = isCompleted ? ticket.Loc : ticket.LID;
      const elevId = isCompleted ? ticket.Elev : ticket.LElev;
      const loc = locId ? locMap.get(locId) : null;
      const elev = elevId ? elevMap.get(elevId) : null;
      const owner = ticket.Owner ? ownerMap.get(ticket.Owner) : null;
      const locRol = loc?.Rol ? rolMap.get(loc.Rol) : null;
      const ownerRol = owner?.Rol ? rolMap.get(owner.Rol) : null;

      // Calculate total hours for completed tickets
      const hours = isCompleted
        ? (parseFloat(ticket.Reg || 0) + parseFloat(ticket.OT || 0) + parseFloat(ticket.DT || 0) + parseFloat(ticket.TT || 0))
        : 0;

      return {
        id: ticket.ID.toString(),
        ticketNumber: ticket.ID,
        workOrderNumber: ticket.WorkOrder ? parseInt(ticket.WorkOrder) : null,
        date: ticket.CDate,
        time: ticket.CDate ? new Date(ticket.CDate).toLocaleTimeString() : null,
        dispatchDate: ticket.DDate,
        endDate: ticket.EDate,
        type: jobTypeMap.get(ticket.Type) || `Type ${ticket.Type}`,
        typeId: ticket.Type,
        category: ticket.Cat || null,
        status: isCompleted ? "Completed" : "Open",
        level: ticket.Level,
        estimate: ticket.Est,
        description: ticket.fDesc || "",
        scopeOfWork: ticket.Scope || ticket.fDesc || "",
        resolution: isCompleted ? (ticket.DescRes || "") : null,
        who: ticket.Who || "",
        caller: ticket.Who || "",
        createdBy: ticket.fBy || "",
        takenBy: ticket.fBy || "",
        accountId: loc?.ID || locId?.toString() || null,
        mechCrew: ticket.fWork?.toString() || null,
        supervisor: null,
        bill: isCompleted ? (ticket.Charge === 1) : false,
        reviewed: isCompleted ? (ticket.BReview === 1) : false,
        pr: isCompleted ? (ticket.ClearPR === 1) : false,
        vd: false,
        inv: isCompleted ? (ticket.Invoice != null) : false,
        invoiceId: isCompleted ? ticket.Invoice : null,
        hours: hours,
        reg: isCompleted ? ticket.Reg : null,
        ot: isCompleted ? ticket.OT : null,
        dt: isCompleted ? ticket.DT : null,
        tt: isCompleted ? ticket.TT : null,
        total: isCompleted ? ticket.Total : null,
        emailStatus: null,
        unitName: elev?.Unit || null,
        unitId: elevId,
        jobId: ticket.Job,
        phone: ticket.Phone || null,
        notes: ticket.Notes || null,
        group: ticket.fGroup || null,
        source: ticket.Source || null,
        calledIn: ticket.CalledIn === 1,
        highPriority: ticket.Priority === 1,
        followUp: ticket.FollowUp === 1,
        scheduledDate: ticket.SDate || null,
        scheduledTime: ticket.STime || null,
        scheduledMech: ticket.SMech || null,
        enRouteTime: ticket.EnRoute || null,
        onSiteTime: ticket.OnSite || null,
        completedTime: ticket.Completed || null,
        witness: ticket.Witness || null,
        premises: loc ? {
          id: loc.Loc.toString(),
          premisesId: loc.ID || loc.Loc.toString(),
          address: locRol?.Address || loc.Address || "",
          tag: loc.Tag || "",
          city: locRol?.City || ticket.City || null,
          state: locRol?.State || ticket.State || null,
          zip: locRol?.Zip || loc.Zip || null,
          country: locRol?.Country || "United States",
          phone: locRol?.Phone || loc.Phone || null,
          mobile: locRol?.Mobile || loc.Mobile || null,
          contact: locRol?.Contact || loc.Contact || null,
          email: locRol?.Email || loc.Email || null,
          zone: loc.Zone || null,
          route: loc.Route || null,
          territory: loc.Territory || null,
          remarks: loc.Remark || null,
          customer: owner ? {
            id: owner.ID.toString(),
            name: ownerRol?.Name || "",
            address: ownerRol?.Address || "",
            city: ownerRol?.City || "",
            state: ownerRol?.State || "",
            zip: ownerRol?.Zip || "",
            country: ownerRol?.Country || "United States",
            phone: ownerRol?.Phone || "",
            fax: ownerRol?.Fax || "",
            mobile: ownerRol?.Mobile || "",
            contact: ownerRol?.Contact || "",
            email: ownerRol?.Email || "",
            remarks: owner.Remark || "",
          } : null,
        } : null,
        custom1: ticket.Custom1,
        custom2: ticket.Custom2,
        custom3: ticket.Custom3,
        custom4: ticket.Custom4,
        custom5: ticket.Custom5,
        custom6: ticket.Custom6,
        custom7: ticket.Custom7,
        custom8: ticket.Custom8,
        custom9: ticket.Custom9,
        custom10: ticket.Custom10,
      };
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching tickets from SQL Server:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets from SQL Server", details: String(error) },
      { status: 500 }
    );
  }
}
