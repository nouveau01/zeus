import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, hasRole, isAuthRequired } from "@/lib/auth";
import fs from "fs";
import path from "path";

// GET /api/system-settings — return current settings
export async function GET() {
  try {
    // Auth check only if auth is enabled
    if (isAuthRequired()) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const user = session.user as any;
      if (!hasRole(user.role, "Admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({
      authRequired: process.env.AUTH_REQUIRED !== "false",
    });
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/system-settings — update settings
export async function PUT(request: NextRequest) {
  try {
    // This route always requires auth (you shouldn't be able to toggle auth off without being logged in first)
    if (isAuthRequired()) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const user = session.user as any;
      if (!hasRole(user.role, "Admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();

    if (body.authRequired !== undefined) {
      const newValue = body.authRequired ? "true" : "false";

      // Update in-memory (takes effect immediately for this process)
      process.env.AUTH_REQUIRED = newValue;

      // Persist to .env file so it survives restarts
      try {
        const envPath = path.resolve(process.cwd(), ".env");
        let envContent = fs.readFileSync(envPath, "utf-8");

        if (envContent.includes("AUTH_REQUIRED=")) {
          envContent = envContent.replace(
            /AUTH_REQUIRED="[^"]*"/,
            `AUTH_REQUIRED="${newValue}"`
          );
        } else {
          envContent += `\n# Authentication toggle (true = require login, false = no login required)\nAUTH_REQUIRED="${newValue}"\n`;
        }

        fs.writeFileSync(envPath, envContent, "utf-8");
      } catch (fsError) {
        console.error("Could not persist to .env file:", fsError);
        // Still works in-memory even if file write fails
      }
    }

    return NextResponse.json({
      authRequired: process.env.AUTH_REQUIRED !== "false",
    });
  } catch (error) {
    console.error("Error updating system settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
