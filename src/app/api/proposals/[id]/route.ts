import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/proposals/[id] - Get single proposal with opportunity + account relations
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

    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        opportunity: {
          include: {
            customer: { select: { id: true, name: true } },
            premises: { select: { id: true, premisesId: true, address: true, city: true, state: true, zipCode: true, name: true, phone: true, fax: true, email: true } },
            contact: { select: { id: true, name: true, email: true, phone: true, fax: true, title: true } },
          },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...proposal,
      amount: proposal.amount ? Number(proposal.amount) : null,
      laborHours: proposal.laborHours ? Number(proposal.laborHours) : null,
      laborRate: proposal.laborRate ? Number(proposal.laborRate) : null,
      laborTotal: proposal.laborTotal ? Number(proposal.laborTotal) : null,
    });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json({ error: "Failed to fetch proposal" }, { status: 500 });
  }
}

// PUT /api/proposals/[id] - Update proposal
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

    if (body.title !== undefined) data.title = body.title || null;
    if (body.status !== undefined) data.status = body.status;
    if (body.workDescription !== undefined) data.workDescription = body.workDescription || null;
    if (body.laborHours !== undefined) data.laborHours = body.laborHours ? parseFloat(body.laborHours) : null;
    if (body.laborRate !== undefined) data.laborRate = body.laborRate ? parseFloat(body.laborRate) : null;
    if (body.laborTotal !== undefined) data.laborTotal = body.laborTotal ? parseFloat(body.laborTotal) : null;
    if (body.amount !== undefined) data.amount = body.amount ? parseFloat(body.amount) : null;
    if (body.taxNote !== undefined) data.taxNote = body.taxNote || null;
    if (body.validDays !== undefined) data.validDays = body.validDays != null ? parseInt(body.validDays) : null;
    if (body.paymentTerms !== undefined) data.paymentTerms = body.paymentTerms || null;
    if (body.attn !== undefined) data.attn = body.attn || null;
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.fax !== undefined) data.fax = body.fax || null;
    if (body.email !== undefined) data.email = body.email || null;
    if (body.fromName !== undefined) data.fromName = body.fromName || null;
    if (body.sentDate !== undefined) data.sentDate = body.sentDate ? new Date(body.sentDate) : null;

    // Auto-set sentDate when status changes to Sent
    if (body.status === "Sent" && !body.sentDate) {
      data.sentDate = new Date();
    }

    const proposal = await prisma.proposal.update({
      where: { id },
      data,
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
    });
  } catch (error) {
    console.error("Error updating proposal:", error);
    return NextResponse.json({ error: "Failed to update proposal" }, { status: 500 });
  }
}
