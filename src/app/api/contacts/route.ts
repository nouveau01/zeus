import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";
import { getOfficeScope, parseOfficeFilter } from "@/lib/officeScope";

// GET /api/contacts - List all contacts
export async function GET(request: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user as any;
    const filteredIds = parseOfficeFilter(request);
    const scope = await getOfficeScope(user.id, user.profile, filteredIds);

    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId");
    const search = searchParams.get("search");

    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { title: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (!scope.allOffices) {
      where.customer = {
        ...(where.customer || {}),
        premises: { some: { OR: [{ officeId: { in: scope.officeIds } }, { officeId: null }] } },
      };
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    const mapped = contacts.map((c) => ({
      ...c,
      customerName: c.customer?.name || "",
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

// POST /api/contacts - Create new contact
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.customerId) {
      return NextResponse.json({ error: "Customer is required" }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        name: body.name || "",
        title: body.title || null,
        phone: body.phone || null,
        fax: body.fax || null,
        mobile: body.mobile || null,
        email: body.email || null,
        linkedinUrl: body.linkedinUrl || null,
        inv: body.inv === true,
        es: body.es === true,
        customerId: body.customerId,
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      ...contact,
      customerName: contact.customer?.name || "",
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
