import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET — list all sequences with step/enrollment counts
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const id = url.searchParams.get("id");

  // Single sequence with full steps
  if (id) {
    const sequence = await prisma.sequence.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { stepOrder: "asc" } },
        _count: { select: { enrollments: true } },
      },
    });
    if (!sequence) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(sequence);
  }

  // List all sequences
  const where = status && status !== "all" ? { status } : {};

  const sequences = await prisma.sequence.findMany({
    where,
    include: {
      _count: { select: { steps: true, enrollments: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(sequences);
}

// POST — create a new sequence
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, description, type, exitOnReply, exitOnBounce } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const sequence = await prisma.sequence.create({
    data: {
      name,
      description: description || null,
      type: type || null,
      exitOnReply: exitOnReply !== false,
      exitOnBounce: exitOnBounce !== false,
      createdBy: (session.user as any)?.name || (session.user as any)?.email || "",
    },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      _count: { select: { enrollments: true } },
    },
  });

  return NextResponse.json(sequence);
}

// PUT — update sequence metadata OR manage steps
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, description, status, type, exitOnReply, exitOnBounce, steps } = body;

  if (!id) return NextResponse.json({ error: "Missing sequence id" }, { status: 400 });

  // If steps array is provided, sync all steps (upsert/delete)
  if (steps && Array.isArray(steps)) {
    // Delete removed steps
    const existingSteps = await prisma.sequenceStep.findMany({
      where: { sequenceId: id },
      select: { id: true },
    });
    const incomingIds = steps.filter((s: any) => s.id && !s.id.startsWith("temp_")).map((s: any) => s.id);
    const toDelete = existingSteps.filter(s => !incomingIds.includes(s.id)).map(s => s.id);

    if (toDelete.length > 0) {
      await prisma.sequenceStep.deleteMany({ where: { id: { in: toDelete } } });
    }

    // Upsert each step
    for (const step of steps) {
      const isNew = !step.id || step.id.startsWith("temp_");
      if (isNew) {
        await prisma.sequenceStep.create({
          data: {
            sequenceId: id,
            stepOrder: step.stepOrder,
            delayDays: step.delayDays ?? 0,
            subject: step.subject || "",
            bodyHtml: step.bodyHtml || "",
            templateId: step.templateId || null,
            isActive: step.isActive !== false,
          },
        });
      } else {
        await prisma.sequenceStep.update({
          where: { id: step.id },
          data: {
            stepOrder: step.stepOrder,
            delayDays: step.delayDays ?? 0,
            subject: step.subject || "",
            bodyHtml: step.bodyHtml || "",
            templateId: step.templateId || null,
            isActive: step.isActive !== false,
          },
        });
      }
    }
  }

  // Update sequence metadata
  const updated = await prisma.sequence.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(type !== undefined && { type }),
      ...(exitOnReply !== undefined && { exitOnReply }),
      ...(exitOnBounce !== undefined && { exitOnBounce }),
    },
    include: {
      steps: { orderBy: { stepOrder: "asc" } },
      _count: { select: { enrollments: true } },
    },
  });

  return NextResponse.json(updated);
}

// DELETE — delete a sequence
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Missing sequence id" }, { status: 400 });

  await prisma.sequence.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
