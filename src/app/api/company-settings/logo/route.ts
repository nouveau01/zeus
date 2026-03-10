import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// Serves the company logo as an image (publicly accessible for Gamma API)
export async function GET() {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: "singleton" },
      select: { logoBase64: true },
    });

    const logo = settings?.logoBase64;
    if (!logo) {
      return new NextResponse(null, { status: 404 });
    }

    // Parse data URL: "data:image/png;base64,iVBOR..."
    const match = logo.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!match) {
      return new NextResponse(null, { status: 404 });
    }

    const mimeType = match[1]; // png, jpeg, etc.
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, "base64");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": `image/${mimeType}`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
