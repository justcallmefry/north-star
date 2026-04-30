"use client";

import { useEffect, useState } from "react";
import { haptic } from "@/lib/haptics";

const STORAGE_PREFIX = "ns:reveal-seen:";

/**
 * Returns whether this is the first time the current device has rendered
 * the reveal identified by `key`. Fires a haptic on first render only.
 *
 * Pass `enabled=false` to skip side effects (e.g., on retrospective views
 * like "yesterday's results").
 */
export function useFirstReveal(key: string | null | undefined, enabled = true): boolean {
  const [isFirst, setIsFirst] = useState(false);

  useEffect(() => {
    if (!enabled || !key) return;
    if (typeof window === "undefined") return;
    let storage: Storage | null = null;
    try {
      storage = window.sessionStorage;
    } catch {
      return;
    }
    if (!storage) return;
    const storageKey = STORAGE_PREFIX + key;
    if (storage.getItem(storageKey)) return;
    try {
      storage.setItem(storageKey, "1");
    } catch {
      // ignore quota / privacy mode failures
    }
    setIsFirst(true);
    void haptic("reveal");
  }, [key, enabled]);

  return isFirst;
}
