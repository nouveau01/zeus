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

    // Create lookup maps
    const locMap = new Map(locs.map(l => [l.Loc, l]));
    const elevMap = new Map(elevs.map(e => [e.ID, e]));
    const ownerMap = new Map(owners.map(o => [o.ID, o]));
    const rolMap = new Map(rols.map(r => [r.ID, r]));

    // Map type int to string
    const typeNames: Record<number, string> = {
      1: "Service",
      2: "Repair",
      3: "Maintenance",
      4: "PM",
    };

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
        premises: loc ? {
          id: loc.Loc.toString(),
          premisesId: loc.ID || loc.Loc.toString(),
          address: locRol?.Address || loc.Address || "",
          tag: loc.Tag || "",
          city: locRol?.City || ticket.City || null,
          state: locRol?.State || ticket.State || null,
          customer: owner ? {
            id: owner.ID.toString(),
            name: ownerRol?.Name || "",
          } : null,
        } : null,
        custom1: ticket.Custom1,
        custom2: ticket.Custom2,
        custom3: ticket.Custom3,
        custom4: ticket.Custom4,
        custom5: ticket.Custom5,
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
