import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";
import { trackChanges } from "@/lib/audit";

// GET /api/contacts/[id] - Get single contact with relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            premises: {
              select: {
                id: true,
                premisesId: true,
                name: true,
                address: true,
                city: true,
                state: true,
                type: true,
                isActive: true,
                balance: true,
              },
              orderBy: { premisesId: "asc" },
            },
          },
        },
        opportunities: {
          orderBy: { opportunityNumber: "desc" },
          include: {
            premises: { select: { id: true, premisesId: true, name: true } },
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...contact,
      customerName: contact.customer?.name || "",
      accounts: (contact.customer?.premises || []).map((p) => ({
        ...p,
        balance: p.balance ? Number(p.balance) : 0,
      })),
      opportunities: contact.opportunities.map((opp) => ({
        ...opp,
        estimatedValue: opp.estimatedValue ? Number(opp.estimatedValue) : null,
        accountName: opp.premises?.premisesId || opp.premises?.name || "",
      })),
    });
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json({ error: "Failed to fetch contact" }, { status: 500 });
  }
}

// PUT /api/contacts/[id] - Update contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await request.json();
    const data: any = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.title !== undefined) data.title = body.title || null;
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.fax !== undefined) data.fax = body.fax || null;
    if (body.mobile !== undefined) data.mobile = body.mobile || null;
    if (body.email !== undefined) data.email = body.email || null;
    if (body.linkedinUrl !== undefined) data.linkedinUrl = body.linkedinUrl || null;
    if (body.inv !== undefined) data.inv = body.inv === true;
    if (body.es !== undefined) data.es = body.es === true;
    if (body.customerId !== undefined) data.customerId = body.customerId || null;

    const contact = await prisma.contact.update({
      where: { id },
      data,
      include: {
        customer: { select: { id: true, name: true } },
      },
    });

    trackChanges("Contact", id, existing as any, contact as any, session?.user);

    return NextResponse.json({
      ...contact,
      customerName: contact.customer?.name || "",
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

// DELETE /api/contacts/[id] - Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.contact.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
