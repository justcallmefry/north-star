"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { getQuizForToday } from "@/lib/quiz";
import type { QuizForTodayResult } from "@/lib/quiz";
import { QuizClient } from "./quiz-client";

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

export function QuizSection({
  relationshipId,
  sessionUserName,
  sessionUserImage,
}: Props) {
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizForTodayResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [localDateStr, setLocalDateStr] = useState(getLocalDateString);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetchQuiz = useCallback(() => {
    getQuizForToday(relationshipId, localDateStr).then((result) => {
      if (result) setQuiz(result);
    });
  }, [relationshipId, localDateStr]);

  useEffect(() => {
    let cancelled = false;
    function load() {
      setLoading(true);
      getQuizForToday(relationshipId, localDateStr)
        .then((result) => {
          if (!cancelled) {
            if (result) setQuiz(result);
            else router.replace("/app");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }
    load();
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

  if (loading && !quiz) {
    return (
      <div className="space-y-6 rounded-2xl bg-gradient-to-b from-brand-50/40 via-white to-brand-50/30 py-6 px-4 -mx-4 -my-5 sm:px-6 sm:-mx-6 sm:-my-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="space-y-6 rounded-2xl bg-gradient-to-b from-brand-50/40 via-white to-brand-50/30 py-6 px-4 -mx-4 -my-5 sm:px-6 sm:-mx-6 sm:-my-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200/80 ring-2 ring-white ring-offset-2">
          <HelpCircle className="h-8 w-8" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          Quiz
        </h1>
        <p className="mt-1 max-w-md text-sm text-slate-600 sm:text-base">
          Answer for yourself, then guess what your partner picked. See how well you know each other.
        </p>
      </div>
      <QuizClient
        relationshipId={relationshipId}
        initialData={quiz}
        localDateStr={localDateStr}
        onQuizUpdated={refetchQuiz}
        sessionUserName={sessionUserName}
        sessionUserImage={sessionUserImage}
        partnerImage={quiz.partnerImage ?? null}
      />
    </div>
  );
}
