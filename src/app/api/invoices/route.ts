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
    const premisesId = searchParams.get("premisesId");

    // Build where clause
    const where: any = {};

    // Premises filter (for filtering by account)
    if (premisesId) {
      where.premisesId = premisesId;
    }

    // Date range filter (use fDate - the invoice date)
    if (startDate || endDate) {
      where.fDate = {};
      if (startDate) {
        where.fDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.fDate.lte = new Date(endDate);
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

    // Map to frontend-friendly field names
    const mapped = invoices.map((inv) => ({
      ...inv,
      date: inv.fDate,
      postingDate: inv.iDate,
      description: inv.fDesc,
      poNumber: inv.po,
      salesTax: inv.sTax,
      subTotal: inv.amount,
    }));

    return NextResponse.json(mapped);
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
    const salesTax = taxableAmount * 0.08875; // NYC sales tax rate as example
    const total = subTotal + salesTax;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: nextInvoiceNumber,
        date: date ? new Date(date) : new Date(),
        postingDate: postingDate ? new Date(postingDate) : new Date(),
        fDate: date ? new Date(date) : new Date(),
        iDate: postingDate ? new Date(postingDate) : new Date(),
        type: type || "Other",
        terms: terms || "Net 30 Days",
        pricing: priceLevel ? parseInt(priceLevel) : null,
        po: poNumber || null,
        poNumber: poNumber || null,
        status: status || "Open",
        fDesc: description || null,
        description: description || null,
        taxable: taxableAmount,
        amount: subTotal,
        subTotal: subTotal,
        sTax: salesTax,
        total: total,
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

    // Map to frontend-friendly field names
    const mapped = {
      ...invoice,
      date: invoice.fDate,
      postingDate: invoice.iDate,
      description: invoice.fDesc,
      poNumber: invoice.po,
      salesTax: invoice.sTax,
      subTotal: invoice.amount,
    };

    return NextResponse.json(mapped, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 });
  }
}
