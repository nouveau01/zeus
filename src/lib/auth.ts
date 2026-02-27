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

        // Update avatar if changed
        if (dbUser.avatar !== user.image && user.image) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { avatar: user.image },
          });
        }

        if (!dbUser.isActive) {
          return false; // Deactivated user can't sign in
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // On sign-in, look up DB user for id, role, avatar
      if (account) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.avatar = dbUser.avatar;
          token.uiMode = dbUser.uiMode;
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
