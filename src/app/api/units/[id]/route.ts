import { NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import { getOfficeScope, childOfficeWhere } from "@/lib/officeScope";
import prisma from "@/lib/db";
import { trackChanges } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scope = await getOfficeScope(session.user.id, session.user.profile);

    const unit = await prisma.unit.findFirst({
      where: { id: params.id, ...childOfficeWhere(scope) },
      include: {
        premises: {
          select: {
            id: true,
            premisesId: true,
            address: true,
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
    if (!unit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error fetching unit:", error);
    return NextResponse.json(
      { error: "Failed to fetch unit" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scope = await getOfficeScope(session.user.id, session.user.profile);

    // Fetch existing record for access check + audit trail
    const existing = await prisma.unit.findFirst({
      where: { id: params.id, ...childOfficeWhere(scope) },
    });
    if (!existing) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const body = await request.json();
    const unit = await prisma.unit.update({
      where: { id: params.id },
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
        status: body.status,
        price: body.price !== undefined ? (body.price ? parseFloat(String(body.price).replace(/[^0-9.-]/g, '')) : null) : undefined,
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
        custom11: body.custom11,
        custom12: body.custom12,
        custom13: body.custom13,
        custom14: body.custom14,
        custom15: body.custom15,
        custom16: body.custom16,
        custom17: body.custom17,
        custom18: body.custom18,
        custom19: body.custom19,
        custom20: body.custom20,
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
    trackChanges("Unit", params.id, existing as any, unit as any, session.user);

    return NextResponse.json(unit);
  } catch (error) {
    console.error("Error updating unit:", error);
    return NextResponse.json(
      { error: "Failed to update unit" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scope = await getOfficeScope(session.user.id, session.user.profile);

    // Access check
    const existing = await prisma.unit.findFirst({
      where: { id: params.id, ...childOfficeWhere(scope) },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    await prisma.unit.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting unit:", error);
    return NextResponse.json(
      { error: "Failed to delete unit" },
      { status: 500 }
    );
  }
}
