import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionOrBypass } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const entityId = searchParams.get("entityId");
  const limit = parseInt(searchParams.get("limit") || "25", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const typeFilter = searchParams.get("type");

  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: "entityType and entityId are required" },
      { status: 400 }
    );
  }

  // Map entityType to the correct Prisma where clause
  const whereClause: Record<string, string> = {};
  switch (entityType) {
    case "Account":
      whereClause.premisesId = entityId;
      break;
    case "Customer":
      whereClause.customerId = entityId;
      break;
    case "Contact":
      whereClause.contactId = entityId;
      break;
    default:
      return NextResponse.json(
        { error: "Invalid entityType. Must be Account, Customer, or Contact" },
        { status: 400 }
      );
  }

  if (typeFilter) {
    whereClause.type = typeFilter;
  }

  try {
    const [entries, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.activityLog.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({ entries, total });
  } catch (error) {
    console.error("Error fetching activity log:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity log" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      type,
      direction,
      subject,
      body: activityBody,
      recipients,
      emailStatus,
      callDuration,
      phoneNumber,
      callStatus,
      recordingUrl,
      contactName,
      source,
      sourceId,
      customerId,
      premisesId,
      contactId,
    } = body;

    if (!type) {
      return NextResponse.json(
        { error: "type is required" },
        { status: 400 }
      );
    }

    const user = session.user as any;

    const entry = await prisma.activityLog.create({
      data: {
        type,
        direction: direction || null,
        subject: subject || null,
        body: activityBody || null,
        recipients: recipients || null,
        emailStatus: emailStatus || null,
        callDuration: callDuration ? parseInt(String(callDuration), 10) : null,
        phoneNumber: phoneNumber || null,
        callStatus: callStatus || null,
        recordingUrl: recordingUrl || null,
        contactName: contactName || null,
        source: source || "manual",
        sourceId: sourceId || null,
        userId: user.id,
        userName: user.name || user.email,
        customerId: customerId || null,
        premisesId: premisesId || null,
        contactId: contactId || null,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    console.error("Error creating activity log:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create activity log entry" },
      { status: 500 }
    );
  }
}
