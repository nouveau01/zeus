import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import { getOfficeScope, parseOfficeFilter, premisesOfficeWhere } from "@/lib/officeScope";
import prisma from "@/lib/db";

// GET /api/premises
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;
    const filteredIds = parseOfficeFilter(request);
    const scope = await getOfficeScope(user.id, user.role, filteredIds);

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter");

    const premises = await prisma.premises.findMany({
      where: {
        ...premisesOfficeWhere(scope),
      },
      orderBy: { premisesId: "asc" },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { units: true, jobs: true },
        },
      },
    });

    return NextResponse.json(premises);
  } catch (error) {
    console.error("Error fetching premises:", error);
    return NextResponse.json({ error: "Failed to fetch premises" }, { status: 500 });
  }
}

// POST /api/premises
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      premisesId,
      name,
      address,
      city,
      state,
      zipCode,
      type,
      isActive,
      balance,
      customerId,
      officeId,
    } = body;

    if (!address) {
      return NextResponse.json({ error: "Address is required" }, { status: 400 });
    }

    const premises = await prisma.premises.create({
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
        customerId: customerId || undefined,
        officeId: officeId || undefined,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { units: true, jobs: true },
        },
      },
    });

    return NextResponse.json(premises, { status: 201 });
  } catch (error: any) {
    console.error("Error creating premises:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Account ID already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create premises" }, { status: 500 });
  }
}
