import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionOrBypass } from "@/lib/auth";
import { trackChanges } from "@/lib/audit";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
    });
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
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
    const existing = await prisma.vendor.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const body = await request.json();
    const vendor = await prisma.vendor.update({
      where: { id: params.id },
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
        type: body.type || undefined,
        status: body.status === "Inactive" ? 0 : body.status === "Active" ? 1 : undefined,
        is1099: body.is1099 !== undefined ? (body.is1099 ? 1 : 0) : undefined,
        fid: body.fedId || body.fid || null,
        acctNumber: body.acctNumber || null,
        shipVia: body.shipVia || null,
        defaultBank: body.desiredBank || body.defaultBank || null,
        terms: body.terms !== undefined ? parseInt(body.terms) : undefined,
        discPercent: body.discount !== undefined ? parseFloat(body.discount) : undefined,
        discDays: body.ifPaidIn !== undefined ? parseInt(body.ifPaidIn) : undefined,
        bankAcctNo: body.bankAccountNumber || body.bankAcctNo || null,
        routeNo: body.bankRouteNumber || body.routeNo || null,
        transCode: body.bankAcctType === "Savings" ? 2 : body.bankAcctType === "Checking" ? 1 : undefined,
        custom1: body.custom1,
        custom2: body.custom2,
        custom3: body.custom3,
        custom4: body.custom4,
        custom5: body.custom5,
        custom6: body.custom6,
        custom7: body.custom7,
        isActive: body.status === "Inactive" ? false : body.status === "Active" ? true : undefined,
      },
    });
    trackChanges("Vendor", params.id, existing as any, vendor as any, session?.user);

    return NextResponse.json(vendor);
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json(
      { error: "Failed to update vendor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.vendor.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    );
  }
}
