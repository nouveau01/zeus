import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

// Role hierarchy: GodAdmin > Admin > User
// GodAdmin: Full platform control — user management, destructive actions, backend access
// Admin: Module configuration, user management (cannot create/modify GodAdmin)
// User: Standard access, no admin features
export type UserRole = "GodAdmin" | "Admin" | "User";

const ROLE_LEVEL: Record<string, number> = {
  GodAdmin: 100,
  Admin: 50,
  User: 10,
};

export function hasRole(userRole: string, requiredRole: UserRole): boolean {
  return (ROLE_LEVEL[userRole] || 0) >= (ROLE_LEVEL[requiredRole] || 0);
}

export function isGodAdmin(role: string): boolean {
  return role === "GodAdmin";
}

// Only these emails can ever hold the GodAdmin role.
// Even with direct DB access, the JWT callback and API routes enforce this.
export const GOD_ADMIN_EMAILS = [
  "zschwartz@nouveauelevator.com",
];

export function canBeGodAdmin(email: string): boolean {
  return GOD_ADMIN_EMAILS.includes(email.toLowerCase());
}

// ============================================
// AUTH MODE
// ============================================

export type AuthMode = "none" | "sso" | "manual";

/** Returns the current auth mode from env vars */
export function getAuthMode(): AuthMode {
  const mode = process.env.AUTH_MODE;
  if (mode === "sso" || mode === "manual") return mode;
  // Backward compat: fall back to legacy AUTH_REQUIRED
  return process.env.AUTH_REQUIRED === "false" ? "none" : "sso";
}

/** Returns true if authentication is currently required (backward compat) */
export function isAuthRequired(): boolean {
  return getAuthMode() !== "none";
}

// ============================================
// SESSION BYPASS
// ============================================

let _bypassUser: { id: string; name: string; email: string; role: string; primaryOfficeId: string | null } | null = null;

export async function getSessionOrBypass() {
  if (!isAuthRequired()) {
    if (!_bypassUser) {
      const godAdmin = await prisma.user.findFirst({
        where: { email: { in: GOD_ADMIN_EMAILS } },
        select: { id: true, name: true, email: true, role: true, primaryOfficeId: true },
      });
      _bypassUser = godAdmin || { id: "system", name: "System", email: "system@local", role: "GodAdmin", primaryOfficeId: null };
    }
    return { user: _bypassUser };
  }

  // Try getServerSession first (works with Google OAuth)
  const { getServerSession } = await import("next-auth");
  const session = await getServerSession(buildAuthOptions());
  if (session) return session;

  // Fallback: read JWT directly (fixes CredentialsProvider + getServerSession issue)
  const { cookies } = await import("next/headers");
  const { decode } = await import("next-auth/jwt");
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("next-auth.session-token")?.value
    || cookieStore.get("__Secure-next-auth.session-token")?.value;
  if (tokenCookie && process.env.NEXTAUTH_SECRET) {
    const decoded = await decode({ token: tokenCookie, secret: process.env.NEXTAUTH_SECRET });
    if (decoded?.email) {
      return {
        user: {
          id: decoded.id as string,
          name: decoded.name as string,
          email: decoded.email as string,
          role: decoded.role as string,
          primaryOfficeId: decoded.primaryOfficeId as string | null,
        },
      };
    }
  }

  return null;
}

// ============================================
// SHARED CALLBACKS (used by both SSO and manual)
// ============================================

const jwtCallback = async ({ token }: { token: any }) => {
  if (token.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: token.email },
    });
    if (dbUser) {
      token.id = dbUser.id;
      token.role = dbUser.role === "GodAdmin" && !GOD_ADMIN_EMAILS.includes(dbUser.email.toLowerCase())
        ? "Admin"
        : dbUser.role;
      token.avatar = dbUser.avatar;
      token.uiMode = dbUser.uiMode;
      token.primaryOfficeId = dbUser.primaryOfficeId;
      token.mustResetPassword = dbUser.mustResetPassword;
    }
  }
  return token;
};

const sessionCallback = async ({ session, token }: { session: any; token: any }) => {
  if (session.user) {
    session.user.id = token.id;
    session.user.role = token.role;
    session.user.avatar = token.avatar;
    session.user.uiMode = token.uiMode;
    session.user.primaryOfficeId = token.primaryOfficeId;
    session.user.mustResetPassword = token.mustResetPassword;
  }
  return session;
};

// ============================================
// BUILD AUTH OPTIONS (dynamic per auth mode)
// ============================================

export function buildAuthOptions(): NextAuthOptions {
  const mode = getAuthMode();

  const providers: NextAuthOptions["providers"] = [];

  if (mode === "sso") {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      })
    );
  }

  if (mode === "manual") {
    providers.push(
      CredentialsProvider({
        name: "Email & Password",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          if (!credentials?.email || !credentials?.password) return null;

          const dbUser = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });

          if (!dbUser || !dbUser.isActive || !dbUser.password) return null;

          const valid = await bcrypt.compare(credentials.password, dbUser.password);
          if (!valid) return null;

          // Update last login
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { lastLogin: new Date() },
          });

          return {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
            primaryOfficeId: dbUser.primaryOfficeId,
            mustResetPassword: dbUser.mustResetPassword,
          };
        },
      })
    );
  }

  const callbacks: NextAuthOptions["callbacks"] = {
    jwt: jwtCallback,
    session: sessionCallback,
  };

  // SSO mode needs signIn callback for domain restriction + pre-created user check
  if (mode === "sso") {
    callbacks.signIn = async ({ user, account }) => {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        const domain = email.split("@")[1]?.toLowerCase() || "";
        if (!domain.startsWith("nouveau") || !domain.endsWith(".com")) {
          return false;
        }

        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (!dbUser) return false;

        const updateData: any = { lastLogin: new Date() };
        if (dbUser.avatar !== user.image && user.image) {
          updateData.avatar = user.image;
        }
        await prisma.user.update({ where: { id: dbUser.id }, data: updateData });

        if (!dbUser.isActive) return false;
      }
      return true;
    };
  }

  return {
    providers,
    callbacks,
    pages: { signIn: "/login" },
    session: { strategy: "jwt" },
    secret: process.env.NEXTAUTH_SECRET,
  };
}

// Keep legacy export for any existing imports
export const authOptions: NextAuthOptions = buildAuthOptions();
