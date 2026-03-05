import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
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

/** Returns true if authentication is currently required */
export function isAuthRequired(): boolean {
  return process.env.AUTH_REQUIRED !== "false";
}

/**
 * Gets the session, or returns a mock admin session when auth is disabled.
 * Use this instead of getServerSession in API routes to respect the auth toggle.
 */
export async function getSessionOrBypass() {
  if (!isAuthRequired()) {
    // Return a mock GodAdmin session so API routes work without login
    // GodAdmin ensures full office scope (allOffices: true) bypassing office filtering
    return {
      user: {
        id: "system",
        name: "System",
        email: "system@local",
        role: "GodAdmin",
        primaryOfficeId: null,
      },
    };
  }
  const { getServerSession } = await import("next-auth");
  return getServerSession(authOptions);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;

        // 1. Domain restriction — only @nouveau*.com emails allowed
        const domain = email.split("@")[1]?.toLowerCase() || "";
        if (!domain.startsWith("nouveau") || !domain.endsWith(".com")) {
          return false;
        }

        // 2. Pre-created users only — must already exist in DB
        const dbUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!dbUser) {
          return false; // Not in the system — admin must add them first
        }

        // Update avatar if changed + record last login
        const updateData: any = { lastLogin: new Date() };
        if (dbUser.avatar !== user.image && user.image) {
          updateData.avatar = user.image;
        }
        await prisma.user.update({
          where: { id: dbUser.id },
          data: updateData,
        });

        if (!dbUser.isActive) {
          return false; // Deactivated user can't sign in
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Always refresh user data from DB to keep role, avatar, etc. current
      if (token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          // Enforce GodAdmin whitelist — even if DB says GodAdmin, only approved emails get it
          token.role = dbUser.role === "GodAdmin" && !GOD_ADMIN_EMAILS.includes(dbUser.email.toLowerCase())
            ? "Admin"
            : dbUser.role;
          token.avatar = dbUser.avatar;
          token.uiMode = dbUser.uiMode;
          token.primaryOfficeId = dbUser.primaryOfficeId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).avatar = token.avatar;
        (session.user as any).uiMode = token.uiMode;
        (session.user as any).primaryOfficeId = token.primaryOfficeId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
