"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { claimInvite, type RelationshipRole } from "@/lib/relationships";

type Props = { initialCode: string };

export function JoinForm({ initialCode }: Props) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<RelationshipRole>("young_adult");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { relationshipId } = await claimInvite(code, role);
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="code" className="block text-sm font-medium mb-1">
          Invite code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 font-mono"
          placeholder="e.g. Abc12XyZ"
          autoComplete="off"
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-800">Who are you in this space?</p>
        <div className="flex flex-wrap gap-3 text-sm text-slate-700">
          <button
            type="button"
            onClick={() => setRole("parent")}
            className={`rounded-full px-3 py-1.5 border ${
              role === "parent"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white"
            }`}
          >
            I&apos;m a parent
          </button>
          <button
            type="button"
            onClick={() => setRole("young_adult")}
            className={`rounded-full px-3 py-1.5 border ${
              role === "young_adult"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white"
            }`}
          >
            I&apos;m the young adult
          </button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !code.trim()}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Joining…" : "Join"}
      </button>
    </form>
  );
}
