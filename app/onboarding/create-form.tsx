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
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Relationship name (optional)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
          placeholder="e.g. Chris & Partner"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Start as a couple"}
      </button>
    </form>
  );
}
