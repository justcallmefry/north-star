"use client";

import { toast } from "sonner";
import { requestPermissionAndSubscribe } from "@/lib/push-client";

type Props = {
  sessionId: string;
  /** Required for in-app push; when missing we only use Share/SMS */
  relationshipId?: string;
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
  messageType?: "your_turn" | "reveal";
  className?: string;
};

const MESSAGES = {
  your_turn: "I already answered today's question. Whenever you're ready.",
  reveal: "We both answered. Come see what each other wrote.",
} as const;

const TITLES = {
  your_turn: "They're curious what you'll say.",
  reveal: "You're both in.",
} as const;

export function NotifyPartnerButton({
  sessionId,
  relationshipId,
  size = "md",
  variant = "primary",
  messageType = "your_turn",
  className: extraClass,
}: Props) {
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");
  const targetUrl = appUrl ? `${appUrl}/app/session/${sessionId}` : "";
  const baseText = MESSAGES[messageType];

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
              title: TITLES[messageType],
              body: baseText,
              url: `/app/session/${sessionId}`,
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

    const text = `${baseText} ${targetUrl}`.trim();
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (o: { text: string; url?: string }) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (o: { text: string; url?: string }) => Promise<void> }).share({
          text,
          url: targetUrl || undefined,
        });
        return;
      } catch {
        // User cancelled or share failed; fall through to SMS.
      }
    }

    const smsHref = `sms:&body=${encodeURIComponent(text)}`;
    if (typeof window !== "undefined") window.location.href = smsHref;
  }

  const baseClass = variant === "secondary" ? "ns-btn-secondary" : "ns-btn-primary";
  const sizeClass = size === "sm" ? "!px-3 !py-1.5 text-sm" : "";
  const className = [baseClass, sizeClass, extraClass].filter(Boolean).join(" ");

  return (
    <button type="button" onClick={handleClick} className={className}>
      Notify
    </button>
  );
}
