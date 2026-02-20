"use client";

import { useState, useCallback, useEffect } from "react";
import { Sparkles } from "lucide-react";

const SLIDES = [
  {
    headline: "One question a day.",
    subtext: "Answer privately. Reveal together.",
    icon: "question",
  },
  {
    headline: "A shared record of your week.",
    subtext: "Capture moments as they happen.",
    icon: "week",
  },
  {
    headline: "Less friction. More connection.",
    subtext: "Private by design. Built for real life.",
    icon: "heart",
  },
] as const;

const AUTO_ADVANCE_MS = 4500;

export function WelcomeCarousel() {
  const [index, setIndex] = useState(0);

  const goTo = useCallback((i: number) => {
    setIndex((i + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    const t = setInterval(() => goTo(index + 1), AUTO_ADVANCE_MS);
    return () => clearInterval(t);
  }, [index, goTo]);

  const slide = SLIDES[index];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Illustration placeholder: soft card with icon */}
      <div
        className="flex h-40 w-full max-w-xs items-center justify-center rounded-2xl border border-pink-100 bg-pink-50/50 shadow-md shadow-pink-100/60 sm:h-48"
        aria-hidden
      >
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-pink-400 shadow-sm ring-1 ring-pink-100 sm:h-24 sm:w-24">
          <Sparkles className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.5} />
        </span>
      </div>

      {/* Headline + subtext */}
      <h2 className="mt-6 text-center text-xl font-semibold text-slate-900 sm:text-2xl">
        {slide.headline}
      </h2>
      <p className="mt-2 text-center text-base text-slate-600 sm:text-lg">
        {slide.subtext}
      </p>

      {/* Progress dots */}
      <div className="mt-6 flex gap-2" role="tablist" aria-label="Slide">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${
              i === index
                ? "w-6 bg-pink-500"
                : "w-2 bg-pink-200 hover:bg-pink-300"
            }`}
          />
        ))}
      </div>

      {/* Swipe hint: optional touch area for next/prev - we use dots for control */}
      <div
        className="mt-2 w-full max-w-xs touch-pan-y"
        onTouchStart={(e) => {
          const x = e.touches[0].clientX;
          (e.currentTarget as HTMLElement).dataset.startX = String(x);
        }}
        onTouchEnd={(e) => {
          const start = (e.currentTarget as HTMLElement).dataset.startX;
          if (start == null) return;
          const end = e.changedTouches[0].clientX;
          const diff = Number(start) - end;
          if (Math.abs(diff) > 50) {
            setIndex((i) => (diff > 0 ? Math.min(i + 1, SLIDES.length - 1) : Math.max(i - 1, 0)));
          }
        }}
        aria-hidden
      />
    </div>
  );
}
