import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const types = await prisma.jobType.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(types);
  } catch (error) {
    console.error("Error fetching job types:", error);
    return NextResponse.json(
      { error: "Failed to fetch job types" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = await prisma.jobType.create({
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive ?? true,
        sortOrder: body.sortOrder || 0,
      },
    });
    return NextResponse.json(type);
  } catch (error) {
    console.error("Error creating job type:", error);
    return NextResponse.json(
      { error: "Failed to create job type" },
      { status: 500 }
    );
  }
}
