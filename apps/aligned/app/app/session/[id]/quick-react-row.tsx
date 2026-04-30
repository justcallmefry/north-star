// apps/aligned/app/app/session/[id]/quick-react-row.tsx
"use client";

import { useState } from "react";
import { setReactions } from "@/lib/sessions";
import { haptic } from "@/lib/haptics";
import { toast } from "sonner";

const QUICK_EMOJIS = ["❤️", "🥹", "😂", "💯", "🔥"] as const;

type Props = {
  responseId: string;
  initialReactions: string | null;
};

export function QuickReactRow({ responseId, initialReactions }: Props) {
  const [active, setActive] = useState<Set<string>>(
    () => new Set(initialReactions ? Array.from(initialReactions) : [])
  );
  const [pending, setPending] = useState(false);

  async function toggle(emoji: string) {
    void haptic("tap");
    const next = new Set(active);
    if (next.has(emoji)) next.delete(emoji);
    else {
      if (next.size >= 2) {
        // Drop oldest by removing first iteration entry
        const first = next.values().next().value as string | undefined;
        if (first) next.delete(first);
      }
      next.add(emoji);
    }
    setActive(next);
    setPending(true);
    try {
      await setReactions(responseId, Array.from(next));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save reaction.");
      setActive(active); // revert
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="flex items-center gap-1.5"
      role="group"
      aria-label="Quick reactions"
    >
      {QUICK_EMOJIS.map((e) => {
        const on = active.has(e);
        return (
          <button
            key={e}
            type="button"
            onClick={() => void toggle(e)}
            disabled={pending}
            aria-pressed={on}
            className={`text-xl px-2 py-1 rounded-full transition active:scale-90 ${
              on ? "bg-brand-100 ring-2 ring-brand-300" : "hover:bg-slate-100"
            }`}
          >
            {e}
          </button>
        );
      })}
    </div>
  );
}
