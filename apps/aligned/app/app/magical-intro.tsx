"use client";

import Image from "next/image";
import { useEffect } from "react";

type Props = {
  onComplete: () => void;
  /** Duration in ms; should match CSS animation (2.1s = 2100) */
  duration?: number;
};

/**
 * Full-card intro: logo appears, grows toward you, then flies off screen.
 * Call onComplete when done so parent can show the main content.
 */
export function MagicalIntro({ onComplete, duration = 2100 }: Props) {
  useEffect(() => {
    const t = setTimeout(onComplete, duration);
    return () => clearTimeout(t);
  }, [onComplete, duration]);

  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center py-12"
      aria-hidden
    >
      <div
        className="animate-magical-logo flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-28"
        style={{ willChange: "transform, opacity" }}
      >
        <Image
          src="/aligned-icon.png"
          alt=""
          width={112}
          height={112}
          className="h-full w-full object-contain drop-shadow-lg"
        />
      </div>
    </div>
  );
}
