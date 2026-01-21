import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/invoices/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
        premises: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            externalId: true,
            jobName: true,
          },
        },
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

// PUT /api/invoices/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      postingDate,
      date,
      type,
      terms,
      priceLevel,
      poNumber,
      mechSales,
      creditReq,
      backup,
      status,
      description,
      premisesId,
      jobId,
      items,
    } = body;

    // Calculate totals from items if provided
    let taxable = 0;
    let nonTaxable = 0;

    if (items && items.length > 0) {
      items.forEach((item: any) => {
        const amount = parseFloat(item.amount) || 0;
        if (item.tax) {
          taxable += amount;
        } else {
          nonTaxable += amount;
        }
      });
    }

    const subTotal = taxable + nonTaxable;
    const salesTax = taxable * 0.08875;
    const total = subTotal + salesTax;

    // Determine remaining unpaid based on status
    let remainingUnpaid = total;
    if (status === "Paid") {
      remainingUnpaid = 0;
    } else if (status === "Void") {
      remainingUnpaid = 0;
    }

    // Delete existing items and recreate if items provided
    if (items) {
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      });
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        postingDate: postingDate ? new Date(postingDate) : undefined,
        date: date ? new Date(date) : undefined,
        type: type || undefined,
        terms: terms || undefined,
        priceLevel: priceLevel,
        poNumber: poNumber,
        mechSales: mechSales,
        creditReq: creditReq,
        backup: backup,
        status: status || undefined,
        description: description,
        taxable,
        nonTaxable,
        subTotal,
        salesTax,
        total,
        remainingUnpaid,
        premisesId: premisesId,
        jobId: jobId,
        items: items
          ? {
              create: items.map((item: any) => ({
                name: item.name,
                quantity: item.quantity || 1,
                description: item.description || null,
                tax: item.tax || false,
                price: item.price || 0,
                markupPercent: item.markupPercent || 0,
                amount: item.amount || 0,
                measure: item.measure || "Each",
                phase: item.phase || 0,
              })),
            }
          : undefined,
      },
      include: {
        premises: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            externalId: true,
            jobName: true,
          },
        },
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.invoice.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
