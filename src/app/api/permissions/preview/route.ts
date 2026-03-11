import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/permissions/preview?profile=ProfileName — GodAdmin only, fetch permissions for any profile
export async function GET(request: NextRequest) {
  const session = await getSessionOrBypass();
  const callerProfile = (session?.user as any)?.profile;

  if (callerProfile !== "GodAdmin") {
    return NextResponse.json({ error: "Only GodAdmin can preview profiles" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const profileName = searchParams.get("profile");

  if (!profileName) {
    return NextResponse.json({ error: "profile parameter is required" }, { status: 400 });
  }

  try {
    const found = await prisma.profile.findUnique({
      where: { name: profileName },
      include: { permissions: true },
    });

    if (!found) {
      return NextResponse.json({ profile: profileName, permissions: [] });
    }

    return NextResponse.json({
      profile: profileName,
      permissions: found.permissions,
    });
  } catch (error) {
    console.error("Error fetching preview permissions:", error);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}
