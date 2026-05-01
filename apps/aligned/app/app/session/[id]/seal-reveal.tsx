"use client";

import { useEffect, useState } from "react";

/**
 * The Seal — wax-sealed envelope reveal animation.
 *
 * Auto-plays on mount: brief sealed-state beat, then wax cracks, flap opens,
 * envelope collapses to nothing. Total ~1.3s after open trigger.
 *
 * Sync `AFTER_REVEAL_PAUSE_MS` in `session-content.tsx` to ≥1400ms so the
 * envelope finishes collapsing before the answers cascade in.
 */
export function SealReveal() {
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpened(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`seal-scene flex min-h-[12rem] items-center justify-center py-6 ${opened ? "seal-opened" : ""}`}
      role="img"
      aria-label="Opening sealed answers"
    >
      <div className="seal-envelope">
        <div className="seal-envelope-body" aria-hidden />
        <div className="seal-envelope-flap" aria-hidden />
        <div className="seal-wax" aria-hidden>
          <svg viewBox="0 0 56 56" width="56" height="56" xmlns="http://www.w3.org/2000/svg">
            <g className="seal-wax-half seal-wax-half-left">
              <path d="M28 4 C28 4 14 8 8 18 C4 24 4 28 4 28 L28 28 Z" fill="#c0392b" />
              <path d="M28 52 C28 52 14 48 8 38 C4 32 4 28 4 28 L28 28 Z" fill="#922b21" />
              <path d="M28 28 L4 28 C4 28 8 22 14 18 L28 28Z" fill="#a93226" opacity="0.5" />
            </g>
            <g className="seal-wax-half seal-wax-half-right">
              <path d="M28 4 C28 4 42 8 48 18 C52 24 52 28 52 28 L28 28 Z" fill="#c0392b" />
              <path d="M28 52 C28 52 42 48 48 38 C52 32 52 28 52 28 L28 28 Z" fill="#922b21" />
              <path d="M28 28 L52 28 C52 28 48 22 42 18 L28 28Z" fill="#a93226" opacity="0.5" />
            </g>
            <circle cx="28" cy="28" r="20" stroke="rgba(255,200,180,0.3)" strokeWidth="1" fill="none" />
            <circle className="seal-particle" cx="28" cy="28" r="2.5" style={{ fill: "#c0392b" }} />
            <circle className="seal-particle" cx="28" cy="28" r="2.5" style={{ fill: "#e74c3c" }} />
            <circle className="seal-particle" cx="28" cy="28" r="2.5" style={{ fill: "#a93226" }} />
            <circle className="seal-particle" cx="28" cy="28" r="3" style={{ fill: "#d44000" }} />
            <circle className="seal-particle" cx="28" cy="28" r="2" style={{ fill: "#c0392b" }} />
          </svg>
        </div>
      </div>
    </div>
  );
}
