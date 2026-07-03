"use client";

import { useEffect, useState } from "react";

const STORAGE_PREFIX = "ns:reveal-guess:";

type Props = {
  sessionId: string;
  partnerName: string | null;
};

/**
 * Optional pre-reveal step: capture the user's guess of what partner said
 * before they tap "Reveal answers." Stored locally — purely self-reflective.
 * At reveal time, display this back next to the user's actual answer.
 */
export function PreRevealGuess({ sessionId, partnerName }: Props) {
  const [value, setValue] = useState("");
  const [collapsed, setCollapsed] = useState(true);

  // Hydrate from sessionStorage in case the user already typed earlier
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.sessionStorage.getItem(STORAGE_PREFIX + sessionId);
      if (v) {
        setValue(v);
        setCollapsed(false);
      }
    } catch {
      // ignore
    }
  }, [sessionId]);

  function handleChange(next: string) {
    setValue(next);
    try {
      if (next.trim()) {
        window.sessionStorage.setItem(STORAGE_PREFIX + sessionId, next);
      } else {
        window.sessionStorage.removeItem(STORAGE_PREFIX + sessionId);
      }
    } catch {
      // ignore
    }
  }

  const subject = partnerName?.trim() || "your partner";

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="w-full rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-3 text-left text-sm text-slate-600 transition hover:border-dusk-300 hover:bg-dusk-50/40 sm:text-base"
      >
        <span className="font-medium text-slate-700">🔮 Call it before you reveal?</span>{" "}
        <span className="text-slate-500">
          (Just for you — {subject} won&apos;t see it.)
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:py-4">
      <label
        htmlFor="reveal-guess"
        className="block text-sm font-medium text-slate-700"
      >
        Call it — guess a word or phrase {subject} used in their answer.
      </label>
      <textarea
        id="reveal-guess"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Take a swing — if you're right, you'll know."
        rows={2}
        className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-dusk-300 focus:outline-none focus:ring-2 focus:ring-dusk-200/60"
      />
      <p className="mt-1 text-xs text-slate-500">
        Optional. Stays on this device.
      </p>
    </div>
  );
}

/** Read the saved guess for a given session, if any. */
export function readGuess(sessionId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(STORAGE_PREFIX + sessionId);
    return v && v.trim() ? v : null;
  } catch {
    return null;
  }
}
