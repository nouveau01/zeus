import { NextRequest } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import prisma from "@/lib/db";
import JSZip from "jszip";
import sharp from "sharp";
import { removeWhiteBackground } from "@/lib/logoProcessing";

/**
 * Get the company logo as a PNG buffer, optionally with background removed.
 * Returns null if no logo is configured or processing fails.
 */
async function getLogoBuffer(): Promise<Buffer | null> {
  try {
    const settings = await prisma.companySettings.findUnique({
      where: { id: "singleton" },
    });
    if (!settings) return null;

    let buffer: Buffer | null = null;

    // Try URL first, then base64
    if (settings.logoUrl) {
      try {
        const res = await fetch(settings.logoUrl);
        if (res.ok) buffer = Buffer.from(await res.arrayBuffer());
      } catch {
        // URL fetch failed — try base64 fallback
      }
    }

    if (!buffer && settings.logoBase64) {
      const match = settings.logoBase64.match(/^data:[^;]+;base64,(.+)$/);
      if (match) buffer = Buffer.from(match[1], "base64");
    }

    if (!buffer) return null;

    // Remove white background if enabled
    if (settings.removeLogoBg) {
      buffer = await removeWhiteBackground(buffer);
    }

    // Ensure PNG format
    buffer = await sharp(buffer).png().toBuffer();
    return buffer;
  } catch (err) {
    console.error("Failed to get logo buffer:", err);
    return null;
  }
}

/**
 * Inject the company logo into every slide of a PPTX file.
 * PPTX files are ZIP archives containing XML — we add the logo image
 * to the media folder and modify each slide's XML to display it
 * in the top-left corner with correct aspect ratio.
 */
