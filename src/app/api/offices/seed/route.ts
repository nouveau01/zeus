import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

const DEFAULT_OFFICES = [
  { code: "NEI", name: "New York (HQ)" },
  { code: "N-CA", name: "California" },
  { code: "N-CT", name: "Connecticut" },
  { code: "N-DC", name: "Washington D.C." },
  { code: "N-MO", name: "Missouri" },
  { code: "N-MA", name: "Massachusetts" },
  { code: "N-IL", name: "Illinois" },
  { code: "N-TX", name: "Texas" },
  { code: "N-GA", name: "Georgia" },
  { code: "N-FL", name: "Florida" },
];

// POST — Seed default offices (GodAdmin only)
export async function POST(req: NextRequest) {
  const session = await getSessionOrBypass();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as any;
  if (user.profile !== "GodAdmin") {
    return NextResponse.json({ error: "GodAdmin only" }, { status: 403 });
  }

  const results = [];
  for (const office of DEFAULT_OFFICES) {
    try {
      const created = await prisma.office.upsert({
        where: { code: office.code },
        update: { name: office.name },
        create: { code: office.code, name: office.name },
      });
      results.push({ ...created, status: "ok" });
    } catch (e: any) {
      results.push({ code: office.code, name: office.name, status: "error", error: e.message });
    }
  }

  // Also assign GodAdmin user to all offices
  const godAdmins = await prisma.user.findMany({ where: { profile: "GodAdmin" } });
  const allOffices = await prisma.office.findMany();

  for (const admin of godAdmins) {
    for (const office of allOffices) {
      await prisma.userOffice.upsert({
        where: {
          userId_officeId: { userId: admin.id, officeId: office.id },
        },
        update: {},
        create: { userId: admin.id, officeId: office.id },
      });
    }
  }

  return NextResponse.json({
    offices: results,
    godAdminsAssigned: godAdmins.length,
  });
}
