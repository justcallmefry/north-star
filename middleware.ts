import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth for /app (and similar) is enforced in server components via getServerAuthSession()
// and redirect(). We do not protect those routes here because the Auth.js session cookie
// is read by the Node server (with the database adapter), not in Edge middleware.
// Protecting here caused logged-in users to be sent to /login when visiting /app.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
