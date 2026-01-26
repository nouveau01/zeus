import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");
    const status = searchParams.get("status");

    const where: any = {};
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = parseInt(status);

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            acct: true,
          },
        },
      },
      orderBy: { fDate: "desc" },
    });
    return NextResponse.json(purchaseOrders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Get next PO number
    const lastPO = await prisma.purchaseOrder.findFirst({
      orderBy: { poNumber: "desc" },
    });
    const nextPONumber = (lastPO?.poNumber || 80000000) + 1;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber: nextPONumber,
        fDate: body.date ? new Date(body.date) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        fDesc: body.description || null,
        amount: body.total || 0,
        status: body.status === "Open" ? 0 : body.status === "Closed" ? 2 : 0,
        shipVia: body.shipVia || null,
        terms: body.terms ? parseInt(body.terms) : null,
        fob: body.fob || null,
        shipTo: body.shipTo || null,
        approved: body.approved ? 1 : 0,
        fBy: body.createdBy || null,
        custom1: body.custom1 || null,
        custom2: body.custom2 || null,
        vendorId: body.vendorId || null,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return NextResponse.json(purchaseOrder);
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json(
      { error: "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
