"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitMeeting } from "@/lib/meetings";
import type { MeetingEntryData } from "@/lib/meetings";

const SECTIONS = [
  {
    key: "wins" as const,
    label: "Bright spots",
    description: "What gave you energy—even something small.",
    placeholder: "A moment, a win, or a laugh you want to keep.",
  },
  {
    key: "stressors" as const,
    label: "Heavy stuff",
    description: "What’s been on your chest.",
    placeholder: "No fixing required—just name it if you want to.",
  },
  {
    key: "request" as const,
    label: "One wish",
    description: "One doable thing that would help this week.",
    placeholder: "A small “could you…?”—gentle and specific beats vague.",
  },
  {
    key: "plan" as const,
    label: "This week",
    description: "Logistics, boundaries, or intentions—whatever helps you both.",
    placeholder: "Schedules, needs, or a shared plan in one breath.",
  },
  {
    key: "appreciation" as const,
    label: "I’m glad",
    description: "Something about them you don’t want to forget right now.",
    placeholder: "A habit, a gesture, or how they showed up for you.",
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
            className="block text-sm font-semibold uppercase tracking-[0.14em] text-slate-700 sm:text-[13px]"
          >
            {label}
          </label>
          <p className="text-sm text-slate-600 sm:text-base">{description}</p>
          <textarea
            id={key}
            value={fields[key]}
            onChange={(e) => setFields((p) => ({ ...p, [key]: e.target.value }))}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300 sm:text-lg"
            placeholder={placeholder}
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="ns-btn-primary w-full"
      >
        {loading ? "Saving…" : "Save my snapshot"}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
