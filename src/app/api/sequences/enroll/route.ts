import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// ---------------------------------------------------------------------------
// POST — Enroll contacts into a sequence
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const body = await req.json();
  const { sequenceId, contacts } = body;

  if (!sequenceId) {
    return NextResponse.json({ error: "Missing sequenceId" }, { status: 400 });
  }

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return NextResponse.json({ error: "contacts array is required and must not be empty" }, { status: 400 });
  }

  // Verify the sequence exists and is active
  const sequence = await prisma.sequence.findUnique({
    where: { id: sequenceId },
    select: { id: true, status: true },
  });

  if (!sequence) {
    return NextResponse.json({ error: "Sequence not found" }, { status: 404 });
  }

  // Resolve enrolledBy from session
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, name: true, email: true },
  });
  const enrolledBy = dbUser?.name || dbUser?.email || user.email;

  let enrolledCount = 0;
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const contact of contacts) {
    const { contactId, contactEmail, contactName, premisesId, customerId } = contact;

    if (!contactEmail) {
      errors.push("Contact missing email address — skipped");
      continue;
    }

    try {
      await prisma.sequenceEnrollment.create({
        data: {
          sequenceId,
          contactId: contactId || null,
          contactEmail,
          contactName: contactName || null,
          premisesId: premisesId || null,
          customerId: customerId || null,
          status: "active",
          currentStep: 0,
          enrolledBy,
          enrolledAt: new Date(),
        },
      });
      enrolledCount++;
    } catch (err: any) {
      // Unique constraint violation — duplicate enrollment
      if (err?.code === "P2002") {
        skipped.push(contactEmail);
      } else {
        throw err; // Re-throw unexpected errors — let Next.js handle 500
      }
    }
  }

  return NextResponse.json({
    enrolledCount,
    skippedCount: skipped.length,
    skipped,
    errorCount: errors.length,
    errors,
  });
}

// ---------------------------------------------------------------------------
// PUT — Update enrollment status (pause, resume, remove, etc.)
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { enrollmentId, status, pauseReason, autoResumeAt } = body;

  if (!enrollmentId) {
    return NextResponse.json({ error: "Missing enrollmentId" }, { status: 400 });
  }

  if (!status) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const validStatuses = ["active", "paused", "finished", "bounced", "replied", "failed", "removed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  // Verify enrollment exists
  const existing = await prisma.sequenceEnrollment.findUnique({
    where: { id: enrollmentId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  const updateData: any = { status };

  // Handle pause
  if (status === "paused") {
    updateData.pausedAt = new Date();
    if (pauseReason) updateData.pauseReason = pauseReason;
    if (autoResumeAt) updateData.autoResumeAt = new Date(autoResumeAt);
  }

  // Handle resume (active after being paused)
  if (status === "active" && existing.status === "paused") {
    updateData.pausedAt = null;
    updateData.pauseReason = null;
    updateData.autoResumeAt = null;
  }

  // Handle remove
  if (status === "removed") {
    updateData.exitReason = "manual";
  }

  // Handle finished
  if (status === "finished") {
    updateData.completedAt = new Date();
  }

  // Handle replied/bounced exit
  if (status === "replied") {
    updateData.exitReason = "replied";
    updateData.completedAt = new Date();
  }
  if (status === "bounced") {
    updateData.exitReason = "bounced";
    updateData.completedAt = new Date();
  }

  // Always update lastActivityAt
  updateData.lastActivityAt = new Date();

  const updated = await prisma.sequenceEnrollment.update({
    where: { id: enrollmentId },
    data: updateData,
  });

  return NextResponse.json(updated);
}

// ---------------------------------------------------------------------------
// DELETE — Remove enrollment (soft delete via status change)
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing enrollment id" }, { status: 400 });
  }

  const existing = await prisma.sequenceEnrollment.findUnique({
    where: { id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  }

  const updated = await prisma.sequenceEnrollment.update({
    where: { id },
    data: {
      status: "removed",
      exitReason: "manual",
      lastActivityAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}
