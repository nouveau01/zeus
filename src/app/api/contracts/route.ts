import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/contracts - List contracts with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const premisesId = searchParams.get("premisesId");
    const customerId = searchParams.get("customerId");

    const where: any = {};
    if (premisesId) where.premisesId = premisesId;
    if (customerId) where.customerId = customerId;

    const contracts = await prisma.contract.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Error fetching contracts:", error);
    return NextResponse.json({ error: "Failed to fetch contracts" }, { status: 500 });
  }
}

// POST /api/contracts - Create new contract
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      premisesId,
      customerId,
      jobId,
      description,
      sType, // schedule type (Monthly, Quarterly, etc.)
      hours,
      bCycle, // billing cycle
      bAmt, // billing amount
      status,
    } = body;

    const contract = await prisma.contract.create({
      data: {
        premisesId: premisesId || null,
        customerId: customerId || null,
        jobId: jobId || null,
        sType: sType || "Monthly",
        hours: hours ? parseFloat(hours) : 0,
        bCycle: bCycle ? parseInt(bCycle) : 1,
        bAmt: bAmt ? parseFloat(bAmt) : 0,
        status: status ?? 1,
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

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Error creating contract:", error);
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
  }
}
