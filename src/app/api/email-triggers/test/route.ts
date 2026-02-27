import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

// POST — send a test email to verify SMTP configuration
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "Admin" && role !== "GodAdmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const to = body.to || (session.user as any)?.email;

  if (!to) {
    return NextResponse.json({ error: "No recipient email" }, { status: 400 });
  }

  // Allow custom subject/html from template editor, fall back to defaults
  const emailSubject = body.subject || "ZEUS Test Email";
  const emailHtml = body.html || `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e3a5f; border-bottom: 2px solid #316ac5; padding-bottom: 8px;">ZEUS Email Test</h2>
        <p>This is a test email from ZEUS. If you're seeing this, your email configuration is working correctly.</p>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">Sent at: ${new Date().toLocaleString()}</p>
      </div>
    `;

  const success = await sendEmail({
    to,
    subject: emailSubject,
    html: emailHtml,
  });

  if (success) {
    return NextResponse.json({ message: `Test email sent to ${to}` });
  } else {
    return NextResponse.json({ error: "Failed to send email. Check SMTP configuration in Settings." }, { status: 500 });
  }
}
