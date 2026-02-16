import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth.js v5 session cookie (dev: authjs.session-token; prod HTTPS: __Secure-authjs.session-token)
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"];

const protectedPrefixes = ["/app", "/dashboard", "/account", "/onboarding", "/invite", "/join"];

function isProtected(pathname: string): boolean {
  return protectedPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtected(pathname)) return NextResponse.next();

  const hasSession = SESSION_COOKIE_NAMES.some(
    (name) => request.cookies.get(name)?.value
  );
  if (!hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/dashboard/:path*", "/account/:path*", "/onboarding", "/onboarding/:path*", "/invite/:path*", "/join", "/join/:path*"],
};
