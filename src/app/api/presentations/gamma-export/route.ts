import { NextRequest } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";

/**
 * Server-side proxy to download PPTX from the presentation engine.
 * The user never sees or interacts with Gamma directly.
 *
 * Two modes:
 * 1. POST { downloadUrl } — direct download from a pre-signed URL (fast)
 * 2. POST { generationId } — poll until export URL is ready, then download
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { generationId, downloadUrl, filename } = await request.json();

    // Mode 1: Direct download from pre-signed URL
    if (downloadUrl && typeof downloadUrl === "string") {
      const pptxRes = await fetch(downloadUrl);
      if (!pptxRes.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to download presentation file." }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      const pptxBuffer = await pptxRes.arrayBuffer();
      const safeName = (filename || "presentation").replace(/[^a-zA-Z0-9_\- ]/g, "") + ".pptx";

      return new Response(pptxBuffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="${safeName}"`,
          "Content-Length": String(pptxBuffer.byteLength),
        },
      });
    }

    // Mode 2: Poll generation for download URL, then download
    if (!generationId) {
      return new Response(
        JSON.stringify({ error: "generationId or downloadUrl is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const integrationSettings = await prisma.integrationSettings.findUnique({
      where: { id: "singleton" },
    });
    const apiKey = integrationSettings?.presentationApiKey;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Presentation API key is not configured." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Poll for the download link (max 60 seconds)
    let exportUrl: string | undefined;

    for (let i = 0; i < 30; i++) {
      const pollRes = await fetch(`https://public-api.gamma.app/v1.0/generations/${generationId}`, {
        headers: { "X-API-KEY": apiKey },
      });

      if (pollRes.ok) {
        const data = await pollRes.json();

        if (data.status === "completed") {
          // Look for download URL in various field names
          exportUrl = data.downloadLink || data.pptxUrl || data.exportUrl;

          // Scan all string values for export URL pattern
          if (!exportUrl) {
            for (const [, val] of Object.entries(data)) {
              if (typeof val === "string" && val.includes("assets.api.gamma.app/export/pptx/")) {
                exportUrl = val;
                break;
              }
            }
          }

          if (exportUrl) break;
        } else if (data.status !== "pending") {
          return new Response(
            JSON.stringify({ error: `Generation failed: ${data.status}` }),
            { status: 502, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!exportUrl) {
      return new Response(
        JSON.stringify({ error: "PPTX export is not ready yet. Try again in a moment." }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      );
    }

    // Download the PPTX from the pre-signed URL
    const pptxRes = await fetch(exportUrl);
    if (!pptxRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to download the presentation file." }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    const pptxBuffer = await pptxRes.arrayBuffer();
    const safeName = (filename || "presentation").replace(/[^a-zA-Z0-9_\- ]/g, "") + ".pptx";

    return new Response(pptxBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(pptxBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("Gamma export proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to export presentation." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
