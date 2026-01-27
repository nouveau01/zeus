import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/premises/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const premises = await prisma.premises.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        units: {
          orderBy: { unitNumber: "asc" },
        },
        _count: {
          select: { units: true, jobs: true },
        },
      },
    });

    if (!premises) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(premises);
  } catch (error) {
    console.error("Error fetching premises:", error);
    return NextResponse.json({ error: "Failed to fetch premises" }, { status: 500 });
  }
}

// PUT /api/premises/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      premisesId,
      name,
      address,
      city,
      state,
      zipCode,
      country,
      contact,
      phone,
      fax,
      cellular,
      email,
      website,
      type,
      isActive,
      balance,
      // Remarks fields
      remarks,
      colRemarks,
      salesRemarks,
    } = body;

    const premises = await prisma.premises.update({
      where: { id: params.id },
      data: {
        premisesId: premisesId || null,
        name: name || null,
        address,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        type: type || "Non-Contract",
        isActive: isActive ?? true,
        balance: balance || 0,
        // Remarks
        remarks: remarks !== undefined ? remarks : undefined,
        colRemarks: colRemarks !== undefined ? colRemarks : undefined,
        salesRemarks: salesRemarks !== undefined ? salesRemarks : undefined,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        units: {
          orderBy: { unitNumber: "asc" },
        },
        _count: {
          select: { units: true, jobs: true },
        },
      },
    });

    return NextResponse.json(premises);
  } catch (error: any) {
    console.error("Error updating premises:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Premises ID already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update premises" }, { status: 500 });
  }
}

// DELETE /api/premises/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.premises.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting premises:", error);
    return NextResponse.json({ error: "Failed to delete premises" }, { status: 500 });
  }
}
