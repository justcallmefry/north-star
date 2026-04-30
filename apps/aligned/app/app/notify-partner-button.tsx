"use client";

import { toast } from "sonner";
import { requestPermissionAndSubscribe } from "@/lib/push-client";
import { haptic } from "@/lib/haptics";

type Props = {
  sessionId: string;
  /** Required for in-app push; when missing we only use Share/SMS */
  relationshipId?: string;
  /** Partner's first name — used to personalise notification copy */
  partnerName?: string | null;
  size?: "sm" | "md";
  variant?: "primary" | "secondary";
  messageType?: "your_turn" | "reveal";
  className?: string;
};

function getMessages(partnerName?: string | null) {
  const them = partnerName ? partnerName : null;
  return {
    your_turn: {
      title: them ? `${them} answered — your turn` : "Your turn",
      body: them
        ? `${them} just answered today's question and is waiting on you.`
        : "Your partner answered today's question and is waiting on you.",
      sms: them
        ? `${them} answered today's question — it's your turn.`
        : "I answered today's question — your turn.",
    },
    reveal: {
      title: "You're both in — ready to reveal?",
      body: them
        ? `${them} answered. You're both in. Come see what they wrote.`
        : "You both answered. Come reveal your answers together.",
      sms: them
        ? `We both answered. Come reveal — I want to see what you said.`
        : "We both answered. Come reveal together.",
    },
  } as const;
}

export function NotifyPartnerButton({
  sessionId,
  relationshipId,
  partnerName,
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
  const messages = getMessages(partnerName);
  const msg = messages[messageType];

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    void haptic("tap");

    if (relationshipId && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      try {
        const subscribed = await requestPermissionAndSubscribe();
        if (subscribed) {
          const res = await fetch("/api/push/notify-partner", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              relationshipId,
              title: msg.title,
              body: msg.body,
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

    const text = `${msg.sms} ${targetUrl}`.trim();
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
    <button type="button" onClick={handleClick} className={`${className} transition active:scale-[0.98]`}>
      Notify
    </button>
  );
}
