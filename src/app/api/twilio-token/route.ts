import { NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import Twilio from "twilio";

const AccessToken = Twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

// GET /api/twilio-token — generate Twilio Access Token for browser Voice SDK
export async function GET() {
  try {
    const session = await getSessionOrBypass();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKeySid = process.env.TWILIO_API_KEY_SID;
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    if (!accountSid || !apiKeySid || !apiKeySecret || !twimlAppSid) {
      return NextResponse.json({ configured: false });
    }

    const user = session.user as any;
    const identity = user?.email?.replace(/[^a-zA-Z0-9_-]/g, "_") || "zeus-user";

    const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
      identity,
      ttl: 3600, // 1 hour
    });

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });

    token.addGrant(voiceGrant);

    return NextResponse.json({
      token: token.toJwt(),
      identity,
      configured: true,
    });
  } catch (error) {
    console.error("Error generating Twilio token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
