import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/tickets - List tickets with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const mechanic = searchParams.get("mechanic");
    const supervisor = searchParams.get("supervisor");
    const reviewed = searchParams.get("reviewed");
    const billed = searchParams.get("billed");
    const payroll = searchParams.get("payroll");
    const premisesId = searchParams.get("premisesId");

    // Build where clause
    const where: any = {};

    // Premises filter (for filtering by account)
    if (premisesId) {
      where.premisesId = premisesId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // Type filter
    if (type && type !== "All") {
      where.type = type;
    }

    // Status filter (default to Completed for completed tickets page)
    if (status) {
      where.status = status;
    }

    // Mechanic filter
    if (mechanic && mechanic !== "All") {
      where.mechCrew = mechanic;
    }

    // Supervisor filter
    if (supervisor && supervisor !== "All") {
      where.supervisor = supervisor;
    }

    // Reviewed filter
    if (reviewed && reviewed !== "All") {
      where.reviewed = reviewed === "true";
    }

    // Billed filter
    if (billed && billed !== "All") {
      where.bill = billed === "true";
    }

    // Payroll filter
    if (payroll && payroll !== "All") {
      where.pr = payroll === "true";
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        premises: {
          select: {
            id: true,
            premisesId: true,
            address: true,
            city: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            externalId: true,
            jobName: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Build the data object, only including fields that have values
    const data: any = {
      ticketNumber: body.ticketNumber,
      workOrderNumber: body.workOrderNumber || body.ticketNumber,
      type: body.type || "Other",
      status: body.status || "Open",
      bill: body.bill || false,
      reviewed: body.reviewed || false,
      pr: body.pr || false,
      vd: body.vd || false,
      inv: body.inv || false,
      hours: body.hours || 0,
      emailStatus: body.emailStatus || "No Email Sent",
    };

    // Date — parse from MM/DD/YYYY or ISO string
    if (body.date) {
      const parts = body.date.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (parts) {
        data.date = new Date(parseInt(parts[3]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        data.date = new Date(body.date);
      }
    } else {
      data.date = new Date();
    }

    // Optional string fields
    if (body.category) data.category = body.category;
    if (body.level) data.level = body.level;
    if (body.accountId) data.accountId = body.accountId;
    if (body.mechCrew) data.mechCrew = body.mechCrew;
    if (body.supervisor) data.supervisor = body.supervisor;
    if (body.unitName) data.unitName = body.unitName;
    if (body.description) data.description = body.description;
    if (body.scopeOfWork) data.scopeOfWork = body.scopeOfWork;
    if (body.resolution) data.resolution = body.resolution;
    if (body.nameAddress) data.nameAddress = body.nameAddress;
    if (body.enRouteTime) data.enRouteTime = body.enRouteTime;
    if (body.onSiteTime) data.onSiteTime = body.onSiteTime;
    if (body.completedTime) data.completedTime = body.completedTime;
    if (body.takenBy) data.takenBy = body.takenBy;
    if (body.calledInBy) data.calledInBy = body.calledInBy;
    if (body.internalComments) data.internalComments = body.internalComments;

    // Relations — look up premises by premisesId code if provided
    if (body.premisesId) {
      data.premisesId = body.premisesId;
    } else if (body.accountPremisesId) {
      // Look up the internal ID from the user-facing premisesId code
      const premises = await prisma.premises.findFirst({
        where: { premisesId: body.accountPremisesId },
        select: { id: true },
      });
      if (premises) data.premisesId = premises.id;
    }

    if (body.jobId) data.jobId = body.jobId;
    if (body.customerId) data.customerId = body.customerId;
    if (body.unitId) data.unitId = body.unitId;
    if (body.invoiceId) data.invoiceId = body.invoiceId;

    const ticket = await prisma.ticket.create({
      data,
      include: {
        premises: {
          select: {
            id: true,
            premisesId: true,
            address: true,
            city: true,
          },
        },
        job: {
          select: {
            id: true,
            externalId: true,
            jobName: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: error.message || "Failed to create ticket" }, { status: 500 });
  }
}
