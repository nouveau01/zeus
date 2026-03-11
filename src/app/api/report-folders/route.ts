import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

async function getCurrentUserId(): Promise<string | null> {
  const session = await getSessionOrBypass();
  const sessionUserId = (session?.user as any)?.id;
  if (sessionUserId) return sessionUserId;

  const defaultUser = await prisma.user.findFirst({
    where: { profile: "Admin", isActive: true },
    select: { id: true },
  });
  return defaultUser?.id || null;
}

// GET /api/report-folders — list folders (user's own + public)
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    const folders = await prisma.reportFolder.findMany({
      where: {
        OR: [
          { isPublic: true },
          ...(userId ? [{ userId }] : []),
        ],
      },
      orderBy: { name: "asc" },
      include: {
        user: { select: { name: true } },
        _count: { select: { reports: true } },
      },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("Error fetching report folders:", error);
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
  }
}

// POST /api/report-folders
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    const body = await request.json();
    const { name, isPublic } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const folder = await prisma.reportFolder.create({
      data: {
        name,
        isPublic: isPublic ?? false,
        userId,
      },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Error creating report folder:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}

// DELETE /api/report-folders?id=xxx
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

    const folder = await prisma.reportFolder.findUnique({
      where: { id },
      include: { _count: { select: { reports: true } } },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    if (folder.userId !== userId) {
      return NextResponse.json({ error: "You can only delete your own folders" }, { status: 403 });
    }

    if (folder._count.reports > 0) {
      return NextResponse.json({ error: "Folder is not empty. Move or delete reports first." }, { status: 400 });
    }

    await prisma.reportFolder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report folder:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
