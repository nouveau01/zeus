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
    const { subject, description, priority } = body;

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Generate ticket number
    const ticketCount = await prisma.ticket.count();
    const ticketNumber = `TKT-${String(ticketCount + 1).padStart(5, "0")}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject,
        description: description || null,
        priority: priority || "Medium",
        status: "Open",
        jobId: params.id,
      },
    });

    // Create activity for ticket creation
    await prisma.activity.create({
      data: {
        type: "TICKET_CREATED",
        content: `Created ticket ${ticketNumber}: ${subject}`,
        jobId: params.id,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
