"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { claimInvite } from "@/lib/relationships";

type Props = { initialCode: string };

export function JoinForm({ initialCode }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await claimInvite(code);
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="ns-card space-y-4 border-emerald-200/70 bg-white/95 shadow-md">
      <div>
        <label htmlFor="code" className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-1.5">
          Invite code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-xl border border-emerald-200/90 bg-white px-3 py-3 text-base font-mono text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200/60"
          placeholder="e.g. Abc12XyZ"
          autoComplete="off"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="ns-btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "Pairing…" : "Pair with partner"}
      </button>
    </form>
  );
}
