import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/invoices - List all invoices with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Type filter (All, Maintenance, Modernization, Repair, Other)
    if (type && type !== "All") {
      where.type = type;
    }

    // Search filter (invoice number, account, or tag/address)
    if (search) {
      where.OR = [
        { invoiceNumber: { equals: parseInt(search) || -1 } },
        { premises: { premisesId: { contains: search, mode: "insensitive" } } },
        { premises: { address: { contains: search, mode: "insensitive" } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        premises: {
          select: {
            id: true,
            premisesId: true,
            address: true,
            city: true,
          },
        },
        job: {
          select: {
            id: true,
            externalId: true,
            jobName: true,
          },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { invoiceNumber: "asc" },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request: NextRequest) {
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

    // Get next invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      orderBy: { invoiceNumber: "desc" },
    });
    const nextInvoiceNumber = (lastInvoice?.invoiceNumber || 0) + 1;

    // Calculate totals from items
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
    const salesTax = taxable * 0.08875; // NYC sales tax rate as example
    const total = subTotal + salesTax;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: nextInvoiceNumber,
        postingDate: postingDate ? new Date(postingDate) : new Date(),
        date: date ? new Date(date) : new Date(),
        type: type || "Other",
        terms: terms || "Net 30 Days",
        priceLevel: priceLevel || null,
        poNumber: poNumber || null,
        mechSales: mechSales || null,
        creditReq: creditReq || null,
        backup: backup || null,
        status: status || "Open",
        description: description || null,
        taxable,
        nonTaxable,
        subTotal,
        salesTax,
        total,
        remainingUnpaid: total,
        premisesId: premisesId || null,
        jobId: jobId || null,
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
          select: {
            id: true,
            premisesId: true,
            address: true,
            city: true,
          },
        },
        job: {
          select: {
            id: true,
            externalId: true,
            jobName: true,
          },
        },
        items: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
