import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass, hasProfile } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/detail-layouts/[pageId] — get layout config
export async function GET(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const session = await getSessionOrBypass();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pageId } = params;
  const layout = await prisma.detailLayout.findUnique({
    where: { pageId },
  });

  if (!layout) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(layout.layout);
}

// PUT /api/detail-layouts/[pageId] — save/update layout config
export async function PUT(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const session = await getSessionOrBypass();
  const profile = (session?.user as any)?.profile;
  if (!profile || !hasProfile(profile, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pageId } = params;
  const body = await request.json();

  if (!body.layout) {
    return NextResponse.json({ error: "Layout config required" }, { status: 400 });
  }

  await prisma.detailLayout.upsert({
    where: { pageId },
    update: {
      layout: body.layout,
      createdBy: (session?.user as any)?.id || null,
    },
    create: {
      pageId,
      layout: body.layout,
      createdBy: (session?.user as any)?.id || null,
    },
  });

  return NextResponse.json({ success: true });
}

// DELETE /api/detail-layouts/[pageId] — reset to default
export async function DELETE(
  request: NextRequest,
  { params }: { params: { pageId: string } }
) {
  const session = await getSessionOrBypass();
  const profile = (session?.user as any)?.profile;
  if (!profile || !hasProfile(profile, "Admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pageId } = params;
  await prisma.detailLayout.delete({ where: { pageId } }).catch(() => null);
  return NextResponse.json({ success: true });
}
