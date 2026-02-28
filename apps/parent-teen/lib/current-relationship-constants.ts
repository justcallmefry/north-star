/**
 * Cookie name and max age for the "current relationship" (dual-parent switching).
 * Kept in a separate file with no server/cookies imports so API routes can use it
 * without pulling in "use server" or next/headers during build.
 */
export const CURRENT_RELATIONSHIP_COOKIE_NAME = "pt_rid";
export const CURRENT_RELATIONSHIP_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
