"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, PenLine, Send } from "lucide-react";
import { createRelationship, claimInvite } from "@/lib/relationships";
import { haptic } from "@/lib/haptics";

/** Format 12-char code as 4-4-4 for display */
function formatCode(code: string): string {
  const clean = code.replace(/[\s-]/g, "").slice(0, 12);
  if (clean.length <= 4) return clean;
  if (clean.length <= 8) return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8)}`;
}

function defaultMessage(firstName: string | null, joinUrl: string): string {
  const lead = firstName?.trim()
    ? `It's me — ${firstName.trim()}.`
    : "Hey.";
  return (
    `${lead} Want to try this with me? It's one question a day on Aligned — answered privately, ` +
    `revealed together. Tap to pair with me: ${joinUrl}`
  );
}

type Props = {
  userFirstName: string | null;
};

export function PairContent({ userFirstName }: Props) {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [creatingCode, setCreatingCode] = useState(true);
  const [partnerCode, setPartnerCode] = useState("");
  const [claimLoading, setClaimLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageEdited, setMessageEdited] = useState(false);
  const [showCodeFallback, setShowCodeFallback] = useState(false);
  const requestedRef = useRef(false);

  // Auto-create the invite code on first load. No reason to make the user
  // click a button to "get" a code — that's a needless gate.
  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    (async () => {
      try {
        const { inviteCode: code } = await createRelationship();
        setInviteCode(code);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create invite");
      } finally {
        setCreatingCode(false);
      }
    })();
  }, []);

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined" || !inviteCode) return "";
    return `${window.location.origin}/join?code=${encodeURIComponent(inviteCode)}`;
  }, [inviteCode]);

  // Refresh the default message when the URL becomes available, but only if
  // the user hasn't customized it.
  useEffect(() => {
    if (messageEdited) return;
    if (!joinUrl) return;
    setMessage(defaultMessage(userFirstName, joinUrl));
  }, [joinUrl, userFirstName, messageEdited]);

  async function handleSend() {
    if (!message.trim() || !joinUrl) return;
    setError(null);
    const nav = window.navigator as Navigator & {
      share?: (data: { title?: string; text?: string }) => Promise<void>;
      clipboard?: { writeText: (s: string) => Promise<void> };
    };

    // We pass ONLY `text` (with the URL embedded inline). Passing both
    // `text` AND `url` to navigator.share causes iOS Messages to render
    // the link twice in the same SMS body — that's the duplicate-link bug.
    try {
      if (typeof nav.share === "function") {
        void haptic("tap");
        await nav.share({ title: "Join me on Aligned", text: message });
        return;
      }
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      // fall through to clipboard fallback
    }

    try {
      await nav.clipboard?.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't share. Copy the message manually below.");
    }
  }

  async function handleCopyCode() {
    if (!inviteCode) return;
    setError(null);
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
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
      {/* Hero: invite-by-message */}
      <section className="ns-shadow-glow rounded-2xl border border-brand-100/80 bg-gradient-to-b from-white to-brand-50/40 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Invite your partner
        </p>
        <h2 className="mt-1 font-display text-xl font-semibold text-slate-900 sm:text-2xl">
          Send them this
        </h2>
        <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
          We&apos;ve drafted a message. Edit it if you want, then send by text or wherever feels right.
        </p>

        <div className="mt-4">
          <label htmlFor="invite-message" className="sr-only">
            Invite message
          </label>
          {creatingCode || !joinUrl ? (
            <div className="h-32 w-full animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
          ) : (
            <textarea
              id="invite-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setMessageEdited(true);
              }}
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-base leading-relaxed text-slate-900 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200/60"
            />
          )}
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={creatingCode || !joinUrl || !message.trim()}
          className="ns-btn-primary mt-4 inline-flex w-full items-center justify-center gap-2 py-3.5 disabled:opacity-50"
        >
          <Send className="h-5 w-5" aria-hidden />
          {copied ? "Copied to clipboard" : "Send invite"}
        </button>

        {/* Collapsible code fallback */}
        <button
          type="button"
          onClick={() => setShowCodeFallback((v) => !v)}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showCodeFallback ? "rotate-180" : ""}`}
            aria-hidden
          />
          {showCodeFallback ? "Hide code" : "Or share a code instead"}
        </button>

        {showCodeFallback && (
          <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Your invite code
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className="font-mono text-xl font-semibold tracking-wide text-slate-900 sm:text-2xl">
                {inviteCode ? formatCode(inviteCode) : "…"}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                disabled={!inviteCode}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied" : "Copy code"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Soft separator */}
      <div className="flex items-center justify-center">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          or
        </span>
      </div>

      {/* Claim path */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-slate-900 sm:text-xl">
          They sent you a code?
        </h2>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Paste it below to pair right now.
        </p>
        <form onSubmit={handleClaim} className="mt-4 space-y-3">
          <input
            id="partner-code"
            type="text"
            inputMode="text"
            autoComplete="off"
            placeholder="e.g. Abc1-2XyZ-3456"
            value={partnerCode}
            onChange={(e) => setPartnerCode(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 font-mono text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200/60"
            aria-label="Partner's code"
          />
          <button
            type="submit"
            disabled={claimLoading || !partnerCode.trim()}
            className="ns-btn-secondary w-full py-3 disabled:opacity-50"
          >
            {claimLoading ? "Pairing…" : "Pair now"}
          </button>
        </form>
      </section>

      {/* While you wait — turn the dead zone between "invited" and "they
          joined" into the first daily action. Their sealed answer becomes
          the thing waiting for the partner on arrival. */}
      <section className="rounded-2xl border border-peach-300/50 bg-gradient-to-br from-peach-300/15 via-white to-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-peach-300/40 text-peach-600">
            <PenLine className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-semibold text-slate-900 sm:text-xl">
              While you wait — answer today&apos;s question
            </h2>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">
              Your answer stays sealed until they join. When they arrive, the
              first thing they&apos;ll see is that you already showed up.
            </p>
            <Link
              href="/app"
              className="ns-btn-secondary mt-3 inline-flex items-center gap-2 !py-2.5 text-sm"
            >
              Write your first answer →
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
