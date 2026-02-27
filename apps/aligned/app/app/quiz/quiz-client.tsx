"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Trophy, X } from "lucide-react";
import type { QuizForTodayResult, QuizQuestion } from "@/lib/quiz";
import { submitQuiz } from "@/lib/quiz";
import { NotifyPartnerQuizButton } from "../notify-partner-quiz-button";

type Props = {
  relationshipId: string;
  initialData: QuizForTodayResult;
  localDateStr?: string;
  onQuizUpdated?: () => void;
  sessionUserName: string | null;
  sessionUserImage: string | null;
  partnerImage: string | null;
};

const TOTAL_QUESTIONS = 5;

export function QuizClient({ relationshipId, initialData, localDateStr, onQuizUpdated, sessionUserName, sessionUserImage, partnerImage }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [data, setData] = useState(initialData);
  const [answers, setAnswers] = useState<number[]>(
    initialData.myParticipation?.answerIndices ?? [-1, -1, -1, -1, -1]
  );
  const [guesses, setGuesses] = useState<number[]>(
    initialData.myParticipation?.guessIndices ?? [-1, -1, -1, -1, -1]
  );
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDoneCelebration, setShowDoneCelebration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    setData(initialData);
    setAnswers(initialData.myParticipation?.answerIndices ?? [-1, -1, -1, -1, -1]);
    setGuesses(initialData.myParticipation?.guessIndices ?? [-1, -1, -1, -1, -1]);
  }, [initialData]);

  // Show bottom nav when viewing results or waiting for partner (set ?done=1)
  const showResultsOrWaiting =
    data.state === "revealed" || (!!data.myParticipation && !data.partnerSubmitted);
  useEffect(() => {
    if (showResultsOrWaiting && pathname.startsWith("/app/quiz") && searchParams.get("done") !== "1") {
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

  const currentQuestion = data.questions[step];
  const currentAnswered = currentQuestion && answers[step] >= 0 && guesses[step] >= 0;
  const canGoNext = step < TOTAL_QUESTIONS - 1 && currentAnswered;
  const isLastStep = step === TOTAL_QUESTIONS - 1;

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
      const result = await submitQuiz(relationshipId, answers, guesses, localDateStr);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      onQuizUpdated?.();
      setLoading(false);
      setShowDoneCelebration(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setLoading(false);
    }
  }

  function goNext() {
    if (canGoNext) setStep((s) => s + 1);
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (data.state === "revealed" && data.reveal) {
    return (
      <QuizRevealView
        questions={data.questions}
        reveal={data.reveal}
        sessionUserName={sessionUserName}
        sessionUserImage={sessionUserImage}
        partnerImage={partnerImage}
      />
    );
  }

  if (data.myParticipation && !data.partnerSubmitted) {
    return (
      <div className="ns-card space-y-4 py-8 text-center">
        <p className="text-lg font-medium text-slate-700">
          You&apos;re done! Waiting for your partner to finish.
        </p>
        <p className="text-sm text-slate-500">
          We&apos;ll show scores once you&apos;ve both answered.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <NotifyPartnerQuizButton variant="quiz" size="sm" />
          <Link href="/app" className="ns-btn-secondary inline-flex">
            Back to today
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          <p className="text-sm text-slate-600">Submitting your quiz…</p>
        </div>
      </div>
    );
  }

  if (showDoneCelebration) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
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

  if (!currentQuestion) return null;

  const guessLabel = data.partnerName ? `Your guess for ${data.partnerName}` : "Your guess for partner";

  return (
    <form onSubmit={handleSubmit} className="flex min-h-[65vh] flex-col">
      {/* Progress */}
      <div className="mb-6 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-500">
          Question {step + 1} of {TOTAL_QUESTIONS}
        </span>
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_QUESTIONS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full min-w-[24px] max-w-[32px] transition-colors ${
                i < step ? "bg-brand-500" : i === step ? "bg-brand-400" : "bg-slate-200"
              }`}
              aria-hidden
            />
          ))}
        </div>
      </div>

      {/* Single question — full-screen feel */}
      <div key={step} className="flex flex-1 flex-col rounded-2xl bg-white/80 ring-1 ring-slate-200/80 p-6 shadow-sm sm:p-8 animate-calm-fade-in">
        <p className="text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
          {currentQuestion.text}
        </p>

        <div className="mt-8 space-y-8">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Your answer
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((opt, j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => {
                    const next = [...answers];
                    next[step] = j;
                    setAnswers(next);
                  }}
                  className={`rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all ${
                    answers[step] === j
                      ? "border-brand-500 bg-brand-50 text-brand-800 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50/50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              {guessLabel}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {currentQuestion.options.map((opt, j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => {
                    const next = [...guesses];
                    next[step] = j;
                    setGuesses(next);
                  }}
                  className={`rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition-all ${
                    guesses[step] === j
                      ? "border-brand-500 bg-green-50 text-green-800 shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-green-200 hover:bg-green-50/50"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {submitAttempted && !currentAnswered && (
          <p className="mt-4 text-sm font-medium text-brand-700" role="alert">
            Pick your answer and your guess to continue.
          </p>
        )}
        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Back / Next or Submit */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 disabled:invisible"
          disabled={step === 0}
        >
          <ChevronLeft className="h-5 w-5" />
          Back
        </button>
        {isLastStep ? (
          <button
            type="submit"
            disabled={loading || !allAnswered}
            className="ns-btn-primary min-w-[10rem] px-6 py-3 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit quiz"}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!currentAnswered}
            className="ns-btn-primary inline-flex items-center gap-1.5 px-6 py-3 disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
      </div>

      <p className="mt-4 text-center">
        <Link href="/app" className="text-sm text-slate-500 hover:text-slate-700">
          Back to today
        </Link>
      </p>
    </form>
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

function QuizRevealView({
  questions,
  reveal,
  sessionUserName,
  sessionUserImage,
  partnerImage,
}: {
  questions: QuizQuestion[];
  reveal: NonNullable<QuizForTodayResult["reveal"]>;
  sessionUserName: string | null;
  sessionUserImage: string | null;
  partnerImage: string | null;
}) {
  const myName = sessionUserName ?? "You";
  const partnerName = reveal.partnerName ?? "Partner";

  const overallMyPct = reveal.overallTotal > 0 ? Math.round((reveal.overallMyScore / reveal.overallTotal) * 100) : 0;
  const overallPartnerPct = reveal.overallTotal > 0 ? Math.round((reveal.overallPartnerScore / reveal.overallTotal) * 100) : 0;

  const iAmWinning = reveal.overallMyScore > reveal.overallPartnerScore;
  const theyAreWinning = reveal.overallPartnerScore > reveal.overallMyScore;
  const isTie = reveal.overallMyScore === reveal.overallPartnerScore;
  const todayCombined = reveal.myScore + reveal.partnerScore;
  const resultsLine = todayCombined >= 8 ? "You know each other well!" : "Keep playing to improve.";

  return (
    <div className="space-y-6">
      <p className="text-center text-base font-medium text-slate-700 sm:text-lg">
        {resultsLine}
      </p>
      {/* Today's scores side by side with name + emoji, then overall with trophy / loser emoji */}
      <div className="ns-card space-y-3 py-4">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-700 pb-1">Today</p>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="flex justify-center">
              <ProfileImageOrStar imageUrl={sessionUserImage} star="⭐" />
            </div>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{myName}</p>
            <p className="text-2xl font-bold text-brand-600">{reveal.myScore}/5</p>
          </div>
          <div>
            <div className="flex justify-center">
              <ProfileImageOrStar imageUrl={partnerImage} star="🌟" />
            </div>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{partnerName}</p>
            <p className="text-2xl font-bold text-violet-600">{reveal.partnerScore}/5</p>
          </div>
        </div>
        <div className="border-t border-brand-100 pt-3">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-700 pb-2">Overall</p>
          <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{myName}</p>
            {iAmWinning ? (
              <div className="mt-2 flex flex-col items-center gap-1">
                <Trophy className="h-10 w-10 text-amber-500" strokeWidth={1.5} aria-hidden />
                <p className="text-xl font-bold text-slate-800">{reveal.overallMyScore}/{reveal.overallTotal}</p>
                <p className="text-sm text-slate-600">{overallMyPct}%</p>
                <p className="text-sm font-medium text-amber-600">Leading</p>
              </div>
            ) : isTie ? (
              <div className="mt-2 flex flex-col items-center gap-1">
                <Trophy className="h-8 w-8 text-slate-400" strokeWidth={1.5} aria-hidden />
                <p className="text-xl font-bold text-slate-800">{reveal.overallMyScore}/{reveal.overallTotal}</p>
                <p className="text-sm text-slate-600">{overallMyPct}%</p>
                <p className="text-sm text-slate-500">Tied</p>
              </div>
            ) : (
              <div className="mt-2 flex flex-col items-center gap-1">
                <span className="text-3xl leading-none" aria-hidden>🤪</span>
                <p className="text-xl font-bold text-slate-800">{reveal.overallMyScore}/{reveal.overallTotal}</p>
                <p className="text-sm text-slate-600">{overallMyPct}%</p>
              </div>
            )}
          </div>
          <div>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{partnerName}</p>
            {theyAreWinning ? (
              <div className="mt-2 flex flex-col items-center gap-1">
                <Trophy className="h-10 w-10 text-amber-500" strokeWidth={1.5} aria-hidden />
                <p className="text-xl font-bold text-slate-800">{reveal.overallPartnerScore}/{reveal.overallTotal}</p>
                <p className="text-sm text-slate-600">{overallPartnerPct}%</p>
                <p className="text-sm font-medium text-amber-600">Leading</p>
              </div>
            ) : isTie ? (
              <div className="mt-2 flex flex-col items-center gap-1">
                <Trophy className="h-8 w-8 text-slate-400" strokeWidth={1.5} aria-hidden />
                <p className="text-xl font-bold text-slate-800">{reveal.overallPartnerScore}/{reveal.overallTotal}</p>
                <p className="text-sm text-slate-600">{overallPartnerPct}%</p>
                <p className="text-sm text-slate-500">Tied</p>
              </div>
            ) : (
              <div className="mt-2 flex flex-col items-center gap-1">
                <span className="text-3xl leading-none" aria-hidden>🤪</span>
                <p className="text-xl font-bold text-slate-800">{reveal.overallPartnerScore}/{reveal.overallTotal}</p>
                <p className="text-sm text-slate-600">{overallPartnerPct}%</p>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Answers in two columns with green/red and bigger icons */}
      <div className="space-y-4">
        {questions.map((q, i) => {
          const myAns = reveal.myAnswers[i];
          const myGuess = reveal.myGuesses[i];
          const partnerAns = reveal.partnerAnswers[i];
          const partnerGuess = reveal.partnerGuesses[i];
          const iGotRight = myGuess === partnerAns;
          const theyGotRight = partnerGuess === myAns;

          return (
            <div key={i} className="ns-card space-y-3">
              <p className="font-semibold text-slate-900">{q.text}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div
                  className={`rounded-xl border p-4 ${
                    theyGotRight
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-red-200 bg-red-50/70"
                  }`}
                >
                  <div className="flex justify-center">
                    <ProfileImageOrStar imageUrl={sessionUserImage} star="⭐" />
                  </div>
                  <p className="mt-1 font-medium text-brand-800">{myName}</p>
                  <p className="text-sm text-slate-700">
                    Picked: <span className="font-medium text-slate-900">{q.options[myAns]}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {partnerName} guessed: {q.options[partnerGuess]}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {theyGotRight ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white" aria-label="Correct">
                        <Check className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-400 text-white" aria-label="Missed">
                        <X className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                    )}
                    <span className="text-sm font-medium text-slate-700">
                      {theyGotRight ? "Correct" : "Missed"}
                    </span>
                  </div>
                </div>
                <div
                  className={`rounded-xl border p-4 ${
                    iGotRight
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-red-200 bg-red-50/70"
                  }`}
                >
                  <div className="flex justify-center">
                    <ProfileImageOrStar imageUrl={partnerImage} star="🌟" />
                  </div>
                  <p className="mt-1 font-medium text-violet-800">{partnerName}</p>
                  <p className="text-sm text-slate-700">
                    Picked: <span className="font-medium text-slate-900">{q.options[partnerAns]}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    You guessed: {q.options[myGuess]}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    {iGotRight ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white" aria-label="Correct">
                        <Check className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-400 text-white" aria-label="Missed">
                        <X className="h-5 w-5" strokeWidth={2.5} />
                      </span>
                    )}
                    <span className="text-sm font-medium text-slate-700">
                      {iGotRight ? "Correct" : "Missed"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center">
        <Link href="/app" className="ns-btn-secondary inline-flex">
          Back to today
        </Link>
      </p>
    </div>
  );
}
