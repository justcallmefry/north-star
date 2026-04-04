import type { MeetingEntryData } from "@/lib/meetings";

const SECTIONS = [
  { key: "wins" as const, label: "Bright spots" },
  { key: "stressors" as const, label: "Heavy stuff" },
  { key: "request" as const, label: "One wish" },
  { key: "plan" as const, label: "This week" },
  { key: "appreciation" as const, label: "I'm glad" },
] as const;

type Props = {
  ownEntry: MeetingEntryData | null;
  partnerEntry: MeetingEntryData | null;
  canViewPartner: boolean;
};

export function MeetingView({ ownEntry, partnerEntry, canViewPartner }: Props) {
  return (
    <div className="ns-stack">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="ns-card">
          <h3 className="mb-3 text-base font-semibold text-slate-900 sm:text-lg">My notes</h3>
          {ownEntry && Object.values(ownEntry).some(Boolean) ? (
            <ul className="space-y-3">
              {SECTIONS.map(({ key, label }) => (
                <li key={key}>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </span>
                  <p className="mt-0.5 text-sm text-slate-700 sm:text-base">
                    {ownEntry[key] ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Nothing here yet.</p>
          )}
        </section>

        <section className="ns-card">
          <h3 className="mb-3 text-base font-semibold text-slate-900 sm:text-lg">Partner&apos;s notes</h3>
          {canViewPartner && partnerEntry && Object.values(partnerEntry).some(Boolean) ? (
            <ul className="space-y-3">
              {SECTIONS.map(({ key, label }) => (
                <li key={key}>
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {label}
                  </span>
                  <p className="mt-0.5 text-sm text-slate-700 sm:text-base">
                    {partnerEntry[key] ?? "—"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">Your partner&apos;s notes will appear here after you&apos;ve both saved this week.</p>
          )}
        </section>
      </div>
    </div>
  );
}
