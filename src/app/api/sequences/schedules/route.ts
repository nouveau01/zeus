import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// ---------------------------------------------------------------------------
// GET — List all sending schedules
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  // Single schedule by id
  if (id) {
    const schedule = await prisma.sendingSchedule.findUnique({
      where: { id },
    });
    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }
    return NextResponse.json(schedule);
  }

  // List all schedules
  const schedules = await prisma.sendingSchedule.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(schedules);
}

// ---------------------------------------------------------------------------
// POST — Create a new sending schedule
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const body = await req.json();
  const { name, timezone, timeBlocks, blockedDates } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Resolve createdBy
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { name: true, email: true },
  });
  const createdBy = dbUser?.name || dbUser?.email || user.email;

  const schedule = await prisma.sendingSchedule.create({
    data: {
      name: name.trim(),
      timezone: timezone || "America/New_York",
      timeBlocks: timeBlocks || [],
      blockedDates: blockedDates || [],
      createdBy,
    },
  });

  return NextResponse.json(schedule);
}

// ---------------------------------------------------------------------------
// PUT — Update a sending schedule
// ---------------------------------------------------------------------------
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, name, timezone, timeBlocks, blockedDates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing schedule id" }, { status: 400 });
  }

  // Verify it exists
  const existing = await prisma.sendingSchedule.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (timezone !== undefined) updateData.timezone = timezone;
  if (timeBlocks !== undefined) updateData.timeBlocks = timeBlocks;
  if (blockedDates !== undefined) updateData.blockedDates = blockedDates;

  const updated = await prisma.sendingSchedule.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(updated);
}

// ---------------------------------------------------------------------------
// DELETE — Delete a sending schedule
// ---------------------------------------------------------------------------
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing schedule id" }, { status: 400 });
  }

  // Verify it exists
  const existing = await prisma.sendingSchedule.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  // Check if any sequences reference this schedule
  const referencingSequences = await prisma.sequence.count({
    where: { scheduleId: id },
  });

  if (referencingSequences > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete schedule — ${referencingSequences} sequence(s) are using it. Remove the schedule from those sequences first.`,
      },
      { status: 409 }
    );
  }

  await prisma.sendingSchedule.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
