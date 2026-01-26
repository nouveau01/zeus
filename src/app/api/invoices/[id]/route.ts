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

    // Map schema fields to frontend-friendly names
    const mapped = {
      ...invoice,
      invoiceNumber: invoice.invoiceNumber,
      postingDate: invoice.iDate,
      date: invoice.fDate,
      description: invoice.fDesc,
      jobRemarks: invoice.remarks,
      poNumber: invoice.po,
      priceLevel: invoice.pricing,
      taxRegion1: invoice.taxRegion,
      taxRate1: invoice.taxRate,
      salesTax: invoice.sTax,
      subTotal: Number(invoice.amount),
      nonTaxable: Number(invoice.total) - Number(invoice.taxable) - Number(invoice.sTax),
      remainingUnpaid: Number(invoice.total), // Would need payment tracking
    };

    return NextResponse.json(mapped);
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
      status,
      description,
      jobRemarks,
      taxRegion1,
      taxRate1,
      taxRegion2,
      taxRate2,
      taxFactor,
      premisesId,
      jobId,
      items,
    } = body;

    // Calculate totals from items if provided
    let taxableAmount = 0;
    let nonTaxableAmount = 0;

    if (items && items.length > 0) {
      items.forEach((item: any) => {
        const amount = parseFloat(item.amount) || 0;
        if (item.tax) {
          taxableAmount += amount;
        } else {
          nonTaxableAmount += amount;
        }
      });
    }

    const subTotal = taxableAmount + nonTaxableAmount;
    const calculatedTax = taxableAmount * (parseFloat(taxRate1) || 0.08875);
    const total = subTotal + calculatedTax;

    // Delete existing items and recreate if items provided
    if (items) {
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: params.id },
      });
    }

    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        date: date ? new Date(date) : undefined,
        postingDate: postingDate ? new Date(postingDate) : undefined,
        fDate: date ? new Date(date) : undefined,
        iDate: postingDate ? new Date(postingDate) : undefined,
        type: type || undefined,
        terms: terms || undefined,
        pricing: priceLevel ? parseInt(priceLevel) : undefined,
        po: poNumber || undefined,
        poNumber: poNumber || undefined,
        status: status || undefined,
        fDesc: description,
        description: description,
        remarks: jobRemarks,
        taxRegion: taxRegion1 || undefined,
        taxRate: taxRate1 !== undefined ? taxRate1 : undefined,
        taxRegion2: taxRegion2 || undefined,
        taxRate2: taxRate2 !== undefined ? taxRate2 : undefined,
        taxFactor: taxFactor !== undefined ? taxFactor : undefined,
        taxable: taxableAmount,
        amount: subTotal,
        subTotal: subTotal,
        sTax: calculatedTax,
        total: total,
        premisesId: premisesId || undefined,
        jobId: jobId || undefined,
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

    // Map response to frontend-friendly names
    const mapped = {
      ...invoice,
      postingDate: invoice.iDate,
      date: invoice.fDate,
      description: invoice.fDesc,
      jobRemarks: invoice.remarks,
      poNumber: invoice.po,
      priceLevel: invoice.pricing,
      taxRegion1: invoice.taxRegion,
      taxRate1: invoice.taxRate,
      salesTax: invoice.sTax,
      subTotal: Number(invoice.amount),
    };

    return NextResponse.json(mapped);
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
