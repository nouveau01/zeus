import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/jobs/[id]/notes
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notes = await prisma.note.findMany({
      where: { jobId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

// POST /api/jobs/[id]/notes
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, body: noteBody } = body;

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const note = await prisma.note.create({
      data: {
        title: title || null,
        body: noteBody,
        jobId: params.id,
      },
    });

    // Create activity for note creation
    await prisma.activity.create({
      data: {
        type: "NOTE_CREATED",
        content: `Added note: ${title || noteBody.substring(0, 50)}...`,
        jobId: params.id,
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
