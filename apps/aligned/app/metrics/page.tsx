import { notFound } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getFunnelMetrics } from "@/lib/metrics";

/**
 * The Friday dashboard. Open it in a browser; no curl, no secret in a URL.
 *
 * Gated on ADMIN_EMAIL — when that isn't set, or you aren't it, this 404s
 * rather than 403s, so the route's existence isn't advertised.
 */
export const dynamic = "force-dynamic";
export const metadata = { title: "Aligned metrics", robots: { index: false, follow: false } };

function Stat({
  label,
  value,
  hint,
  target,
}: {
  label: string;
  value: string;
  hint?: string;
  target?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-4 py-3.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-stone-900">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-stone-500">{hint}</div> : null}
      {target ? <div className="mt-1 text-xs text-stone-400">Target {target}</div> : null}
    </div>
  );
}

const pct = (v: number | null) => (v === null ? "—" : `${v}%`);
const hrs = (v: number | null) =>
  v === null ? "—" : v < 48 ? `${v}h` : `${Math.round((v / 24) * 10) / 10}d`;

export default async function MetricsPage() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const session = await getServerAuthSession();
  if (!adminEmail || session?.user?.email !== adminEmail) notFound();

  const m = await getFunnelMetrics();

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="text-2xl font-semibold text-stone-900">The eight numbers</h1>
      <p className="mt-1 text-sm text-stone-500">
        Derived from existing data, so these are correct for every couple since day one.
      </p>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-stone-600">
        Pairing &mdash; the metric of the business
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Paired within 72h"
          value={pct(m.couples.pairRateWithin72h)}
          hint={`${m.couples.pairedWithin72h} of ${m.couples.created} couples`}
          target="> 50%"
        />
        <Stat
          label="Paired ever"
          value={pct(m.couples.pairRate)}
          hint={`${m.couples.paired} of ${m.couples.created}`}
        />
        <Stat
          label="Median time to pair"
          value={hrs(m.couples.medianHoursToPair)}
        />
      </div>
      {m.couples.stillUnpairedPast72h > 0 ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong className="tabular-nums">{m.couples.stillUnpairedPast72h}</strong>{" "}
          {m.couples.stillUnpairedPast72h === 1 ? "person is" : "people are"} still waiting on a
          partner more than 72h after starting. These are the invites that died.
        </p>
      ) : null}

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-stone-600">
        Activation
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Stat
          label="First reveal within 48h"
          value={pct(m.activation.activationRate)}
          hint={`${m.activation.revealedWithin48h} of ${m.activation.pairedCouples} paired`}
          target="> 70%"
        />
        <Stat
          label="Ever revealed"
          value={`${m.activation.revealedAtLeastOnce}`}
          hint="paired couples with ≥1 reveal"
        />
        <Stat
          label="Median time to first reveal"
          value={hrs(m.activation.medianHoursToFirstReveal)}
        />
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-stone-600">
        Engagement &amp; retention
      </h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <Stat
          label="Reveals / active couple"
          value={
            m.engagement.revealsPerActiveCouple === null
              ? "—"
              : `${m.engagement.revealsPerActiveCouple}`
          }
          hint="last 7 days"
          target="≥ 4"
        />
        <Stat
          label="Active couples"
          value={`${m.engagement.activeCouplesLast7d}`}
          hint={`${m.engagement.revealsLast7d} reveals, last 7d`}
        />
        <Stat
          label="D7 retention"
          value={pct(m.retention.d7.rate)}
          hint={`${m.retention.d7.retained} of ${m.retention.d7.cohort} eligible`}
          target="> 40%"
        />
        <Stat
          label="D30 retention"
          value={pct(m.retention.d30.rate)}
          hint={`${m.retention.d30.retained} of ${m.retention.d30.cohort} eligible`}
          target="> 20%"
        />
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-stone-600">
        Not measurable yet
      </h2>
      <ul className="mt-2 space-y-1 text-sm text-stone-500">
        {m.notInstrumented.map((item) => (
          <li key={item}>&middot; {item}</li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-stone-400">
        Generated {m.generatedAt}. A dash means there is no data to divide by yet, not zero.
      </p>
    </main>
  );
}
