"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, HelpCircle, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading-spinner";
import type { QuizForTodayResult, QuizQuestion } from "@/lib/quiz";
import { getQuizForDate, submitQuiz } from "@/lib/quiz";
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
  const [step, setStep] = useState(0); // 0–4 your answer, 5–9 your guess, 10 submit
  const [quizStarted, setQuizStarted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDoneCelebration, setShowDoneCelebration] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  /** undefined = not loaded, null = no session yesterday, data = show yesterday's results */
  const [yesterdayData, setYesterdayData] = useState<QuizForTodayResult | null | undefined>(undefined);

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

  // One-question flow: step 0–4 = your answer, 5–9 = your guess, 10 = submit
  const questionIndex = step < 5 ? step : step - 5;
  const isAnswerPhase = step < 5;
  const isGuessPhase = step >= 5 && step < 10;
  const isSubmitStep = step === 10;
  const currentQuestion = data.questions[questionIndex];
  const currentAnswered = isAnswerPhase ? answers[questionIndex] >= 0 : isGuessPhase ? guesses[questionIndex] >= 0 : false;

  function handleSelectAnswer(optionIndex: number) {
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

  // After exit animation, advance to next step and scroll to top so new question is at top
  useEffect(() => {
    if (!exiting) return;
    const prevStep = step;
    const nextStep = prevStep >= 9 ? 10 : prevStep + 1;
    const t = setTimeout(() => {
      setExiting(false);
      setStep(nextStep);
      // Keep question at top: no scrolling
      requestAnimationFrame(() => document.getElementById("app-scroll")?.scrollTo({ top: 0, behavior: "auto" }));
    }, 280);
    return () => clearTimeout(t);
  }, [exiting, step]);

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
      toast.success("Quiz submitted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
      setLoading(false);
    }
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (data.state === "revealed" && data.reveal) {
    return (
      <div className="space-y-6">
        <QuizPageHeader />
        <QuizRevealView
          questions={data.questions}
          reveal={data.reveal}
          sessionUserName={sessionUserName}
          sessionUserImage={sessionUserImage}
          partnerImage={partnerImage}
        />
      </div>
    );
  }

  if (data.myParticipation && !data.partnerSubmitted) {
    return (
      <div className="space-y-6">
        <QuizPageHeader />
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
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              setYesterdayData(undefined);
              const d = new Date();
              d.setDate(d.getDate() - 1);
              const ys = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
              getQuizForDate(relationshipId, ys).then((r) => setYesterdayData(r ?? null));
            }}
            className="text-sm font-medium text-brand-600 underline hover:text-brand-700"
          >
            Yesterday&apos;s results
          </button>
        </div>
      </div>
    );
  }

  if (yesterdayData !== undefined) {
    if (yesterdayData === null) {
      return (
        <div className="space-y-6">
          <QuizPageHeader />
          <div className="ns-card py-8 text-center">
            <p className="text-slate-600">No results from yesterday.</p>
            <button type="button" onClick={() => setYesterdayData(undefined)} className="mt-3 text-sm font-medium text-brand-600 underline hover:text-brand-700">
              Back to today
            </button>
          </div>
        </div>
      );
    }
    if (yesterdayData.reveal) {
      return (
        <div className="space-y-6">
          <QuizPageHeader />
          <p className="text-center text-sm font-medium text-slate-500">Yesterday&apos;s results</p>
          <QuizRevealView
            questions={yesterdayData.questions}
            reveal={yesterdayData.reveal}
            sessionUserName={sessionUserName}
            sessionUserImage={sessionUserImage}
            partnerImage={yesterdayData.partnerImage ?? null}
          />
          <div className="flex justify-center">
            <button type="button" onClick={() => setYesterdayData(undefined)} className="text-sm font-medium text-brand-600 underline hover:text-brand-700">
              Back to today
            </button>
          </div>
        </div>
      );
    }
    if (yesterdayData.myParticipation && !yesterdayData.partnerSubmitted) {
      const ans = yesterdayData.myParticipation.answerIndices;
      return (
        <div className="space-y-6">
          <QuizPageHeader />
          <p className="text-center text-sm font-medium text-slate-500">Yesterday&apos;s results — only you answered</p>
          <div className="space-y-3">
            {yesterdayData.questions.map((q, i) => (
              <div key={i} className="ns-card p-4">
                <p className="font-semibold text-slate-900">{q.text}</p>
                <p className="mt-2 text-slate-600">{q.options[ans[i] ?? 0] ?? "—"}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <button type="button" onClick={() => setYesterdayData(undefined)} className="text-sm font-medium text-brand-600 underline hover:text-brand-700">
              Back to today
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        <QuizPageHeader />
        <div className="ns-card py-8 text-center">
          <p className="text-slate-600">No results from yesterday.</p>
          <button type="button" onClick={() => setYesterdayData(undefined)} className="mt-3 text-sm font-medium text-brand-600 underline hover:text-brand-700">
            Back to today
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="md" />
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

  // —— Start Quiz gate: header + one CTA, then one question at a time at top ——
  if (!quizStarted) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center py-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200/80 ring-2 ring-white ring-offset-2">
            <HelpCircle className="h-8 w-8" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Quiz
          </h1>
          <p className="mt-1 max-w-md text-sm text-slate-600 sm:text-base">
            Answer for yourself, then guess what your partner would pick.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setQuizStarted(true);
            requestAnimationFrame(() => document.getElementById("app-scroll")?.scrollTo({ top: 0, behavior: "auto" }));
          }}
          className="ns-btn-primary mt-6 min-w-[12rem] px-8 py-3.5 text-lg ring-2 ring-brand-300/50 ring-offset-2 shadow-lg shadow-brand-200/40"
        >
          Start quiz
        </button>
        <p className="mt-6 text-center">
          <Link href="/app" className="text-sm text-slate-500 hover:text-slate-700">
            Back to today
          </Link>
        </p>
      </div>
    );
  }

  // —— Submit step: all 10 done, show Submit quiz then go to done/waiting ——
  if (isSubmitStep) {
    return (
      <form onSubmit={handleSubmit} className="flex min-h-[50vh] flex-col items-center justify-center py-8">
        <p className="text-center text-lg font-medium text-slate-700">
          You&apos;re done! Submit to see results once your partner finishes.
        </p>
        <button
          type="submit"
          disabled={loading || !allAnswered}
          className="ns-btn-primary mt-6 min-w-[12rem] px-8 py-3.5 text-lg disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit quiz"}
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
      </form>
    );
  }

  if (!currentQuestion) return null;

  const guessLabel = data.partnerName ? `How would ${data.partnerName} answer?` : "How would your partner answer?";

  // —— One question at a time: progress + single card with exit/enter ——
  const progressLabel = isAnswerPhase
    ? `Question ${questionIndex + 1} of ${TOTAL_QUESTIONS}`
    : `Guess ${questionIndex + 1} of ${TOTAL_QUESTIONS}`;

  return (
    <div className="flex flex-col pt-0" id="quiz-step-container">
      {/* Progress — at top so no scrolling; clear and minimal */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {progressLabel}
        </span>
        <div className="flex gap-1" aria-hidden>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full min-w-[14px] max-w-[22px] transition-colors duration-200 ${
                i < step ? "bg-brand-500" : i === step ? "bg-brand-400" : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Single question card — one at a time, exit/enter for seamless feel */}
      <div
        key={step}
        className={`flex flex-col rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80 p-5 sm:p-6 ${
          exiting ? "animate-quiz-card-exit" : "animate-quiz-card-enter"
        }`}
      >
        <p className="text-lg font-bold leading-snug text-slate-900 sm:text-xl">
          {currentQuestion.text}
        </p>

        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            {isAnswerPhase ? "Your answer" : guessLabel}
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {currentQuestion.options.map((opt, j) => {
              const selected = isAnswerPhase ? answers[questionIndex] === j : guesses[questionIndex] === j;
              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => handleSelectAnswer(j)}
                  disabled={exiting}
                  className={`rounded-xl border-2 px-3.5 py-3 text-left text-sm font-medium transition-all disabled:opacity-70 ${
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

      {/* Back — minimal chrome */}
      <div className="mt-4 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <p className="mt-3 text-center">
        <Link href="/app" className="text-sm text-slate-500 hover:text-slate-700">
          Back to today
        </Link>
      </p>
    </div>
  );
}

function QuizPageHeader() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200/80 ring-2 ring-white ring-offset-2">
        <HelpCircle className="h-8 w-8" strokeWidth={2} />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
        Quiz
      </h1>
      <p className="mt-1 max-w-md text-sm text-slate-600 sm:text-base">
        Answer for yourself, then guess what your partner would pick.
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
