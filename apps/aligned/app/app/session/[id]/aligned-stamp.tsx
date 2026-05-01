import type { AlignedLevel } from "@/lib/reveal/aligned";

interface Props {
  level: Exclude<AlignedLevel, "none">;
}

export function AlignedStamp({ level }: Props) {
  return (
    <div className="animate-aligned-stamp-in flex justify-center py-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
        <span aria-hidden>✨</span>
        {level === "deeplyAligned" ? "deeply aligned" : "aligned"}
      </span>
    </div>
  );
}
