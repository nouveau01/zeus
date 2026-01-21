import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/jobs/[id]/tickets
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { jobId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// POST /api/jobs/[id]/tickets
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { description, type, scopeOfWork } = body;

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Generate ticket number (auto-increment)
    const lastTicket = await prisma.ticket.findFirst({
      orderBy: { ticketNumber: "desc" },
    });
    const ticketNumber = (lastTicket?.ticketNumber || 0) + 1;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        date: new Date(),
        type: type || "Repair",
        status: "Open",
        description: description || null,
        scopeOfWork: scopeOfWork || null,
        jobId: params.id,
      },
    });

    // Create activity for ticket creation
    await prisma.activity.create({
      data: {
        type: "TICKET_CREATED",
        content: `Created ticket #${ticketNumber}`,
        jobId: params.id,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
