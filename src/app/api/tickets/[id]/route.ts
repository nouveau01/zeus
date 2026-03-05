import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import { getOfficeScope, childOfficeWhere } from "@/lib/officeScope";
import prisma from "@/lib/db";

// GET /api/tickets/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scope = await getOfficeScope(session.user.id, session.user.role);

    const ticket = await prisma.ticket.findFirst({
      where: { id: params.id, ...childOfficeWhere(scope) },
      include: {
        premises: {
          select: {
            id: true,
            premisesId: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            phone: true,
            contact: true,
            type: true,
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
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scope = await getOfficeScope(session.user.id, session.user.role);

    // Access check
    const existing = await prisma.ticket.findFirst({
      where: { id: params.id, ...childOfficeWhere(scope) },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const body = await request.json();

    // Build update data - only include fields that are present in the request
    const updateData: any = {};

    // Basic fields
    if (body.ticketNumber !== undefined) updateData.ticketNumber = body.ticketNumber;
    if (body.workOrderNumber !== undefined) updateData.workOrderNumber = body.workOrderNumber;
    if (body.date !== undefined) updateData.date = body.date ? new Date(body.date) : null;
    if (body.scheduledDate !== undefined) updateData.scheduledDate = body.scheduledDate ? new Date(body.scheduledDate) : null;
    if (body.completedDate !== undefined) updateData.completedDate = body.completedDate ? new Date(body.completedDate) : null;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.level !== undefined) updateData.level = body.level;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.accountId !== undefined) updateData.accountId = body.accountId;

    // Personnel
    if (body.mechCrew !== undefined) updateData.mechCrew = body.mechCrew;
    if (body.supervisor !== undefined) updateData.supervisor = body.supervisor;
    if (body.wage !== undefined) updateData.wage = body.wage;

    // Job & Unit
    if (body.phase !== undefined) updateData.phase = body.phase;
    if (body.unitName !== undefined) updateData.unitName = body.unitName;
    if (body.unitId !== undefined) updateData.unitId = body.unitId;
    if (body.nameAddress !== undefined) updateData.nameAddress = body.nameAddress;

    // Text fields
    if (body.scopeOfWork !== undefined) updateData.scopeOfWork = body.scopeOfWork;
    if (body.resolution !== undefined) updateData.resolution = body.resolution;
    if (body.partsUsed !== undefined) updateData.partsUsed = body.partsUsed;
    if (body.description !== undefined) updateData.description = body.description;

    // Work Performed
    if (body.workTime !== undefined) updateData.workTime = body.workTime;

    // Scheduling extras
    if (body.witness !== undefined) updateData.witness = body.witness;
    if (body.onHold !== undefined) updateData.onHold = body.onHold;

    // Time Frame
    if (body.enRouteTime !== undefined) updateData.enRouteTime = body.enRouteTime;
    if (body.onSiteTime !== undefined) updateData.onSiteTime = body.onSiteTime;
    if (body.completedTime !== undefined) updateData.completedTime = body.completedTime;

    // Mileage
    if (body.mileageStarting !== undefined) updateData.mileageStarting = body.mileageStarting;
    if (body.mileageEnding !== undefined) updateData.mileageEnding = body.mileageEnding;
    if (body.mileageTraveled !== undefined) updateData.mileageTraveled = body.mileageTraveled;

    // Time Spent (hours)
    if (body.hours !== undefined) updateData.hours = body.hours;
    if (body.overtimeHours !== undefined) updateData.overtimeHours = body.overtimeHours;
    if (body.oneSevenHours !== undefined) updateData.oneSevenHours = body.oneSevenHours;
    if (body.doubleTimeHours !== undefined) updateData.doubleTimeHours = body.doubleTimeHours;
    if (body.travelHours !== undefined) updateData.travelHours = body.travelHours;
    if (body.totalHours !== undefined) updateData.totalHours = body.totalHours;
    if (body.estTime !== undefined) updateData.estTime = body.estTime;
    if (body.difference !== undefined) updateData.difference = body.difference;

    // Expenses
    if (body.expensePhase !== undefined) updateData.expensePhase = body.expensePhase;
    if (body.expenseMileage !== undefined) updateData.expenseMileage = body.expenseMileage;
    if (body.expenseZone !== undefined) updateData.expenseZone = body.expenseZone;
    if (body.expenseTolls !== undefined) updateData.expenseTolls = body.expenseTolls;
    if (body.expenseMisc !== undefined) updateData.expenseMisc = body.expenseMisc;
    if (body.expenseTotal !== undefined) updateData.expenseTotal = body.expenseTotal;

    // Checkbox statuses (list view)
    if (body.bill !== undefined) updateData.bill = body.bill;
    if (body.reviewed !== undefined) updateData.reviewed = body.reviewed;
    if (body.pr !== undefined) updateData.pr = body.pr;
    if (body.vd !== undefined) updateData.vd = body.vd;
    if (body.inv !== undefined) updateData.inv = body.inv;

    // Checkbox statuses (detail view)
    if (body.workCompleted !== undefined) updateData.workCompleted = body.workCompleted;
    if (body.chargeable !== undefined) updateData.chargeable = body.chargeable;
    if (body.emailOnSave !== undefined) updateData.emailOnSave = body.emailOnSave;
    if (body.updateLocation !== undefined) updateData.updateLocation = body.updateLocation;
    if (body.internetAccess !== undefined) updateData.internetAccess = body.internetAccess;

    // Review & Contract
    if (body.reviewStatus !== undefined) updateData.reviewStatus = body.reviewStatus;
    if (body.contractType !== undefined) updateData.contractType = body.contractType;

    // Internal comments
    if (body.internalComments !== undefined) updateData.internalComments = body.internalComments;

    // Call tracking
    if (body.calledInBy !== undefined) updateData.calledInBy = body.calledInBy;
    if (body.calledInDate !== undefined) updateData.calledInDate = body.calledInDate ? new Date(body.calledInDate) : null;
    if (body.takenBy !== undefined) updateData.takenBy = body.takenBy;
    if (body.resolvedBy !== undefined) updateData.resolvedBy = body.resolvedBy;

    // Email
    if (body.emailStatus !== undefined) updateData.emailStatus = body.emailStatus;

    // Relations
    if (body.premisesId !== undefined) updateData.premisesId = body.premisesId;
    if (body.jobId !== undefined) updateData.jobId = body.jobId;
    if (body.invoiceId !== undefined) updateData.invoiceId = body.invoiceId;

    // Auto-set completedDate when status changes to "Completed"
    if (updateData.status === "Completed" && !updateData.completedDate) {
      updateData.completedDate = new Date();
    }

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: updateData,
      include: {
        premises: {
          select: {
            id: true,
            premisesId: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            phone: true,
            contact: true,
            type: true,
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
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scope = await getOfficeScope(session.user.id, session.user.role);

    // Access check
    const existing = await prisma.ticket.findFirst({
      where: { id: params.id, ...childOfficeWhere(scope) },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    await prisma.ticket.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
