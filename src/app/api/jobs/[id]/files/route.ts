import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/jobs/[id]/files
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const files = await prisma.file.findMany({
      where: { jobId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json({ error: "Failed to fetch files" }, { status: 500 });
  }
}

// POST /api/jobs/[id]/files
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, url, size, mimeType, uploadedById } = body;

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: params.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const file = await prisma.file.create({
      data: {
        name,
        url,
        size: size || 0,
        mimeType: mimeType || "application/octet-stream",
        jobId: params.id,
        uploadedById: uploadedById || null,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    // Create activity for file upload
    await prisma.activity.create({
      data: {
        type: "FILE_UPLOAD",
        content: `Uploaded file: ${name}`,
        jobId: params.id,
        userId: uploadedById || null,
      },
    });

    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    console.error("Error creating file:", error);
    return NextResponse.json({ error: "Failed to create file" }, { status: 500 });
  }
}

// DELETE /api/jobs/[id]/files/[fileId] would go in a separate route file
