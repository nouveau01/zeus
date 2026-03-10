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

    const twilioConfigured = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_API_KEY_SID &&
      process.env.TWILIO_API_KEY_SECRET &&
      process.env.TWILIO_TWIML_APP_SID
    );

    return NextResponse.json({
      authRequired: process.env.AUTH_REQUIRED !== "false",
      softphoneEnabled: process.env.SOFTPHONE_ENABLED === "true",
      twilioConfigured,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
      twilioWebhookUrl: process.env.TWILIO_WEBHOOK_URL || "",
      callRecording: process.env.CALL_RECORDING_ENABLED === "true",
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
      }
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

    // Persist env vars to .env
    if (Object.keys(envUpdates).length > 0) {
      try {
        const envPath = path.resolve(process.cwd(), ".env");
        let envContent = fs.readFileSync(envPath, "utf-8");

        for (const [key, value] of Object.entries(envUpdates)) {
          const regex = new RegExp(`${key}="[^"]*"`);
          if (envContent.match(regex)) {
            envContent = envContent.replace(regex, `${key}="${value}"`);
          } else {
            envContent += `\n${key}="${value}"`;
          }
        }

        fs.writeFileSync(envPath, envContent, "utf-8");
      } catch (fsError) {
        console.error("Could not persist settings to .env:", fsError);
      }
    }

    const twilioConfigured = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_API_KEY_SID &&
      process.env.TWILIO_API_KEY_SECRET &&
      process.env.TWILIO_TWIML_APP_SID
    );

    return NextResponse.json({
      authRequired: process.env.AUTH_REQUIRED !== "false",
      softphoneEnabled: process.env.SOFTPHONE_ENABLED === "true",
      twilioConfigured,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || "",
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || "",
      twilioWebhookUrl: process.env.TWILIO_WEBHOOK_URL || "",
      callRecording: process.env.CALL_RECORDING_ENABLED === "true",
    });
  } catch (error) {
    console.error("Error updating system settings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
