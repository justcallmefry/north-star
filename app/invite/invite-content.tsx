"use client";

import { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { createInvite } from "@/lib/relationships";

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
      setError("Could not copy link. You can still select and copy it manually.");
    }
  }

  if (!code) {
    return (
      <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
        <p className="text-sm text-slate-300">
          No active invite yet. Create one and send it to your partner so they can join.
        </p>
        <button
          type="button"
          onClick={handleNewCode}
          disabled={loading}
          className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-sm shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Generate invite code"}
        </button>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {relationshipName && (
        <p className="text-sm text-slate-400">
          Relationship: <span className="font-medium text-slate-100">{relationshipName}</span>
        </p>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-4 text-center sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Invite code
        </p>
        <p className="mt-2 text-3xl font-mono font-bold tracking-[0.3em] text-slate-50 sm:text-4xl">
          {code}
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-4 sm:px-5">
        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Share link
        </label>
        <input
          readOnly
          value={shareUrl}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
        />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400 sm:max-w-xs">
            Tap **Copy link** and paste it into a text or email. The code expires in 7 days.
          </p>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!shareUrl}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-sm shadow-sky-500/30 hover:bg-sky-400 disabled:opacity-60"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleNewCode}
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-950/80 px-4 py-2 text-xs font-medium text-slate-200 hover:border-slate-500 hover:bg-slate-900 disabled:opacity-50"
      >
        <RefreshCw className="h-4 w-4" />
        {loading ? "Creating…" : "Generate new code"}
      </button>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
