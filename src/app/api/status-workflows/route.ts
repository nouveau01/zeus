import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionOrBypass, hasRole } from "@/lib/auth";

// GET /api/status-workflows?pageId=xxx
// Returns all active workflow transitions for the given module, sorted by sortOrder.
export async function GET(request: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId");

  if (!pageId) {
    return NextResponse.json(
      { error: "pageId is required" },
      { status: 400 }
    );
  }

  try {
    const workflows = await prisma.statusWorkflow.findMany({
      where: {
        pageId,
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Error fetching status workflows:", error);
    return NextResponse.json(
      { error: "Failed to fetch status workflows" },
      { status: 500 }
    );
  }
}

// POST /api/status-workflows — create a new workflow transition (Admin+ only)
export async function POST(request: NextRequest) {
  const session = await getSessionOrBypass();
  const role = (session?.user as any)?.role;
  if (!role || !hasRole(role, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { pageId, fromStatus, toStatus, sortOrder, requiresRole, requiresNote } = body;

    if (!pageId?.trim() || !fromStatus?.trim() || !toStatus?.trim()) {
      return NextResponse.json(
        { error: "pageId, fromStatus, and toStatus are required" },
        { status: 400 }
      );
    }

    if (fromStatus === toStatus) {
      return NextResponse.json(
        { error: "fromStatus and toStatus must be different" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.statusWorkflow.findUnique({
      where: {
        pageId_fromStatus_toStatus: {
          pageId,
          fromStatus,
          toStatus,
        },
      },
    });

    if (existing) {
      // If it exists but is inactive, reactivate it
      if (!existing.isActive) {
        const updated = await prisma.statusWorkflow.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            sortOrder: sortOrder ?? existing.sortOrder,
            requiresRole: requiresRole !== undefined ? (requiresRole || null) : existing.requiresRole,
            requiresNote: requiresNote !== undefined ? requiresNote : existing.requiresNote,
          },
        });
        return NextResponse.json(updated);
      }

      return NextResponse.json(
        { error: "This workflow transition already exists" },
        { status: 409 }
      );
    }

    const created = await prisma.statusWorkflow.create({
      data: {
        pageId: pageId.trim(),
        fromStatus: fromStatus.trim(),
        toStatus: toStatus.trim(),
        sortOrder: sortOrder ?? 0,
        requiresRole: requiresRole || null,
        requiresNote: requiresNote ?? false,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating status workflow:", error);
    return NextResponse.json(
      { error: "Failed to create status workflow" },
      { status: 500 }
    );
  }
}

// DELETE /api/status-workflows — delete a workflow by { pageId, fromStatus, toStatus } (Admin+ only)
export async function DELETE(request: NextRequest) {
  const session = await getSessionOrBypass();
  const role = (session?.user as any)?.role;
  if (!role || !hasRole(role, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { pageId, fromStatus, toStatus } = body;

    if (!pageId || !fromStatus || !toStatus) {
      return NextResponse.json(
        { error: "pageId, fromStatus, and toStatus are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.statusWorkflow.findUnique({
      where: {
        pageId_fromStatus_toStatus: {
          pageId,
          fromStatus,
          toStatus,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Workflow transition not found" },
        { status: 404 }
      );
    }

    await prisma.statusWorkflow.delete({
      where: { id: existing.id },
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
