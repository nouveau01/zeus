import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const sessionUserId = (session?.user as any)?.id;
  if (sessionUserId) return sessionUserId;

  const defaultUser = await prisma.user.findFirst({
    where: { role: "Admin", isActive: true },
    select: { id: true },
  });
  return defaultUser?.id || null;
}

// GET /api/saved-reports?view=my|public|all|recent&folderId=xxx
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

    const reports = await prisma.savedReport.findMany({
      where,
      orderBy: view === "recent"
        ? { updatedAt: "desc" }
        : { name: "asc" },
      take: view === "recent" ? 20 : undefined,
      include: {
        user: { select: { name: true } },
        folder: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching saved reports:", error);
    return NextResponse.json({ error: "Failed to fetch saved reports" }, { status: 500 });
  }
}

// POST /api/saved-reports
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No user found. Please create a user first." }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, prompt, sql, reportData, isPublic, folderId } = body;

    if (!name || !prompt) {
      return NextResponse.json({ error: "name and prompt are required" }, { status: 400 });
    }

    const savedReport = await prisma.savedReport.create({
      data: {
        name,
        description: description || null,
        prompt,
        sql: sql || null,
        reportData: reportData || {},
        isPublic: isPublic ?? false,
        folderId: folderId || null,
        userId,
      },
    });

    return NextResponse.json(savedReport);
  } catch (error) {
    console.error("Error creating saved report:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }
}

// DELETE /api/saved-reports?id=xxx
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

    const report = await prisma.savedReport.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.userId !== userId) {
      return NextResponse.json({ error: "You can only delete your own reports" }, { status: 403 });
    }

    await prisma.savedReport.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved report:", error);
    return NextResponse.json({ error: "Failed to delete saved report" }, { status: 500 });
  }
}
