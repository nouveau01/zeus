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

// GET /api/presentations?view=my|public|all|recent&folderId=xxx
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view") || "all";
    const folderId = searchParams.get("folderId");

    let where: any = {};

    if (view === "my") {
      where = userId ? { userId } : { id: "none" };
    } else if (view === "public") {
      where = { isPublic: true };
    } else if (view === "recent") {
      where = {
        OR: [
          { isPublic: true },
          ...(userId ? [{ userId }] : []),
        ],
      };
    } else {
      // "all" — user's own + public
      where = {
        OR: [
          { isPublic: true },
          ...(userId ? [{ userId }] : []),
        ],
      };
    }

    if (folderId) {
      where.folderId = folderId;
    }

    const presentations = await prisma.presentation.findMany({
      where,
      orderBy: view === "recent" ? { updatedAt: "desc" } : { name: "asc" },
      take: view === "recent" ? 20 : undefined,
      select: {
        id: true,
        name: true,
        description: true,
        customerId: true,
        presentationType: true,
        slideCount: true,
        isPublic: true,
        folderId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { name: true } },
        customer: { select: { id: true, name: true } },
        folder: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(presentations);
  } catch (error) {
    console.error("Error fetching presentations:", error);
    return NextResponse.json({ error: "Failed to fetch presentations" }, { status: 500 });
  }
}

// POST /api/presentations
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No user found. Please create a user first." }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      customerId,
      premisesId,
      generationPrompt,
      presentationType,
      slides,
      isPublic,
      folderId,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const slideArray = Array.isArray(slides) ? slides : [];

    const presentation = await prisma.presentation.create({
      data: {
        name,
        description: description || null,
        customerId: customerId || null,
        premisesId: premisesId || null,
        generationPrompt: generationPrompt || null,
        presentationType: presentationType || "general",
        slides: slideArray,
        slideCount: slideArray.length,
        isPublic: isPublic ?? false,
        folderId: folderId || null,
        userId,
      },
    });

    return NextResponse.json(presentation);
  } catch (error) {
    console.error("Error creating presentation:", error);
    return NextResponse.json({ error: "Failed to save presentation" }, { status: 500 });
  }
}

// DELETE /api/presentations?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const presentation = await prisma.presentation.findUnique({ where: { id } });
    if (!presentation) {
      return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
    }

    if (presentation.userId !== userId) {
      return NextResponse.json({ error: "You can only delete your own presentations" }, { status: 403 });
    }

    await prisma.presentation.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting presentation:", error);
    return NextResponse.json({ error: "Failed to delete presentation" }, { status: 500 });
  }
}
