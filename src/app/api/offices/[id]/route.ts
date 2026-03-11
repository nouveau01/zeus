import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass, hasProfile } from "@/lib/auth";
import prisma from "@/lib/db";

// PUT — Update an office (Admin+)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (!hasProfile(user.profile, "Admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const body = await req.json();
  const { code, name, isActive, address, city, state, zipCode, phone, email } = body;

  const data: any = {};
  if (code !== undefined) data.code = code.toUpperCase().trim();
  if (name !== undefined) data.name = name.trim();
  if (isActive !== undefined) data.isActive = isActive;
  if (address !== undefined) data.address = address?.trim() || null;
  if (city !== undefined) data.city = city?.trim() || null;
  if (state !== undefined) data.state = state?.trim() || null;
  if (zipCode !== undefined) data.zipCode = zipCode?.trim() || null;
  if (phone !== undefined) data.phone = phone?.trim() || null;
  if (email !== undefined) data.email = email?.trim() || null;

  try {
    const office = await prisma.office.update({
      where: { id },
      data,
    });
    return NextResponse.json(office);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: `Office code "${code}" already exists` }, { status: 409 });
    }
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Office not found" }, { status: 404 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
