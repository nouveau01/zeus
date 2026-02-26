import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasRole } from "@/lib/auth";
import prisma from "@/lib/db";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!role || !hasRole(role, "Admin")) return null;
  return session;
}

// GET /api/roles — list all roles with their permissions
export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const roles = await prisma.role.findMany({
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    include: {
      permissions: {
        orderBy: { pageId: "asc" },
      },
    },
  });

  return NextResponse.json(roles);
}

// POST /api/roles — create a new role
export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }

    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json({ error: "A role with this name already exists" }, { status: 409 });
    }

    const role = await prisma.role.create({
      data: { name: name.trim(), description: description?.trim() || null },
      include: { permissions: true },
    });

    return NextResponse.json(role);
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
}

// PATCH /api/roles — update role name/description
export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, name, description } = body;

    if (!id) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }

    const role = await prisma.role.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.isSystem) {
      return NextResponse.json({ error: "System roles cannot be renamed" }, { status: 400 });
    }

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (description !== undefined) data.description = description?.trim() || null;

    const updated = await prisma.role.update({
      where: { id },
      data,
      include: { permissions: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}

// DELETE /api/roles?id=xxx — delete a custom role (GodAdmin only)
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const callerRole = (session?.user as any)?.role;

  if (callerRole !== "GodAdmin") {
    return NextResponse.json({ error: "Only GodAdmin can delete roles" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
  }

  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  if (role.isSystem) {
    return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 400 });
  }

  // Check if any users are assigned this role
  const usersWithRole = await prisma.user.count({ where: { role: role.name } });
  if (usersWithRole > 0) {
    return NextResponse.json({
      error: `Cannot delete: ${usersWithRole} user(s) are assigned this role. Reassign them first.`,
    }, { status: 400 });
  }

  await prisma.role.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
