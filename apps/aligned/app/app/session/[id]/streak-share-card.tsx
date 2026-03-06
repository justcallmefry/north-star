"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

type Props = {
  currentCount: number;
};

export function StreakShareCard({ currentCount }: Props) {
  const [shared, setShared] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleShare() {
    setError(null);
    try {
      const origin =
        typeof window !== "undefined" && window.location
          ? window.location.origin
          : "https://alignedcouples.app";
      const url = origin;
      const text =
        "We’ve been using Aligned (one question a day for couples) and thought of you.";

      if (navigator.share) {
        await navigator.share({
          title: "Aligned: Connecting Couples",
          text,
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text} ${url}`);
      }

      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError("Couldn’t open sharing. You can still copy and paste your link.");
    }
  }

  return (
    <div className="ns-card-inner mt-4 flex flex-col gap-3 rounded-2xl border border-brand-100 bg-brand-50/80 p-4">
      <p className="text-sm font-medium text-slate-900 sm:text-base">
        You&apos;ve kept a {currentCount}-day streak. Want to cheer on a friend couple?
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:ring-offset-2"
        >
          <Share2 className="h-4 w-4" />
          <span>{shared ? "Thanks for sharing" : "Share Aligned with a friend"}</span>
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && (
        <p className="text-xs text-slate-600">
          We never include your answers—just a simple link to Aligned.
        </p>
      )}
    </div>
  );
}

