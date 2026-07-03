"use client";

import { toast } from "sonner";
import { requestPermissionAndSubscribe } from "@/lib/push-client";

type Variant = "quiz" | "agreement" | "wyr";

const MESSAGES: Record<Variant, string> = {
  quiz: "I finished the daily quiz. Whenever you get a chance.",
  agreement: "I filled out the alignment questions. Take a look when you're ready.",
  wyr: "I made my pick on today's Would You Rather. Your turn — let's see if we match.",
};

const TITLES: Record<Variant, string> = {
  quiz: "Today's quiz is ready.",
  agreement: "Alignment check-in is ready.",
  wyr: "They picked — your turn.",
};

const PATHS: Record<Variant, string> = {
  quiz: "/app/quiz",
  agreement: "/app/agreement",
  wyr: "/app/wyr",
};

const LABELS: Record<Variant, string> = {
  quiz: "Notify partner",
  agreement: "Notify partner",
  wyr: "Nudge them",
};

type Props = {
  variant: Variant;
  /** Required for in-app push; when missing we only use Share/SMS */
  relationshipId?: string;
  size?: "sm" | "md";
};

export function NotifyPartnerQuizButton({ variant, relationshipId, size = "sm" }: Props) {
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");
  const path = PATHS[variant];
  const url = appUrl ? `${appUrl}${path}` : path;
  const message = MESSAGES[variant];

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();

    if (relationshipId && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      try {
        const subscribed = await requestPermissionAndSubscribe();
        if (subscribed) {
          const res = await fetch("/api/push/notify-partner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              relationshipId,
              title: TITLES[variant],
              body: message,
              url: path,
            }),
          });
          if (res.ok) {
            const data = (await res.json()) as { sent?: number };
            if (data.sent && data.sent > 0) {
              toast.success("Notification sent.");
              return;
            }
          }
        }
      } catch {
        // Fall through to Share/SMS
      }
    }

    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (o: { text: string; url?: string }) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (o: { text: string; url?: string }) => Promise<void> }).share({
          text: message,
          url: url || undefined,
        });
        return;
      } catch {
        // Fall through to SMS
      }
    }

    const smsBody = `${message} ${url}`.trim();
    const smsHref = `sms:&body=${encodeURIComponent(smsBody)}`;
    if (typeof window !== "undefined") window.location.href = smsHref;
  }

  const className =
    size === "sm"
      ? "ns-btn-primary inline-flex !px-3 !py-1.5 text-sm"
      : "ns-btn-primary inline-flex";

  return (
    <button type="button" onClick={handleClick} className={className}>
      {LABELS[variant]}
    </button>
  );
}
