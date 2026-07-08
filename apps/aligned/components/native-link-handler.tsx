"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

/**
 * Routes Universal Links inside the native app. When iOS opens Aligned via
 * an https://alignedconnectingcouples.com/... link (invite, session link
 * from a notification, etc.), Capacitor fires `appUrlOpen` — but with the
 * remote-server setup the WebView doesn't navigate by itself, so we do it.
 * No-op on the web.
 */
export function NativeLinkHandler() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    void import("@capacitor/app").then(({ App }) => {
      const sub = App.addListener("appUrlOpen", ({ url }) => {
        try {
          const parsed = new URL(url);
          // Only follow links on our own domain; keep path + query (invite codes).
          if (parsed.hostname.endsWith("alignedconnectingcouples.com")) {
            window.location.href = parsed.pathname + parsed.search;
          }
        } catch {
          // Malformed URL — ignore.
        }
      });
      cleanup = () => void sub.then((s) => s.remove());
    });

    return () => cleanup?.();
  }, []);

  return null;
}
