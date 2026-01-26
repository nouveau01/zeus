import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.jobTemplate.findUnique({
      where: { id: params.id },
      include: {
        type: true,
      },
    });
    if (!template) {
      return NextResponse.json(
        { error: "Job template not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(template);
  } catch (error) {
    console.error("Error fetching job template:", error);
    return NextResponse.json(
      { error: "Failed to fetch job template" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const template = await prisma.jobTemplate.update({
      where: { id: params.id },
      data: {
        name: body.name,
        typeId: body.typeId,
        revNum: body.revNum,
        expNum: body.expNum,
        isActive: body.isActive,
        isBillable: body.isBillable,
        isChargeable: body.isChargeable,
        defaultStatus: body.defaultStatus,
        defaultContractType: body.defaultContractType,
        defaultBillRate: body.defaultBillRate,
        defaultMarkup: body.defaultMarkup,
        glRevenue: body.glRevenue,
        glExpense: body.glExpense,
      },
      include: {
        type: true,
      },
    });
    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating job template:", error);
    return NextResponse.json(
      { error: "Failed to update job template" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.jobTemplate.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting job template:", error);
    return NextResponse.json(
      { error: "Failed to delete job template" },
      { status: 500 }
    );
  }
}
