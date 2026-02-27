import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { getOfficeScope, parseOfficeFilter } from "@/lib/officeScope";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user as any;
    const filteredIds = parseOfficeFilter(request);
    const scope = await getOfficeScope(user.id, user.role, filteredIds);

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    const where: any = customerId ? { customerId } : {};

    if (!scope.allOffices) {
      where.customer = { ...(where.customer || {}), premises: { some: { OR: [{ officeId: { in: scope.officeIds } }, { officeId: null }] } } };
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const contact = await prisma.contact.create({
      data: {
        name: body.name,
        title: body.title || null,
        phone: body.phone || null,
        fax: body.fax || null,
        mobile: body.mobile || null,
        email: body.email || null,
        inv: body.inv || false,
        es: body.es || false,
        customerId: body.customerId,
      },
    });
    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
