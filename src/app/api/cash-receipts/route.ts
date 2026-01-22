import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/cash-receipts - List cash receipts with filtering
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const bankAccountId = searchParams.get("bankAccountId");
    const fsCatalogue = searchParams.get("fsCatalogue");

    // Build where clause
    const where: any = {};

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    // Bank account filter
    if (bankAccountId && bankAccountId !== "all") {
      where.bankAccountId = bankAccountId;
    }

    // F&S Catalogue filter
    if (fsCatalogue && fsCatalogue !== "None") {
      where.fsCatalogue = fsCatalogue;
    }

    const cashReceipts = await prisma.cashReceipt.findMany({
      where,
      include: {
        bankAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(cashReceipts);
  } catch (error) {
    console.error("Error fetching cash receipts:", error);
    return NextResponse.json({ error: "Failed to fetch cash receipts" }, { status: 500 });
  }
}

// POST /api/cash-receipts - Create a new cash receipt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refNumber, date, description, amount, bankAccountId, fsCatalogue } = body;

    const cashReceipt = await prisma.cashReceipt.create({
      data: {
        refNumber,
        date: new Date(date),
        description,
        amount: amount || 0,
        bankAccountId,
        fsCatalogue,
      },
      include: {
        bankAccount: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return NextResponse.json(cashReceipt, { status: 201 });
  } catch (error) {
    console.error("Error creating cash receipt:", error);
    return NextResponse.json({ error: "Failed to create cash receipt" }, { status: 500 });
  }
}
