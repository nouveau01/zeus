import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/company-settings - Fetch company settings (singleton)
export async function GET() {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let settings = await prisma.companySettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.companySettings.create({
        data: { id: "singleton" },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return NextResponse.json({ error: "Failed to fetch company settings" }, { status: 500 });
  }
}

// PUT /api/company-settings - Update company settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = (session.user as any)?.profile;
    if (!profile || !["Admin", "GodAdmin"].includes(profile)) {
      return NextResponse.json({ error: "Unauthorized — Admin only" }, { status: 403 });
    }

    const body = await request.json();

    const data: any = {};
    if (body.companyName !== undefined) data.companyName = body.companyName;
    if (body.companySubtitle !== undefined) data.companySubtitle = body.companySubtitle;
    if (body.address !== undefined) data.address = body.address;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.fax !== undefined) data.fax = body.fax;
    if (body.website !== undefined) data.website = body.website;
    if (body.logoBase64 !== undefined) data.logoBase64 = body.logoBase64;
    if (body.logoUrl !== undefined) data.logoUrl = body.logoUrl;
    if (body.removeLogoBg !== undefined) data.removeLogoBg = body.removeLogoBg;
    if (body.themeMode !== undefined) data.themeMode = body.themeMode;
    if (body.brandColor !== undefined) data.brandColor = body.brandColor;
    if (body.extractedColors !== undefined) data.extractedColors = body.extractedColors;

    const settings = await prisma.companySettings.upsert({
      where: { id: "singleton" },
      update: data,
      create: { id: "singleton", ...data },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating company settings:", error);
    return NextResponse.json({ error: "Failed to update company settings" }, { status: 500 });
  }
}
