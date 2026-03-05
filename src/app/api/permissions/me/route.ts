import { NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/permissions/me — return all permissions for the current user's role
export async function GET() {
  const session = await getSessionOrBypass();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as any)?.role || "User";

  // GodAdmin has full access to everything — return empty permissions (means no restrictions)
  if (role === "GodAdmin") {
    return NextResponse.json({ role: "GodAdmin", permissions: [], unrestricted: true });
  }

  try {
    // Find the role record
    const roleRecord = await prisma.role.findUnique({
      where: { name: role },
      include: { permissions: true },
    });

    if (!roleRecord) {
      // Role not found in DB — return no restrictions (default open)
      return NextResponse.json({ role, permissions: [], unrestricted: false });
    }

    return NextResponse.json({
      role,
      permissions: roleRecord.permissions,
      unrestricted: false,
    });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
}
