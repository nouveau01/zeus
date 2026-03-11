import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";
import { hash } from "bcryptjs";
import crypto from "crypto";

/** Check if the user's profile has portal-users module access */
async function canAccessPortalUsers(session: any): Promise<boolean> {
  if (!session?.user) return false;
  // GodAdmin always has access
  if (session.user.profile === "GodAdmin") return true;
  // Look up the Profile record by name, then check its permission for portal-users
  const prof = await prisma.profile.findUnique({
    where: { name: session.user.profile },
    select: { id: true },
  });
  if (!prof) return false;
  const perm = await prisma.profilePermission.findUnique({
    where: { profileId_pageId: { profileId: prof.id, pageId: "portal-users" } },
  });
  // No permission record = no access (portal-users is opt-in)
  if (!perm) return false;
  return perm.canAccess;
}

// GET /api/portal-users?customerId=...
export async function GET(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!(await canAccessPortalUsers(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const customerId = req.nextUrl.searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId required" }, { status: 400 });
  }

  const users = await prisma.portalUser.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      title: true,
      isActive: true,
      mustResetPassword: true,
      lastLogin: true,
      createdAt: true,
      contact: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(users);
}

// POST /api/portal-users — create portal user
export async function POST(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!(await canAccessPortalUsers(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { customerId, email, name, phone, title, contactId } = body;

  if (!customerId || !email || !name) {
    return NextResponse.json({ error: "customerId, email, and name are required" }, { status: 400 });
  }

  // Check email doesn't already exist
  const existing = await prisma.portalUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ error: "A portal user with this email already exists" }, { status: 400 });
  }

  // Generate temp password
  const tempPassword = crypto.randomBytes(4).toString("hex");
  const passwordHash = await hash(tempPassword, 12);

  const user = await prisma.portalUser.create({
    data: {
      customerId,
      email: email.toLowerCase().trim(),
      name,
      phone: phone || null,
      title: title || null,
      contactId: contactId || null,
      passwordHash,
      mustResetPassword: true,
    },
  });

  // Enable portal access on customer if not already
  await prisma.customer.update({
    where: { id: customerId },
    data: { portalAccess: true },
  });

  return NextResponse.json({ ...user, tempPassword }, { status: 201 });
}

// PUT /api/portal-users — update portal user
export async function PUT(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!(await canAccessPortalUsers(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const { id, isActive, name, phone, title, resetPassword } = body;

  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const data: any = {};
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (name) data.name = name;
  if (typeof phone === "string") data.phone = phone || null;
  if (typeof title === "string") data.title = title || null;

  // Reset password
  if (resetPassword) {
    const tempPassword = crypto.randomBytes(4).toString("hex");
    data.passwordHash = await hash(tempPassword, 12);
    data.mustResetPassword = true;

    const updated = await prisma.portalUser.update({ where: { id }, data });
    return NextResponse.json({ ...updated, tempPassword });
  }

  const updated = await prisma.portalUser.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// DELETE /api/portal-users — delete portal user
export async function DELETE(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!(await canAccessPortalUsers(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  await prisma.portalUser.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
