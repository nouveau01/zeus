import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/opportunities - List all opportunities
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get("stage");
    const search = searchParams.get("search");
    const premisesId = searchParams.get("premisesId");
    const customerId = searchParams.get("customerId");

    const where: any = {};

    if (premisesId) {
      where.premisesId = premisesId;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (stage && stage !== "All") {
      where.stage = stage;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { owner: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { premises: { premisesId: { contains: search, mode: "insensitive" } } },
      ];
    }

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true },
        },
        premises: {
          select: { id: true, premisesId: true, address: true, name: true },
        },
        contact: {
          select: { id: true, name: true, email: true, phone: true },
        },
        _count: {
          select: { proposals: true },
        },
      },
      orderBy: { opportunityNumber: "desc" },
    });

    const mapped = opportunities.map((opp) => ({
      ...opp,
      customerName: opp.customer?.name || "",
      accountName: opp.premises?.premisesId || opp.premises?.name || "",
      accountId: opp.premises?.id || "",
      contactName: opp.contact?.name || "",
      proposalCount: opp._count.proposals,
      estimatedValue: opp.estimatedValue ? Number(opp.estimatedValue) : null,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return NextResponse.json({ error: "Failed to fetch opportunities" }, { status: 500 });
  }
}

// POST /api/opportunities - Create new opportunity
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get next opportunity number
    const last = await prisma.opportunity.findFirst({
      orderBy: { opportunityNumber: "desc" },
    });
    const nextNumber = (last?.opportunityNumber || 0) + 1;

    const opportunity = await prisma.opportunity.create({
      data: {
        opportunityNumber: nextNumber,
        name: body.name || `Opportunity ${nextNumber}`,
        type: body.type || null,
        stage: body.stage || "Prospecting",
        probability: body.probability != null ? parseInt(body.probability) : 0,
        estimatedValue: body.estimatedValue ? parseFloat(body.estimatedValue) : null,
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        closedDate: body.closedDate ? new Date(body.closedDate) : null,
        lostReason: body.lostReason || null,
        owner: body.owner || null,
        description: body.description || null,
        nextStep: body.nextStep || null,
        remarks: body.remarks || null,
        customerId: body.customerId || null,
        premisesId: body.premisesId || null,
        contactId: body.contactId || null,
        ...(body.unitIds?.length ? {
          units: { connect: body.unitIds.map((uid: string) => ({ id: uid })) },
        } : {}),
      },
      include: {
        customer: { select: { id: true, name: true } },
        premises: { select: { id: true, premisesId: true, address: true, name: true } },
        contact: { select: { id: true, name: true, email: true, phone: true } },
        units: { select: { id: true, unitNumber: true, unitType: true, description: true } },
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error("Error creating opportunity:", error);
    return NextResponse.json({ error: "Failed to create opportunity" }, { status: 500 });
  }
}
