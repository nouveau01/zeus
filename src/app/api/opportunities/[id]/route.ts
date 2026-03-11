import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/opportunities/[id] - Get single opportunity with full relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true },
        },
        premises: {
          select: { id: true, premisesId: true, address: true, city: true, state: true, name: true, phone: true, fax: true, email: true },
        },
        contact: {
          select: { id: true, name: true, email: true, phone: true, fax: true, title: true },
        },
        proposals: {
          orderBy: { proposalNumber: "desc" },
        },
        units: {
          select: { id: true, unitNumber: true, unitType: true, description: true },
        },
        jobs: {
          select: { id: true, externalId: true, jobName: true, status: true, type: true, date: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...opportunity,
      estimatedValue: opportunity.estimatedValue ? Number(opportunity.estimatedValue) : null,
      proposals: opportunity.proposals.map((p) => ({
        ...p,
        amount: p.amount ? Number(p.amount) : null,
        laborHours: p.laborHours ? Number(p.laborHours) : null,
        laborRate: p.laborRate ? Number(p.laborRate) : null,
        laborTotal: p.laborTotal ? Number(p.laborTotal) : null,
      })),
    });
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    return NextResponse.json({ error: "Failed to fetch opportunity" }, { status: 500 });
  }
}

// PUT /api/opportunities/[id] - Update opportunity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const data: any = {};

    // Only set fields that are present in the body
    if (body.name !== undefined) data.name = body.name;
    if (body.type !== undefined) data.type = body.type || null;
    if (body.stage !== undefined) data.stage = body.stage;
    if (body.probability !== undefined) data.probability = body.probability != null ? parseInt(body.probability) : null;
    if (body.estimatedValue !== undefined) data.estimatedValue = body.estimatedValue ? parseFloat(body.estimatedValue) : null;
    if (body.expectedCloseDate !== undefined) data.expectedCloseDate = body.expectedCloseDate ? new Date(body.expectedCloseDate) : null;
    if (body.closedDate !== undefined) data.closedDate = body.closedDate ? new Date(body.closedDate) : null;
    if (body.lostReason !== undefined) data.lostReason = body.lostReason || null;
    if (body.owner !== undefined) data.owner = body.owner || null;
    if (body.description !== undefined) data.description = body.description || null;
    if (body.nextStep !== undefined) data.nextStep = body.nextStep || null;
    if (body.remarks !== undefined) data.remarks = body.remarks || null;
    if (body.customerId !== undefined) data.customerId = body.customerId || null;
    if (body.premisesId !== undefined) data.premisesId = body.premisesId || null;
    if (body.contactId !== undefined) data.contactId = body.contactId || null;

    // Auto-set closedDate when stage changes to Closed Won or Closed Lost
    if (body.stage === "Closed Won" || body.stage === "Closed Lost") {
      if (!body.closedDate) data.closedDate = new Date();
    }

    // Handle units many-to-many: replace all linked units with the provided list
    if (body.unitIds !== undefined) {
      data.units = {
        set: (body.unitIds || []).map((uid: string) => ({ id: uid })),
      };
    }

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data,
      include: {
        customer: { select: { id: true, name: true } },
        premises: { select: { id: true, premisesId: true, address: true, name: true } },
        contact: { select: { id: true, name: true, email: true, phone: true } },
        units: { select: { id: true, unitNumber: true, unitType: true, description: true } },
      },
    });

    return NextResponse.json({
      ...opportunity,
      estimatedValue: opportunity.estimatedValue ? Number(opportunity.estimatedValue) : null,
    });
  } catch (error) {
    console.error("Error updating opportunity:", error);
    return NextResponse.json({ error: "Failed to update opportunity" }, { status: 500 });
  }
}

// DELETE /api/opportunities/[id] - Delete opportunity
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.opportunity.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    return NextResponse.json({ error: "Failed to delete opportunity" }, { status: 500 });
  }
}
