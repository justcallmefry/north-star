// apps/aligned/app/app/session/[id]/post-reveal-action-bar.tsx
"use client";

import { Heart, Bookmark, MessageSquareText } from "lucide-react";
import { haptic } from "@/lib/haptics";

type Props = {
  onReact: () => void;
  onSave: () => void;
  onTalk: () => void;
  saved: boolean;
  saving: boolean;
};

export function PostRevealActionBar({ onReact, onSave, onTalk, saved, saving }: Props) {
  return (
    <div
      className="sticky bottom-3 mt-4 flex items-center justify-around gap-2 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-2 py-2 shadow-md"
      role="group"
      aria-label="Post-reveal actions"
    >
      <button
        type="button"
        onClick={() => { void haptic("tap"); onReact(); }}
        className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition active:scale-[0.96] hover:bg-slate-50"
      >
        <Heart className="h-5 w-5 text-rose-500" strokeWidth={2} />
        <span className="text-[11px] font-medium text-slate-600">React</span>
      </button>
      <button
        type="button"
        onClick={() => { void haptic("success"); onSave(); }}
        disabled={saving}
        className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition active:scale-[0.96] ${
          saved ? "bg-emerald-50" : "hover:bg-slate-50"
        }`}
      >
        <Bookmark className={`h-5 w-5 ${saved ? "text-emerald-600 fill-emerald-600" : "text-slate-700"}`} strokeWidth={2} />
        <span className="text-[11px] font-medium text-slate-600">{saved ? "Saved" : "Save"}</span>
      </button>
      <button
        type="button"
        onClick={() => { void haptic("tap"); onTalk(); }}
        className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition active:scale-[0.96] hover:bg-slate-50"
      >
        <MessageSquareText className="h-5 w-5 text-dusk-600" strokeWidth={2} />
        <span className="text-[11px] font-medium text-slate-600">Talk about it</span>
      </button>
    </div>
  );
}
