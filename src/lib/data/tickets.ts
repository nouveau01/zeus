/**
 * Tickets Data Access Layer
 *
 * Fetches from SQL Server (Total Service) and mirrors to PostgreSQL (ZEUS)
 * The app reads fresh data from SQL Server, which automatically gets cached in PostgreSQL
 */

import prisma from "@/lib/db";
import sqlserver, { isSqlServerAvailable } from "@/lib/sqlserver";
import { fetchLevelLookup, fetchWageLookup, formatTimeOnly } from "./lookups";

// Type mapping for ticket types
const TYPE_MAP: Record<number, string> = {
  0: "Service",
  1: "Repair",
  2: "Maintenance",
  3: "PM",
  4: "Violation",
  5: "NEW REPAIR",
};

// Reverse type map for lookups
const TYPE_ID_MAP: Record<string, number> = {
  "Service": 0,
  "Repair": 1,
  "Maintenance": 2,
  "PM": 3,
  "Violation": 4,
  "NEW REPAIR": 5,
};

interface FetchTicketsOptions {
  status?: "Open" | "Completed" | "All";
  type?: string;
  startDate?: string;
  endDate?: string;
  premisesId?: string;
  limit?: number;  // Default increased to 1000 for better coverage
}

/**
 * Fetch open tickets from SQL Server and mirror to PostgreSQL
 */
