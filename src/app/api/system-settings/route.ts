import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildAuthOptions, hasProfile, isAuthRequired, getAuthMode } from "@/lib/auth";
import fs from "fs";
import path from "path";

function persistEnvVar(key: string, value: string) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    let envContent = fs.readFileSync(envPath, "utf-8");
    const regex = new RegExp(`${key}="[^"]*"`);
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}="${value}"`);
    } else {
      envContent += `\n${key}="${value}"`;
    }
    fs.writeFileSync(envPath, envContent, "utf-8");
  } catch (fsError) {
    console.error(`Could not persist ${key} to .env:`, fsError);
  }
}

// GET /api/system-settings — return current settings
export async function GET() {
  try {
    if (isAuthRequired()) {
      const session = await getServerSession(buildAuthOptions());
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const user = session.user as any;
      if (!hasProfile(user.profile, "Admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const twilioConfigured = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_API_KEY_SID &&
      process.env.TWILIO_API_KEY_SECRET &&
      process.env.TWILIO_TWIML_APP_SID
    );

    const response = NextResponse.json({
      authMode: getAuthMode(),
      authRequired: isAuthRequired(), // backward compat
      softphoneEnabled: process.env.SOFTPHONE_ENABLED === "true",
      twilioConfigured,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
      twilioWebhookUrl: process.env.TWILIO_WEBHOOK_URL || "",
      callRecording: process.env.CALL_RECORDING_ENABLED === "true",
    });

    // Keep middleware cookie in sync with current auth mode
    response.cookies.set("__zeus_auth_mode", getAuthMode(), {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/system-settings — update settings
export async function PUT(request: NextRequest) {
  try {
    if (isAuthRequired()) {
      const session = await getServerSession(buildAuthOptions());
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const user = session.user as any;
      if (!hasProfile(user.profile, "Admin")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();

    // New authMode field (replaces legacy authRequired)
    if (body.authMode !== undefined) {
      const mode = body.authMode as string;
      process.env.AUTH_MODE = mode;

      // Also set legacy AUTH_REQUIRED for backward compat
      const legacyValue = mode === "none" ? "false" : "true";
      process.env.AUTH_REQUIRED = legacyValue;

      persistEnvVar("AUTH_MODE", mode);
      persistEnvVar("AUTH_REQUIRED", legacyValue);
    }

    // Legacy authRequired support (in case old UI calls it)
    if (body.authRequired !== undefined && body.authMode === undefined) {
      const newValue = body.authRequired ? "true" : "false";
      process.env.AUTH_REQUIRED = newValue;
      process.env.AUTH_MODE = body.authRequired ? "sso" : "none";
      persistEnvVar("AUTH_REQUIRED", newValue);
      persistEnvVar("AUTH_MODE", body.authRequired ? "sso" : "none");
    }

    // Softphone settings
    const envUpdates: Record<string, string> = {};

    if (body.softphoneEnabled !== undefined) {
      const val = body.softphoneEnabled ? "true" : "false";
      process.env.SOFTPHONE_ENABLED = val;
      envUpdates["SOFTPHONE_ENABLED"] = val;
    }
    if (body.callRecording !== undefined) {
      const val = body.callRecording ? "true" : "false";
      process.env.CALL_RECORDING_ENABLED = val;
      envUpdates["CALL_RECORDING_ENABLED"] = val;
    }
    if (body.twilioWebhookUrl !== undefined) {
      process.env.TWILIO_WEBHOOK_URL = body.twilioWebhookUrl;
      envUpdates["TWILIO_WEBHOOK_URL"] = body.twilioWebhookUrl;
    }

    // Persist remaining env vars
    for (const [key, value] of Object.entries(envUpdates)) {
      persistEnvVar(key, value);
    }

    const twilioConfigured = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_API_KEY_SID &&
      process.env.TWILIO_API_KEY_SECRET &&
      process.env.TWILIO_TWIML_APP_SID
    );

    const response = NextResponse.json({
      authMode: getAuthMode(),
      authRequired: isAuthRequired(),
      softphoneEnabled: process.env.SOFTPHONE_ENABLED === "true",
      twilioConfigured,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
      twilioWebhookUrl: process.env.TWILIO_WEBHOOK_URL || "",
      callRecording: process.env.CALL_RECORDING_ENABLED === "true",
    });

    // Set cookie so middleware (Edge Runtime) picks up auth mode changes immediately.
    // process.env in middleware is inlined at compile time and won't see runtime changes.
    if (body.authMode !== undefined || body.authRequired !== undefined) {
      response.cookies.set("__zeus_auth_mode", getAuthMode(), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
      });
    }

    return response;
  } catch (error) {
    console.error("Error updating system settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
