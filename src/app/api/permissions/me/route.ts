import { NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/permissions/me — return all permissions for the current user's profile
export async function GET() {
  const session = await getSessionOrBypass();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = (session.user as any)?.profile || "User";

  // GodAdmin has full access to everything — return empty permissions (means no restrictions)
  if (profile === "GodAdmin") {
    return NextResponse.json({ profile: "GodAdmin", permissions: [], unrestricted: true });
  }

  try {
    // Find the profile record
    const profileRecord = await prisma.profile.findUnique({
      where: { name: profile },
      include: { permissions: true },
    });

    if (!profileRecord) {
      // Profile not found in DB — return no restrictions (default open)
      return NextResponse.json({ profile, permissions: [], unrestricted: false });
    }

    return NextResponse.json({
      profile,
      permissions: profileRecord.permissions,
      unrestricted: false,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}