export async function fetchTickets(options: FetchTicketsOptions = {}) {
  const {
    status = "Open",
    type,
    startDate,
    endDate,
    premisesId,
    limit = 1000  // Increased from 500 to ensure we get more tickets
  } = options;

  if (!isSqlServerAvailable()) {
    console.log("SQL Server not available, reading from PostgreSQL only");
    return fetchTicketsFromPostgres(options);
  }

  try {
    // Determine which table to query
    const isCompleted = status === "Completed";
    const table = isCompleted ? "TicketD" : "TicketO";
    const locField = isCompleted ? "Loc" : "LID";

    // Build query conditions
    const conditions: string[] = [];

    // For completed tickets, filter by EDate (end/completion date)
    // For open tickets, filter by CDate (creation date)
    const dateField = isCompleted ? "EDate" : "CDate";
    if (startDate) {
      conditions.push(`${dateField} >= '${startDate}'`);
    }
    if (endDate) {
      conditions.push(`${dateField} <= '${endDate} 23:59:59'`);
    }
    if (type && type !== "All" && TYPE_ID_MAP[type] !== undefined) {
      conditions.push(`Type = ${TYPE_ID_MAP[type]}`);
    }
    if (premisesId) {
      conditions.push(`${locField} = ${parseInt(premisesId)}`);
    }

    // Build full query
    // For completed tickets, order by EDate (completion date) to show most recently completed first
    // For open tickets, order by ID (creation order)
    const orderField = isCompleted ? "EDate" : "ID";
    let query = `SELECT TOP ${limit} * FROM ${table}`;
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += ` ORDER BY ${orderField} DESC`;

    // Fetch from SQL Server
    const tickets: any[] = await sqlserver.$queryRawUnsafe(query);

    // Get related data (Loc, Elev, Owner, Rol for names, Emp for mechanics)
    const locIds = [...new Set(tickets.map(t => isCompleted ? t.Loc : t.LID).filter(Boolean))];
    const elevIds = [...new Set(tickets.map(t => isCompleted ? t.Elev : t.LElev).filter(Boolean))];
    const ownerIds = [...new Set(tickets.map(t => t.Owner).filter(Boolean))];
    const jobIds = [...new Set(tickets.map(t => t.Job).filter(Boolean))];
    // Get mechanic/employee IDs (DWork for completed, fWork for open tickets)
    const mechIds = [...new Set(tickets.map(t => t.DWork || t.fWork).filter(Boolean))];

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

    // Fetch mechanics/crews from tblWork table
    const mechanics: any[] = mechIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM tblWork WHERE ID IN (${mechIds.join(",")})`)
      : [];

    // Fetch Job records
    const jobs: any[] = jobIds.length > 0
      ? await sqlserver.$queryRawUnsafe(`SELECT * FROM Job WHERE ID IN (${jobIds.join(",")})`)
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

    // Get JobType records
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
    // Map mechanic/crew IDs to names from tblWork.fDesc
    const mechMap = new Map(mechanics.map(m => [m.ID, m.fDesc || `Crew ${m.ID}`]));
    // Map job IDs to job records
    const jobMap = new Map(jobs.map(j => [j.ID, j]));

    // Map and mirror each ticket
    const mappedTickets = await Promise.all(tickets.map(async (ticket) => {
      const locId = isCompleted ? ticket.Loc : ticket.LID;
      const elevId = isCompleted ? ticket.Elev : ticket.LElev;
      const loc = locId ? locMap.get(locId) : null;
      const elev = elevId ? elevMap.get(elevId) : null;
      const owner = ticket.Owner ? ownerMap.get(ticket.Owner) : null;
      const locRol = loc?.Rol ? rolMap.get(loc.Rol) : null;
      const ownerRol = owner?.Rol ? rolMap.get(owner.Rol) : null;

      // Calculate status
      const ticketStatus = isCompleted
        ? "Completed"
        : getTicketStatus(ticket.Status, ticket.TimeRoute, ticket.TimeSite);

      // Calculate hours for completed tickets
      const hours = isCompleted
        ? (parseFloat(ticket.Reg || 0) + parseFloat(ticket.OT || 0) + parseFloat(ticket.DT || 0) + parseFloat(ticket.TT || 0))
        : 0;

      const mappedTicket = {
        id: ticket.ID.toString(),
        ticketNumber: ticket.ID,
        workOrderNumber: ticket.WorkOrder ? parseInt(ticket.WorkOrder) : null,
        // For completed tickets, use EDate as the primary date (completion date)
        // For open tickets, use CDate (creation date)
        date: isCompleted ? ticket.EDate : ticket.CDate,
        dispatchDate: ticket.DDate,
        completedDate: ticket.EDate,
        type: jobTypeMap.get(ticket.Type) || TYPE_MAP[ticket.Type] || `Type ${ticket.Type}`,
        typeId: ticket.Type,
        category: ticket.Cat || null,
        status: ticketStatus,
        level: ticket.Level,
        estimate: ticket.Est,
        description: ticket.fDesc || "",
        scopeOfWork: ticket.fDesc || "",
        resolution: isCompleted ? (ticket.DescRes || ticket.Resolution || "") : null,
        caller: ticket.Who || "",
        createdBy: ticket.fBy || "",
        accountId: loc?.ID || locId?.toString() || null,
        mechCrew: mechMap.get(ticket.DWork || ticket.fWork) || null,
        hours: hours,
        unitName: elev?.Unit || null,
        unitId: elevId,
        jobId: ticket.Job,
        job: ticket.Job ? {
          id: ticket.Job.toString(),
          externalId: ticket.Job.toString(),
          jobName: jobMap.get(ticket.Job)?.fDesc || "",
        } : null,
        phone: ticket.Phone || null,
        notes: ticket.Notes || null,
        source: ticket.Source || null,
        calledIn: ticket.CallIn === 1,
        highPriority: ticket.High === 1,
        followUp: ticket.Follow === 1,
        enRouteTime: ticket.TimeRoute || null,
        onSiteTime: ticket.TimeSite || null,
        completedTime: ticket.TimeComp || null,
        city: locRol?.City || ticket.City || null,
        state: locRol?.State || ticket.State || null,
        premises: loc ? {
          id: loc.Loc.toString(),
          premisesId: loc.ID || loc.Loc.toString(),
          address: locRol?.Address || loc.Address || "",
          tag: loc.Tag || "",
          city: locRol?.City || ticket.City || null,
          state: locRol?.State || ticket.State || null,
          zip: locRol?.Zip || loc.Zip || null,
          phone: locRol?.Phone || loc.Phone || null,
          contact: locRol?.Contact || loc.Contact || null,
          email: locRol?.Email || loc.Email || null,
          zone: loc.Zone || null,
          route: loc.Route || null,
          territory: loc.Territory || null,
          customer: owner ? {
            id: owner.ID.toString(),
            name: ownerRol?.Name || "",
            address: ownerRol?.Address || "",
            city: ownerRol?.City || "",
            state: ownerRol?.State || "",
            phone: ownerRol?.Phone || "",
            email: ownerRol?.Email || "",
          } : null,
        } : null,
      };

      // Mirror to PostgreSQL (upsert)
      await mirrorTicketToPostgres(mappedTicket, isCompleted);

      return mappedTicket;
    }));

    return mappedTickets;
  } catch (error) {
    console.error("Error fetching tickets from SQL Server:", error);
    // Fallback to PostgreSQL if SQL Server fails
    return fetchTicketsFromPostgres(options);
  }
}

/**
 * Mirror a ticket to PostgreSQL
 */
async function mirrorTicketToPostgres(ticket: any, isCompleted: boolean) {
  try {
    await prisma.ticket.upsert({
      where: { ticketNumber: ticket.ticketNumber },
      update: {
        workOrderNumber: ticket.workOrderNumber,
        date: ticket.date ? new Date(ticket.date) : new Date(),
        completedDate: ticket.completedDate ? new Date(ticket.completedDate) : null,
        type: ticket.type || "Other",
        category: ticket.category,
        level: ticket.level?.toString(),
        status: ticket.status,
        accountId: ticket.accountId,
        mechCrew: ticket.mechCrew,
        unitName: ticket.unitName,
        scopeOfWork: ticket.scopeOfWork,
        resolution: ticket.resolution,
        hours: ticket.hours || 0,
        enRouteTime: ticket.enRouteTime?.toString(),
        onSiteTime: ticket.onSiteTime?.toString(),
        completedTime: ticket.completedTime?.toString(),
        calledInBy: ticket.caller,
        takenBy: ticket.createdBy,
      },
      create: {
        ticketNumber: ticket.ticketNumber,
        workOrderNumber: ticket.workOrderNumber,
        date: ticket.date ? new Date(ticket.date) : new Date(),
        completedDate: ticket.completedDate ? new Date(ticket.completedDate) : null,
        type: ticket.type || "Other",
        category: ticket.category,
        level: ticket.level?.toString(),
        status: ticket.status,
        accountId: ticket.accountId,
        mechCrew: ticket.mechCrew,
        unitName: ticket.unitName,
        scopeOfWork: ticket.scopeOfWork,
        resolution: ticket.resolution,
        hours: ticket.hours || 0,
        enRouteTime: ticket.enRouteTime?.toString(),
        onSiteTime: ticket.onSiteTime?.toString(),
        completedTime: ticket.completedTime?.toString(),
        calledInBy: ticket.caller,
        takenBy: ticket.createdBy,
      },
    });
  } catch (error) {
    // Log but don't fail - mirroring is secondary to fetching
    console.error("Error mirroring ticket to PostgreSQL:", error);
  }
}

/**
 * Fallback: fetch from PostgreSQL only
 */
async function fetchTicketsFromPostgres(options: FetchTicketsOptions) {
  const { status, type, startDate, endDate, premisesId, limit = 500 } = options;

  const where: any = {};

  if (status && status !== "All") {
    where.status = status === "Completed" ? "Completed" : { not: "Completed" };
  }
  if (type && type !== "All") {
    where.type = type;
  }
  if (startDate) {
    where.date = { ...where.date, gte: new Date(startDate) };
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    where.date = { ...where.date, lte: end };
  }
  if (premisesId) {
    where.premisesId = premisesId;
  }

  const tickets = await prisma.ticket.findMany({
    where,
    take: limit,
    orderBy: { ticketNumber: "desc" },
    include: {
      premises: {
        include: {
          customer: true,
        },
      },
    },
  });

  return tickets.map(t => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    workOrderNumber: t.workOrderNumber,
    date: t.date,
    completedDate: t.completedDate,
    type: t.type,
    category: t.category,
    status: t.status,
    level: t.level,
    description: t.scopeOfWork,
    scopeOfWork: t.scopeOfWork,
    resolution: t.resolution,
    accountId: t.accountId,
    mechCrew: t.mechCrew,
    unitName: t.unitName,
    hours: Number(t.hours),
    premises: t.premises ? {
      id: t.premises.id,
      premisesId: t.premises.premisesId,
      address: t.premises.address,
      tag: t.premises.tag,
      city: t.premises.city,
      state: t.premises.state,
      customer: t.premises.customer ? {
        id: t.premises.customer.id,
        name: t.premises.customer.name,
      } : null,
    } : null,
  }));
}

/**
 * Get ticket status from SQL Server fields
 */
function getTicketStatus(statusField: any, enRouteTime: any, onSiteTime: any): string {
  if (onSiteTime) return "On Site";
  if (enRouteTime) return "En Route";
  if (statusField === 1 || statusField === "1") return "Assigned";
  if (statusField === 2 || statusField === "2") return "En Route";
  if (statusField === 3 || statusField === "3") return "On Site";
  return "Open";
}

/**
 * Get a single ticket by ID
 */
export async function fetchTicketById(ticketId: string | number) {
  const ticketNum = parseInt(ticketId.toString());

  if (!isSqlServerAvailable()) {
    const ticket = await prisma.ticket.findFirst({
      where: {
        OR: [
          { id: ticketId.toString() },
          { ticketNumber: ticketNum }
        ]
      },
      include: {
        premises: {
          include: { customer: true },
        },
      },
    });
    return ticket;
  }

  // Try open tickets first
  let query = `SELECT TOP 1 * FROM TicketO WHERE ID = ${ticketNum}`;
  let results: any[] = await sqlserver.$queryRawUnsafe(query);
  let isCompleted = false;

  if (results.length === 0) {
    // Try completed tickets
    query = `SELECT TOP 1 * FROM TicketD WHERE ID = ${ticketNum}`;
    results = await sqlserver.$queryRawUnsafe(query);
    isCompleted = true;
    if (results.length === 0) return null;
  }

  const ticket = results[0];

  // Get related data
  const locId = isCompleted ? ticket.Loc : ticket.LID;
  const elevId = isCompleted ? ticket.Elev : ticket.LElev;
  const mechId = ticket.DWork || ticket.fWork;
  const jobId = ticket.Job;

  // Fetch related records and lookups in parallel
  const [locs, elevs, mechanics, jobs, jobTypes, levelLookup, wageLookup] = await Promise.all([
    locId ? sqlserver.$queryRawUnsafe(`SELECT * FROM Loc WHERE Loc = ${locId}`) : Promise.resolve([]),
    elevId ? sqlserver.$queryRawUnsafe(`SELECT * FROM Elev WHERE ID = ${elevId}`) : Promise.resolve([]),
    mechId ? sqlserver.$queryRawUnsafe(`SELECT * FROM tblWork WHERE ID = ${mechId}`) : Promise.resolve([]),
    jobId ? sqlserver.$queryRawUnsafe(`SELECT * FROM Job WHERE ID = ${jobId}`) : Promise.resolve([]),
    ticket.Type !== null ? sqlserver.$queryRawUnsafe(`SELECT * FROM JobType WHERE ID = ${ticket.Type}`) : Promise.resolve([]),
    fetchLevelLookup(),
    fetchWageLookup(),
  ]) as [any[], any[], any[], any[], any[], Map<number, string>, Map<number, string>];

  const loc = locs[0] || null;
  const elev = elevs[0] || null;
  const mech = mechanics[0] || null;
  const job = jobs[0] || null;
  const jobType = jobTypes[0] || null;

  // Get Rol for location name/address
  let locRol = null;
  if (loc?.Rol) {
    const rols: any[] = await sqlserver.$queryRawUnsafe(`SELECT * FROM Rol WHERE ID = ${loc.Rol}`);
    locRol = rols[0] || null;
  }

  // Calculate hours for completed tickets
  const hours = isCompleted
    ? (parseFloat(ticket.Reg || 0) + parseFloat(ticket.OT || 0) + parseFloat(ticket.DT || 0) + parseFloat(ticket.TT || 0))
    : 0;

  // Calculate status
  const ticketStatus = isCompleted
    ? "Completed"
    : getTicketStatus(ticket.Status, ticket.TimeRoute, ticket.TimeSite);

  // Get Level and Wage labels from lookups
  const levelLabel = ticket.Level ? levelLookup.get(ticket.Level) || null : null;
  const wageLabel = ticket.WageC ? wageLookup.get(ticket.WageC) || null : null;

  return {
    id: ticket.ID.toString(),
    ticketNumber: ticket.ID,
    workOrderNumber: ticket.WorkOrder ? parseInt(ticket.WorkOrder) : null,
    date: isCompleted ? ticket.EDate : ticket.CDate,
    dispatchDate: ticket.DDate,
    completedDate: ticket.EDate,
    type: jobType?.Type || jobType?.Name || TYPE_MAP[ticket.Type] || `Type ${ticket.Type}`,
    typeId: ticket.Type,
    category: ticket.Cat || null,
    status: ticketStatus,
    level: ticket.Level,
    levelLabel: levelLabel,
    estimate: ticket.Est,
    description: ticket.fDesc || "",
    scopeOfWork: ticket.fDesc || "",
    resolution: isCompleted ? (ticket.DescRes || ticket.Resolution || "") : null,
    caller: ticket.Who || "",
    createdBy: ticket.fBy || "",
    resolvedBy: ticket.RBy || null,
    accountId: loc?.ID || locId?.toString() || null,
    mechCrew: mech?.fDesc || null,
    wage: wageLabel,
    wageId: ticket.WageC || null,
    phase: ticket.Phase || null,
    hours: hours,
    regularHours: parseFloat(ticket.Reg || 0),
    overtimeHours: parseFloat(ticket.OT || 0),
    doubleTimeHours: parseFloat(ticket.DT || 0),
    travelHours: parseFloat(ticket.TT || 0),
    unitName: elev?.Unit || null,
    unitId: elevId,
    jobId: ticket.Job,
    job: job ? {
      id: job.ID.toString(),
      externalId: job.ID.toString(),
      jobName: job.fDesc || "",
    } : null,
    phone: ticket.Phone || ticket.CPhone || null,
    notes: ticket.Notes || null,
    source: ticket.Source || null,
    calledIn: ticket.CallIn === 1,
    highPriority: ticket.High === 1,
    followUp: ticket.Follow === 1,
    // Time fields - use string time fields if available, otherwise format DateTime
    enRouteTime: ticket.CTime || formatTimeOnly(ticket.TimeRoute),
    onSiteTime: ticket.DTime || formatTimeOnly(ticket.TimeSite),
    completedTime: ticket.ETime || formatTimeOnly(ticket.TimeComp),
    // Mileage
    startingMileage: ticket.SMile || 0,
    endingMileage: ticket.EMile || 0,
    mileage: ticket.Mileage || 0,
    // Expenses
    zoneExpense: parseFloat(ticket.Zone || 0),
    tollExpense: parseFloat(ticket.Toll || 0),
    otherExpense: parseFloat(ticket.OtherE || 0),
    // Flags
    workComplete: ticket.WorkComplete === 1,
    chargeable: ticket.Charge === 1,
    internet: ticket.Internet === 1,
    // Review
    reviewStatus: ticket.BReview,
    city: locRol?.City || ticket.City || null,
    state: locRol?.State || ticket.State || null,
    premises: loc ? {
      id: loc.Loc.toString(),
      premisesId: loc.ID || loc.Loc.toString(),
      address: locRol?.Address || loc.Address || "",
      tag: loc.Tag || "",
      city: locRol?.City || ticket.City || null,
      state: locRol?.State || ticket.State || null,
      zip: locRol?.Zip || loc.Zip || null,
      phone: locRol?.Phone || loc.Phone || null,
    } : null,
  };
}
