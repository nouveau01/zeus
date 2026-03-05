import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// PUT — Update user's UI mode preference
export async function PUT(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  const body = await req.json();
  const { uiMode } = body;

  if (uiMode !== "classic" && uiMode !== "modern") {
    return NextResponse.json({ error: "Invalid uiMode. Must be 'classic' or 'modern'" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email: user.email },
    data: { uiMode },
  });

  return NextResponse.json({ success: true, uiMode });
}
