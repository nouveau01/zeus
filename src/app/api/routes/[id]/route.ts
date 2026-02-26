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

// GET /api/routes/[id] — fetch a single route
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid route ID" }, { status: 400 });
  }

  try {
    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    return NextResponse.json(route);
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json({ error: "Failed to fetch route" }, { status: 500 });
  }
}

// PUT /api/routes/[id] — update a route
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid route ID" }, { status: 400 });
  }

  try {
    const body = await request.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Route name is required" }, { status: 400 });
    }

    const existing = await prisma.route.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    const updated = await prisma.route.update({
      where: { id },
      data: {
        name: body.name.trim(),
        mech: body.mech ?? existing.mech,
        loc: body.loc ?? existing.loc,
        elev: body.elev ?? existing.elev,
        hour: body.hour ?? existing.hour,
        amount: body.amount ?? existing.amount,
        remarks: body.remarks !== undefined ? body.remarks : existing.remarks,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating route:", error);
    return NextResponse.json({ error: "Failed to update route" }, { status: 500 });
  }
}

// DELETE /api/routes/[id] — delete a route
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid route ID" }, { status: 400 });
  }

  try {
    const existing = await prisma.route.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    await prisma.route.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting route:", error);
    return NextResponse.json({ error: "Failed to delete route" }, { status: 500 });
  }
}
