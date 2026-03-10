import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionOrBypass, hasRole } from "@/lib/auth";

// GET /api/picklist-values?pageId=xxx&fieldName=yyy
// Returns active picklist values sorted by sortOrder.
// Falls back to _global if no values found for the specific pageId.
export async function GET(request: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get("pageId");
  const fieldName = searchParams.get("fieldName");

  if (!pageId || !fieldName) {
    return NextResponse.json(
      { error: "pageId and fieldName are required" },
      { status: 400 }
    );
  }

  try {
    // Admin+ can request inactive values too (for the editor)
    const includeInactive = searchParams.get("includeInactive") === "true";
    let showInactive = false;
    if (includeInactive) {
      const role = (session?.user as any)?.role;
      if (role && hasRole(role, "Admin")) {
        showInactive = true;
      }
    }

    const activeFilter = showInactive ? {} : { isActive: true };

    // Try page-specific values first
    let values = await prisma.picklistValue.findMany({
      where: {
        pageId,
        fieldName,
        ...activeFilter,
      },
      orderBy: { sortOrder: "asc" },
    });

    // Fallback to _global if no page-specific values found
    if (values.length === 0 && pageId !== "_global") {
      values = await prisma.picklistValue.findMany({
        where: {
          pageId: "_global",
          fieldName,
          ...activeFilter,
        },
        orderBy: { sortOrder: "asc" },
      });
    }

    return NextResponse.json(values);
  } catch (error) {
    console.error("Error fetching picklist values:", error);
    return NextResponse.json(
      { error: "Failed to fetch picklist values" },
      { status: 500 }
    );
  }
}

// POST /api/picklist-values — create a new picklist value (Admin+ only)
export async function POST(request: NextRequest) {
  const session = await getSessionOrBypass();
  const role = (session?.user as any)?.role;
  if (!role || !hasRole(role, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
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

    if (!pageId?.trim() || !fieldName?.trim() || !value?.trim()) {
      return NextResponse.json(
        { error: "pageId, fieldName, and value are required" },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.picklistValue.findUnique({
      where: {
        pageId_fieldName_value: { pageId, fieldName, value },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A picklist value with this pageId, fieldName, and value already exists" },
        { status: 409 }
      );
    }

    const created = await prisma.picklistValue.create({
      data: {
        pageId: pageId.trim(),
        fieldName: fieldName.trim(),
        value: value.trim(),
        label: (label || value).trim(),
        sortOrder: sortOrder ?? 0,
        isDefault: isDefault ?? false,
        isActive: isActive ?? true,
        color: color || null,
        icon: icon || null,
        metadata: metadata || null,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error creating picklist value:", error);
    return NextResponse.json(
      { error: "Failed to create picklist value" },
      { status: 500 }
    );
  }
}
