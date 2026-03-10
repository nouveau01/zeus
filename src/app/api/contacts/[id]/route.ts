import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionOrBypass } from "@/lib/auth";
import { trackChanges } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
    });
    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionOrBypass();
    const existing = await prisma.contact.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    const body = await request.json();
    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        name: body.name,
        title: body.title || null,
        phone: body.phone || null,
        fax: body.fax || null,
        mobile: body.mobile || null,
        email: body.email || null,
        inv: body.inv ?? false,
        es: body.es ?? false,
      },
    });
    trackChanges("Contact", params.id, existing as any, contact as any, session?.user);

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.contact.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
