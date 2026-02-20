"use client";

import { useEffect } from "react";

/**
 * Injects iOS PWA meta tags into document.head. Next.js metadata doesn't expose
 * apple-mobile-web-app-capable or apple-mobile-web-app-status-bar-style, so we
 * add them client-side for "Add to Home Screen" behavior and status bar styling.
 */
export function ApplePwaMeta() {
  useEffect(() => {
    const tags = [
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
