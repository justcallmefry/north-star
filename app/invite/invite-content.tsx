"use client";

import { useState } from "react";
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

  const shareUrl = code ? `${origin}/join?code=${encodeURIComponent(code)}` : "";

  async function handleNewCode() {
    setError(null);
    setLoading(true);
    try {
      const { code: newCode } = await createInvite(relationshipId);
      setCode(newCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invite");
    } finally {
      setLoading(false);
    }
  }

  if (!code) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No active invite. Create one below.
        </p>
        <button
          type="button"
          onClick={handleNewCode}
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Generate invite code"}
        </button>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {relationshipName && (
        <p className="text-sm text-gray-500">Relationship: {relationshipName}</p>
      )}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
        <p className="text-sm text-gray-500 mb-1">Code</p>
        <p className="text-2xl font-mono font-bold tracking-wider">{code}</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Share link</label>
        <input
          readOnly
          value={shareUrl}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800 text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Copy and send this link to your partner. Code expires in 7 days.
        </p>
      </div>
      <button
        type="button"
        onClick={handleNewCode}
        disabled={loading}
        className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Generate new code"}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
