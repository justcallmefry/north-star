"use client";

type Props = {
  meetingId: string;
  size?: "sm" | "md";
};

export function NotifyPartnerMeetingButton({ meetingId, size = "md" }: Props) {
  const baseText = "I updated Our Week. Please feel free to add your thoughts.";

  // Prefer current page origin so notify link always goes to the site the user is on (e.g. alignedconnectingcouples.com), not a build-time env.
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "");

  const targetUrl = appUrl ? `${appUrl}/app/meeting/${meetingId}` : "";

  async function handleClick(e: any) {
    e.preventDefault();
    const text = `${baseText} ${targetUrl}`.trim();

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          text,
          url: targetUrl || undefined,
        });
        return;
      } catch {
        // User cancelled or share failed; fall through to SMS fallback.
      }
    }

    const smsHref = `sms:&body=${encodeURIComponent(text)}`;
    if (typeof window !== "undefined") {
      window.location.href = smsHref;
    }
  }

  const className = size === "sm" ? "ns-btn-primary !px-3 !py-1.5 text-sm" : "ns-btn-primary";

  return (
    <button type="button" onClick={handleClick} className={className}>
      Notify
    </button>
  );
}

