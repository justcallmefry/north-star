"use client";

type Props = {
  sessionId: string;
  size?: "sm" | "md";
};

export function NotifyPartnerButton({ sessionId, size = "md" }: Props) {
  const baseText =
    "Hey love 💗 I just answered our North Star question of the day. Tap to answer yours so we can reveal it together:";

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  const href = `sms:&body=${encodeURIComponent(
    `${baseText} ${appUrl ? `${appUrl}/app/session/${sessionId}` : ""}`.trim()
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

