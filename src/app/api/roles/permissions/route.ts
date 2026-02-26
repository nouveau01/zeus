import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasRole } from "@/lib/auth";
import prisma from "@/lib/db";

// PUT /api/roles/permissions — save permissions for a role + module
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!role || !hasRole(role, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { roleId, pageId, canAccess, fields } = body;

    if (!roleId || !pageId) {
      return NextResponse.json({ error: "roleId and pageId are required" }, { status: 400 });
    }

    // Prevent editing GodAdmin permissions unless you are GodAdmin
    const targetRole = await prisma.role.findUnique({ where: { id: roleId } });
    if (targetRole?.name === "GodAdmin" && role !== "GodAdmin") {
      return NextResponse.json({ error: "Only GodAdmin can modify GodAdmin permissions" }, { status: 403 });
    }

    const permission = await prisma.rolePermission.upsert({
      where: {
        roleId_pageId: { roleId, pageId },
      },
      update: {
        canAccess: canAccess ?? true,
        fields: fields ?? {},
      },
      create: {
        roleId,
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
