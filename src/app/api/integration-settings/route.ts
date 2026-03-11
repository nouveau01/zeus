import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass, hasProfile } from "@/lib/auth";
import prisma from "@/lib/db";

async function requireAdmin() {
  const session = await getSessionOrBypass();
  if (!session?.user) return null;
  const profile = (session.user as any)?.profile;
  if (!hasProfile(profile, "Admin")) return null;
  return session;
}

// GET /api/integration-settings
export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let settings = await prisma.integrationSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings) {
      settings = await prisma.integrationSettings.create({
        data: { id: "singleton" },
      });
    }

    // Mask API key for display
    return NextResponse.json({
      presentationProvider: settings.presentationProvider,
      presentationApiKey: settings.presentationApiKey
        ? "••••••••" + settings.presentationApiKey.slice(-4)
        : "",
      presentationApiKeySet: !!settings.presentationApiKey,
      presentationApiUrl: settings.presentationApiUrl,
    });
  } catch (error) {
    console.error("Error fetching integration settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/integration-settings
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.presentationProvider !== undefined) {
      updateData.presentationProvider = body.presentationProvider;
    }
    if (body.presentationApiKey !== undefined) {
      // Only update if it's not the masked value
      if (!body.presentationApiKey.startsWith("••••")) {
        updateData.presentationApiKey = body.presentationApiKey;
      }
    }
    if (body.presentationApiUrl !== undefined) {
      updateData.presentationApiUrl = body.presentationApiUrl;
    }

    const settings = await prisma.integrationSettings.upsert({
      where: { id: "singleton" },
      update: updateData,
      create: { id: "singleton", ...updateData },
    });

    return NextResponse.json({
      presentationProvider: settings.presentationProvider,
      presentationApiKey: settings.presentationApiKey
        ? "••••••••" + settings.presentationApiKey.slice(-4)
        : "",
      presentationApiKeySet: !!settings.presentationApiKey,
      presentationApiUrl: settings.presentationApiUrl,
    });
  } catch (error) {
    console.error("Error updating integration settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
