"use client";

type Props = {
  meetingId: string;
  size?: "sm" | "md";
};

export function NotifyPartnerMeetingButton({ meetingId, size = "md" }: Props) {
  const baseText =
    "Hey love 💗 I just added notes to our North Star weekly check-in. Tap to read them or add yours:";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  const href = `sms:&body=${encodeURIComponent(
    `${baseText} ${appUrl ? `${appUrl}/app/meeting/${meetingId}` : ""}`.trim()
  )}`;

  const className =
    size === "sm"
      ? "inline-flex items-center justify-center rounded-lg bg-pink-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-pink-300/60 hover:bg-pink-400"
      : "inline-flex items-center justify-center rounded-lg bg-pink-500 px-4 py-2.5 text-base font-semibold text-white shadow-sm shadow-pink-300/60 hover:bg-pink-400";

  return (
    <a href={href} className={className}>
      Notify them
    </a>
  );
}

