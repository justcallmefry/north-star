"use server";

import { cookies } from "next/headers";
import { getServerAuthSession } from "@/lib/auth";
import { getActiveRelationshipsForUser } from "@/lib/relationships";
import {
  CURRENT_RELATIONSHIP_COOKIE_NAME as COOKIE_NAME,
  CURRENT_RELATIONSHIP_COOKIE_MAX_AGE as COOKIE_MAX_AGE,
} from "@/lib/current-relationship-constants";

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
