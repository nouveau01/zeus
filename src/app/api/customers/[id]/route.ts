import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/customers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        premises: {
          include: {
            _count: {
              select: { units: true },
            },
          },
        },
        contacts: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

// PUT /api/customers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      accountNumber,
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
      billing,
      custom1,
      custom2,
      balance,
      portalAccess,
      remarks,
      salesRemarks,
      currentYearSales,
      priorYearSales,
    } = body;

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name,
        accountNumber: accountNumber || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        country: country || null,
        contact: contact || null,
        phone: phone || null,
        fax: fax || null,
        cellular: cellular || null,
        email: email || null,
        website: website || null,
        type: type || "General",
        isActive: isActive ?? true,
        billing: billing || "Individual",
        custom1: custom1 || null,
        custom2: custom2 || null,
        balance: balance || 0,
        portalAccess: portalAccess ?? false,
        remarks: remarks || null,
        salesRemarks: salesRemarks || null,
        currentYearSales: currentYearSales || 0,
        priorYearSales: priorYearSales || 0,
      },
      include: {
        premises: {
          include: {
            _count: {
              select: { units: true },
            },
          },
        },
        contacts: {
          orderBy: { name: "asc" },
        },
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error("Error updating customer:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Account number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

// DELETE /api/customers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
