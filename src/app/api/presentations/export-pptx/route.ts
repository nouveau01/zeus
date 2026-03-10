import { NextRequest } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import PptxGenJS from "pptxgenjs";

interface SlideData {
  layout: string;
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  leftContent?: string;
  rightContent?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { slides, presentationName } = (await request.json()) as {
      slides: SlideData[];
      presentationName?: string;
    };

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return new Response(JSON.stringify({ error: "No slides provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pres = new PptxGenJS();
    pres.layout = "LAYOUT_16x9";
    pres.author = "ZEUS — Nouveau Elevator";
    pres.title = presentationName || "Presentation";

    for (const s of slides) {
      const slide = pres.addSlide();

      if (s.notes) {
        slide.addNotes(s.notes);
      }

      switch (s.layout) {
        case "title":
          slide.addText(s.title || "", {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 1.5,
            fontSize: 36,
            bold: true,
            color: "1a1a2e",
            align: "center",
          });
          if (s.subtitle) {
            slide.addText(s.subtitle, {
              x: 0.5,
              y: 3.2,
              w: 9,
              h: 0.8,
              fontSize: 18,
              color: "555555",
              align: "center",
            });
          }
          break;

        case "two-column":
          slide.addText(s.title || "", {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 0.7,
            fontSize: 24,
            bold: true,
            color: "1a1a2e",
          });
          slide.addText(s.leftContent || "", {
            x: 0.5,
            y: 1.3,
            w: 4.2,
            h: 3.8,
            fontSize: 14,
            color: "333333",
            valign: "top",
          });
          slide.addText(s.rightContent || "", {
            x: 5.0,
            y: 1.3,
            w: 4.2,
            h: 3.8,
            fontSize: 14,
            color: "333333",
            valign: "top",
          });
          break;

        case "bullets":
          slide.addText(s.title || "", {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 0.7,
            fontSize: 24,
            bold: true,
            color: "1a1a2e",
          });
          if (s.bullets && s.bullets.length > 0) {
            slide.addText(
              s.bullets.map((b) => ({
                text: b,
                options: { bullet: true, fontSize: 16, color: "333333", breakLine: true },
              })),
              { x: 0.8, y: 1.3, w: 8.4, h: 3.8, valign: "top" }
            );
          }
          if (s.body) {
            slide.addText(s.body, {
              x: 0.5,
              y: s.bullets?.length ? 4.2 : 1.3,
              w: 9,
              h: 1,
              fontSize: 14,
              color: "555555",
            });
          }
          break;

        default: // "content" and fallback
          slide.addText(s.title || "", {
            x: 0.5,
            y: 0.3,
            w: 9,
            h: 0.7,
            fontSize: 24,
            bold: true,
            color: "1a1a2e",
          });
          if (s.body) {
            slide.addText(s.body, {
              x: 0.5,
              y: 1.3,
              w: 9,
              h: 3.8,
              fontSize: 16,
              color: "333333",
              valign: "top",
            });
          }
          break;
      }
    }

    // Generate as base64 string (works in Node.js without fs writes)
    const base64 = (await pres.write({ outputType: "base64" })) as string;
    const buffer = Buffer.from(base64, "base64");

    const fileName = `${presentationName || "presentation"}.pptx`;

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("PPTX export error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate PPTX" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
