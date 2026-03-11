import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// POST /api/opportunities/[id]/jobs - Create a Job from an Opportunity
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

    // Fetch parent opportunity with relations
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        premises: { select: { id: true, premisesId: true, address: true, name: true } },
        units: { select: { id: true }, take: 1 },
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    // Auto-generate next job number (externalId) — same pattern as /api/jobs POST
    const lastJob = await prisma.job.findFirst({
      where: { externalId: { not: null } },
      orderBy: { externalId: "desc" },
      select: { externalId: true },
    });
    let nextJobNum = "1";
    if (lastJob?.externalId) {
      const lastNum = parseInt(lastJob.externalId, 10);
      if (!isNaN(lastNum)) {
        nextJobNum = String(lastNum + 1);
      }
    }

    // Create Job pre-filled from Opportunity
    const job = await prisma.job.create({
      data: {
        externalId: nextJobNum,
        jobName: opportunity.name,
        jobDescription: opportunity.description || null,
        status: "Open",
        date: new Date(),
        opportunityId: id,
        ...(opportunity.premisesId ? { premisesId: opportunity.premisesId } : {}),
        ...(opportunity.customerId ? { customerId: opportunity.customerId } : {}),
        ...(opportunity.units[0]?.id ? { unitId: opportunity.units[0].id } : {}),
      },
      include: {
        premises: { select: { id: true, premisesId: true, address: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    });

    // Create history entry
    await prisma.jobHistory.create({
      data: {
        jobId: job.id,
        field: "Created",
        originalValue: null,
        newValue: `Created from Opportunity #${opportunity.opportunityNumber}`,
        userId: (session.user as any).id,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating job from opportunity:", error);
    return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
  }
}
