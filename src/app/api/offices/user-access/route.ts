import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass, hasRole } from "@/lib/auth";
import prisma from "@/lib/db";

// GET — Get all users with their office assignments (Admin+)
export async function GET(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (!hasRole(user.role, "Admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      primaryOfficeId: true,
      offices: {
        select: {
          officeId: true,
        },
      },
    },
  });

  // Flatten: return users with officeIds array and primaryOfficeId
  const result = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    avatar: u.avatar,
    primaryOfficeId: u.primaryOfficeId,
    officeIds: u.offices.map((o) => o.officeId),
  }));

  return NextResponse.json(result);
}

// PUT — Set a user's office assignments (Admin+)
// Body: { userId: string, officeIds: string[] }
export async function PUT(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const currentUser = session.user as any;
  if (!hasRole(currentUser.role, "Admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, officeIds } = body;

  if (!userId || !Array.isArray(officeIds)) {
    return NextResponse.json({ error: "userId and officeIds[] required" }, { status: 400 });
  }

  // Don't let non-GodAdmin modify GodAdmin users' offices
  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (targetUser.role === "GodAdmin" && currentUser.role !== "GodAdmin") {
    return NextResponse.json({ error: "Cannot modify GodAdmin office assignments" }, { status: 403 });
  }

  // Transaction: delete all existing assignments, create new ones
  await prisma.$transaction([
    prisma.userOffice.deleteMany({ where: { userId } }),
    ...officeIds.map((officeId: string) =>
      prisma.userOffice.create({
        data: { userId, officeId },
      })
    ),
  ]);

  return NextResponse.json({ success: true, officeIds });
}
