import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionOrBypass } from "@/lib/auth";
import { getOfficeScope, parseOfficeFilter, customerOfficeWhere } from "@/lib/officeScope";

// GET /api/accounts
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;
    const filteredIds = parseOfficeFilter(request);
    const scope = await getOfficeScope(user.id, user.role, filteredIds);

    const where: any = { ...customerOfficeWhere(scope) };

    const accounts = await prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { premises: true, jobs: true },
        },
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

// POST /api/accounts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, accountNumber, phone, email, website } = body;

    if (!name) {
      return NextResponse.json({ error: "Account name is required" }, { status: 400 });
    }

    const account = await prisma.customer.create({
      data: {
        name,
        accountNumber: accountNumber || null,
        phone: phone || null,
        email: email || null,
        website: website || null,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error: any) {
    console.error("Error creating account:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Account number already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
