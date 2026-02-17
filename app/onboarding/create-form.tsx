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
        <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Relationship name (optional)
        </label>
        <p className="mt-1 text-xs text-slate-500">
          This is just for you two (e.g. &quot;Chris & Partner&quot;). You can change it later.
        </p>
        <input
          id="name"
          name="name"
          type="text"
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          placeholder="e.g. Chris & Partner"
        />
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-sm shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Start as a couple"}
      </button>
    </form>
  );
}
