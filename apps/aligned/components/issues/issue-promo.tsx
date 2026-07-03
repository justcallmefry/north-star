"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLatestIssuePromo } from "@/lib/issues/promo";
import type { LatestIssuePromo } from "@/lib/issues/promo";

type Props = { relationshipId: string };

export function IssuePromo({ relationshipId }: Props) {
  const [promo, setPromo] = useState<LatestIssuePromo | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLatestIssuePromo(relationshipId).then((p) => {
      if (!cancelled) setPromo(p);
    });
    return () => {
      cancelled = true;
    };
  }, [relationshipId]);

  if (!promo) return null;

  const coverStyle: React.CSSProperties = promo.coverPhotoUrl
    ? { backgroundImage: `url(${promo.coverPhotoUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : promo.coverGradient
      ? { background: `linear-gradient(160deg, ${promo.coverGradient.primary} 0%, ${promo.coverGradient.secondary} 100%)` }
      : { background: "#faf7f2" };

  return (
    <Link
      href={`/app/issues/${promo.id}`}
      className="animate-calm-fade-in flex items-center gap-4 rounded-2xl border border-[#EDE5D4] bg-[#FFFDF8] p-3 transition active:scale-[0.99] hover:border-dusk-300/70"
    >
      <div
        style={{ ...coverStyle, width: 64, height: 80, borderRadius: 4, flexShrink: 0 }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-dusk-600">
          New issue
        </p>
        <p className="mt-1 truncate font-display text-base font-semibold text-slate-900">
          {promo.headline}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Issue {promo.issueNumber} · Read together
        </p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
    </Link>
  );
}
