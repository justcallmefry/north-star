"use server";

import { cookies } from "next/headers";
import { getServerAuthSession } from "@/lib/auth";
import { getActiveRelationshipsForUser } from "@/lib/relationships";

const COOKIE_NAME = "pt_rid";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * Returns the relationship id the user is currently "in" (for dual-parent switching).
 * Reads cookie pt_rid; if valid (user is member), returns it; else returns first relationship id.
 */
export async function getCurrentRelationshipId(): Promise<string | null> {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return null;

  const relationships = await getActiveRelationshipsForUser(session.user.id);
  if (relationships.length === 0) return null;

  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  if (value && relationships.some((r) => r.id === value)) return value;

  return relationships[0]?.id ?? null;
}

export { COOKIE_NAME as CURRENT_RELATIONSHIP_COOKIE_NAME, COOKIE_MAX_AGE as CURRENT_RELATIONSHIP_COOKIE_MAX_AGE };
