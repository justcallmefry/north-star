"use client";

export type FilterKey = "all" | "session_reveal" | "appreciation";

const CHIPS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "session_reveal", label: "Sessions" },
  { key: "appreciation", label: "Appreciations" },
];

type Props = {
  active: FilterKey;
  onChange: (k: FilterKey) => void;
  counts: Record<FilterKey, number>;
};

export function MemoriesFilterChips({ active, onChange, counts }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {CHIPS.map((chip) => {
        const isActive = chip.key === active;
        const count = counts[chip.key];
        if (count === 0 && chip.key !== "all") return null;
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.key)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              isActive
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            <span>{chip.label}</span>
            <span
              className={`text-[11px] ${isActive ? "text-white/80" : "text-slate-400"}`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
