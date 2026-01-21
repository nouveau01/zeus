import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/jobs/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
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
          select: { id: true, ticketNumber: true, subject: true, status: true },
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
    const body = await request.json();

    // Get current job for history
    const currentJob = await prisma.job.findUnique({
      where: { id: params.id },
    });

    if (!currentJob) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Update the job
    const job = await prisma.job.update({
      where: { id: params.id },
      data: body,
    });

    // Create history entries for changed fields
    const historyEntries = [];
    for (const [key, newValue] of Object.entries(body)) {
      const oldValue = (currentJob as any)[key];
      if (oldValue !== newValue) {
        historyEntries.push({
          jobId: job.id,
          field: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1").trim(),
          originalValue: oldValue?.toString() || null,
          newValue: newValue?.toString() || null,
        });
      }
    }

    if (historyEntries.length > 0) {
      await prisma.jobHistory.createMany({ data: historyEntries });
    }

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
    await prisma.job.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}
