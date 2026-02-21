"use client";

import { useEffect } from "react";

/**
 * Injects PWA meta tags into document.head. Next.js metadata doesn't expose
 * these, so we add them client-side for "Add to Home Screen" and status bar styling.
 * Use mobile-web-app-capable (standard) and keep apple-* for Safari.
 */
export function ApplePwaMeta() {
  useEffect(() => {
    const tags = [
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ];
    tags.forEach(({ name, content }) => {
      if (document.querySelector(`meta[name="${name}"]`)) return;
      const meta = document.createElement("meta");
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    });
  }, []);
  return null;
}
