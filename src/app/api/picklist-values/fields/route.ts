import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionOrBypass, hasRole } from "@/lib/auth";
import { MODULE_REGISTRY } from "@/lib/moduleRegistry";

// GET /api/picklist-values/fields
// Returns all distinct pageId+fieldName combos with value counts.
// Merges in registry-defined fields that have no DB values yet (count=0).
// Admin+ only.
export async function GET() {
  const session = await getSessionOrBypass();
  const role = (session?.user as any)?.role;
  if (!role || !hasRole(role, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Get all distinct pageId+fieldName combos with counts from DB
    const dbFields = await prisma.picklistValue.groupBy({
      by: ["pageId", "fieldName"],
      _count: { id: true },
    });

    // Build a map of "pageId::fieldName" -> count
    const countMap = new Map<string, number>();
    for (const row of dbFields) {
      countMap.set(`${row.pageId}::${row.fieldName}`, row._count.id);
    }

    // Build module label + field label lookup from registry
    const moduleLabelMap = new Map<string, string>();
    const fieldLabelMap = new Map<string, string>();
    for (const mod of MODULE_REGISTRY) {
      moduleLabelMap.set(mod.pageId, mod.label);
      for (const f of mod.fields) {
        fieldLabelMap.set(`${mod.pageId}::${f.fieldName}`, f.label);
      }
    }

    // Start with all registry-defined fields (so empty ones show up)
    const resultMap = new Map<
      string,
      { pageId: string; fieldName: string; moduleLabel: string; fieldLabel: string; count: number }
    >();

    for (const mod of MODULE_REGISTRY) {
      for (const f of mod.fields) {
        const key = `${mod.pageId}::${f.fieldName}`;
        resultMap.set(key, {
          pageId: mod.pageId,
          fieldName: f.fieldName,
          moduleLabel: mod.label,
          fieldLabel: f.label,
          count: countMap.get(key) || 0,
        });
      }
    }

    // Add any DB fields not in the registry (custom fields added via UI)
    for (const row of dbFields) {
      const key = `${row.pageId}::${row.fieldName}`;
      if (!resultMap.has(key)) {
        resultMap.set(key, {
          pageId: row.pageId,
          fieldName: row.fieldName,
          moduleLabel: moduleLabelMap.get(row.pageId) || row.pageId,
          fieldLabel: fieldLabelMap.get(key) || row.fieldName,
          count: row._count.id,
        });
      }
    }

    // Sort alphabetically by fieldLabel, then by moduleLabel
    const results = Array.from(resultMap.values()).sort((a, b) => {
      const cmp = a.fieldLabel.localeCompare(b.fieldLabel);
      if (cmp !== 0) return cmp;
      return a.moduleLabel.localeCompare(b.moduleLabel);
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching picklist fields:", error);
    return NextResponse.json(
      { error: "Failed to fetch picklist fields" },
      { status: 500 }
    );
  }
}
