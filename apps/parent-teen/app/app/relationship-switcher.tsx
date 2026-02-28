"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Relationship = { id: string; name: string | null; status: string };

type MeResponse = {
  session: { user: unknown };
  relationships: Relationship[];
  currentRelationshipId: string | null;
};

export function RelationshipSwitcher() {
  const router = useRouter();
  const [data, setData] = useState<MeResponse | null>(null);

  useEffect(() => {
    fetch("/api/app/me", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: MeResponse | null) => json && setData(json))
      .catch(() => {});
  }, []);

  const relationships = data?.relationships ?? [];
  const currentId = data?.currentRelationshipId ?? null;
  if (relationships.length <= 1) return null;

  async function handleChange(relationshipId: string) {
    const res = await fetch("/api/app/set-relationship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ relationshipId }),
    });
    if (res.ok) router.refresh();
  }

  const label = (r: Relationship) => r.name?.trim() || `Connection ${relationships.indexOf(r) + 1}`;

  return (
    <div className="flex shrink-0 items-center justify-center gap-2 py-2 md:py-3">
      <span className="text-xs font-medium text-slate-500 sm:text-sm">Viewing:</span>
      <select
        value={currentId ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        aria-label="Switch relationship"
      >
        {relationships.map((r) => (
          <option key={r.id} value={r.id}>
            {label(r)}
          </option>
        ))}
      </select>
      </div>
  );
}
