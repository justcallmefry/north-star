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
        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">Your entry</h3>
          {ownEntry ? (
            <ul className="space-y-3">
              {SECTIONS.map(({ key, label }) => (
                <li key={key}>
                  <span className="text-xs font-medium text-gray-500">{label}</span>
                  <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-200">
                    {ownEntry[key] ?? "-"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Not submitted yet.</p>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">
            Partner entry
          </h3>
          {canViewPartner && partnerEntry ? (
            <ul className="space-y-3">
              {SECTIONS.map(({ key, label }) => (
                <li key={key}>
                  <span className="text-xs font-medium text-gray-500">{label}</span>
                  <p className="mt-0.5 text-sm text-gray-800 dark:text-gray-200">
                    {partnerEntry[key] ?? "-"}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">
              {canViewPartner ? "-" : "Visible once you and your partner have both submitted."}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
