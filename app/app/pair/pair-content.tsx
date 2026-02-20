"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Share2 } from "lucide-react";
import { createRelationship, claimInvite } from "@/lib/relationships";

/** Format 12-char code as 4-4-4 for display */
function formatCode(code: string): string {
  const clean = code.replace(/[\s-]/g, "").slice(0, 12);
  if (clean.length <= 4) return clean;
  if (clean.length <= 8) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
}

export function PairContent() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [partnerCode, setPartnerCode] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinUrl =
    typeof window !== "undefined" && inviteCode
      ? `${window.location.origin}/join?code=${encodeURIComponent(inviteCode)}`
      : "";

  async function handleGetCode() {
    setError(null);
    setInviteLoading(true);
    try {
      const { inviteCode: code } = await createRelationship();
      setInviteCode(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create invite");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleCopy() {
    if (!joinUrl) return;
    setError(null);
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(inviteCode ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleShare() {
    if (!inviteCode || !joinUrl) return;
    setError(null);
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join me on North Star",
          text: "Use this link to pair with me on North Star:",
          url: joinUrl,
        });
      } else {
        await navigator.clipboard.writeText(joinUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        await navigator.clipboard.writeText(joinUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  }

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = partnerCode.trim();
    if (!trimmed) return;
    setError(null);
    setClaimLoading(true);
    try {
      await claimInvite(trimmed);
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setClaimLoading(false);
    }
  }

  return (
    <>
      {/* Card 1: I want to invite my partner */}
      <section className="rounded-2xl border border-pink-100 bg-pink-50/50 p-5 shadow-md shadow-pink-100/60 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          I want to invite my partner
        </h2>
        {!inviteCode ? (
          <>
            <p className="mt-2 text-sm text-slate-600">
              Get a link and code to send by text or email.
            </p>
            <button
              type="button"
              onClick={handleGetCode}
              disabled={inviteLoading}
              className="ns-btn-primary mt-4 w-full py-3 disabled:opacity-50"
            >
              {inviteLoading ? "Creating…" : "Get my invite code"}
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-xs font-medium uppercase tracking-wider text-slate-500">
              Your code
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xl font-mono font-semibold tracking-wide text-slate-900 sm:text-2xl">
                {formatCode(inviteCode)}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-pink-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-pink-50"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied" : "Tap to copy"}
              </button>
            </div>
            <button
              type="button"
              onClick={handleShare}
              className="ns-btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3"
            >
              <Share2 className="h-5 w-5" />
              Share your invite code
            </button>
          </>
        )}
      </section>

      {/* Or */}
      <div className="flex justify-center">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-pink-200 bg-white text-sm font-medium text-slate-500">
          or
        </span>
      </div>

      {/* Card 2: I have a code from my partner */}
      <section className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 shadow-md shadow-slate-100/80 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          I have a code from my partner
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Enter the code they sent you to pair now.
        </p>
        <form onSubmit={handleClaim} className="mt-4 space-y-3">
          <div>
            <label htmlFor="partner-code" className="sr-only">
              Partner&apos;s code
            </label>
            <input
              id="partner-code"
              type="text"
              inputMode="text"
              autoComplete="off"
              placeholder="e.g. Abc1-2XyZ-3456"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base font-mono text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200/60"
            />
          </div>
          <button
            type="submit"
            disabled={claimLoading || !partnerCode.trim()}
            className="ns-btn-primary w-full py-3 disabled:opacity-50"
          >
            {claimLoading ? "Pairing…" : "Pair now"}
          </button>
        </form>
      </section>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
