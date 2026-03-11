import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(request: NextRequest) {
  // Read auth mode from cookie (set by system-settings API on change).
  // Cookie is the source of truth because Next.js inlines process.env at compile time
  // in Edge Runtime, so runtime changes to env vars aren't visible here.
  const cookieMode = request.cookies.get("__zeus_auth_mode")?.value;
  const authMode = cookieMode || process.env.AUTH_MODE || (process.env.AUTH_REQUIRED === "false" ? "none" : "sso");

  // No auth — let everything through, redirect /login to /
  if (authMode === "none") {
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Auth is active (sso or manual) — check JWT token
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Not authenticated — redirect to login (unless already on /login)
  if (!token) {
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated but must reset password — force them to /login (which shows set-password form)
  if (token.mustResetPassword && request.nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Authenticated and on /login but doesn't need reset — send to app
  if (request.nextUrl.pathname === "/login" && !token.mustResetPassword) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Protect page routes only — API routes handle their own auth
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
