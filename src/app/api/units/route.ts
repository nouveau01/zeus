import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const premisesId = searchParams.get("premisesId");

    const where = premisesId ? { premisesId } : {};

    const units = await prisma.unit.findMany({
      where,
      include: {
        premises: {
          select: {
            id: true,
            premisesId: true,
            address: true,
          },
        },
      },
      orderBy: { unitNumber: "asc" },
    });
    return NextResponse.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const unit = await prisma.unit.create({
      data: {
        unitNumber: body.unitNumber,
        state: body.state,
        cat: body.cat || body.category,
        unitType: body.unitType || body.type,
        building: body.building,
        manufacturer: body.manufacturer,
        serial: body.serial || body.serialNumber,
        description: body.description,
        remarks: body.remarks,
        status: body.status || "Active",
        price: body.price ? parseFloat(body.price) : null,
        group: body.group,
        week: body.week,
        template: body.template,
        installDate: body.installDate || body.installed ? new Date(body.installDate || body.installed) : null,
        installBy: body.installBy || body.installedBy,
        sinceDate: body.sinceDate || body.onServiceSince ? new Date(body.sinceDate || body.onServiceSince) : null,
        lastDate: body.lastDate || body.lastServiceOn ? new Date(body.lastDate || body.lastServiceOn) : null,
        premisesId: body.premisesId || body.accountId,
        custom1: body.custom1,
        custom2: body.custom2,
        custom3: body.custom3,
        custom4: body.custom4,
        custom5: body.custom5,
        custom6: body.custom6,
        custom7: body.custom7,
        custom8: body.custom8,
        custom9: body.custom9,
        custom10: body.custom10,
      },
      include: {
        premises: {
          select: {
            id: true,
            premisesId: true,
            address: true,
          },
        },
      },
    });
    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error creating unit:", error);
    return NextResponse.json(
      { error: "Failed to create unit" },
      { status: 500 }
    );
  }
}
