"use client";

import { useState } from "react";
import { Copy, RefreshCw, Share2 } from "lucide-react";
import { createInvite } from "@/lib/relationships";

function formatCode(code: string): string {
  const clean = code.replace(/[\s-]/g, "").slice(0, 12);
  if (clean.length <= 4) return clean;
  if (clean.length <= 8) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
}

type Props = {
  relationshipId: string;
  relationshipName: string | null;
  code: string | null;
  origin: string;
};

export function InviteContent({ relationshipId, relationshipName, code: initialCode, origin }: Props) {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const shareUrl = code ? `${origin}/join?code=${encodeURIComponent(code)}` : "";

  async function handleNewCode() {
    setError(null);
    setLoading(true);
    try {
      const { code: newCode } = await createInvite(relationshipId);
      setCode(newCode);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    setError(null);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(code ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (!code || !shareUrl) return;
    setError(null);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join me on North Star",
          text: "Use this link to pair with me on North Star:",
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }

  if (!code) {
    return (
      <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-5 shadow-md shadow-pink-100/60 sm:p-6">
        <p className="text-sm text-slate-600">
          Generate a code to text or share with your partner.
        </p>
        <button
          type="button"
          onClick={handleNewCode}
          disabled={loading}
          className="ns-btn-primary mt-4 w-full py-3 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Get my invite code"}
        </button>
        {error && (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {relationshipName && (
        <p className="text-sm text-slate-500">
          Relationship: <span className="font-medium text-slate-700">{relationshipName}</span>
        </p>
      )}

      <div className="rounded-2xl border border-pink-100 bg-pink-50/50 p-5 shadow-md shadow-pink-100/60 sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Your code
        </p>
        <p className="mt-2 text-xl font-mono font-semibold tracking-wide text-slate-900 sm:text-2xl">
          {formatCode(code)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-pink-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-pink-50"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Tap to copy link"}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="ns-btn-primary inline-flex items-center gap-2 py-2"
          >
            <Share2 className="h-4 w-4" />
            Share your invite code
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Link expires in 7 days. Partner can open the link or enter the code on the pair screen.
        </p>
      </div>

      <button
        type="button"
        onClick={handleNewCode}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <RefreshCw className="h-4 w-4" />
        {loading ? "Creating…" : "Generate new code"}
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
