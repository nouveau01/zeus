import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";
import { AVAILABLE_EVENTS, generateDefaultBody } from "@/lib/notifications";

// GET — list all triggers + available events
export async function GET(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "Admin" && role !== "GodAdmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  // Return available events list
  if (type === "available-events") {
    return NextResponse.json(AVAILABLE_EVENTS);
  }

  const triggers = await prisma.emailTrigger.findMany({
    orderBy: { event: "asc" },
  });

  return NextResponse.json(triggers);
}

// POST — create a new trigger
export async function POST(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "Admin" && role !== "GodAdmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { event, label, recipients, subject } = body;

  if (!event || !label) {
    return NextResponse.json({ error: "Event and label are required" }, { status: 400 });
  }

  // Check if trigger for this event already exists
  const existing = await prisma.emailTrigger.findUnique({ where: { event } });
  if (existing) {
    return NextResponse.json({ error: "A trigger for this event already exists" }, { status: 409 });
  }

  // Look up event definition for defaults
  const eventDef = AVAILABLE_EVENTS.find(e => e.event === event);
  const defaultSubject = subject || eventDef?.defaultSubject || event;
  const bodyHtml = generateDefaultBody(event, label);

  const trigger = await prisma.emailTrigger.create({
    data: {
      event,
      label,
      description: eventDef?.description || null,
      recipients: recipients || "",
      subject: defaultSubject,
      bodyHtml,
      isActive: true,
    },
  });

  return NextResponse.json(trigger);
}

// PUT — update a trigger
export async function PUT(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "Admin" && role !== "GodAdmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { id, isActive, recipients, subject, bodyHtml, label } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing trigger id" }, { status: 400 });
  }

  const updated = await prisma.emailTrigger.update({
    where: { id },
    data: {
      ...(isActive !== undefined && { isActive }),
      ...(recipients !== undefined && { recipients }),
      ...(subject !== undefined && { subject }),
      ...(bodyHtml !== undefined && { bodyHtml }),
      ...(label !== undefined && { label }),
    },
  });

  return NextResponse.json(updated);
}

// DELETE — delete a trigger
export async function DELETE(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "Admin" && role !== "GodAdmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing trigger id" }, { status: 400 });
  }

  await prisma.emailTrigger.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
