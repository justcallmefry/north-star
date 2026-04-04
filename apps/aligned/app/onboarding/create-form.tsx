"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRelationship } from "@/lib/relationships";

export function CreateRelationshipForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = (formData.get("name") as string) || undefined;
      const { relationshipId, inviteCode } = await createRelationship(name);
      router.push(`/invite?relationshipId=${relationshipId}&code=${inviteCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="name"
          className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
        >
          Name your space (optional)
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Just for you two (e.g. &quot;Chris &amp; Alex&quot;). You can change it later.
        </p>
        <input
          id="name"
          name="name"
          type="text"
          className="mt-2 w-full rounded-xl border border-emerald-200/90 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200/60"
          placeholder="e.g. Chris & Partner"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="ns-btn-primary w-full py-3 text-sm font-semibold disabled:opacity-50">
        {loading ? "Creating…" : "Continue — invite next"}
      </button>
    </form>
  );
}
