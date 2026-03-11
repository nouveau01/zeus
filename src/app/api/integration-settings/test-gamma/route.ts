import { NextResponse } from "next/server";
import { getSessionOrBypass, hasProfile } from "@/lib/auth";
import prisma from "@/lib/db";

// POST /api/integration-settings/test-gamma — validate Gamma API key
export async function POST() {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const profile = (session.user as any)?.profile;
    if (!hasProfile(profile, "Admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const settings = await prisma.integrationSettings.findUnique({
      where: { id: "singleton" },
    });

    if (!settings?.presentationApiKey) {
      return NextResponse.json({ error: "No Gamma API key configured." }, { status: 400 });
    }

    // Test by listing themes (lightweight call)
    const res = await fetch("https://public-api.gamma.app/v1.0/themes", {
      headers: {
        "X-API-KEY": settings.presentationApiKey,
      },
    });

    if (res.ok) {
      return NextResponse.json({ success: true });
    } else if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ error: "Invalid API key. Check your Gamma credentials." }, { status: 400 });
    } else {
      return NextResponse.json({ error: `Gamma API returned ${res.status}. Try again later.` }, { status: 502 });
    }
  } catch (error) {
    console.error("Gamma test error:", error);
    return NextResponse.json({ error: "Failed to connect to Gamma." }, { status: 500 });
  }
}
