"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Heart, Pencil, X } from "lucide-react";
import { setAnniversaryDate } from "@/lib/relationships";

type Props = {
  relationshipId: string;
  initial: string | null; // YYYY-MM-DD or null
};

function formatPretty(iso: string): string {
  // iso = YYYY-MM-DD
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function AnniversaryForm({ relationshipId, initial }: Props) {
  const [editing, setEditing] = useState(!initial);
  const [value, setValue] = useState(initial ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await setAnniversaryDate(relationshipId, value || null);
      toast.success(value ? "Anniversary saved." : "Anniversary cleared.");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setValue("");
    setSaving(true);
    try {
      await setAnniversaryDate(relationshipId, null);
      toast.success("Anniversary cleared.");
      setEditing(true);
    } catch {
      toast.error("Couldn't clear.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ns-card">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-peach-300/40 text-peach-600">
          <Heart className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
            Your anniversary
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">
            {initial && !editing ? formatPretty(initial) : "When did you two start?"}
          </p>
          {!editing && initial && (
            <p className="mt-1 text-sm text-slate-600">
              We&apos;ll mark the day every year.
            </p>
          )}
          {editing && (
            <p className="mt-1 text-sm text-slate-600">
              Optional. We&apos;ll only use it for the day-of and a small &quot;Day N together&quot; note.
            </p>
          )}
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Edit anniversary"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-4 space-y-3">
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 focus:border-dusk-300 focus:outline-none focus:ring-2 focus:ring-dusk-200/60"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="ns-btn-primary w-full py-3 sm:flex-1"
            >
              {saving ? "Saving…" : initial ? "Update" : "Save"}
            </button>
            {initial && (
              <button
                type="button"
                onClick={handleClear}
                disabled={saving}
                className="ns-btn-secondary inline-flex w-full items-center justify-center gap-1.5 sm:w-auto"
              >
                <X className="h-4 w-4" />
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
