import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/jobs - Get all jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const premisesId = searchParams.get("premisesId");

    // Build where clause
    const where: any = {};
    if (type && type !== "all") {
      where.type = type;
    }
    if (premisesId) {
      where.premisesId = premisesId;
    }

    const jobs = await prisma.job.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true },
        },
        premises: {
          select: { id: true, premisesId: true, name: true, address: true },
        },
        _count: {
          select: {
            notes: true,
            tickets: true,
            files: true,
            history: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// POST /api/jobs - Create a new job
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const job = await prisma.job.create({
      data: body,
      include: {
        customer: true,
        premises: true,
      },
    });

    // Create history entry for creation
    await prisma.jobHistory.create({
      data: {
        jobId: job.id,
        field: "Created.",
        newValue: null,
        userId: body.createdById,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job" },
      { status: 500 }
    );
  }
}
