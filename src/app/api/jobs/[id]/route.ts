import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import { getOfficeScope, childOfficeWhere } from "@/lib/officeScope";
import prisma from "@/lib/db";
import { trackChanges } from "@/lib/audit";

// GET /api/jobs/[id]
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

    const job = await prisma.job.findFirst({
      where: { id: params.id, ...childOfficeWhere(scope) },
      include: {
        customer: { select: { id: true, name: true } },
        premises: { select: { id: true, address: true } },
        unit: { select: { id: true, unitNumber: true } },
        createdBy: { select: { id: true, name: true } },
        history: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { user: { select: { name: true } } },
        },
        files: { select: { id: true, name: true, url: true } },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { name: true } } },
        },
        notes: {
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, body: true, createdAt: true },
        },
        tickets: {
          select: { id: true, ticketNumber: true, description: true, status: true, createdAt: true },
        },
        opportunity: {
          select: { id: true, opportunityNumber: true, name: true, stage: true },
        },
        _count: {
          select: { notes: true, tickets: true, files: true, history: true, activities: true },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}

// PATCH /api/jobs/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scope = await getOfficeScope(session.user.id, session.user.role);

    const body = await request.json();

    // Get current job for history + access check
    const currentJob = await prisma.job.findFirst({
      where: { id: params.id, ...childOfficeWhere(scope) },
    });

    if (!currentJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Update the job
    const job = await prisma.job.update({
      where: { id: params.id },
      data: body,
    });

    // Track field changes (fire-and-forget)
    trackChanges("Job", params.id, currentJob as any, job as any, session.user);

    return NextResponse.json(job);
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

// DELETE /api/jobs/[id]
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
    const existing = await prisma.job.findFirst({
      where: { id: params.id, ...childOfficeWhere(scope) },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await prisma.job.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}

export { PATCH as PUT };
