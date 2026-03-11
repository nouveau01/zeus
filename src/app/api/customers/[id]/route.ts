import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import { getOfficeScope, customerOfficeWhere } from "@/lib/officeScope";
import prisma from "@/lib/db";
import { trackChanges } from "@/lib/audit";

// GET /api/customers/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scope = await getOfficeScope(session.user.id, session.user.profile);

    const customer = await prisma.customer.findFirst({
      where: { id: params.id, ...customerOfficeWhere(scope) },
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
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scope = await getOfficeScope(session.user.id, session.user.profile);

    // Fetch existing record for access check + audit trail
    const existing = await prisma.customer.findFirst({
      where: { id: params.id, ...customerOfficeWhere(scope) },
    });
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

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
        billing: typeof billing === 'string'
          ? ({ "Individual": 0, "Consolidated": 1, "Corporate": 2 }[billing] ?? 0)
          : (billing ?? 0),
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

    trackChanges("Customer", params.id, existing as any, customer as any, session.user);

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
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const scope = await getOfficeScope(session.user.id, session.user.profile);

    // Access check
    const existing = await prisma.customer.findFirst({
      where: { id: params.id, ...customerOfficeWhere(scope) },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
