import { NextResponse } from "next/server";
import { getAuthMode } from "@/lib/auth";

// GET /api/auth-mode — PUBLIC (no auth required, login page needs this)
export async function GET() {
  return NextResponse.json({ mode: getAuthMode() });
}
