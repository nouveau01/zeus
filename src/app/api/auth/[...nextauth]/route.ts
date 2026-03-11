import NextAuth from "next-auth";
import { buildAuthOptions } from "@/lib/auth";

async function handler(req: Request, ctx: { params: { nextauth: string[] } }) {
  return NextAuth(req as any, ctx as any, buildAuthOptions());
}

export { handler as GET, handler as POST };
