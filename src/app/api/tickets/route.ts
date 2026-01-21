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

    // Build where clause
    const where: any = {};

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
    const {
      ticketNumber,
      workOrderNumber,
      date,
      type,
      category,
      status,
      accountId,
      mechCrew,
      supervisor,
      bill,
      reviewed,
      pr,
      vd,
      inv,
      hours,
      emailStatus,
      unitName,
      description,
      premisesId,
      jobId,
      invoiceId,
    } = body;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        workOrderNumber,
        date: new Date(date),
        type: type || "Other",
        category,
        status: status || "Completed",
        accountId,
        mechCrew,
        supervisor,
        bill: bill || false,
        reviewed: reviewed || false,
        pr: pr || false,
        vd: vd || false,
        inv: inv || false,
        hours: hours || 0,
        emailStatus: emailStatus || "No Email Sent",
        unitName,
        description,
        premisesId,
        jobId,
        invoiceId,
      },
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
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
