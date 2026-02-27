"use client";

type Props = {
  sessionId: string;
  size?: "sm" | "md";
  /** Use "secondary" when shown next to a primary action (e.g. View my answer) so hierarchy is clear */
  variant?: "primary" | "secondary";
  /** "reveal" = we both answered, nudge to reveal; default = waiting for partner to answer */
  messageType?: "your_turn" | "reveal";
};

const MESSAGES = {
  your_turn: "I answered today's question. It's your turn. I'm excited to see what you say.",
  reveal: "I answered the question. We both did – come reveal so we can see what we said.",
} as const;

export function NotifyPartnerButton({ sessionId, size = "md", variant = "primary", messageType = "your_turn" }: Props) {
  const baseText = MESSAGES[messageType];

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  const targetUrl = appUrl ? `${appUrl}/app/session/${sessionId}` : "";

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

  const baseClass = variant === "secondary" ? "ns-btn-secondary" : "ns-btn-primary";
  const className = size === "sm" ? `${baseClass} !px-3 !py-1.5 text-sm` : baseClass;

  return (
    <button type="button" onClick={handleClick} className={className}>
      Notify
    </button>
  );
}

