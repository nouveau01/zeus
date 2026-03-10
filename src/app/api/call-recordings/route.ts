import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import fs from "fs";
import path from "path";

const RECORDINGS_DIR = path.join(process.cwd(), "public", "uploads", "recordings");

// Ensure directory exists
function ensureDir() {
  if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
  }
}

// POST /api/call-recordings — upload a recording
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    ensureDir();

    const formData = await request.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = `${Date.now()}-${(session.user as any)?.id || "unknown"}.webm`;
    const filepath = path.join(RECORDINGS_DIR, filename);

    fs.writeFileSync(filepath, buffer);

    return NextResponse.json({
      success: true,
      filename,
      path: `/uploads/recordings/${filename}`,
    });
  } catch (error) {
    console.error("Error saving call recording:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/call-recordings — list recordings
export async function GET() {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    ensureDir();

    const files = fs.readdirSync(RECORDINGS_DIR)
      .filter((f) => f.endsWith(".webm"))
      .sort((a, b) => b.localeCompare(a)) // newest first
      .slice(0, 100)
      .map((filename) => {
        const stat = fs.statSync(path.join(RECORDINGS_DIR, filename));
        return {
          filename,
          path: `/uploads/recordings/${filename}`,
          size: stat.size,
          createdAt: stat.birthtime.toISOString(),
        };
      });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error listing call recordings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
