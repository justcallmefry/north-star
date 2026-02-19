"use client";

type Props = {
  meetingId: string;
  size?: "sm" | "md";
};

export function NotifyPartnerMeetingButton({ meetingId, size = "md" }: Props) {
  const baseText = "I updated Our Week. Please feel free to add your thoughts.";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  const href = `sms:&body=${encodeURIComponent(
    `${baseText} ${appUrl ? `${appUrl}/app/meeting/${meetingId}` : ""}`.trim()
  )}`;

  const className = size === "sm" ? "ns-btn-primary !px-3 !py-1.5 text-sm" : "ns-btn-primary";

  return (
    <a href={href} className={className}>
      Notify
    </a>
  );
}

