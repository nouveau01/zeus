import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass, hasProfile } from "@/lib/auth";
import prisma from "@/lib/db";

// PUT /api/profiles/permissions — save permissions for a profile + module
export async function PUT(request: NextRequest) {
  const session = await getSessionOrBypass();
  const profile = (session?.user as any)?.profile;
  if (!profile || !hasProfile(profile, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { profileId, pageId, canAccess, fields } = body;

    if (!profileId || !pageId) {
      return NextResponse.json({ error: "profileId and pageId are required" }, { status: 400 });
    }

    // Prevent editing GodAdmin permissions unless you are GodAdmin
    const targetProfile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (targetProfile?.name === "GodAdmin" && profile !== "GodAdmin") {
      return NextResponse.json({ error: "Only GodAdmin can modify GodAdmin permissions" }, { status: 403 });
    }

    const permission = await prisma.profilePermission.upsert({
      where: {
        profileId_pageId: { profileId, pageId },
      },
      update: {
        canAccess: canAccess ?? true,
        fields: fields ?? {},
      },
      create: {
        profileId,
        pageId,
        canAccess: canAccess ?? true,
        fields: fields ?? {},
      },
    });

    return NextResponse.json(permission);
  } catch (error) {
    console.error("Error saving permissions:", error);
    return NextResponse.json({ error: "Failed to save permissions" }, { status: 500 });
  }
}
