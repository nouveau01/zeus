import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/contracts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: params.id },
      include: {
        job: {
          select: {
            id: true,
            externalId: true,
            jobName: true,
          },
        },
        premises: {
          select: {
            id: true,
            premisesId: true,
            address: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Error fetching contract:", error);
    return NextResponse.json({ error: "Failed to fetch contract" }, { status: 500 });
  }
}

// PUT /api/contracts/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      premisesId,
      customerId,
      jobId,
      sType,
      hours,
      bCycle,
      bAmt,
      status,
      bStart,
      bFinish,
      sStart,
    } = body;

    const contract = await prisma.contract.update({
      where: { id: params.id },
      data: {
        premisesId: premisesId !== undefined ? premisesId : undefined,
        customerId: customerId !== undefined ? customerId : undefined,
        jobId: jobId !== undefined ? jobId : undefined,
        sType: sType !== undefined ? sType : undefined,
        hours: hours !== undefined ? parseFloat(hours) : undefined,
        bCycle: bCycle !== undefined ? parseInt(bCycle) : undefined,
        bAmt: bAmt !== undefined ? parseFloat(bAmt) : undefined,
        status: status !== undefined ? status : undefined,
        bStart: bStart ? new Date(bStart) : undefined,
        bFinish: bFinish ? new Date(bFinish) : undefined,
        sStart: sStart ? new Date(sStart) : undefined,
      },
      include: {
        job: {
          select: {
            id: true,
            externalId: true,
            jobName: true,
          },
        },
        premises: {
          select: {
            id: true,
            premisesId: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Error updating contract:", error);
    return NextResponse.json({ error: "Failed to update contract" }, { status: 500 });
  }
}

// DELETE /api/contracts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.contract.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contract:", error);
    return NextResponse.json({ error: "Failed to delete contract" }, { status: 500 });
  }
}