async function injectLogoIntoPptx(
  pptxBuffer: ArrayBuffer,
  logoBuffer: Buffer
): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(pptxBuffer);

  // Get logo dimensions for correct aspect ratio
  const meta = await sharp(logoBuffer).metadata();
  const imgW = meta.width || 200;
  const imgH = meta.height || 100;
  const logoAspect = imgW / imgH;

  // Standard 16:9 slide dimensions in EMU
  const slideW = 12192000; // 13.33 inches
  const slideH = 6858000;  // 7.5 inches
  const margin = 274320;   // ~0.3 inch margin from edges

  // 1. Add logo image to ppt/media/
  zip.file("ppt/media/nouveau_logo.png", logoBuffer);

  // 2. Ensure PNG content type is registered in [Content_Types].xml
  const ctXml = await zip.file("[Content_Types].xml")?.async("string");
  if (ctXml && !ctXml.includes('Extension="png"')) {
    zip.file(
      "[Content_Types].xml",
      ctXml.replace(
        "</Types>",
        '<Default Extension="png" ContentType="image/png"/></Types>'
      )
    );
  }

  // 3. Find all slide files
  const slideFiles = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort();

  // Helper: calculate overlap area between a rectangle and all content shapes
  function calcOverlap(
    lx: number, ly: number, lw: number, lh: number,
    shapes: { x: number; y: number; w: number; h: number }[]
  ): number {
    let total = 0;
    for (const s of shapes) {
      const ox = Math.max(0, Math.min(lx + lw, s.x + s.w) - Math.max(lx, s.x));
      const oy = Math.max(0, Math.min(ly + lh, s.y + s.h) - Math.max(ly, s.y));
      total += ox * oy;
    }
    return total;
  }

  for (let si = 0; si < slideFiles.length; si++) {
    const slidePath = slideFiles[si];
    const slideXml = await zip.file(slidePath)?.async("string");
    if (!slideXml) continue;

    // Skip if already injected
    if (slideXml.includes("NouveauLogo")) continue;

    const isFirstSlide = si === 0;

    // Logo size: 2.5 inches on title, 2 inches on content slides
    const logoW = isFirstSlide ? 2286000 : 1828800;
    const logoH = Math.round(logoW / logoAspect);

    let posX: number;
    let posY: number;

    if (isFirstSlide) {
      // Title slide: top-left, prominent
      posX = margin;
      posY = margin;
    } else {
      // Content slides: scan all shape positions, pick the corner with least overlap
      const shapes: { x: number; y: number; w: number; h: number }[] = [];
      const xfrmRegex = /<a:off x="(\d+)" y="(\d+)"\/>\s*<a:ext cx="(\d+)" cy="(\d+)"\/>/g;
      let m;
      while ((m = xfrmRegex.exec(slideXml)) !== null) {
        shapes.push({
          x: parseInt(m[1]), y: parseInt(m[2]),
          w: parseInt(m[3]), h: parseInt(m[4]),
        });
      }

      // Test all 4 corners
      const corners = [
        { x: margin, y: margin },                                           // top-left
        { x: slideW - logoW - margin, y: margin },                          // top-right
        { x: margin, y: slideH - logoH - margin },                          // bottom-left
        { x: slideW - logoW - margin, y: slideH - logoH - margin },         // bottom-right
      ];

      let bestCorner = corners[3]; // default bottom-right
      let bestOverlap = Infinity;

      for (const corner of corners) {
        const overlap = calcOverlap(corner.x, corner.y, logoW, logoH, shapes);
        if (overlap < bestOverlap) {
          bestOverlap = overlap;
          bestCorner = corner;
        }
      }

      posX = bestCorner.x;
      posY = bestCorner.y;
    }

    // 4. Add relationship entry for the logo image
    const slideNum = slidePath.match(/slide(\d+)/)?.[1];
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    let relsXml = await zip.file(relsPath)?.async("string");

    const relEntry =
      '<Relationship Id="rIdNouveauLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/nouveau_logo.png"/>';

    if (relsXml) {
      if (!relsXml.includes("rIdNouveauLogo")) {
        relsXml = relsXml.replace(
          "</Relationships>",
          relEntry + "</Relationships>"
        );
        zip.file(relsPath, relsXml);
      }
    } else {
      zip.file(
        relsPath,
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relEntry}</Relationships>`
      );
    }

    // 5. Build the picture element XML (OOXML PresentationML)
    const picXml = [
      "<p:pic>",
      "<p:nvPicPr>",
      '<p:cNvPr id="99999" name="NouveauLogo" descr="Company Logo"/>',
      "<p:cNvPicPr><a:picLocks noChangeAspect=\"1\"/></p:cNvPicPr>",
      "<p:nvPr/>",
      "</p:nvPicPr>",
      "<p:blipFill>",
      '<a:blip r:embed="rIdNouveauLogo"/>',
      "<a:stretch><a:fillRect/></a:stretch>",
      "</p:blipFill>",
      "<p:spPr>",
      "<a:xfrm>",
      `<a:off x="${posX}" y="${posY}"/>`,
      `<a:ext cx="${logoW}" cy="${logoH}"/>`,
      "</a:xfrm>",
      '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>',
      "</p:spPr>",
      "</p:pic>",
    ].join("");

    // 6. Insert before closing spTree tag
    const spTreeCloseMatch = slideXml.match(/<\/\w*:?spTree>/);
    if (spTreeCloseMatch) {
      const updated = slideXml.replace(
        spTreeCloseMatch[0],
        picXml + spTreeCloseMatch[0]
      );
      zip.file(slidePath, updated);
    }
  }

  return zip.generateAsync({ type: "arraybuffer" });
}

/**
 * Server-side proxy to download PPTX from the presentation engine.
 * The user never sees or interacts with Gamma directly.
 * After download, the company logo is injected onto every slide.
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

    let pptxBuffer: ArrayBuffer;

    // Mode 1: Direct download from pre-signed URL
    if (downloadUrl && typeof downloadUrl === "string") {
      const pptxRes = await fetch(downloadUrl);
      if (!pptxRes.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to download presentation file." }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }
      pptxBuffer = await pptxRes.arrayBuffer();

      // Mode 2: Poll generation for download URL, then download
    } else if (generationId) {
      const integrationSettings = await prisma.integrationSettings.findUnique({
        where: { id: "singleton" },
      });
      const apiKey = integrationSettings?.presentationApiKey;
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error: "Presentation API key is not configured.",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      let exportUrl: string | undefined;

      for (let i = 0; i < 30; i++) {
        const pollRes = await fetch(
          `https://public-api.gamma.app/v1.0/generations/${generationId}`,
          { headers: { "X-API-KEY": apiKey } }
        );

        if (pollRes.ok) {
          const data = await pollRes.json();

          if (data.status === "completed") {
            exportUrl =
              data.downloadLink || data.pptxUrl || data.exportUrl;

            // Scan all string values for export URL pattern
            if (!exportUrl) {
              for (const [, val] of Object.entries(data)) {
                if (
                  typeof val === "string" &&
                  val.includes("assets.api.gamma.app/export/pptx/")
                ) {
                  exportUrl = val;
                  break;
                }
              }
            }

            if (exportUrl) break;
          } else if (data.status !== "pending" && data.status !== "generating") {
            return new Response(
              JSON.stringify({
                error: `Generation failed: ${data.status}`,
              }),
              {
                status: 502,
                headers: { "Content-Type": "application/json" },
              }
            );
          }
        }

        await new Promise((r) => setTimeout(r, 2000));
      }

      if (!exportUrl) {
        return new Response(
          JSON.stringify({
            error: "PPTX export is not ready yet. Try again in a moment.",
          }),
          { status: 504, headers: { "Content-Type": "application/json" } }
        );
      }

      const pptxRes = await fetch(exportUrl);
      if (!pptxRes.ok) {
        return new Response(
          JSON.stringify({
            error: "Failed to download the presentation file.",
          }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }

      pptxBuffer = await pptxRes.arrayBuffer();
    } else {
      return new Response(
        JSON.stringify({ error: "generationId or downloadUrl is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Post-process: inject company logo onto every slide
    try {
      const logoBuffer = await getLogoBuffer();
      if (logoBuffer) {
        pptxBuffer = await injectLogoIntoPptx(pptxBuffer, logoBuffer);
      }
    } catch (err) {
      console.error("Logo injection failed (serving original PPTX):", err);
      // Non-fatal — serve the original PPTX without logo
    }

    const safeName =
      (filename || "presentation").replace(/[^a-zA-Z0-9_\- ]/g, "") + ".pptx";

    return new Response(pptxBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
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
