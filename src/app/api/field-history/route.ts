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
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  if (!entityType || !entityId) {
    return NextResponse.json(
      { error: "entityType and entityId are required" },
      { status: 400 }
    );
  }

  const [entries, total] = await Promise.all([
    prisma.fieldHistory.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.fieldHistory.count({
      where: { entityType, entityId },
    }),
  ]);

  return NextResponse.json({ entries, total });
}
