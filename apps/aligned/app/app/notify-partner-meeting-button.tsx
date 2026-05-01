"use client";

import { toast } from "sonner";
import { requestPermissionAndSubscribe } from "@/lib/push-client";

type Props = {
  meetingId: string;
  /** Required for in-app push; when missing we only use Share/SMS */
  relationshipId?: string;
  size?: "sm" | "md";
};

const MESSAGE = "I added to Our Week. Add yours whenever you're ready.";

export function NotifyPartnerMeetingButton({
  meetingId,
  relationshipId,
  size = "md",
}: Props) {
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");
  const targetUrl = appUrl ? `${appUrl}/app/meeting/${meetingId}` : "";
  const path = `/app/meeting/${meetingId}`;

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
              title: "Our Week is updated.",
              body: MESSAGE,
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

    const text = `${MESSAGE} ${targetUrl}`.trim();
    if (typeof navigator !== "undefined" && (navigator as Navigator & { share?: (o: { text: string; url?: string }) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (o: { text: string; url?: string }) => Promise<void> }).share({
          text,
          url: targetUrl || undefined,
        });
        return;
      } catch {
        // Fall through to SMS
      }
    }

    const smsHref = `sms:&body=${encodeURIComponent(text)}`;
    if (typeof window !== "undefined") window.location.href = smsHref;
  }

  const className = size === "sm" ? "ns-btn-primary !px-3 !py-1.5 text-sm" : "ns-btn-primary";

  return (
    <button type="button" onClick={handleClick} className={className}>
      Notify
    </button>
  );
}
