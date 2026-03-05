import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedMiddleware = withAuth({
  pages: {
    signIn: "/login",
  },
});

export default function middleware(request: NextRequest) {
  // When auth is disabled, allow all requests through
  if (process.env.AUTH_REQUIRED === "false") {
    // Redirect /login to / since there's no login needed
    if (request.nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }
  return (protectedMiddleware as any)(request);
}

export const config = {
  // Protect page routes only — API routes handle their own auth
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
