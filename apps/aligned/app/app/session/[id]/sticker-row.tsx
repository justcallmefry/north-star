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
const STICKERS: Array<{ key: string; glyph: string; label: string }> = [
  { key: "soft_heart", glyph: "💗", label: "Soft heart" },
  { key: "tender", glyph: "🥺", label: "Tender" },
  { key: "warm_smile", glyph: "😊", label: "Warm smile" },
  { key: "holding", glyph: "🫶", label: "Holding you" },
  { key: "touched", glyph: "✨", label: "Touched" },
  { key: "laughing", glyph: "🤣", label: "Cracked up" },
  { key: "surprised", glyph: "😮", label: "Surprised" },
  { key: "moved", glyph: "🥹", label: "Moved" },
  { key: "hugged", glyph: "🫂", label: "Hugged" },
  { key: "thinking", glyph: "💭", label: "Thinking on it" },
  { key: "understood", glyph: "🤝", label: "I get it" },
  { key: "grounded", glyph: "🌿", label: "Grounded" },
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
      void haptic("tap");
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
