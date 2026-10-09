"use client";

import { useState } from "react";

/** Website subscribers only: opens Stripe's billing portal. */
export function ManageBilling() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (!res.ok || !data.url) throw new Error();
      window.location.href = data.url;
    } catch {
      setError("Couldn't open billing. Try again, or email support@alignedconnectingcouples.com.");
      setBusy(false);
    }
  }

  return (
    <div className="ns-card">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
        Subscription
      </h2>
      <p className="mt-1 text-sm text-slate-600 sm:text-base">
        Cancel, update your card, or see receipts.
      </p>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="ns-btn-secondary mt-3 w-full disabled:opacity-60"
      >
        {busy ? "Opening…" : "Manage subscription"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
