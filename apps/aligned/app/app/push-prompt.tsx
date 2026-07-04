"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Bell, X } from "lucide-react";
import { requestPermissionAndSubscribe, hasPushSubscription } from "@/lib/push-client";

const DISMISSED_KEY = "push-prompt-dismissed";

export function PushPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // The native app has no `window.Notification` at all (that's a browser
    // API a WKWebView doesn't implement) — those checks only make sense
    // on the web path; native gates on OS permission state instead, inside
    // hasPushSubscription()/requestPermissionAndSubscribe().
    if (!Capacitor.isNativePlatform()) {
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") return;
      if (Notification.permission === "denied") return;
    }

    hasPushSubscription().then((has) => {
      if (!has) setShow(true);
    });
  }, []);

  if (!show) return null;

  async function handleEnable() {
    setLoading(true);
    const success = await requestPermissionAndSubscribe();
    if (success) {
      setShow(false);
    } else {
      // Denied or failed — dismiss so we don't pester them
      localStorage.setItem(DISMISSED_KEY, "1");
      setShow(false);
    }
    setLoading(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 mt-0.5">
        <Bell className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">Know when they answer.</p>
        <p className="text-xs text-slate-500 mt-0.5">Get a quiet nudge when your partner replies — no other alerts.</p>
        <button
          type="button"
          onClick={handleEnable}
          disabled={loading}
          className="mt-2 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition disabled:opacity-60"
        >
          {loading ? "Enabling…" : "Enable notifications"}
        </button>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-brand-100 text-slate-400 mt-0.5"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
