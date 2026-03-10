import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";
import { removeWhiteBackground, extractDominantColors } from "@/lib/logoProcessing";

// POST /api/company-settings/process-logo
// Processes the uploaded logo: removes background + extracts dominant colors
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { logoBase64, removeBackground } = await request.json();

    if (!logoBase64) {
      return NextResponse.json({ error: "No logo provided" }, { status: 400 });
    }

    // Parse base64 data URL
    const match = logoBase64.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const imageBuffer = Buffer.from(match[2], "base64");
    const result: { processedLogo?: string; extractedColors: string[] } = {
      extractedColors: [],
    };

    // Extract dominant colors from the original image
    result.extractedColors = await extractDominantColors(imageBuffer);

    // Remove background if requested
    if (removeBackground) {
      const transparentBuffer = await removeWhiteBackground(imageBuffer);
      result.processedLogo = `data:image/png;base64,${transparentBuffer.toString("base64")}`;
    }

    // Save extracted colors to DB
    await prisma.companySettings.upsert({
      where: { id: "singleton" },
      update: { extractedColors: JSON.stringify(result.extractedColors) },
      create: { id: "singleton", extractedColors: JSON.stringify(result.extractedColors) },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing logo:", error);
    return NextResponse.json({ error: "Failed to process logo" }, { status: 500 });
  }
}
