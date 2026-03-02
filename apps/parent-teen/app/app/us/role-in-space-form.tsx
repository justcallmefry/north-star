"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateMyRole, type RelationshipRole } from "@/lib/relationships";

type Props = {
  relationshipId: string;
  currentRole: "parent" | "young_adult";
};

export function RoleInSpaceForm({ relationshipId, currentRole }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<RelationshipRole>(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newRole: RelationshipRole) {
    if (newRole === role) return;
    setError(null);
    setLoading(true);
    try {
      const result = await updateMyRole(relationshipId, newRole);
      if (result.ok) {
        setRole(newRole);
        router.refresh();
      } else {
        setError(result.error ?? "Could not update");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">In this space you're</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleChange("parent")}
          disabled={loading}
          className={`rounded-full px-3 py-1.5 border text-sm font-medium transition-colors disabled:opacity-50 ${
            role === "parent"
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Parent
        </button>
        <button
          type="button"
          onClick={() => handleChange("young_adult")}
          disabled={loading}
          className={`rounded-full px-3 py-1.5 border text-sm font-medium transition-colors disabled:opacity-50 ${
            role === "young_adult"
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Young adult
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
