"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateSharedCalendarTimezone } from "@/lib/relationships";

type Props = {
  relationshipId: string;
  initialTimeZone: string | null;
};

export function SharedCalendarTimezoneForm({ relationshipId, initialTimeZone }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(initialTimeZone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const zoneOptions = useMemo(() => {
    try {
      if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
        return Intl.supportedValuesOf("timeZone");
      }
    } catch {
      /* ignore */
    }
    return [] as string[];
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    setLoading(true);
    try {
      await updateSharedCalendarTimezone(relationshipId, value);
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save time zone.");
    } finally {
      setLoading(false);
    }
  }

  function useThisDevice() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setValue(tz);
      setError(null);
    } catch {
      setError("Could not read this device’s time zone.");
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-3 space-y-3">
      <p className="text-sm text-slate-600 sm:text-base">
        After you&apos;re paired, the daily question uses one shared calendar day so you both see the same prompt.
        Defaults to the second person&apos;s device when they join; change it here if you need to match where you
        actually live.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {zoneOptions.length > 0 ? (
          <select
            value={value}
            onChange={(ev) => setValue(ev.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300 sm:max-w-md"
            aria-label="Shared calendar time zone"
          >
            <option value="">(not set — use each phone&apos;s date until paired)</option>
            {zoneOptions.map((z) => (
              <option key={z} value={z}>
                {z.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(ev) => setValue(ev.target.value)}
            placeholder="e.g. America/New_York"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300 sm:max-w-md"
            aria-label="IANA time zone"
          />
        )}
        <button
          type="button"
          onClick={useThisDevice}
          className="ns-btn-secondary shrink-0 py-2.5 text-sm font-semibold"
        >
          Use this device
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {done && <p className="text-sm text-emerald-700">Saved.</p>}

      <button
        type="submit"
        disabled={loading}
        className="ns-btn-primary py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save shared time zone"}
      </button>
    </form>
  );
}
