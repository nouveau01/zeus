import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass, hasProfile, canBeGodAdmin } from "@/lib/auth";
import prisma from "@/lib/db";

async function requireAdmin() {
  const session = await getSessionOrBypass();
  const profile = (session?.user as any)?.profile;
  if (!profile || !hasProfile(profile, "Admin")) {
    return null;
  }
  return session;
}

// GET /api/users — list all users
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      profile: true,
      avatar: true,
      title: true,
      department: true,
      phone: true,
      extension: true,
      lastLogin: true,
      isActive: true,
      primaryOfficeId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(users);
}

// POST /api/users — create a new user
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const callerProfile = (session.user as any)?.profile;
  const body = await request.json();
  const { email, name, profile, primaryOfficeId } = body;

  if (!email || !name) {
    return NextResponse.json({ error: "Email and name are required" }, { status: 400 });
  }

  // Only GodAdmin can create GodAdmin users, and only whitelisted emails can be GodAdmin
  if (profile === "GodAdmin") {
    if (callerProfile !== "GodAdmin") {
      return NextResponse.json({ error: "Only GodAdmin can create GodAdmin users" }, { status: 403 });
    }
    if (!canBeGodAdmin(email)) {
      return NextResponse.json({ error: "This email is not authorized for the GodAdmin profile" }, { status: 403 });
    }
  }

  // Check domain restriction
  const domain = email.split("@")[1]?.toLowerCase() || "";
  if (!domain.startsWith("nouveau") || !domain.endsWith(".com")) {
    return NextResponse.json({ error: "Email must be a nouveau*.com domain" }, { status: 400 });
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      profile: profile || "User",
      isActive: true,
      ...(primaryOfficeId !== undefined && { primaryOfficeId: primaryOfficeId || null }),
    },
  });

  return NextResponse.json(user);
}

// PATCH /api/users — update a user
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const callerProfile = (session.user as any)?.profile;
  const callerId = (session.user as any)?.id;
  const body = await request.json();
  const { id, name, profile, isActive, primaryOfficeId, title, department, phone, extension } = body;

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  const targetUser = await prisma.user.findUnique({ where: { id } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Protect GodAdmin accounts from non-GodAdmin
  if (targetUser.profile === "GodAdmin" && callerProfile !== "GodAdmin") {
    return NextResponse.json({ error: "Only GodAdmin can modify GodAdmin accounts" }, { status: 403 });
  }

  // Only GodAdmin can promote to GodAdmin, and only whitelisted emails can hold it
  if (profile === "GodAdmin") {
    if (callerProfile !== "GodAdmin") {
      return NextResponse.json({ error: "Only GodAdmin can assign GodAdmin profile" }, { status: 403 });
    }
    if (!canBeGodAdmin(targetUser.email)) {
      return NextResponse.json({ error: "This email is not authorized for the GodAdmin profile" }, { status: 403 });
    }
  }

  // Prevent GodAdmin from deactivating themselves
  if (id === callerId && isActive === false) {
    return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
  }

  try {
    const data: any = {};
    if (name !== undefined) data.name = name;
    if (profile !== undefined) data.profile = profile;
    if (isActive !== undefined) data.isActive = isActive;
    if (primaryOfficeId !== undefined) data.primaryOfficeId = primaryOfficeId || null;
    if (title !== undefined) data.title = title || null;
    if (department !== undefined) data.department = department || null;
    if (phone !== undefined) data.phone = phone || null;
    if (extension !== undefined) data.extension = extension || null;

    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/users — delete a user (GodAdmin only)
export async function DELETE(request: NextRequest) {
  const session = await getSessionOrBypass();
  const callerProfile = (session?.user as any)?.profile;
  const callerId = (session?.user as any)?.id;

  if (callerProfile !== "GodAdmin") {
    return NextResponse.json({ error: "Only GodAdmin can delete users" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  if (id === callerId) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }

  try {
    // Delete related records first, then the user
    await prisma.savedFilter.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
