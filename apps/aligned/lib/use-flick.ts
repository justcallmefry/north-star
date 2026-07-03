"use client";

import { useRef, useState } from "react";
import type React from "react";

export type FlickHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
  onClickCapture: (e: React.MouseEvent) => void;
};

export type Flick = {
  /** Current horizontal drag offset in px (0 at rest). */
  dx: number;
  /** True while the pointer is down and moving the card. */
  dragging: boolean;
  /** True when the drag has passed the flick threshold (for affordance styling). */
  pastThreshold: boolean;
  handlers: FlickHandlers;
};

const AXIS_LOCK_PX = 8;
const CLICK_SUPPRESS_PX = 10;

/**
 * Horizontal flick gesture on a card. Vertical movement stays free so page
 * scrolling isn't hijacked (pair with `touch-action: pan-y` on the element).
 * Calls `onFlick` when released past the threshold; otherwise the caller
 * springs the card back (dx returns to 0 — style it with .wyr-spring-back).
 */
export function useFlick(opts: {
  disabled?: boolean;
  /** Px of horizontal travel that counts as a flick. Default 90. */
  threshold?: number;
  onFlick: (dir: "left" | "right") => void;
}): Flick {
  const { disabled = false, threshold = 90, onFlick } = opts;
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<"h" | "v" | null>(null);
  const moved = useRef(0);

  function reset() {
    start.current = null;
    axis.current = null;
    setDragging(false);
    setDx(0);
  }

  const handlers: FlickHandlers = {
    onPointerDown(e) {
      if (disabled) return;
      start.current = { x: e.clientX, y: e.clientY };
      axis.current = null;
      moved.current = 0;
    },
    onPointerMove(e) {
      if (disabled || !start.current) return;
      const ddx = e.clientX - start.current.x;
      const ddy = e.clientY - start.current.y;
      moved.current = Math.max(moved.current, Math.abs(ddx));

      if (!axis.current) {
        if (Math.abs(ddx) < AXIS_LOCK_PX && Math.abs(ddy) < AXIS_LOCK_PX) return;
        axis.current = Math.abs(ddx) > Math.abs(ddy) ? "h" : "v";
        if (axis.current === "h") {
          setDragging(true);
          (e.target as Element).setPointerCapture?.(e.pointerId);
        }
      }
      if (axis.current === "h") setDx(ddx);
    },
    onPointerUp() {
      if (disabled || !start.current) return;
      const finalDx = dx;
      const flicked = axis.current === "h" && Math.abs(finalDx) >= threshold;
      reset();
      if (flicked) onFlick(finalDx < 0 ? "left" : "right");
    },
    onPointerCancel() {
      reset();
    },
    // A real drag shouldn't also fire the card's tap action.
    onClickCapture(e) {
      if (moved.current > CLICK_SUPPRESS_PX) {
        e.preventDefault();
        e.stopPropagation();
      }
      moved.current = 0;
    },
  };

  return { dx, dragging, pastThreshold: Math.abs(dx) >= threshold, handlers };
}
