"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitMeeting } from "@/lib/meetings";
import type { MeetingEntryData } from "@/lib/meetings";

const SECTIONS = [
  {
    key: "wins" as const,
    label: "Wins",
    description: "What went well this week—for you, for your partner, or between you two?",
    placeholder: "Moments that felt good, things you appreciated, small or big wins…",
  },
  {
    key: "stressors" as const,
    label: "Stressors",
    description: "What felt heavy, stressful, or draining this week?",
    placeholder: "Work, family, health, or anything that weighed on you…",
  },
  {
    key: "request" as const,
    label: "Request",
    description: "One simple thing you’d love from your partner this week.",
    placeholder: "“Could you…?” requests, not complaints. Keep it small and concrete.",
  },
  {
    key: "plan" as const,
    label: "Plan",
    description: "Anything you want to agree on together for the coming week.",
    placeholder: "Shared plans, boundaries, or check-ins that would help…",
  },
  {
    key: "appreciation" as const,
    label: "Appreciation",
    description: "Something you’re grateful for about your partner right now.",
    placeholder: "A moment, a habit, or something you don’t want to take for granted…",
  },
] as const;

type Props = { meetingId: string; initial?: MeetingEntryData | null };

export function MeetingForm({ meetingId, initial }: Props) {
  const router = useRouter();
  const [fields, setFields] = useState({
    wins: initial?.wins ?? "",
    stressors: initial?.stressors ?? "",
    request: initial?.request ?? "",
    plan: initial?.plan ?? "",
    appreciation: initial?.appreciation ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await submitMeeting(meetingId, {
        wins: fields.wins || null,
        stressors: fields.stressors || null,
        request: fields.request || null,
        plan: fields.plan || null,
        appreciation: fields.appreciation || null,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {SECTIONS.map(({ key, label, description, placeholder }) => (
        <div key={key} className="space-y-1.5">
          <label
            htmlFor={key}
            className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-300 sm:text-[13px]"
          >
            {label}
          </label>
          <p className="text-xs text-slate-500 sm:text-sm">{description}</p>
          <textarea
            id={key}
            value={fields[key]}
            onChange={(e) => setFields((p) => ({ ...p, [key]: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:text-base"
            placeholder={placeholder}
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-emerald-950 shadow-sm shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50 sm:text-base"
      >
        {loading ? "Saving…" : "Save weekly check-in"}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
