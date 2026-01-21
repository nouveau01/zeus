import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/jobs/[id]/activities
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const activities = await prisma.activity.findMany({
      where: { jobId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}

// POST /api/jobs/[id]/activities
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { type, content, userId } = body;

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const activity = await prisma.activity.create({
      data: {
        type: type || "COMMENT",
        content,
        jobId: params.id,
        userId: userId || null,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 });
  }
}
