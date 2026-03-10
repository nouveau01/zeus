import { NextRequest, NextResponse } from "next/server";
import Twilio from "twilio";

const VoiceResponse = Twilio.twiml.VoiceResponse;

// POST /api/twilio-voice — TwiML webhook for outbound and incoming calls
// Twilio calls this URL when:
//   1. Browser makes an outbound call via device.connect()
//   2. Someone calls our Twilio phone number (incoming)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const to = formData.get("To") as string | null;
    const from = formData.get("From") as string | null;
    const callerId = process.env.TWILIO_PHONE_NUMBER || "";

    const twiml = new VoiceResponse();

    // Determine if this is outbound from browser or incoming from PSTN
    const isFromBrowser = from?.startsWith("client:");

    if (isFromBrowser && to) {
      // Outbound call from browser to a phone number or another client
      const dial = twiml.dial({ callerId });

      // Clean the number and check if it's a phone number
      const cleaned = to.replace(/[\s\-\(\)]/g, "");
      if (/^\+?\d{7,}$/.test(cleaned)) {
        // Phone number — ensure E.164 format
        const e164 = cleaned.startsWith("+") ? cleaned
          : cleaned.length === 10 ? `+1${cleaned}`
          : cleaned.length === 11 && cleaned.startsWith("1") ? `+${cleaned}`
          : `+${cleaned}`;
        dial.number(e164);
      } else {
        // Client identity (browser-to-browser)
        dial.client(to);
      }
    } else {
      // Incoming call from PSTN — route to browser client
      // Use a generic identity; in multi-user setup, you'd look up which user to ring
      const dial = twiml.dial();
      dial.client("zeus-user");
    }

    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Twilio voice webhook error:", error);
    const twiml = new VoiceResponse();
    twiml.say("An error occurred. Please try again.");
    return new NextResponse(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
