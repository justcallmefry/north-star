"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { sealCapsule, type CapsuleView } from "@/lib/time-capsules";
import { haptic } from "@/lib/haptics";

const DAY = 86_400_000;

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}
function nice(dateStr: string) {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
export function daysUntil(dateStr: string) {
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  return Math.round((new Date(dateStr + "T00:00:00Z").getTime() - today.getTime()) / DAY);
}

/** Next occurrence of the anniversary at least a week out. */
function nextAnniversary(iso: string | null): string | null {
  if (!iso) return null;
  const [, m, d] = iso.split("-").map(Number);
  const now = new Date();
  for (const y of [now.getUTCFullYear(), now.getUTCFullYear() + 1]) {
    const cand = new Date(Date.UTC(y, m! - 1, d!));
    if (cand.getTime() - now.getTime() >= 7 * DAY) return ymd(cand);
  }
  return null;
}

export function Capsules({
  capsules,
  anniversaryISO,
}: {
  capsules: CapsuleView[];
  anniversaryISO: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const anniversary = nextAnniversary(anniversaryISO);

  const presets = useMemo(() => {
    const now = Date.now();
    const list: { label: string; date: string }[] = [
      { label: "In 6 months", date: ymd(new Date(now + 182 * DAY)) },
      { label: "In a year", date: ymd(new Date(now + 365 * DAY)) },
    ];
    if (anniversary) list.push({ label: "Our anniversary", date: anniversary });
    list.push({ label: "In 5 years", date: ymd(new Date(now + 5 * 365 * DAY)) });
    return list;
  }, [anniversary]);
  const [date, setDate] = useState(presets[1]!.date);

  const sealed = capsules.filter((c) => !c.open);
  const opened = capsules.filter((c) => c.open).reverse();

  async function seal() {
    setBusy(true);
    const res = await sealCapsule(text, date);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    void haptic("success");
    toast.success(`Sealed until ${nice(date)}.`);
    setText("");
    setOpen(false);
    router.refresh();
  }

  return (
    <section className="space-y-3" aria-labelledby="capsules-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="capsules-heading" className="font-display text-lg font-semibold text-slate-900">
            Time capsules
          </h2>
          <p className="text-sm text-slate-600">
            Sealed until the day you choose. Neither of you can read it until then, not even the one who wrote it.
          </p>
        </div>
      </div>

      {opened.map((c) => (
        <article key={c.id} className="rounded-2xl border border-[#E4B95B]/50 bg-gradient-to-br from-[#FFF8E8] to-white p-4">
          <p className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[#A8792A]">
            <MailOpen className="h-3.5 w-3.5" aria-hidden />
            Opened {nice(c.openOn)} · from {c.byMe ? "you" : c.authorName ?? "your partner"}
          </p>
          <p className="mt-2 whitespace-pre-wrap font-prompt text-lg leading-relaxed text-slate-900">{c.message}</p>
          <p className="mt-2 text-xs text-slate-400">Sealed {nice(c.createdAt.slice(0, 10))}</p>
        </article>
      ))}

      {sealed.map((c) => {
        const d = daysUntil(c.openOn);
        return (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#14304D] to-[#0B1B2E] px-4 py-3 text-[#F5EFE3]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Lock className="h-4 w-4 text-[#FFD9A8]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Opens {nice(c.openOn)}</span>
              <span className="block text-xs text-white/55">
                Sealed by {c.byMe ? "you" : c.authorName ?? "your partner"} ·{" "}
                {d <= 1 ? "tomorrow" : `${d.toLocaleString()} days to go`}
              </span>
            </span>
          </div>
        );
      })}

      {open ? (
        <div className="ns-card space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={5}
            autoFocus
            placeholder="Write to the two of you, later. What's true right now that you want to remember?"
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-prompt text-base leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
          />
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setDate(p.date)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  date === p.date ? "bg-dusk-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
                }`}
              >
                {p.label}
              </button>
            ))}
            <input
              type="date"
              aria-label="Or pick a date"
              value={date}
              min={ymd(new Date(Date.now() + 7 * DAY))}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="rounded-full px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200"
            />
          </div>
          <p className="text-xs text-slate-500">Opens {nice(date)}. Once sealed, it can&apos;t be read or edited until then.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={seal}
              disabled={busy || !text.trim()}
              className="ns-btn-primary flex-1 py-3 disabled:opacity-50"
            >
              {busy ? "Sealing…" : "Seal it"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="ns-btn-secondary px-4 py-3">
              Not now
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-2xl border-2 border-dashed border-slate-200 px-4 py-4 text-sm font-semibold text-slate-600 transition hover:border-dusk-300 hover:text-dusk-700"
        >
          ☄︎ Seal a time capsule
        </button>
      )}
    </section>
  );
}
