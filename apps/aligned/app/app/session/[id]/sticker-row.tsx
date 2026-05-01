"use client";

import { useState } from "react";
import { toast } from "sonner";
import { submitReflection } from "@/lib/sessions";
import { haptic } from "@/lib/haptics";

/**
 * Sticker reactions — v1 uses unicode glyphs as placeholders.
 * Replace with hand-illustrated SVGs once design lands; the data
 * shape (single string per sticker) is forward-compatible.
 */
/**
 * Per-glyph haptic kind. Different reactions feel different on tap —
 * heart-flavored = soft double; laugh = triple-tap burst; nod/grounded =
 * one confident medium; everything else = one soft pulse.
 */
type HapticKind =
  | "react-heart"
  | "react-soft"
  | "react-laugh"
  | "react-mark";

const STICKERS: Array<{ key: string; glyph: string; label: string; haptic: HapticKind }> = [
  { key: "soft_heart", glyph: "💗", label: "Soft heart",   haptic: "react-heart" },
  { key: "tender",     glyph: "🥺", label: "Tender",        haptic: "react-soft"  },
  { key: "warm_smile", glyph: "😊", label: "Warm smile",    haptic: "react-soft"  },
  { key: "holding",    glyph: "🫶", label: "Holding you",   haptic: "react-heart" },
  { key: "touched",    glyph: "✨", label: "Touched",       haptic: "react-soft"  },
  { key: "laughing",   glyph: "🤣", label: "Cracked up",    haptic: "react-laugh" },
  { key: "surprised",  glyph: "😮", label: "Surprised",     haptic: "react-mark"  },
  { key: "moved",      glyph: "🥹", label: "Moved",         haptic: "react-soft"  },
  { key: "hugged",     glyph: "🫂", label: "Hugged",        haptic: "react-heart" },
  { key: "thinking",   glyph: "💭", label: "Thinking on it",haptic: "react-soft"  },
  { key: "understood", glyph: "🤝", label: "I get it",      haptic: "react-mark"  },
  { key: "grounded",   glyph: "🌿", label: "Grounded",      haptic: "react-soft"  },
];

type Props = {
  sessionId: string;
};

export function StickerRow({ sessionId }: Props) {
  const [sentKey, setSentKey] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function handleTap(s: (typeof STICKERS)[number]) {
    if (busy) return;
    setBusy(s.key);
    try {
      await submitReflection(sessionId, s.glyph, undefined);
      setSentKey(s.key);
      void haptic(s.haptic);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
        React
      </p>
      <div
        className="-mx-1 flex gap-1.5 overflow-x-auto pb-1"
        role="toolbar"
        aria-label="Reaction stickers"
      >
        {STICKERS.map((s) => {
          const isSent = sentKey === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => handleTap(s)}
              disabled={busy != null}
              aria-label={s.label}
              className={`group flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl transition active:scale-95 disabled:opacity-50 ${
                isSent
                  ? "border-peach-300/60 bg-peach-300/30 scale-105"
                  : "border-slate-200 bg-white hover:border-dusk-300/60 hover:bg-dusk-50/40"
              }`}
            >
              <span aria-hidden>{s.glyph}</span>
            </button>
          );
        })}
      </div>
      {sentKey && (
        <p className="mt-1.5 text-xs text-slate-500">Sent.</p>
      )}
    </div>
  );
}
