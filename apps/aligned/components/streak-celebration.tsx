// apps/aligned/components/streak-celebration.tsx
type Props = {
  count: number;
};

const COPY: Record<number, { headline: string; sub: string }> = {
  7: {
    headline: "One week.",
    sub: "Seven days of showing up for each other. The hard part is starting — you started.",
  },
  30: {
    headline: "Thirty days.",
    sub: "A month of small, consistent moments. This is what becomes a rhythm.",
  },
  100: {
    headline: "100 days.",
    sub: "Most couples don't get here. You did. This isn't a streak anymore — it's how you two are.",
  },
  365: {
    headline: "A whole year.",
    sub: "365 days of choosing each other in this small, daily way. That's not a number — that's a record of love.",
  },
};

const FALLBACK = {
  headline: "Another milestone.",
  sub: "Still showing up. That's what it's about.",
};

export function isStreakMilestone(count: number | null | undefined): boolean {
  if (count == null) return false;
  return count === 7 || count === 30 || count === 100 || count === 365;
}

function ConfettiBurst({ count }: { count: number }) {
  const colors = ["#1f4e73", "#e07a5f", "#f4d03f", "#86efac", "#a5b4fc"];
  const particles = Array.from({ length: count }, (_, i) => {
    const tx = (Math.sin(i * 12.9898) * 50000) % 60;
    const rot = (Math.cos(i * 78.233) * 50000) % 360;
    const delay = (i % 5) * 50;
    const color = colors[i % colors.length];
    return { i, tx, rot, delay, color };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.i}
          className="animate-confetti-fall absolute left-1/2 top-2 block h-2 w-2 rounded-sm"
          style={{
            backgroundColor: p.color,
            ["--tx" as string]: `${p.tx}px`,
            ["--rot" as string]: `${p.rot}deg`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function StreakCelebration({ count }: Props) {
  const { headline, sub } = COPY[count] ?? FALLBACK;
  const tier: "small" | "medium" | "large" =
    count >= 100 ? "large" : count >= 30 ? "medium" : "small";
  const particleCount = tier === "large" ? 36 : tier === "medium" ? 22 : 10;

  return (
    <div className="animate-reveal-stamp relative overflow-hidden rounded-3xl bg-gradient-to-br from-dusk-500 via-dusk-600 to-peach-500 px-5 py-7 text-center text-white shadow-lg sm:px-7 sm:py-8">
      <ConfettiBurst count={particleCount} />
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-white/80">
        Day {count} together
      </p>
      <p className={`mt-2 font-display font-semibold leading-tight ${
        tier === "large" ? "text-5xl sm:text-6xl" : "text-4xl sm:text-5xl"
      }`}>
        {headline}
      </p>
      <p className="mx-auto mt-3 max-w-md text-base text-white/90 sm:text-lg">
        {sub}
      </p>
      <span
        className="pointer-events-none absolute right-5 top-5 text-2xl text-white/40"
        aria-hidden
      >
        ✦
      </span>
    </div>
  );
}
