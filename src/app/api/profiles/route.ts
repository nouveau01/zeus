import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass, hasProfile } from "@/lib/auth";
import prisma from "@/lib/db";

async function requireAdmin() {
  const session = await getSessionOrBypass();
  const profile = (session?.user as any)?.profile;
  if (!profile || !hasProfile(profile, "Admin")) return null;
  return session;
}

// GET /api/profiles — list all profiles with their permissions
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const profiles = await prisma.profile.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: {
      permissions: {
        orderBy: { pageId: "asc" },
      },
    },
  });

  return NextResponse.json(profiles);
}

// POST /api/profiles — create a new profile
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
    }

    const existing = await prisma.profile.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "A profile with this name already exists" }, { status: 409 });
    }

    const created = await prisma.profile.create({
      data: { name: name.trim(), description: description?.trim() || null },
      include: { permissions: true },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating profile:", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}

// PATCH /api/profiles — update profile name/description
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, name, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
    }

    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (existing.isSystem) {
      return NextResponse.json({ error: "System profiles cannot be renamed" }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;

    const updated = await prisma.profile.update({
      where: { id },
      data,
      include: { permissions: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

// DELETE /api/profiles?id=xxx — delete a custom profile (Admin+)
export async function DELETE(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Profile ID is required" }, { status: 400 });
  }

  const found = await prisma.profile.findUnique({ where: { id } });
  if (!found) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (found.isSystem) {
    return NextResponse.json({ error: "System profiles cannot be deleted" }, { status: 400 });
  }

  // Check if any users are assigned this profile
  const usersWithProfile = await prisma.user.count({ where: { profile: found.name } });
  if (usersWithProfile > 0) {
    return NextResponse.json({
      error: `Cannot delete: ${usersWithProfile} user(s) are assigned this profile. Reassign them first.`,
    }, { status: 400 });
  }

  await prisma.profile.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
