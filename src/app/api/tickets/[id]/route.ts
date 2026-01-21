import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/tickets/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        premises: {
          include: {
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
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

// PUT /api/tickets/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      ticketNumber,
      workOrderNumber,
      date,
      completedDate,
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

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        ticketNumber,
        workOrderNumber,
        date: date ? new Date(date) : undefined,
        completedDate: completedDate ? new Date(completedDate) : undefined,
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
      },
      include: {
        premises: {
          include: {
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
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

// DELETE /api/tickets/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.ticket.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
