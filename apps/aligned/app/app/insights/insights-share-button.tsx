"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";
import { toast } from "sonner";

type Props = {
  typeName: string;
  tagline: string;
  alignmentPct: number;
  mindReadingPct: number;
};

export function InsightsShareButton({
  typeName,
  tagline,
  alignmentPct,
  mindReadingPct,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text =
      `We took the Aligned couple-type and ours is "${typeName}." ${tagline} ` +
      `Alignment ${Math.round(alignmentPct)}% · Mind-reading ${Math.round(mindReadingPct)}%.`;

    const nav = window.navigator as Navigator & {
      share?: (data: { text?: string; title?: string }) => Promise<void>;
      clipboard?: { writeText: (s: string) => Promise<void> };
    };

    try {
      if (typeof nav.share === "function") {
        // Pass only `text` to avoid the iOS Messages duplicate-link bug.
        await nav.share({ text, title: "Our Aligned couple type" });
        return;
      }
    } catch {
      // user dismissed or share unavailable — fall through to clipboard
    }

    try {
      if (nav.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
        toast.success("Copied to clipboard.");
      }
    } catch {
      toast.error("Couldn't share. Take a screenshot instead.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="ns-btn-secondary inline-flex w-full items-center justify-center gap-2 py-3"
    >
      {copied ? (
        <Check className="h-4 w-4" aria-hidden />
      ) : (
        <Share2 className="h-4 w-4" aria-hidden />
      )}
      {copied ? "Copied" : "Share our type"}
    </button>
  );
}
