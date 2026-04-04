"use client";

import { toast } from "sonner";
import { requestPermissionAndSubscribe } from "@/lib/push-client";

type Variant = "quiz" | "agreement";

const MESSAGES: Record<Variant, string> = {
  quiz: "I finished Guess & compare on Aligned—your turn. Let's see who reads who best.",
  agreement: "I finished Same page? on Aligned—your turn when you have a minute.",
};

const TITLES: Record<Variant, string> = {
  quiz: "Your turn — compare",
  agreement: "Your turn — same page",
};

const PATHS: Record<Variant, string> = {
  quiz: "/app/quiz",
  agreement: "/app/agreement",
};

const LABELS: Record<Variant, string> = {
  quiz: "Nudge partner",
  agreement: "Nudge partner",
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
              toast.success("They'll get a nudge.");
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
      : "ns-btn-primary flex w-full justify-center items-center gap-2 !py-2.5 text-sm";

  return (
    <button type="button" onClick={handleClick} className={className}>
      {LABELS[variant]}
    </button>
  );
}
