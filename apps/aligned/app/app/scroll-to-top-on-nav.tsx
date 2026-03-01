"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Scrolls the app's scroll container to top when the route changes.
 * Next.js only scrolls the window on navigation; our content scrolls inside #app-scroll,
 * so without this, the scroll position can stay put and the new page appears below the fold.
 */
export function ScrollToTopOnNav() {
  const pathname = usePathname();

  useEffect(() => {
    const el = document.getElementById("app-scroll");
    if (!el) return;
    // Run after paint so the new page content is in the DOM
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.scrollTo({ top: 0, behavior: "auto" });
      });
    });
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
