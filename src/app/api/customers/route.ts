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
    const { name, accountNumber, phone, email, website, type, balance } = body;

    if (!name) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        accountNumber: accountNumber || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
        type: type || "General",
        balance: balance || 0,
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
