import type { MeetingEntryData } from "@/lib/meetings";

const SECTIONS = [
  { key: "wins" as const, label: "Wins" },
  { key: "stressors" as const, label: "Stressors" },
  { key: "request" as const, label: "Request" },
  { key: "plan" as const, label: "Plan" },
  { key: "appreciation" as const, label: "Appreciation" },
] as const;

type Props = {
  ownEntry: MeetingEntryData | null;
  partnerEntry: MeetingEntryData | null;
  canViewPartner: boolean;
};

export function MeetingView({ ownEntry, partnerEntry, canViewPartner }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200 sm:text-base">Your entry</h3>
          {ownEntry ? (
            <ul className="space-y-3">
              {SECTIONS.map(({ key, label }) => (
                <li key={key}>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {label}
                  </span>
                  <p className="mt-0.5 text-sm text-slate-100 sm:text-base">
                    {ownEntry[key] ?? "-"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Not submitted yet.</p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-200 sm:text-base">Partner entry</h3>
          {canViewPartner && partnerEntry ? (
            <ul className="space-y-3">
              {SECTIONS.map(({ key, label }) => (
                <li key={key}>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    {label}
                  </span>
                  <p className="mt-0.5 text-sm text-slate-100 sm:text-base">
                    {partnerEntry[key] ?? "-"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">
              {canViewPartner ? "-" : "Visible once you and your partner have both submitted."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
