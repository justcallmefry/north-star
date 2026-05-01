"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { sendAppreciation } from "@/lib/appreciation";
import type { AppreciationStatus } from "@/lib/appreciation";
import { haptic } from "@/lib/haptics";

const PROMPTS = [
  "Tell them one thing they did this week that you noticed.",
  "What's something they did recently that made things easier for you?",
  "Name one way they showed up for you this week.",
  "What's a small thing they do that you never want to take for granted?",
  "Tell them something you've been meaning to say but haven't yet.",
];

function getPromptForWeek(): string {
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  return PROMPTS[weekNum % PROMPTS.length]!;
}

type Props = { relationshipId: string; status: AppreciationStatus };

export function AppreciationClient({ relationshipId, status }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await sendAppreciation(relationshipId, text.trim());
      void haptic("success");
      toast.success("Sent.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  if (status.type === "received") {
    return (
      <div className="animate-calm-fade-in space-y-6">
        {/* Eyebrow */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 animate-calm-fade-in">
              <Heart className="h-6 w-6 text-brand-600 fill-brand-200" strokeWidth={2} />
            </span>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            {status.fromName ?? "Your partner"} wrote this for you
          </p>
        </div>

        {/* The message — big, centered, premium */}
        <div className="rounded-2xl border border-brand-200/60 bg-gradient-to-br from-brand-50 via-white to-dusk-50/30 px-6 py-10 text-center shadow-sm ring-1 ring-brand-100/50">
          {status.fromImage && (
            <img
              src={status.fromImage}
              alt=""
              className="mx-auto mb-5 h-14 w-14 rounded-full object-cover ring-2 ring-brand-200/60 ring-offset-2"
            />
          )}
          <p className="text-2xl font-medium leading-relaxed text-slate-900 sm:text-3xl">
            &ldquo;{status.content}&rdquo;
          </p>
          {status.fromName && (
            <p className="mt-4 text-sm font-medium text-brand-600">— {status.fromName}</p>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          New appreciation available next week. Send one back if you haven&apos;t.
        </p>
      </div>
    );
  }

  if (status.type === "sent") {
    return (
      <div className="animate-calm-fade-in space-y-6 text-center">
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
            <Heart className="h-7 w-7 text-brand-600" strokeWidth={2} />
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Sent</p>
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white px-6 py-6 text-left shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400 mb-2">
            You wrote to {status.toName ?? "them"}
          </p>
          <p className="text-xl leading-relaxed text-slate-800">{status.content}</p>
        </div>
        <p className="text-sm text-slate-500">New appreciation available next week.</p>
      </div>
    );
  }

  if (status.type === "none") {
    return (
      <p className="text-center text-slate-500">
        Pair with a partner to start sending appreciations.
      </p>
    );
  }

  // status.type === "available"
  const partnerName = status.partnerName ?? "your partner";
  const writePrompt = getPromptForWeek();

  return (
    <div className="animate-calm-fade-in space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Appreciation
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Tell {partnerName} something.</h1>
        <p className="text-base text-slate-500">{writePrompt}</p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write it here…"
        rows={5}
        maxLength={600}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-lg leading-relaxed text-slate-900 placeholder:text-slate-500 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
      />

      <button
        type="button"
        onClick={handleSend}
        disabled={loading || !text.trim()}
        className="ns-btn-primary w-full py-3.5 text-lg disabled:opacity-50"
      >
        {loading ? "Sending…" : `Send to ${partnerName}`}
      </button>

      <p className="text-center text-xs text-slate-400">
        They&apos;ll see this when they open the appreciation screen. One per week.
      </p>
    </div>
  );
}
