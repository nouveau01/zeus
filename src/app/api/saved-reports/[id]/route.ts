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

// GET /api/saved-reports/[id] — get single report for re-running
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    const report = await prisma.savedReport.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true } },
        folder: { select: { id: true, name: true } },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Only allow access to own reports or public reports
    if (!report.isPublic && report.userId !== userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error fetching saved report:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

// PUT /api/saved-reports/[id] — update report (rename, move folder, toggle public)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "No user found" }, { status: 401 });
    }

    const report = await prisma.savedReport.findUnique({ where: { id: params.id } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.userId !== userId) {
      return NextResponse.json({ error: "You can only edit your own reports" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.folderId !== undefined) updateData.folderId = body.folderId || null;

    const updated = await prisma.savedReport.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating saved report:", error);
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 });
  }
}
