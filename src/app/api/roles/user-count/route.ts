import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasRole } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/roles/user-count?role=RoleName — count users assigned to a role
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const callerRole = (session?.user as any)?.role;
  if (!callerRole || !hasRole(callerRole, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const roleName = searchParams.get("role");

  if (!roleName) {
    return NextResponse.json({ error: "Role name is required" }, { status: 400 });
  }

  const count = await prisma.user.count({ where: { role: roleName } });

  return NextResponse.json({ count });
}
