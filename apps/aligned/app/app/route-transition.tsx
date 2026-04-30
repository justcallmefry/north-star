"use client";

import { usePathname } from "next/navigation";

/**
 * Cross-fades children whenever the route segment under /app/* changes.
 * Respects prefers-reduced-motion via the same media query the rest of
 * the app uses (the animation declaration in globals.css).
 */
export function RouteTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-route-fade-in">
      {children}
    </div>
  );
}
