"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { saveAppreciation } from "@/lib/memories";
import { haptic } from "@/lib/haptics";

const MAX_LEN = 280;

type Props = {
  relationshipId: string;
  partnerName: string | null;
};

export function AppreciationComposer({ relationshipId, partnerName }: Props) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const subject = partnerName?.trim() || "your partner";

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await saveAppreciation(relationshipId, trimmed);
      void haptic("success");
      toast.success("Saved as a memory.");
      setText("");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ns-card flex w-full items-center gap-3 text-left transition active:scale-[0.99] hover:border-peach-300/50"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-peach-300/30 text-peach-600">
          <Heart className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">Send appreciation</p>
          <p className="truncate text-sm text-slate-500">
            A thank-you, saved as a memory.
          </p>
        </div>
        <span className="text-xl text-slate-400" aria-hidden>+</span>
      </button>
    );
  }

  const remaining = MAX_LEN - text.length;

  return (
    <div className="ns-card space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-peach-300/30 text-peach-600">
          <Heart className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <p className="font-semibold text-slate-900">Send appreciation</p>
      </div>
      <label htmlFor="appreciation-text" className="block text-sm text-slate-600">
        What are you thanking {subject} for?
      </label>
      <textarea
        id="appreciation-text"
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
        placeholder="One small specific thing they did or said."
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-dusk-300 focus:outline-none focus:ring-2 focus:ring-dusk-200/60"
      />
      <p className="text-right text-xs text-slate-500">
        {remaining} left
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setText("");
          }}
          disabled={saving}
          className="ns-btn-secondary w-full sm:flex-1"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSend}
          disabled={saving || !text.trim()}
          className="ns-btn-primary w-full sm:flex-1"
        >
          {saving ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}
