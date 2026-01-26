import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const templates = await prisma.jobTemplate.findMany({
      include: {
        type: true,
      },
      orderBy: [
        { type: { name: "asc" } },
        { name: "asc" },
      ],
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching job templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch job templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const template = await prisma.jobTemplate.create({
      data: {
        name: body.name,
        typeId: body.typeId,
        revNum: body.revNum || 1,
        expNum: body.expNum || 2,
        isActive: body.isActive ?? true,
        isBillable: body.isBillable ?? true,
        isChargeable: body.isChargeable ?? true,
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
    console.error("Error creating job template:", error);
    return NextResponse.json(
      { error: "Failed to create job template" },
      { status: 500 }
    );
  }
}
