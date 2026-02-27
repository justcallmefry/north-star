import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { getActiveRelationshipsForUser } from "@/lib/relationships";

const isDev = process.env.NODE_ENV === "development";

/** Parse Cookie header into a record of name -> value (for dev logging only). */
function parseCookies(cookieHeader: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name) out[name] = value;
  }
  return out;
}

/**
 * Returns session + app data. Uses Auth.js session resolution (same as getServerAuthSession)
 * so the session cookie is read exactly the same way as the rest of the app.
 */
export async function GET(request: Request) {
  let debugReason = "";

  try {
    const cookieHeader = request.headers.get("cookie") ?? "";
    if (!cookieHeader) {
      debugReason = "no_cookie";
      if (isDev) console.warn("[api/app/me] 401: no Cookie header");
      return NextResponse.json(
        { error: "Unauthorized", ...(isDev && { debug: debugReason }) },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      debugReason = "no_session";
      const cookieNames = Object.keys(parseCookies(cookieHeader));
      if (isDev) {
        console.warn("[api/app/me] 401: no session. Cookie names received:", cookieNames.join(", ") || "(none)");
      }
      return NextResponse.json(
        {
          error: "Unauthorized",
          ...(isDev && { debug: debugReason, cookieNames: cookieNames.length ? cookieNames : ["(none)"] }),
        },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const relationships = await getActiveRelationshipsForUser(session.user.id);
    return NextResponse.json(
      {
        session: { user: session.user },
        relationships: relationships.map((r) => ({
          id: r.id,
          name: r.name,
          status: r.status,
        })),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (err) {
    debugReason = "exception";
    if (isDev) console.error("[api/app/me] 401: exception", err);
    return NextResponse.json(
      {
        error: "Unauthorized",
        ...(isDev && { debug: debugReason, message: err instanceof Error ? err.message : String(err) }) as object,
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }
}
