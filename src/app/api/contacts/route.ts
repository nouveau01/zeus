import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");

    const where = customerId ? { customerId } : {};

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
