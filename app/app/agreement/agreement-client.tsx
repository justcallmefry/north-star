"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { AgreementForTodayResult, AgreementQuestion } from "@/lib/agreement-shared";
import { AGREEMENT_OPTIONS } from "@/lib/agreement-shared";
import { submitAgreement } from "@/lib/agreement";

type Props = {
  relationshipId: string;
  initialData: AgreementForTodayResult;
  sessionUserName: string | null;
};

const OPTIONS = [...AGREEMENT_OPTIONS];
const DEFAULT_INDICES = [-1, -1, -1, -1, -1];

export function AgreementClient({
  relationshipId,
  initialData,
  sessionUserName,
}: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [answers, setAnswers] = useState<number[]>(
    initialData.myParticipation?.answerIndices ?? DEFAULT_INDICES
  );
  const [guesses, setGuesses] = useState<number[]>(
    initialData.myParticipation?.guessIndices ?? DEFAULT_INDICES
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    setData(initialData);
    setAnswers(initialData.myParticipation?.answerIndices ?? DEFAULT_INDICES);
    setGuesses(initialData.myParticipation?.guessIndices ?? DEFAULT_INDICES);
  }, [initialData]);

  const allAnswered =
    answers.every((a) => a >= 0) && guesses.every((g) => g >= 0);

  const incompleteQuestionNumbers = data.questions
    .map((_, i) => (answers[i] >= 0 && guesses[i] >= 0 ? null : i + 1))
    .filter((n): n is number => n !== null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnswered) {
      setSubmitAttempted(true);
      const first = incompleteQuestionNumbers[0];
      if (first != null) {
        document
          .getElementById(`agreement-q-${first}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setSubmitAttempted(false);
    setError(null);
    setLoading(true);
    try {
      const result = await submitAgreement(relationshipId, answers, guesses);
      if (!result.ok) {
        setError(result.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  if (data.state === "revealed" && data.reveal) {
    return (
      <AgreementRevealView
        questions={data.questions}
        reveal={data.reveal}
        sessionUserName={sessionUserName}
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
        <Link href="/app" className="ns-btn-secondary inline-flex">
          Back to today
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {data.questions.map((q, i) => (
        <AgreementQuestionBlock
          key={i}
          index={i}
          question={q}
          options={OPTIONS}
          guessLabel={
            data.partnerName
              ? `Your guess for ${data.partnerName}`
              : "Your guess for partner"
          }
          showIncompleteHint={
            submitAttempted && (answers[i] < 0 || guesses[i] < 0)
          }
          answerIndex={answers[i]}
          guessIndex={guesses[i]}
          onAnswerChange={(v) => {
            const next = [...answers];
            next[i] = v;
            setAnswers(next);
          }}
          onGuessChange={(v) => {
            const next = [...guesses];
            next[i] = v;
            setGuesses(next);
          }}
        />
      ))}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {!allAnswered && (
        <p
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700"
          role="alert"
        >
          {submitAttempted && incompleteQuestionNumbers.length > 0 ? (
            <>
              Complete your answer and guess for question
              {incompleteQuestionNumbers.length > 1 ? "s" : ""}{" "}
              {incompleteQuestionNumbers.join(", ")} to submit.
            </>
          ) : (
            <>Answer and guess for all 5 statements to submit.</>
          )}
        </p>
      )}
      <div className="flex flex-col items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="ns-btn-primary text-lg disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit"}
        </button>
        <Link href="/app" className="text-sm text-slate-500 hover:text-slate-700">
          Back to today
        </Link>
      </div>
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
  return (
    <div
      className={`ns-card space-y-4 ${showIncompleteHint ? "ring-2 ring-amber-400 ring-offset-2" : ""}`}
      id={showIncompleteHint ? `agreement-q-${index + 1}` : undefined}
    >
      {showIncompleteHint && (
        <p className="text-sm font-medium text-amber-700" role="alert">
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
                    ? "border-pink-400 bg-pink-50 text-pink-800"
                    : "border-slate-200 bg-white text-slate-700 hover:border-pink-200 hover:bg-pink-50/50"
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

function AgreementRevealView({
  questions,
  reveal,
  sessionUserName,
}: {
  questions: AgreementQuestion[];
  reveal: NonNullable<AgreementForTodayResult["reveal"]>;
  sessionUserName: string | null;
}) {
  const myName = sessionUserName ?? "You";
  const partnerName = reveal.partnerName ?? "Partner";
  const options = [...AGREEMENT_OPTIONS];

  return (
    <div className="space-y-6">
      <div className="ns-card flex flex-wrap items-center justify-center gap-6 py-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Your score
          </p>
          <p className="text-3xl font-bold text-pink-600">
            {reveal.myScore}/5
          </p>
          <p className="text-sm text-slate-600">correct guesses</p>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {partnerName}&apos;s score
          </p>
          <p className="text-3xl font-bold text-violet-600">
            {reveal.partnerScore}/5
          </p>
          <p className="text-sm text-slate-600">correct guesses</p>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const myAns = reveal.myAnswers[i];
          const myGuess = reveal.myGuesses[i];
          const partnerAns = reveal.partnerAnswers[i];
          const partnerGuess = reveal.partnerGuesses[i];
          const iGotRight = myGuess === partnerAns;
          const theyGotRight = partnerGuess === myAns;

          return (
            <div
              key={i}
              className={
                i % 2 === 1
                  ? "rounded-2xl border-2 border-slate-300 bg-slate-200 p-5 shadow-md space-y-3"
                  : "ns-card space-y-3"
              }
            >
              <p className="font-semibold text-slate-900">{q.text}</p>
              <div className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="space-y-1 rounded-lg border border-pink-100 bg-pink-50/50 p-3">
                  <p className="font-medium text-pink-800">{myName}</p>
                  <p className="text-slate-700">
                    Picked:{" "}
                    <span className="font-medium text-slate-900">
                      {options[myAns]}
                    </span>
                  </p>
                  <p className="text-slate-600">
                    {partnerName} guessed: {options[partnerGuess]}
                    {theyGotRight ? (
                      <span className="ml-1 text-violet-600">✓</span>
                    ) : (
                      <span className="ml-1 text-slate-400">✗</span>
                    )}
                  </p>
                </div>
                <div className="space-y-1 rounded-lg border border-violet-100 bg-violet-50/50 p-3">
                  <p className="font-medium text-violet-800">{partnerName}</p>
                  <p className="text-slate-700">
                    Picked:{" "}
                    <span className="font-medium text-slate-900">
                      {options[partnerAns]}
                    </span>
                  </p>
                  <p className="text-slate-600">
                    You guessed: {options[myGuess]}
                    {iGotRight ? (
                      <span className="ml-1 text-pink-600">✓</span>
                    ) : (
                      <span className="ml-1 text-slate-400">✗</span>
                    )}
                  </p>
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
