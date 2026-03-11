import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import { getOfficeScope, parseOfficeFilter } from "@/lib/officeScope";
import prisma from "@/lib/db";

// GET /api/jobs - Get all jobs
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;
    const filteredIds = parseOfficeFilter(request);
    const scope = await getOfficeScope(user.id, user.profile, filteredIds);

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
    // Office scoping — filter jobs through their premises
    if (!scope.allOffices) {
      where.premises = { ...(where.premises || {}), OR: [{ officeId: { in: scope.officeIds } }, { officeId: null }] };
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
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;
    const body = await request.json();

    // Auto-generate next job number (externalId)
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

    // Only pick valid Job scalar fields — exclude relations, computed fields, empty id
    const data: any = {
      jobName: body.jobName,
      externalId: nextJobNum,
      status: body.status || "Open",
    };

    // Chargeable maps to the charge field (Int)
    if (body.chargeable != null) data.charge = body.chargeable ? 1 : 0;

    // Optional fields — only include if provided
    if (body.type) data.type = body.type;
    if (body.template) data.template = body.template;
    if (body.jobDescription) data.jobDescription = body.jobDescription;
    if (body.date) data.date = new Date(body.date);
    if (body.dueDate) data.dueDate = new Date(body.dueDate);
    if (body.estDate) data.estDate = new Date(body.estDate);
    if (body.po) data.po = body.po;
    if (body.cType) data.cType = body.cType;
    if (body.sRemarks) data.sRemarks = body.sRemarks;
    if (body.comments) data.comments = body.comments;
    if (body.level != null) data.level = body.level;
    if (body.certified != null) data.certified = body.certified;

    // Connect relations using Prisma's relation syntax
    if (body.premisesId) {
      data.premises = { connect: { id: body.premisesId } };
      // Also link to customer through premises
      const premises = await prisma.premises.findUnique({
        where: { id: body.premisesId },
        select: { customerId: true },
      });
      if (premises?.customerId) {
        data.customer = { connect: { id: premises.customerId } };
      }
    }
    if (body.unitId) {
      data.unit = { connect: { id: body.unitId } };
    }

    const job = await prisma.job.create({
      data,
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
        userId: user.id,
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
