import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// GET — fetch recent email logs
export async function GET(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = (session.user as any)?.profile;
  if (profile !== "Admin" && profile !== "GodAdmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50");

  const logs = await prisma.emailLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      trigger: {
        select: { label: true, event: true },
      },
    },
  });

  return NextResponse.json(logs);
}
