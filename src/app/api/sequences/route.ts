import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// ---------------------------------------------------------------------------
// GET — Sequences list, single sequence, contacts tab, emails tab, report tab
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const tab = url.searchParams.get("tab");
  const status = url.searchParams.get("status");
  const sharingScope = url.searchParams.get("sharingScope");

  // ---- Single sequence by id ----
  if (id && !tab) {
    const sequence = await prisma.sequence.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        schedule: true,
        _count: { select: { enrollments: true } },
      },
    });
    if (!sequence) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(sequence);
  }

  // ---- Contacts tab — enrollments for a sequence ----
  if (id && tab === "contacts") {
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      prisma.sequenceEnrollment.findMany({
        where: { sequenceId: id },
        orderBy: { enrolledAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sequenceEnrollment.count({ where: { sequenceId: id } }),
    ]);

    return NextResponse.json({
      enrollments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  // ---- Emails tab — step executions for a sequence ----
  if (id && tab === "emails") {
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    const [executions, total] = await Promise.all([
      prisma.sequenceStepExecution.findMany({
        where: {
          enrollment: { sequenceId: id },
        },
        include: {
          enrollment: {
            select: {
              contactEmail: true,
              contactName: true,
              contactId: true,
            },
          },
          step: {
            select: {
              id: true,
              stepOrder: true,
              stepType: true,
              subject: true,
            },
          },
        },
        orderBy: { scheduledAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.sequenceStepExecution.count({
        where: { enrollment: { sequenceId: id } },
      }),
    ]);

    return NextResponse.json({
      executions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  // ---- Report tab — aggregate stats for a sequence ----
  if (id && tab === "report") {
    // Overall enrollment stats
    const enrollmentStats = await prisma.sequenceEnrollment.groupBy({
      by: ["status"],
      where: { sequenceId: id },
      _count: { status: true },
    });

    const statusMap: Record<string, number> = {};
    let totalEnrolled = 0;
    for (const row of enrollmentStats) {
      statusMap[row.status] = row._count.status;
      totalEnrolled += row._count.status;
    }

    // Per-step stats
    const steps = await prisma.sequenceStep.findMany({
      where: { sequenceId: id },
      orderBy: { stepOrder: "asc" },
      select: { id: true, stepOrder: true, stepType: true, subject: true },
    });

    const stepStats = await Promise.all(
      steps.map(async (step) => {
        const execCounts = await prisma.sequenceStepExecution.groupBy({
          by: ["status"],
          where: { stepId: step.id },
          _count: { status: true },
        });

        const countMap: Record<string, number> = {};
        for (const row of execCounts) {
          countMap[row.status] = row._count.status;
        }

        // Aggregate counts from execution-level tracking
        const aggregates = await prisma.sequenceStepExecution.aggregate({
          where: { stepId: step.id },
          _sum: { openCount: true, clickCount: true },
        });

        return {
          stepId: step.id,
          stepOrder: step.stepOrder,
          stepType: step.stepType,
          subject: step.subject,
          sentCount: countMap["sent"] || 0,
          deliveredCount: countMap["delivered"] || 0,
          openedCount: countMap["opened"] || 0,
          clickedCount: countMap["clicked"] || 0,
          repliedCount: countMap["replied"] || 0,
          bouncedCount: countMap["bounced"] || 0,
          failedCount: countMap["failed"] || 0,
          skippedCount: countMap["skipped"] || 0,
          totalOpens: aggregates._sum.openCount || 0,
          totalClicks: aggregates._sum.clickCount || 0,
        };
      })
    );

    return NextResponse.json({
      totalEnrolled,
      active: statusMap["active"] || 0,
      paused: statusMap["paused"] || 0,
      finished: statusMap["finished"] || 0,
      replied: statusMap["replied"] || 0,
      bounced: statusMap["bounced"] || 0,
      failed: statusMap["failed"] || 0,
      removed: statusMap["removed"] || 0,
      stepStats,
    });
  }

  // ---- List all sequences ----
  // Find the current user's DB id for share filtering
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });

  const where: any = {};

  // Status filter
  if (status && status !== "all") {
    where.status = status;
  }

  // Sharing scope filter
  if (sharingScope && sharingScope !== "all") {
    where.sharingScope = sharingScope;
  }

  // Show sequences the user owns OR that are shared with them OR that have org scope
  if (dbUser) {
    where.OR = [
      { ownerId: dbUser.id },
      { sharingScope: "organization" },
      { shares: { some: { userId: dbUser.id } } },
    ];
  }

  const sequences = await prisma.sequence.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      _count: { select: { steps: true, enrollments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(sequences);
}

// ---------------------------------------------------------------------------
// POST — Create a new sequence
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const body = await req.json();

  const {
    name,
    description,
    type,
    sharingScope,
    exitOnReply,
    exitOnBounce,
    exitOnMeeting,
    pauseOnOOO,
    maxEmailsPer24h,
    ccAddresses,
    bccAddresses,
    timezone,
    scheduleId,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Resolve the user's DB id for ownerId
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, name: true, email: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found in database" }, { status: 400 });
  }

  const sequence = await prisma.sequence.create({
    data: {
      name: name.trim(),
      description: description || null,
      type: type || null,
      sharingScope: sharingScope || "private",
      exitOnReply: exitOnReply !== false,
      exitOnBounce: exitOnBounce !== false,
      exitOnMeeting: exitOnMeeting ?? false,
      pauseOnOOO: pauseOnOOO !== false,
      maxEmailsPer24h: maxEmailsPer24h ?? 50,
      ccAddresses: ccAddresses || null,
      bccAddresses: bccAddresses || null,
      timezone: timezone || "America/New_York",
      scheduleId: scheduleId || null,
      ownerId: dbUser.id,
      createdBy: dbUser.name || dbUser.email,
    },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      schedule: true,
      _count: { select: { enrollments: true } },
    },
  });

  return NextResponse.json(sequence);
}

// ---------------------------------------------------------------------------
// PUT — Update sequence metadata and/or sync steps
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    id,
    name,
    description,
    status,
    type,
    sharingScope,
    exitOnReply,
    exitOnBounce,
    exitOnMeeting,
    pauseOnOOO,
    maxEmailsPer24h,
    ccAddresses,
    bccAddresses,
    timezone,
    scheduleId,
    archivedAt,
    steps,
  } = body;

  if (!id) return NextResponse.json({ error: "Missing sequence id" }, { status: 400 });

  // Verify the sequence exists
  const existing = await prisma.sequence.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });

  // ---- Sync steps if provided ----
  if (steps && Array.isArray(steps)) {
    // Get existing step IDs for this sequence
    const existingSteps = await prisma.sequenceStep.findMany({
      where: { sequenceId: id },
      select: { id: true },
    });

    // Determine which incoming steps are existing (have real IDs, not temp_)
    const incomingIds = steps
      .filter((s: any) => s.id && !s.id.startsWith("temp_"))
      .map((s: any) => s.id);

    // Delete steps that are no longer in the incoming array
    const toDelete = existingSteps
      .filter((s) => !incomingIds.includes(s.id))
      .map((s) => s.id);

    if (toDelete.length > 0) {
      // Delete executions referencing these steps first
      await prisma.sequenceStepExecution.deleteMany({
        where: { stepId: { in: toDelete } },
      });
      await prisma.sequenceStep.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    // Upsert each step
    for (const step of steps) {
      const isNew = !step.id || step.id.startsWith("temp_");
      const stepData = {
        stepOrder: step.stepOrder,
        stepType: step.stepType || "auto_email",
        delayDays: step.delayDays ?? 0,
        delayHours: step.delayHours ?? 0,
        subject: step.subject || "",
        bodyHtml: step.bodyHtml || "",
        templateId: step.templateId || null,
        threading: step.threading || "new_thread",
        taskNotes: step.taskNotes || null,
        priority: step.priority || "medium",
        isActive: step.isActive !== false,
      };

      if (isNew) {
        await prisma.sequenceStep.create({
          data: {
            sequenceId: id,
            ...stepData,
          },
        });
      } else {
        await prisma.sequenceStep.update({
          where: { id: step.id },
          data: stepData,
        });
      }
    }
  }

  // ---- Build metadata update ----
  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (type !== undefined) updateData.type = type;
  if (sharingScope !== undefined) updateData.sharingScope = sharingScope;
  if (exitOnReply !== undefined) updateData.exitOnReply = exitOnReply;
  if (exitOnBounce !== undefined) updateData.exitOnBounce = exitOnBounce;
  if (exitOnMeeting !== undefined) updateData.exitOnMeeting = exitOnMeeting;
  if (pauseOnOOO !== undefined) updateData.pauseOnOOO = pauseOnOOO;
  if (maxEmailsPer24h !== undefined) updateData.maxEmailsPer24h = maxEmailsPer24h ?? 50;
  if (ccAddresses !== undefined) updateData.ccAddresses = ccAddresses;
  if (bccAddresses !== undefined) updateData.bccAddresses = bccAddresses;
  if (timezone !== undefined) updateData.timezone = timezone;
  if (scheduleId !== undefined) updateData.scheduleId = scheduleId || null;
  if (archivedAt !== undefined) {
    updateData.archivedAt = archivedAt ? new Date(archivedAt) : null;
  }

  const updated = await prisma.sequence.update({
    where: { id },
    data: updateData,
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      owner: { select: { id: true, name: true, email: true, avatar: true } },
      schedule: true,
      _count: { select: { enrollments: true } },
    },
  });

  return NextResponse.json(updated);
}

// ---------------------------------------------------------------------------
// DELETE — Delete a sequence and all related data
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing sequence id" }, { status: 400 });

  // Verify it exists
  const existing = await prisma.sequence.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Sequence not found" }, { status: 404 });

  // Cascade delete in correct order to respect FK constraints:
  // 1. Step executions (reference enrollments and steps)
  // 2. Enrollments
  // 3. Steps
  // 4. Shares
  // 5. Sequence
  await prisma.sequenceStepExecution.deleteMany({
    where: { enrollment: { sequenceId: id } },
  });
  await prisma.sequenceEnrollment.deleteMany({ where: { sequenceId: id } });
  await prisma.sequenceStep.deleteMany({ where: { sequenceId: id } });
  await prisma.sequenceShare.deleteMany({ where: { sequenceId: id } });
  await prisma.sequence.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
