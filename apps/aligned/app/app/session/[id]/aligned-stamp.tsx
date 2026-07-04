import type { AlignedLevel } from "@/lib/reveal/aligned";

interface Props {
  level: Exclude<AlignedLevel, "none">;
}

export function AlignedStamp({ level }: Props) {
  const isDeep = level === "deeplyAligned";
  return (
    <div className="animate-aligned-stamp-in flex justify-center py-2">
      <span
        className={
          isDeep
            ? "inline-flex items-center gap-1.5 rounded-full bg-peach-500 px-5 py-2.5 text-base font-semibold text-white shadow-[0_4px_20px_-4px_rgba(224,122,95,0.6)]"
            : "inline-flex items-center gap-1.5 rounded-full bg-peach-300 px-4 py-2 text-sm font-semibold text-dusk-800"
        }
      >
        <span aria-hidden>✨</span>
        {isDeep ? "deeply aligned" : "aligned"}
      </span>
    </div>
  );
}
