import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

async function getCurrentUserId(): Promise<string | null> {
  const session = await getSessionOrBypass();
  const sessionUserId = (session?.user as any)?.id;
  if (sessionUserId) return sessionUserId;

  const defaultUser = await prisma.user.findFirst({
    where: { role: "Admin", isActive: true },
    select: { id: true },
  });
  return defaultUser?.id || null;
}

// GET /api/presentations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    const presentation = await prisma.presentation.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true } },
        customer: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } },
      },
    });

    if (!presentation) {
      return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
    }

    if (!presentation.isPublic && presentation.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(presentation);
  } catch (error) {
    console.error("Error fetching presentation:", error);
    return NextResponse.json({ error: "Failed to fetch presentation" }, { status: 500 });
  }
}

// PUT /api/presentations/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    const presentation = await prisma.presentation.findUnique({ where: { id: params.id } });
    if (!presentation) {
      return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
    }

    if (presentation.userId !== userId) {
      return NextResponse.json({ error: "You can only edit your own presentations" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.folderId !== undefined) updateData.folderId = body.folderId || null;
    if (body.slides !== undefined) {
      const slideArray = Array.isArray(body.slides) ? body.slides : [];
      updateData.slides = slideArray;
      updateData.slideCount = slideArray.length;
    }

    const updated = await prisma.presentation.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating presentation:", error);
    return NextResponse.json({ error: "Failed to update presentation" }, { status: 500 });
  }
}
