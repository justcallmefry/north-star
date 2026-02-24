"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";
import { getAgreementForToday } from "@/lib/agreement";
import type { AgreementForTodayResult } from "@/lib/agreement-shared";
import { AgreementClient } from "./agreement-client";

type Props = {
  relationshipId: string;
  sessionUserName: string | null;
  sessionUserImage: string | null;
};

function getLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function msUntilNextMidnight(): number {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow.getTime() - now.getTime();
}

export function AgreementSection({
  relationshipId,
  sessionUserName,
  sessionUserImage,
}: Props) {
  const router = useRouter();
  const [agreement, setAgreement] = useState<AgreementForTodayResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [localDateStr, setLocalDateStr] = useState(getLocalDateString);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAgreementForToday(relationshipId, localDateStr)
      .then((result) => {
        if (!cancelled) {
          if (result) setAgreement(result);
          else router.replace("/app");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [relationshipId, localDateStr, router]);

  useEffect(() => {
    function scheduleNextMidnight() {
      const ms = msUntilNextMidnight();
      timeoutRef.current = setTimeout(() => {
        setLocalDateStr(getLocalDateString());
        scheduleNextMidnight();
      }, ms);
    }
    scheduleNextMidnight();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (loading && !agreement) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (!agreement) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200/80 ring-2 ring-white ring-offset-2">
          <Scale className="h-8 w-8" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          Daily agreement
        </h1>
        <p className="mt-1 max-w-md text-sm text-slate-600 sm:text-base">
          Rate each statement for yourself, then guess how your partner would answer.
        </p>
      </div>
      <AgreementClient
        relationshipId={relationshipId}
        initialData={agreement}
        localDateStr={localDateStr}
        sessionUserName={sessionUserName}
        sessionUserImage={sessionUserImage}
        partnerImage={agreement.partnerImage ?? null}
      />
    </div>
  );
}
