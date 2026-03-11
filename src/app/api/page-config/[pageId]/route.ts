import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

interface FieldConfig {
  fieldName: string;
  displayLabel: string;
  sortOrder: number;
  visible: boolean;
  width?: number;
  section?: string;
  format?: string;
}

// GET /api/page-config/[pageId] - Get field configs for a page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;

    const configs = await prisma.pageFieldConfig.findMany({
      where: { pageId },
      orderBy: { sortOrder: "asc" },
    });

    const fields: FieldConfig[] = configs.map((c) => ({
      fieldName: c.fieldName,
      displayLabel: c.displayLabel,
      sortOrder: c.sortOrder,
      visible: c.visible,
      width: c.width ?? undefined,
      section: c.section ?? undefined,
      format: c.format ?? undefined,
    }));

    return NextResponse.json(fields);
  } catch (error) {
    console.error("Error fetching page config:", error);
    return NextResponse.json(
      { error: "Failed to fetch page config" },
      { status: 500 }
    );
  }
}

// PUT /api/page-config/[pageId] - Save field configs for a page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    // Check if user is admin
    const session = await getSessionOrBypass();
    if (!session?.user || (session.user as any).profile !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await params;
    const body = await request.json();
    const { fields } = body as { fields: FieldConfig[] };

    if (!fields || !Array.isArray(fields)) {
      return NextResponse.json(
        { error: "Invalid fields data" },
        { status: 400 }
      );
    }

    // Upsert each field config
    const upsertPromises = fields.map((field) =>
      prisma.pageFieldConfig.upsert({
        where: {
          pageId_fieldName: {
            pageId,
            fieldName: field.fieldName,
          },
        },
        update: {
          displayLabel: field.displayLabel,
          sortOrder: field.sortOrder,
          visible: field.visible,
          width: field.width ?? null,
          section: field.section ?? null,
          format: field.format ?? null,
        },
        create: {
          pageId,
          fieldName: field.fieldName,
          displayLabel: field.displayLabel,
          sortOrder: field.sortOrder,
          visible: field.visible,
          width: field.width ?? null,
          section: field.section ?? null,
          format: field.format ?? null,
        },
      })
    );

    await Promise.all(upsertPromises);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving page config:", error);
    return NextResponse.json(
      { error: "Failed to save page config" },
      { status: 500 }
    );
  }
}
