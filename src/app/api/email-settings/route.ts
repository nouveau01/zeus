import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

// GET — fetch current SMTP settings (password masked)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "Admin" && role !== "GodAdmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let settings = await prisma.emailSettings.findUnique({
    where: { id: "singleton" },
  });

  if (!settings) {
    // Create default empty settings
    settings = await prisma.emailSettings.create({
      data: { id: "singleton" },
    });
  }

  // Mask password for security — only show if configured
  return NextResponse.json({
    ...settings,
    smtpPassword: settings.smtpPassword ? "••••••••" : "",
  });
}

// PUT — update SMTP settings
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any)?.role;
  if (role !== "Admin" && role !== "GodAdmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom } = body;

  // Build update data — only include password if it was actually changed (not the masked value)
  const updateData: any = {};
  if (smtpHost !== undefined) updateData.smtpHost = smtpHost;
  if (smtpPort !== undefined) updateData.smtpPort = parseInt(smtpPort) || 587;
  if (smtpUser !== undefined) updateData.smtpUser = smtpUser;
  if (smtpFrom !== undefined) updateData.smtpFrom = smtpFrom;
  if (smtpPassword !== undefined && smtpPassword !== "••••••••") {
    updateData.smtpPassword = smtpPassword;
  }

  // Mark as configured if host and user are set
  if (updateData.smtpHost || updateData.smtpUser) {
    const current = await prisma.emailSettings.findUnique({ where: { id: "singleton" } });
    const host = updateData.smtpHost ?? current?.smtpHost;
    const user = updateData.smtpUser ?? current?.smtpUser;
    updateData.isConfigured = !!(host && user);
  }

  const settings = await prisma.emailSettings.upsert({
    where: { id: "singleton" },
    update: updateData,
    create: {
      id: "singleton",
      ...updateData,
    },
  });

  return NextResponse.json({
    ...settings,
    smtpPassword: settings.smtpPassword ? "••••••••" : "",
  });
}
