import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    const where = type && type !== "All" ? { type } : {};

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { premises: true, jobs: true },
        },
        premises: {
          include: {
            _count: {
              select: { units: true },
            },
          },
        },
      },
    });

    // Calculate total units for each customer
    const customersWithUnits = customers.map((customer) => {
      const totalUnits = customer.premises.reduce(
        (sum, premise) => sum + premise._count.units,
        0
      );
      return {
        ...customer,
        totalUnits,
        totalAccounts: customer._count.premises,
      };
    });

    return NextResponse.json(customersWithUnits);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        accountNumber: body.accountNumber || null,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zipCode: body.zipCode || null,
        country: body.country || "United States",
        contact: body.contact || null,
        phone: body.phone || null,
        fax: body.fax || null,
        cellular: body.cellular || null,
        email: body.email || null,
        website: body.website || null,
        type: body.type || "General",
        isActive: body.isActive !== undefined ? body.isActive : true,
        billing: body.billing || "Individual",
        custom1: body.custom1 || null,
        custom2: body.custom2 || null,
        balance: body.balance || 0,
        portalAccess: body.portalAccess || false,
        remarks: body.remarks || null,
        salesRemarks: body.salesRemarks || null,
        currentYearSales: body.currentYearSales || 0,
        priorYearSales: body.priorYearSales || 0,
      },
      include: {
        premises: true,
        contacts: true,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Account number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
