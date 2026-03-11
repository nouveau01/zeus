import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass, hasProfile } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/profiles/user-count?profile=ProfileName — count users assigned to a profile
export async function GET(request: NextRequest) {
  const session = await getSessionOrBypass();
  const callerProfile = (session?.user as any)?.profile;
  if (!callerProfile || !hasProfile(callerProfile, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const profileName = searchParams.get("profile");

  if (!profileName) {
    return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
  }

  const count = await prisma.user.count({ where: { profile: profileName } });

  return NextResponse.json({ count });
}
