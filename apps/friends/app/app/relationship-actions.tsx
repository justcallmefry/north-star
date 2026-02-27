"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { leaveRelationship, archiveRelationship } from "@/lib/relationships";

type Props = { relationshipId: string };

export function RelationshipActions({ relationshipId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLeave() {
    if (!confirm("Leave this relationship? You’ll need a new invite to rejoin.")) return;
    setError(null);
    setLoading("leave");
    try {
      await leaveRelationship(relationshipId);
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to leave");
    } finally {
      setLoading(null);
    }
  }

  async function handleArchive() {
    if (!confirm("Archive this relationship? It will be marked archived.")) return;
    setError(null);
    setLoading("archive");
    try {
      await archiveRelationship(relationshipId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to archive");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2 mt-2">
      <button
        type="button"
        onClick={handleLeave}
        disabled={!!loading}
        className="ns-btn-secondary !py-1.5 !px-3 text-sm"
      >
        {loading === "leave" ? "Leaving…" : "Leave relationship"}
      </button>
      <button
        type="button"
        onClick={handleArchive}
        disabled={!!loading}
        className="ns-btn-secondary !py-1.5 !px-3 text-sm"
      >
        {loading === "archive" ? "Archiving…" : "Archive relationship"}
      </button>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 self-center">{error}</p>
      )}
    </div>
  );
}
