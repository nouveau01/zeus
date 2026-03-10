import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import Twilio from "twilio";
import fs from "fs";
import path from "path";

// POST /api/twilio-setup — Create Twilio API Key + TwiML App, save credentials
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountSid, authToken, phoneNumber, webhookUrl } = await request.json();

    if (!accountSid || !authToken || !phoneNumber) {
      return NextResponse.json({ error: "Account SID, Auth Token, and Phone Number are required." }, { status: 400 });
    }

    // Validate credentials by checking account
    let client: ReturnType<typeof Twilio>;
    try {
      client = Twilio(accountSid, authToken);
      await client.api.accounts(accountSid).fetch();
    } catch {
      return NextResponse.json({ error: "Invalid Twilio credentials. Check your Account SID and Auth Token." }, { status: 400 });
    }

    // Create API Key for generating Access Tokens
    let apiKey: { sid: string; secret: string };
    try {
      const key = await client.newKeys.create({ friendlyName: "ZEUS Softphone" });
      apiKey = { sid: key.sid, secret: key.secret };
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to create API Key: ${err.message}` }, { status: 500 });
    }

    // Create TwiML Application for voice routing
    let twimlAppSid: string;
    try {
      const voiceUrl = webhookUrl ? `${webhookUrl.replace(/\/$/, "")}/api/twilio-voice` : "";
      const app = await client.applications.create({
        friendlyName: "ZEUS Softphone",
        voiceMethod: "POST",
        voiceUrl: voiceUrl || undefined,
      });
      twimlAppSid = app.sid;
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to create TwiML App: ${err.message}` }, { status: 500 });
    }

    // Configure the phone number to use our TwiML App for incoming calls
    if (webhookUrl) {
      try {
        const numbers = await client.incomingPhoneNumbers.list({ phoneNumber });
        if (numbers.length > 0) {
          await client.incomingPhoneNumbers(numbers[0].sid).update({
            voiceApplicationSid: twimlAppSid,
          });
        }
      } catch (err) {
        console.warn("Could not configure phone number voice app:", err);
        // Non-fatal — outbound still works
      }
    }

    // Save all credentials to .env
    const envVars: Record<string, string> = {
      TWILIO_ACCOUNT_SID: accountSid,
      TWILIO_AUTH_TOKEN: authToken,
      TWILIO_API_KEY_SID: apiKey.sid,
      TWILIO_API_KEY_SECRET: apiKey.secret,
      TWILIO_TWIML_APP_SID: twimlAppSid,
      TWILIO_PHONE_NUMBER: phoneNumber,
    };
    if (webhookUrl) {
      envVars.TWILIO_WEBHOOK_URL = webhookUrl;
    }

    // Update process.env (takes effect immediately)
    for (const [key, value] of Object.entries(envVars)) {
      process.env[key] = value;
    }
    process.env.SOFTPHONE_ENABLED = "true";

    // Persist to .env file
    try {
      const envPath = path.resolve(process.cwd(), ".env");
      let envContent = fs.readFileSync(envPath, "utf-8");

      // Also ensure SOFTPHONE_ENABLED is true
      const allVars = { ...envVars, SOFTPHONE_ENABLED: "true" };

      for (const [key, value] of Object.entries(allVars)) {
        const regex = new RegExp(`${key}="[^"]*"`);
        if (envContent.match(regex)) {
          envContent = envContent.replace(regex, `${key}="${value}"`);
        } else {
          envContent += `\n${key}="${value}"`;
        }
      }

      fs.writeFileSync(envPath, envContent, "utf-8");
    } catch (fsError) {
      console.error("Could not persist Twilio settings to .env:", fsError);
    }

    return NextResponse.json({
      success: true,
      apiKeySid: apiKey.sid,
      twimlAppSid,
      message: webhookUrl
        ? "Twilio configured successfully! Softphone is ready."
        : "Twilio configured! Note: Set a Webhook URL to enable outbound and incoming calls.",
    });
  } catch (error: any) {
    console.error("Twilio setup error:", error);
    return NextResponse.json({
      error: error.message || "Setup failed. Check your Twilio credentials.",
    }, { status: 500 });
  }
}
