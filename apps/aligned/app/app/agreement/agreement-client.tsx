"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Check, ChevronLeft, Scale, X } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { AgreementForTodayResult, AgreementQuestion } from "@/lib/agreement-shared";
import { AGREEMENT_OPTIONS } from "@/lib/agreement-shared";
import { getAgreementForDate, submitAgreement } from "@/lib/agreement";
import { NotifyPartnerQuizButton } from "../notify-partner-quiz-button";

type Props = {
  relationshipId: string;
  initialData: AgreementForTodayResult;
  localDateStr: string;
  onAgreementUpdated?: () => void;
  sessionUserName: string | null;
  sessionUserImage: string | null;
  partnerImage: string | null;
};

const OPTIONS = [...AGREEMENT_OPTIONS];
const DEFAULT_INDICES = [-1, -1, -1, -1, -1];

export function AgreementClient({
  relationshipId,
  initialData,
  localDateStr,
  onAgreementUpdated,
  sessionUserName,
  sessionUserImage,
  partnerImage,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [answers, setAnswers] = useState<number[]>(
    initialData.myParticipation?.answerIndices ?? DEFAULT_INDICES
  );
  const [guesses, setGuesses] = useState<number[]>(
    initialData.myParticipation?.guessIndices ?? DEFAULT_INDICES
  );
  const [step, setStep] = useState(0); // 0–4 your answer, 5–9 your guess, 10 submit
  const [checkInStarted, setCheckInStarted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDoneCelebration, setShowDoneCelebration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  /** undefined = not loaded, null = no session yesterday, data = show yesterday's results */
  const [yesterdayData, setYesterdayData] = useState<AgreementForTodayResult | null | undefined>(undefined);
  const [yesterdayLoading, setYesterdayLoading] = useState(false);

  useEffect(() => {
    setData(initialData);
    setAnswers(initialData.myParticipation?.answerIndices ?? DEFAULT_INDICES);
    setGuesses(initialData.myParticipation?.guessIndices ?? DEFAULT_INDICES);
  }, [initialData]);

  // After exit animation, advance to next step and scroll to top (quiz-style)
  useEffect(() => {
    if (!exiting) return;
    const prevStep = step;
    const nextStep = prevStep >= 9 ? 10 : prevStep + 1;
    const t = setTimeout(() => {
      (document.activeElement as HTMLElement)?.blur();
      setExiting(false);
      setStep(nextStep);
      requestAnimationFrame(() => document.getElementById("app-scroll")?.scrollTo({ top: 0, behavior: "auto" }));
    }, 280);
    return () => clearTimeout(t);
  }, [exiting, step]);

  // Show bottom nav when viewing results or waiting for partner (set ?done=1)
  const showResultsOrWaiting =
    data.state === "revealed" || (!!data.myParticipation && !data.partnerSubmitted);
  useEffect(() => {
    if (showResultsOrWaiting && pathname.startsWith("/app/agreement") && searchParams.get("done") !== "1") {
      router.replace(pathname + "?done=1", { scroll: false });
    }
  }, [showResultsOrWaiting, pathname, searchParams, router]);

  // After "Done!" celebration, refresh to show waiting or reveal view
  useEffect(() => {
    if (!showDoneCelebration) return;
    const t = setTimeout(() => router.refresh(), 1500);
    return () => clearTimeout(t);
  }, [showDoneCelebration, router]);

  const allAnswered =
    answers.every((a) => a >= 0) && guesses.every((g) => g >= 0);

  const TOTAL_QUESTIONS = data.questions.length;
  // Quiz-style: step 0–4 = your answer, 5–9 = your guess, 10 = submit
  const questionIndex = step < 5 ? step : step - 5;
  const isAnswerPhase = step < 5;
  const isGuessPhase = step >= 5 && step < 10;
  const isSubmitStep = step === 10;
  const currentQuestion = data.questions[questionIndex];
  const currentAnswered = isAnswerPhase
    ? answers[questionIndex] >= 0
    : isGuessPhase
      ? guesses[questionIndex] >= 0
      : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnswered) {
      setSubmitAttempted(true);
      return;
    }
    setSubmitAttempted(false);
    setError(null);
    setLoading(true);
    try {
      const result = await submitAgreement(relationshipId, answers, guesses, localDateStr);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      onAgreementUpdated?.();
      setLoading(false);
      setShowDoneCelebration(true);
      toast.success("Alignment check-in submitted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setLoading(false);
    }
  }

  function handleSelectOption(optionIndex: number) {
    if (exiting) return;
    if (isAnswerPhase) {
      const next = [...answers];
      next[questionIndex] = optionIndex;
      setAnswers(next);
    } else {
      const next = [...guesses];
      next[questionIndex] = optionIndex;
      setGuesses(next);
    }
    setError(null);
    setExiting(true);
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
    else setCheckInStarted(false);
  }

  const loadYesterdayAgreement = () => {
    setYesterdayLoading(true);
    setYesterdayData(undefined);
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const ys = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    getAgreementForDate(relationshipId, ys)
      .then((r) => setYesterdayData(r ?? null))
      .catch(() => setYesterdayData(null))
      .finally(() => setYesterdayLoading(false));
  };

  // Show yesterday's results or loading first — otherwise when today is revealed/waiting we'd never leave that view
  if (yesterdayLoading) {
    return (
      <div className="space-y-6 animate-calm-fade-in">
        <AgreementPageHeader />
        <div className="ns-card flex flex-col items-center justify-center py-12">
          <LoadingSpinner size="md" />
          <p className="mt-3 text-sm text-slate-600">Loading yesterday's results…</p>
        </div>
      </div>
    );
  }

  if (yesterdayData !== undefined) {
    if (yesterdayData === null) {
      return (
        <div className="space-y-6">
          <AgreementPageHeader />
          <div className="ns-card py-8 text-center">
            <p className="text-slate-600">No results from yesterday.</p>
            <p className="mt-1 text-sm text-slate-500">If neither of you did the alignment that day, there&apos;s nothing to show.</p>
            <button type="button" onClick={() => setYesterdayData(undefined)} className="ns-btn-secondary mt-4 w-full !py-2.5 text-sm">
              Back to today
            </button>
          </div>
        </div>
      );
    }
    if (yesterdayData.reveal) {
      return (
        <div className="space-y-6">
          <AgreementPageHeader />
          <p className="text-center text-sm font-medium text-slate-500">Yesterday's results</p>
          <AgreementRevealView
            questions={yesterdayData.questions}
            reveal={yesterdayData.reveal}
            sessionUserName={sessionUserName}
            sessionUserImage={sessionUserImage}
            partnerImage={yesterdayData.partnerImage ?? null}
            onBack={() => {
              setYesterdayData(undefined);
              requestAnimationFrame(() => document.getElementById("app-scroll")?.scrollTo({ top: 0, behavior: "smooth" }));
            }}
          />
        </div>
      );
    }
    if (yesterdayData.myParticipation && !yesterdayData.partnerSubmitted) {
      const ans = yesterdayData.myParticipation.answerIndices;
      return (
        <div className="space-y-6">
          <AgreementPageHeader />
          <p className="text-center text-sm font-medium text-slate-500">Yesterday's results — only you answered</p>
          <div className="space-y-3">
            {yesterdayData.questions.map((q, i) => (
              <div key={i} className="ns-card p-4">
                <p className="font-semibold text-slate-900">{q.text}</p>
                <p className="mt-2 text-slate-600">{OPTIONS[ans[i] ?? 0] ?? "—"}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <button type="button" onClick={() => setYesterdayData(undefined)} className="ns-btn-secondary w-full !py-2.5 text-sm">
              Back to today
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <AgreementPageHeader />
        <div className="ns-card py-8 text-center">
          <p className="text-slate-600">No results from yesterday.</p>
          <p className="mt-1 text-sm text-slate-500">If neither of you did the alignment that day, there&apos;s nothing to show.</p>
          <button type="button" onClick={() => setYesterdayData(undefined)} className="ns-btn-secondary mt-4 w-full !py-2.5 text-sm">
            Back to today
          </button>
        </div>
      </div>
    );
  }

  if (data.state === "revealed" && data.reveal) {
    return (
      <div className="space-y-6">
        <AgreementPageHeader />
        <AgreementRevealView
          questions={data.questions}
          reveal={data.reveal}
          sessionUserName={sessionUserName}
          sessionUserImage={sessionUserImage}
          partnerImage={partnerImage}
        />
        <div className="flex justify-center">
          <button
            type="button"
            disabled={yesterdayLoading}
            onClick={loadYesterdayAgreement}
            className="ns-btn-secondary flex w-full justify-center items-center gap-2 !py-2.5 text-sm"
          >
            {yesterdayLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Loading…
              </>
            ) : (
              "Yesterday's results"
            )}
          </button>
        </div>
      </div>
    );
  }

  if (data.myParticipation && !data.partnerSubmitted) {
    return (
      <div className="space-y-6">
        <AgreementPageHeader />
        <div className="ns-card space-y-4 py-8 text-center">
          <p className="text-lg font-medium text-slate-700">
            You&apos;re done! Waiting for your partner to finish.
          </p>
          <p className="text-sm text-slate-500">
            We&apos;ll show results once you&apos;ve both answered.
          </p>
          <div className="flex flex-col gap-3">
            <NotifyPartnerQuizButton variant="agreement" relationshipId={relationshipId} size="md" />
            <button
              type="button"
              disabled={yesterdayLoading}
              onClick={loadYesterdayAgreement}
              className="ns-btn-secondary flex w-full justify-center items-center gap-2 !py-2.5 text-sm"
            >
              {yesterdayLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Loading…
                </>
              ) : (
                "Yesterday's results"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="md" />
          <p className="text-sm text-slate-600">Submitting your alignment check-in…</p>
        </div>
      </div>
    );
  }

  if (showDoneCelebration) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="ns-card flex flex-col items-center gap-4 py-10 animate-calm-fade-in">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600" aria-hidden>
            <Check className="h-8 w-8" strokeWidth={2.5} />
          </span>
          <p className="text-xl font-semibold text-slate-900">Done!</p>
          <p className="text-sm text-slate-500">Taking you to your results…</p>
        </div>
      </div>
    );
  }

  // —— Start check-in gate: header + one CTA, then one statement at a time at top ——
  if (!checkInStarted) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-8 animate-calm-fade-in">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200/80 ring-2 ring-white ring-offset-2">
            <Scale className="h-8 w-8" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Alignment check-in
          </h1>
          <p className="mt-1 max-w-md text-sm text-slate-600 sm:text-base">
            Rate each statement, then guess how your partner would answer.
          </p>
        </div>
        <div className="mt-6 flex w-full flex-col gap-4">
          <button
            type="button"
            onClick={() => {
              setCheckInStarted(true);
              requestAnimationFrame(() => document.getElementById("app-scroll")?.scrollTo({ top: 0, behavior: "auto" }));
            }}
            className="ns-btn-primary w-full py-3.5 text-lg ring-2 ring-brand-300/50 ring-offset-2 shadow-lg shadow-brand-200/40"
          >
            Start check-in
          </button>
          <button
            type="button"
            disabled={yesterdayLoading}
            onClick={loadYesterdayAgreement}
            className="ns-btn-secondary flex w-full justify-center items-center gap-2 !py-2.5 text-sm"
          >
            {yesterdayLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Loading…
              </>
            ) : (
              "Yesterday's results"
            )}
          </button>
        </div>
      </div>
    );
  }

  // —— Submit step: all 10 done, show Submit then go to done/waiting (quiz-style) ——
  if (isSubmitStep) {
    return (
      <form onSubmit={handleSubmit} className="flex min-h-[50vh] flex-col items-center justify-center py-8">
        <p className="text-center text-lg font-medium text-slate-700">
          You&apos;re done! Submit to see results once your partner finishes.
        </p>
        <button
          type="submit"
          disabled={loading || !allAnswered}
          className="ns-btn-primary mt-6 w-full py-3.5 text-lg disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit"}
        </button>
        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => setStep(9)}
          className="mt-4 text-sm text-slate-500 hover:text-slate-700"
        >
          Back
        </button>
        <div className="mt-4">
          <button
            type="button"
            disabled={yesterdayLoading}
            onClick={loadYesterdayAgreement}
            className="ns-btn-secondary flex w-full justify-center items-center gap-2 !py-2.5 text-sm"
          >
            {yesterdayLoading ? (
              <>
                <LoadingSpinner size="sm" />
                Loading…
              </>
            ) : (
              "Yesterday's results"
            )}
          </button>
        </div>
      </form>
    );
  }

  if (!currentQuestion) return null;

  const guessLabel = data.partnerName
    ? `How would ${data.partnerName} answer?`
    : "How would your partner answer?";

  return (
    <div className="flex flex-col pt-0" id="agreement-step-container">
      {/* Progress — label above dots, mirrors quiz */}
      <div className="mb-3 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-600 text-center">
          {isAnswerPhase
            ? `Statement ${questionIndex + 1} of ${TOTAL_QUESTIONS}`
            : `Guess ${questionIndex + 1} of ${TOTAL_QUESTIONS}`}
        </p>
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full min-w-[14px] max-w-[22px] transition-colors duration-200 ${
                i < step ? "bg-brand-500" : i === step ? "bg-brand-400" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      <div
        key={step}
        className={`flex flex-col rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80 p-5 sm:p-6 ${
          exiting ? "animate-quiz-card-exit" : "animate-quiz-card-enter"
        }`}
      >
        <p className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
          {currentQuestion.text}
        </p>
        <div className="mt-4">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            {isAnswerPhase ? "Your answer" : guessLabel}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {OPTIONS.map((opt, j) => {
              const selected = isAnswerPhase
                ? answers[questionIndex] === j
                : guesses[questionIndex] === j;
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => handleSelectOption(j)}
                  disabled={exiting}
                  className={`min-h-[3.25rem] rounded-xl border-2 px-4 py-4 text-left text-base font-medium leading-snug transition-all disabled:opacity-70 sm:min-h-[3.5rem] sm:text-lg ${
                    selected
                      ? isAnswerPhase
                        ? "border-brand-500 bg-brand-50 text-brand-800 shadow-sm"
                        : "border-brand-500 bg-green-50 text-green-800 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50/50"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {currentAnswered && !exiting && (
            <p className="mt-3">
              <button
                type="button"
                onClick={() => setExiting(true)}
                className="text-sm font-medium text-brand-600 hover:text-brand-700"
              >
                Next →
              </button>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 w-full">
        <button
          type="button"
          onClick={goBack}
          className="ns-btn-secondary flex w-full justify-center items-center gap-1.5 !py-2.5 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="mt-3 w-full">
        <button
          type="button"
          disabled={yesterdayLoading}
          onClick={loadYesterdayAgreement}
          className="ns-btn-secondary flex w-full justify-center items-center gap-2 !py-2.5 text-sm"
        >
          {yesterdayLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Loading…
            </>
          ) : (
            "Yesterday's results"
          )}
        </button>
      </div>

      <div className="mt-3 w-full">
        <Link
          href="/app"
          className="ns-btn-secondary flex w-full justify-center items-center gap-1.5 !py-2.5 text-sm"
        >
          <ChevronLeft className="h-4 w-4" />
          Exit check-in
        </Link>
      </div>
    </div>
  );
}

function AgreementPageHeader() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200/80 ring-2 ring-white ring-offset-2">
        <Scale className="h-8 w-8" strokeWidth={2} />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
        Alignment check-in
      </h1>
      <p className="mt-1 max-w-md text-sm text-slate-600 sm:text-base">
        Rate each statement, then guess how your partner would answer.
      </p>
    </div>
  );
}

function ProfileImageOrStar({ imageUrl, star }: { imageUrl: string | null; star: string }) {
  const isUrl = typeof imageUrl === "string" && imageUrl.trim().startsWith("http");
  if (isUrl) {
    return (
      <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
        <img src={imageUrl.trim()} alt="" className="absolute inset-0 h-full w-full object-cover" width={32} height={32} />
      </span>
    );
  }
  return <span className="text-2xl leading-none" aria-hidden>{star}</span>;
}

function AgreementRevealView({
  questions,
  reveal,
  sessionUserName,
  sessionUserImage,
  partnerImage,
  onBack,
}: {
  questions: AgreementQuestion[];
  reveal: NonNullable<AgreementForTodayResult["reveal"]>;
  sessionUserName: string | null;
  sessionUserImage: string | null;
  partnerImage: string | null;
  onBack?: () => void;
}) {
  const myName = sessionUserName ?? "You";
  const partnerName = reveal.partnerName ?? "Partner";
  const options = [...AGREEMENT_OPTIONS];

  const overallMyPct = reveal.overallTotal > 0 ? Math.round((reveal.overallMyScore / reveal.overallTotal) * 100) : 0;
  const overallPartnerPct = reveal.overallTotal > 0 ? Math.round((reveal.overallPartnerScore / reveal.overallTotal) * 100) : 0;

  const iAmWinning = reveal.overallMyScore > reveal.overallPartnerScore;
  const theyAreWinning = reveal.overallPartnerScore > reveal.overallMyScore;
  const isTie = reveal.overallMyScore === reveal.overallPartnerScore;
  const avgPct = (overallMyPct + overallPartnerPct) / 2;
  const resultsLine = avgPct >= 70 ? "You're aligned!" : "Keep at it—you're building something good.";

  return (
    <div className="space-y-5">
      <p className="text-center text-lg font-medium text-slate-700 sm:text-xl">
        {resultsLine}
      </p>
      {/* Scoreboard commented out for now — may bring back later
      <div className="ns-card space-y-3 py-4">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-700 pb-1">Today</p>
        ...
        Overall section with trophy / loser emoji
      </div>
      */}

      {/* Answers in two columns with green/red and bigger icons */}
      <div className="space-y-3">
        {questions.map((q, i) => {
          const myAns = reveal.myAnswers[i];
          const myGuess = reveal.myGuesses[i];
          const partnerAns = reveal.partnerAnswers[i];
          const partnerGuess = reveal.partnerGuesses[i];
          const iGotRight = myGuess === partnerAns;
          const theyGotRight = partnerGuess === myAns;

          return (
            <div key={i} className="ns-card space-y-3 py-4">
              <p className="text-xl font-semibold text-slate-900 sm:text-2xl">{q.text}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  className={`rounded-xl border-2 p-4 ${
                    theyGotRight
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-red-200 bg-red-50/70"
                  }`}
                >
                  <div className="flex justify-center">
                    <ProfileImageOrStar imageUrl={sessionUserImage} star="⭐" />
                  </div>
                  <p className="mt-1.5 font-medium text-brand-800">{myName}</p>
                  <p className="mt-1 text-lg text-slate-700 sm:text-xl">
                    Picked: <span className="font-medium text-slate-900">{options[myAns]}</span>
                  </p>
                  <p className="mt-2 text-lg text-slate-600 sm:text-xl">
                    {partnerName} guessed: {options[partnerGuess]}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {theyGotRight ? (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white" aria-label="Correct">
                        <Check className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-400 text-white" aria-label="Missed">
                        <X className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                    )}
                    <span className="text-lg font-medium text-slate-700">
                      {theyGotRight ? "Correct" : "Missed"}
                    </span>
                  </div>
                </div>
                <div
                  className={`rounded-xl border-2 p-4 ${
                    iGotRight
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-red-200 bg-red-50/70"
                  }`}
                >
                  <div className="flex justify-center">
                    <ProfileImageOrStar imageUrl={partnerImage} star="🌟" />
                  </div>
                  <p className="mt-1.5 font-medium text-violet-800">{partnerName}</p>
                  <p className="mt-1 text-lg text-slate-700 sm:text-xl">
                    Picked: <span className="font-medium text-slate-900">{options[partnerAns]}</span>
                  </p>
                  <p className="mt-2 text-lg text-slate-600 sm:text-xl">
                    You guessed: {options[myGuess]}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {iGotRight ? (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white" aria-label="Correct">
                        <Check className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-400 text-white" aria-label="Missed">
                        <X className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                    )}
                    <span className="text-lg font-medium text-slate-700">
                      {iGotRight ? "Correct" : "Missed"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {onBack && (
        <p className="text-center">
          <button type="button" onClick={onBack} className="ns-btn-secondary w-full py-2.5">
            Back to today
          </button>
        </p>
      )}
    </div>
  );
}
