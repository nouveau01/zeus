import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/permissions/preview?role=RoleName — GodAdmin only, fetch permissions for any role
export async function GET(request: NextRequest) {
  const session = await getSessionOrBypass();
  const callerRole = (session?.user as any)?.role;

  if (callerRole !== "GodAdmin") {
    return NextResponse.json({ error: "Only GodAdmin can preview roles" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const roleName = searchParams.get("role");

  if (!roleName) {
    return NextResponse.json({ error: "role parameter is required" }, { status: 400 });
  }

  try {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
      include: { permissions: true },
    });

    if (!role) {
      return NextResponse.json({ role: roleName, permissions: [] });
    }

    return NextResponse.json({
      role: roleName,
      permissions: role.permissions,
    });
  } catch (error) {
    console.error("Error fetching preview permissions:", error);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}
