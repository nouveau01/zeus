import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass, hasProfile } from "@/lib/auth";
import prisma from "@/lib/db";

// GET — List all offices (any authenticated user), or get user's assigned offices with ?mine=true
export async function GET(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const mine = req.nextUrl.searchParams.get("mine");

  if (mine === "true") {
    const user = session.user as any;
    // GodAdmin sees all offices
    if (user.profile === "GodAdmin") {
      const offices = await prisma.office.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
      });
      return NextResponse.json(offices);
    }

    // Regular users see only their assigned offices
    const userOffices = await prisma.userOffice.findMany({
      where: { userId: user.id },
      include: { office: true },
    });
    const offices = userOffices
      .map((uo) => uo.office)
      .filter((o) => o.isActive)
      .sort((a, b) => a.code.localeCompare(b.code));
    return NextResponse.json(offices);
  }

  // Admin+ can list all offices
  const user = session.user as any;
  if (!hasProfile(user.profile, "Admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const offices = await prisma.office.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: { select: { users: true, premises: true } },
    },
  });

  return NextResponse.json(offices);
}

// POST — Create a new office (Admin+)
export async function POST(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (!hasProfile(user.profile, "Admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { code, name, address, city, state, zipCode, phone, email } = body;

  if (!code || !name) {
    return NextResponse.json({ error: "Code and name are required" }, { status: 400 });
  }

  try {
    const office = await prisma.office.create({
      data: {
        code: code.toUpperCase().trim(),
        name: name.trim(),
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        zipCode: zipCode?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
      },
    });
    return NextResponse.json(office);
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: `Office code "${code}" already exists` }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — Delete an office (GodAdmin only)
export async function DELETE(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.profile !== "GodAdmin") {
    return NextResponse.json({ error: "Only GodAdmin can delete offices" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Check if any premises are assigned to this office
  const premisesCount = await prisma.premises.count({ where: { officeId: id } });
  if (premisesCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${premisesCount} account(s) are assigned to this office. Reassign them first.` },
      { status: 409 }
    );
  }

  // Remove user assignments then delete
  await prisma.userOffice.deleteMany({ where: { officeId: id } });
  await prisma.office.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
