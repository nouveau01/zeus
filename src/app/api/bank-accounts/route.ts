import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/bank-accounts - List all bank accounts
export async function GET(request: NextRequest) {
  try {
    const bankAccounts = await prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(bankAccounts);
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json({ error: "Failed to fetch bank accounts" }, { status: 500 });
  }
}

// POST /api/bank-accounts - Create a new bank account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, accountNumber, type } = body;

    const bankAccount = await prisma.bankAccount.create({
      data: {
        name,
        accountNumber,
        type: type || "Checking",
      },
    });

    return NextResponse.json(bankAccount, { status: 201 });
  } catch (error) {
    console.error("Error creating bank account:", error);
    return NextResponse.json({ error: "Failed to create bank account" }, { status: 500 });
  }
}
