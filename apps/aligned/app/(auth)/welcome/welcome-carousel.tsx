"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

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
      {/* Aligned logo */}
      <div
        className="ns-shadow-glow flex h-40 w-full max-w-xs items-center justify-center rounded-2xl border border-brand-100/80 bg-gradient-to-b from-white/95 to-brand-50/40 sm:h-48"
        aria-hidden
      >
        <div className="relative h-28 w-28 sm:h-32 sm:w-32">
          <Image
            src="/aligned-icon.png"
            alt=""
            fill
            className="object-contain"
            sizes="(max-width: 640px) 112px, 128px"
          />
        </div>
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
                ? "w-6 bg-brand-500"
                : "w-2 bg-brand-200 hover:bg-brand-300"
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
