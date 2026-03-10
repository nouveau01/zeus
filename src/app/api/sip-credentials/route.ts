import { NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";

// GET /api/sip-credentials — return SIP extension/password for current user
// In production, these would come from a database table mapping users to SIP extensions.
// For now, returns env-configured defaults or empty if not configured.
export async function GET() {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;

    // Check for user-specific extension env vars: SIP_EXT_<userId> or fall back to default
    const extension = process.env[`SIP_EXT_${user?.id}`]
      || process.env.SIP_DEFAULT_EXTENSION
      || "";
    const password = process.env[`SIP_PASS_${user?.id}`]
      || process.env.SIP_DEFAULT_PASSWORD
      || "";

    if (!extension) {
      return NextResponse.json({
        extension: "",
        password: "",
        configured: false,
      });
    }

    return NextResponse.json({
      extension,
      password,
      configured: true,
    });
  } catch (error) {
    console.error("Error fetching SIP credentials:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
