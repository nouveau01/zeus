import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionOrBypass } from "@/lib/auth";
import { trackChanges } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        vendor: true,
      },
    });
    if (!purchaseOrder) {
      return NextResponse.json(
        { error: "Purchase order not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(purchaseOrder);
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase order" },
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
    const existing = await prisma.purchaseOrder.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    const body = await request.json();
    const purchaseOrder = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        fDate: body.date ? new Date(body.date) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        fDesc: body.description,
        amount: body.total !== undefined ? parseFloat(body.total) : undefined,
        status: body.status === "Open" ? 0 : body.status === "Closed" ? 2 : body.status === "Partial D" ? 1 : undefined,
        shipVia: body.shipVia,
        terms: body.terms !== undefined ? parseInt(body.terms) : undefined,
        fob: body.fob,
        shipTo: body.shipTo,
        approved: body.approved !== undefined ? (body.approved ? 1 : 0) : undefined,
        fBy: body.createdBy,
        custom1: body.custom1,
        custom2: body.custom2,
        vendorId: body.vendorId,
      },
      include: {
        vendor: true,
      },
    });
    trackChanges("Purchase Order", params.id, existing as any, purchaseOrder as any, session?.user);

    return NextResponse.json(purchaseOrder);
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json(
      { error: "Failed to update purchase order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.purchaseOrder.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json(
      { error: "Failed to delete purchase order" },
      { status: 500 }
    );
  }
}
