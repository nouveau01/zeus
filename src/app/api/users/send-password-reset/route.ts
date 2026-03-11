import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass, hasRole } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "@/lib/db";

// POST /api/users/send-password-reset — Admin sends temp password to a user
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRole((session.user as any).role, "Admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, isActive: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "Cannot send password to inactive user" }, { status: 400 });
    }

    // Generate 12-char temp password
    const tempPassword = crypto.randomBytes(9).toString("base64").slice(0, 12);
    const hashed = await bcrypt.hash(tempPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        mustResetPassword: true,
      },
    });

    // Try to send email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3003";
    const emailSent = await sendEmail({
      to: user.email,
      subject: "ZEUS — Your Temporary Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Welcome to ZEUS</h2>
          <p>Hello ${user.name},</p>
          <p>Your administrator has set up a password for your account. Use the temporary password below to sign in, then you'll be asked to set your own password.</p>
          <div style="background: #f5f5f5; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
            <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Temporary Password</div>
            <div style="font-size: 24px; font-weight: bold; font-family: monospace; letter-spacing: 2px; color: #333;">${tempPassword}</div>
          </div>
          <p><a href="${baseUrl}/login" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Sign In to ZEUS</a></p>
          <p style="color: #888; font-size: 12px; margin-top: 20px;">This temporary password must be changed on first login.</p>
        </div>
      `,
      text: `Hello ${user.name}, your temporary ZEUS password is: ${tempPassword} — Sign in at ${baseUrl}/login and set your permanent password.`,
    });

    return NextResponse.json({
      success: true,
      emailSent,
      // If email failed, admin can share the temp password manually
      ...(emailSent ? {} : { tempPassword }),
    });
  } catch (error) {
    console.error("Error sending password reset:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
