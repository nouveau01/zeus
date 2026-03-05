import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionOrBypass, hasRole } from "@/lib/auth";

// PUT /api/picklist-values/[id] — update a picklist value (Admin+ only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionOrBypass();
  const role = (session?.user as any)?.role;
  if (!role || !hasRole(role, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = params;

  try {
    const existing = await prisma.picklistValue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Picklist value not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      pageId,
      fieldName,
      value,
      label,
      sortOrder,
      isDefault,
      isActive,
      color,
      icon,
      metadata,
    } = body;

    const updated = await prisma.picklistValue.update({
      where: { id },
      data: {
        ...(pageId !== undefined && { pageId: pageId.trim() }),
        ...(fieldName !== undefined && { fieldName: fieldName.trim() }),
        ...(value !== undefined && { value: value.trim() }),
        ...(label !== undefined && { label: label.trim() }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive }),
        ...(color !== undefined && { color: color || null }),
        ...(icon !== undefined && { icon: icon || null }),
        ...(metadata !== undefined && { metadata: metadata || null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating picklist value:", error);
    return NextResponse.json(
      { error: "Failed to update picklist value" },
      { status: 500 }
    );
  }
}

// DELETE /api/picklist-values/[id] — delete a picklist value (Admin+ only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionOrBypass();
  const role = (session?.user as any)?.role;
  if (!role || !hasRole(role, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = params;

  try {
    const existing = await prisma.picklistValue.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Picklist value not found" },
        { status: 404 }
      );
    }

    await prisma.picklistValue.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting picklist value:", error);
    return NextResponse.json(
      { error: "Failed to delete picklist value" },
      { status: 500 }
    );
  }
}
