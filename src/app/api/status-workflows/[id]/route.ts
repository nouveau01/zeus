import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions, hasRole } from "@/lib/auth";

// PUT /api/status-workflows/[id] — update a workflow transition (Admin+ only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!role || !hasRole(role, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = params;

  try {
    const existing = await prisma.statusWorkflow.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Workflow transition not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { sortOrder, requiresRole, requiresNote, isActive } = body;

    const updated = await prisma.statusWorkflow.update({
      where: { id },
      data: {
        ...(sortOrder !== undefined && { sortOrder }),
        ...(requiresRole !== undefined && { requiresRole: requiresRole || null }),
        ...(requiresNote !== undefined && { requiresNote }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating status workflow:", error);
    return NextResponse.json(
      { error: "Failed to update status workflow" },
      { status: 500 }
    );
  }
}

// DELETE /api/status-workflows/[id] — delete a workflow transition by id (Admin+ only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!role || !hasRole(role, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = params;

  try {
    const existing = await prisma.statusWorkflow.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Workflow transition not found" },
        { status: 404 }
      );
    }

    await prisma.statusWorkflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting status workflow:", error);
    return NextResponse.json(
      { error: "Failed to delete status workflow" },
      { status: 500 }
    );
  }
}
