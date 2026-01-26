import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const vendor = await prisma.vendor.create({
      data: {
        acct: body.vendorId || body.acct,
        name: body.name,
        address: body.address || null,
        city: body.city || null,
        state: body.state || null,
        zipCode: body.zip || body.zipCode || null,
        contact: body.contact || null,
        phone: body.phone || null,
        fax: body.fax || null,
        email: body.email || null,
        website: body.webSite || body.website || null,
        remitAddress: body.remitTo || body.remitAddress || null,
        type: body.type || "General",
        status: body.status === "Inactive" ? 0 : 1,
        is1099: body.is1099 ? 1 : 0,
        fid: body.fedId || body.fid || null,
        acctNumber: body.acctNumber || null,
        shipVia: body.shipVia || null,
        defaultBank: body.desiredBank || body.defaultBank || null,
        terms: body.terms ? parseInt(body.terms) : null,
        discPercent: body.discount ? parseFloat(body.discount) : null,
        discDays: body.ifPaidIn ? parseInt(body.ifPaidIn) : null,
        bankAcctNo: body.bankAccountNumber || body.bankAcctNo || null,
        routeNo: body.bankRouteNumber || body.routeNo || null,
        transCode: body.bankAcctType === "Savings" ? 2 : 1,
        custom1: body.custom1 || null,
        custom2: body.custom2 || null,
        custom3: body.custom3 || null,
        custom4: body.custom4 || null,
        custom5: body.custom5 || null,
        custom6: body.custom6 || null,
        custom7: body.custom7 || null,
        isActive: body.status !== "Inactive",
      },
    });
    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Error creating vendor:", error);
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    );
  }
}
