import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

async function getCurrentUserId(): Promise<string | null> {
  // Try session first
  const session = await getSessionOrBypass();
  const sessionUserId = (session?.user as any)?.id;
  if (sessionUserId) return sessionUserId;

  // Fall back to first admin user if no session
  const defaultUser = await prisma.user.findFirst({
    where: { profile: "Admin", isActive: true },
    select: { id: true },
  });
  return defaultUser?.id || null;
}

// GET /api/saved-filters?pageId=customers
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
      return NextResponse.json({ error: "pageId is required" }, { status: 400 });
    }

    // Get filters that are public OR owned by the current user
    const filters = await prisma.savedFilter.findMany({
      where: {
        pageId,
        OR: [
          { isPublic: true },
          ...(userId ? [{ userId }] : []),
        ],
      },
      orderBy: { name: "asc" },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(filters);
  } catch (error) {
    console.error("Error fetching saved filters:", error);
    return NextResponse.json({ error: "Failed to fetch saved filters" }, { status: 500 });
  }
}

// POST /api/saved-filters
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "No user found. Please create a user first." }, { status: 401 });
    }

    const body = await request.json();
    const { name, pageId, filters, isPublic } = body;

    if (!name || !pageId) {
      return NextResponse.json({ error: "name and pageId are required" }, { status: 400 });
    }

    const savedFilter = await prisma.savedFilter.create({
      data: {
        name,
        pageId,
        filters: filters || {},
        isPublic: isPublic ?? false,
        userId,
      },
    });

    return NextResponse.json(savedFilter);
  } catch (error) {
    console.error("Error creating saved filter:", error);
    return NextResponse.json({ error: "Failed to create saved filter" }, { status: 500 });
  }
}

// DELETE /api/saved-filters?id=xxx
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

    const filter = await prisma.savedFilter.findUnique({ where: { id } });
    if (!filter) {
      return NextResponse.json({ error: "Filter not found" }, { status: 404 });
    }

    await prisma.savedFilter.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved filter:", error);
    return NextResponse.json({ error: "Failed to delete saved filter" }, { status: 500 });
  }
}
