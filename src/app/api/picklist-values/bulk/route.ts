import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionOrBypass, hasProfile } from "@/lib/auth";

// PUT /api/picklist-values/bulk — replace all values for a pageId+fieldName (Admin+ only)
// Body: { pageId, fieldName, values: [{ value, label, sortOrder, isDefault, isActive, color, icon, metadata }] }
export async function PUT(request: NextRequest) {
  const session = await getSessionOrBypass();
  const profile = (session?.user as any)?.profile;
  if (!profile || !hasProfile(profile, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { pageId, fieldName, values } = body;

    if (!pageId?.trim() || !fieldName?.trim()) {
      return NextResponse.json(
        { error: "pageId and fieldName are required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(values)) {
      return NextResponse.json(
        { error: "values must be an array" },
        { status: 400 }
      );
    }

    // Validate each value entry
    for (const v of values) {
      if (!v.value?.trim()) {
        return NextResponse.json(
          { error: "Each value entry must have a non-empty value field" },
          { status: 400 }
        );
      }
    }

    // Transaction: delete all existing values for this pageId+fieldName, then insert new ones
    const result = await prisma.$transaction(async (tx) => {
      // Delete all existing values for this combination
      await tx.picklistValue.deleteMany({
        where: { pageId, fieldName },
      });

      // Insert all new values
      const created = await tx.picklistValue.createMany({
        data: values.map((v: any, index: number) => ({
          pageId: pageId.trim(),
          fieldName: fieldName.trim(),
          value: v.value.trim(),
          label: (v.label || v.value).trim(),
          sortOrder: v.sortOrder ?? index,
          isDefault: v.isDefault ?? false,
          isActive: v.isActive ?? true,
          color: v.color || null,
          icon: v.icon || null,
          metadata: v.metadata || null,
        })),
      });

      // Return the newly created values
      const newValues = await tx.picklistValue.findMany({
        where: { pageId, fieldName },
        orderBy: { sortOrder: "asc" },
      });

      return newValues;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error bulk updating picklist values:", error);
    return NextResponse.json(
      { error: "Failed to bulk update picklist values" },
      { status: 500 }
    );
  }
}
