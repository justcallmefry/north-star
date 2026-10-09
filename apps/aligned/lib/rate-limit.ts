import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiting backed by Postgres.
 *
 * Deliberately not a "use server" module: nothing here should be callable
 * from the client.
 *
 * A Postgres counter is not as cheap as Redis, but the stack has no Redis
 * and the limited paths (sign-in, signup, magic links, invite claims,
 * partner pushes) are low-volume. One upsert per attempt.
 */

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);

  try {
    const row = await prisma.rateLimit.upsert({
      where: { key_windowStart: { key, windowStart } },
      create: { key, windowStart, count: 1 },
      update: { count: { increment: 1 } },
      select: { count: true },
    });
    if (row.count > limit) {
      return {
        ok: false,
        retryAfterSeconds: Math.ceil((windowStart.getTime() + windowMs - now) / 1000),
      };
    }
    return { ok: true, retryAfterSeconds: 0 };
  } catch (err) {
    // Fail open. A limiter outage must never lock every user out of
    // signing in; the limits exist to slow abuse, not to gate access.
    console.error("[rate-limit] counter failed, allowing request:", err);
    return { ok: true, retryAfterSeconds: 0 };
  }
}

/** Best-effort client IP. Vercel sets x-forwarded-for; the first hop is the client. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/** Drop windows older than two days. Called from a daily cron. */
export async function pruneRateLimits(): Promise<number> {
  const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const { count } = await prisma.rateLimit.deleteMany({ where: { windowStart: { lt: cutoff } } });
  return count;
}
