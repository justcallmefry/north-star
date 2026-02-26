"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Trophy, X } from "lucide-react";
import type { AgreementForTodayResult, AgreementQuestion } from "@/lib/agreement-shared";
import { AGREEMENT_OPTIONS } from "@/lib/agreement-shared";
import { submitAgreement } from "@/lib/agreement";
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
  const [data, setData] = useState(initialData);
  const [answers, setAnswers] = useState<number[]>(
    initialData.myParticipation?.answerIndices ?? DEFAULT_INDICES
  );
  const [guesses, setGuesses] = useState<number[]>(
    initialData.myParticipation?.guessIndices ?? DEFAULT_INDICES
  );
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    setData(initialData);
    setAnswers(initialData.myParticipation?.answerIndices ?? DEFAULT_INDICES);
    setGuesses(initialData.myParticipation?.guessIndices ?? DEFAULT_INDICES);
    setStep(0);
  }, [initialData]);

  const allAnswered =
    answers.every((a) => a >= 0) && guesses.every((g) => g >= 0);

  const TOTAL_QUESTIONS = data.questions.length;
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
      const result = await submitAgreement(relationshipId, answers, guesses, localDateStr);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      onAgreementUpdated?.();
      router.refresh();
      // Keep loading true so button stays "Submitting…" until refetch updates the view
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
      <AgreementRevealView
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
          We&apos;ll show results once you&apos;ve both answered.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <NotifyPartnerQuizButton variant="agreement" size="sm" />
          <Link href="/app" className="ns-btn-secondary inline-flex">
            Back to today
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
          <p className="text-sm text-slate-600">Submitting your agreement…</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  const guessLabel = data.partnerName
    ? `Your guess for ${data.partnerName}`
    : "Your guess for partner";

  return (
    <form onSubmit={handleSubmit} className="flex min-h-[65vh] flex-col">
      {/* Progress */}
      <div className="mb-6 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-500">
          Statement {step + 1} of {TOTAL_QUESTIONS}
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

      {/* Single statement card */}
      <AgreementQuestionBlock
        index={step}
        question={currentQuestion}
        options={OPTIONS}
        guessLabel={guessLabel}
        showIncompleteHint={
          submitAttempted && (answers[step] < 0 || guesses[step] < 0)
        }
        answerIndex={answers[step]}
        guessIndex={guesses[step]}
        onAnswerChange={(v) => {
          const next = [...answers];
          next[step] = v;
          setAnswers(next);
        }}
        onGuessChange={(v) => {
          const next = [...guesses];
          next[step] = v;
          setGuesses(next);
        }}
      />

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {!allAnswered && (
        <p
          className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700"
          role="alert"
        >
          <>Answer and guess for all {TOTAL_QUESTIONS} statements to submit.</>
        </p>
      )}

      {/* Back / Next or Submit */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 disabled:invisible"
          disabled={step === 0}
        >
          Back
        </button>
        {isLastStep ? (
          <button
            type="submit"
            disabled={loading || !allAnswered}
            className="ns-btn-primary min-w-[10rem] px-6 py-3 transition-all duration-200 disabled:opacity-50"
          >
            Submit
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!currentAnswered}
            className="ns-btn-primary inline-flex items-center gap-1.5 px-6 py-3 disabled:opacity-50"
          >
            Next
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

function AgreementQuestionBlock({
  index,
  question,
  options,
  guessLabel,
  showIncompleteHint,
  answerIndex,
  guessIndex,
  onAnswerChange,
  onGuessChange,
}: {
  index: number;
  question: AgreementQuestion;
  options: readonly string[];
  guessLabel: string;
  showIncompleteHint: boolean;
  answerIndex: number;
  guessIndex: number;
  onAnswerChange: (v: number) => void;
  onGuessChange: (v: number) => void;
}) {
  const bgClass = index % 2 === 0 ? "bg-brand-50/50" : "bg-green-50/50";
  return (
    <div
      className={`ns-card space-y-4 rounded-2xl ${bgClass} ${showIncompleteHint ? "ring-2 ring-brand-400 ring-offset-2" : ""}`}
      id={showIncompleteHint ? `agreement-q-${index + 1}` : undefined}
    >
      {showIncompleteHint && (
        <p className="text-sm font-medium text-brand-700" role="alert">
          Pick your answer and your guess for this statement.
        </p>
      )}
      <p className="text-base font-semibold text-slate-900 sm:text-lg">
        {index + 1}. {question.text}
      </p>
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            Your answer
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt, j) => (
              <button
                key={j}
                type="button"
                onClick={() => onAnswerChange(j)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  answerIndex === j
                    ? "border-brand-400 bg-brand-50 text-brand-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50/50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
            {guessLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map((opt, j) => (
              <button
                key={j}
                type="button"
                onClick={() => onGuessChange(j)}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  guessIndex === j
                    ? "border-violet-400 bg-violet-50 text-violet-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50/50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>
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
}: {
  questions: AgreementQuestion[];
  reveal: NonNullable<AgreementForTodayResult["reveal"]>;
  sessionUserName: string | null;
  sessionUserImage: string | null;
  partnerImage: string | null;
}) {
  const myName = sessionUserName ?? "You";
  const partnerName = reveal.partnerName ?? "Partner";
  const options = [...AGREEMENT_OPTIONS];

  const overallMyPct = reveal.overallTotal > 0 ? Math.round((reveal.overallMyScore / reveal.overallTotal) * 100) : 0;
  const overallPartnerPct = reveal.overallTotal > 0 ? Math.round((reveal.overallPartnerScore / reveal.overallTotal) * 100) : 0;

  const iAmWinning = reveal.overallMyScore > reveal.overallPartnerScore;
  const theyAreWinning = reveal.overallPartnerScore > reveal.overallMyScore;
  const isTie = reveal.overallMyScore === reveal.overallPartnerScore;

  return (
    <div className="space-y-6">
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
        <div className="border-t border-violet-100 pt-3">
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
                    Picked: <span className="font-medium text-slate-900">{options[myAns]}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {partnerName} guessed: {options[partnerGuess]}
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
                    Picked: <span className="font-medium text-slate-900">{options[partnerAns]}</span>
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    You guessed: {options[myGuess]}
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
