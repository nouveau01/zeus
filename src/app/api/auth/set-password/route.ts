import { NextRequest, NextResponse } from "next/server";
import { getSessionOrBypass } from "@/lib/auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

// POST /api/auth/set-password — Sets password for the current user
// Works in both authenticated and auth-bypass mode
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionOrBypass();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { newPassword } = await request.json();

    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        password: hashed,
        mustResetPassword: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
