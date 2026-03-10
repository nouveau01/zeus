import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// POST /api/opportunities/[id]/proposals - Create a proposal from an opportunity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch the parent opportunity with relations to pre-fill proposal
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        premises: { select: { id: true, premisesId: true, address: true, name: true, phone: true, fax: true, email: true } },
        contact: { select: { id: true, name: true, email: true, phone: true, fax: true, title: true } },
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    // Get next proposal number
    const lastProposal = await prisma.proposal.findFirst({
      orderBy: { proposalNumber: "desc" },
    });
    const nextNumber = (lastProposal?.proposalNumber || 0) + 1;

    // Pre-fill from opportunity + contact/account data
    const body = await request.json().catch(() => ({}));

    const proposal = await prisma.proposal.create({
      data: {
        proposalNumber: nextNumber,
        title: body.title || opportunity.name,
        type: body.type || null,
        status: "Draft",
        workDescription: body.workDescription || opportunity.description || null,
        amount: opportunity.estimatedValue || null,
        attn: opportunity.contact?.name || opportunity.premises?.name || null,
        phone: opportunity.contact?.phone || opportunity.premises?.phone || null,
        fax: opportunity.contact?.fax || opportunity.premises?.fax || null,
        email: opportunity.contact?.email || opportunity.premises?.email || null,
        fromName: body.fromName || opportunity.owner || null,
        validDays: 30,
        paymentTerms: body.paymentTerms || "Net 30 Days",
        opportunityId: id,
      },
      include: {
        opportunity: {
          include: {
            customer: { select: { id: true, name: true } },
            premises: { select: { id: true, premisesId: true, address: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      ...proposal,
      amount: proposal.amount ? Number(proposal.amount) : null,
      laborHours: proposal.laborHours ? Number(proposal.laborHours) : null,
      laborRate: proposal.laborRate ? Number(proposal.laborRate) : null,
      laborTotal: proposal.laborTotal ? Number(proposal.laborTotal) : null,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json({ error: "Failed to create proposal" }, { status: 500 });
  }
}
