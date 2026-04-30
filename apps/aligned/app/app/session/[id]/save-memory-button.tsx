"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import { saveSessionReveal } from "@/lib/memories";
import { haptic } from "@/lib/haptics";

type Props = {
  sessionId: string;
  initialSaved: boolean;
};

export function SaveMemoryButton({ sessionId, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (saved || busy) return;
    setBusy(true);
    try {
      await saveSessionReveal(sessionId);
      setSaved(true);
      void haptic("success");
      toast.success("Saved to your memories.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={saved || busy}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition disabled:opacity-100 ${
        saved
          ? "border-peach-300/50 bg-peach-300/20 text-peach-600"
          : "border-slate-200 bg-white text-slate-700 hover:border-dusk-300/70 hover:bg-dusk-50/40"
      }`}
    >
      {saved ? (
        <>
          <BookmarkCheck className="h-4 w-4" aria-hidden />
          Saved as a memory
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" aria-hidden />
          {busy ? "Saving…" : "Save as a memory"}
        </>
      )}
    </button>
  );
}
