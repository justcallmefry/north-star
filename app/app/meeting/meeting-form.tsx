"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitMeeting } from "@/lib/meetings";
import type { MeetingEntryData } from "@/lib/meetings";

const SECTIONS = [
  { key: "wins" as const, label: "Wins" },
  { key: "stressors" as const, label: "Stressors" },
  { key: "request" as const, label: "Request" },
  { key: "plan" as const, label: "Plan" },
  { key: "appreciation" as const, label: "Appreciation" },
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
      {SECTIONS.map(({ key, label }) => (
        <div key={key}>
          <label htmlFor={key} className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <textarea
            id={key}
            value={fields[key]}
            onChange={(e) => setFields((p) => ({ ...p, [key]: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save"}
      </button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}
