import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/proposals - List ALL proposals across all opportunities
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const opportunityId = searchParams.get("opportunityId");

    const where: any = {};

    if (status && status !== "All") {
      where.status = status;
    }

    if (opportunityId) {
      where.opportunityId = opportunityId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { attn: { contains: search, mode: "insensitive" } },
        { opportunity: { name: { contains: search, mode: "insensitive" } } },
        { opportunity: { customer: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        opportunity: {
          include: {
            customer: { select: { id: true, name: true } },
            premises: { select: { id: true, premisesId: true, name: true, address: true } },
          },
        },
      },
      orderBy: { proposalNumber: "desc" },
    });

    const mapped = proposals.map((p) => ({
      ...p,
      amount: p.amount ? Number(p.amount) : null,
      laborHours: p.laborHours ? Number(p.laborHours) : null,
      laborRate: p.laborRate ? Number(p.laborRate) : null,
      laborTotal: p.laborTotal ? Number(p.laborTotal) : null,
      opportunityName: p.opportunity.name,
      customerName: p.opportunity.customer?.name || "",
      accountName: p.opportunity.premises?.premisesId || p.opportunity.premises?.name || "",
      accountId: p.opportunity.premises?.id || "",
      customerId: p.opportunity.customer?.id || "",
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json({ error: "Failed to fetch proposals" }, { status: 500 });
  }
}
