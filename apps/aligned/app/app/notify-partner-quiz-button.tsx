"use client";

type Variant = "quiz" | "agreement";

const MESSAGES: Record<Variant, string> = {
  quiz: "I just finished the daily quiz — your turn! Think you can beat my score?",
  agreement: "I just took the questions about being aligned. Take a look and let's see who gets closest to each other's answers.",
};

const LABELS: Record<Variant, string> = {
  quiz: "Notify partner",
  agreement: "Notify partner",
};

const PATHS: Record<Variant, string> = {
  quiz: "/app/quiz",
  agreement: "/app/agreement",
};

type Props = {
  variant: Variant;
  size?: "sm" | "md";
};

export function NotifyPartnerQuizButton({ variant, size = "md" }: Props) {
  const baseUrl = "https://alignedconnectingcouples.com";
  const path = PATHS[variant];
  const url = baseUrl ? `${baseUrl}${path}` : path;
  const message = MESSAGES[variant];

  async function handleClick(e: any) {
    e.preventDefault();

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          text: message,
          url: url || undefined,
        });
        return;
      } catch {
        // User cancelled or share failed; fall through to SMS fallback.
      }
    }

    const smsBody = `${message} ${url}`.trim();
    const smsHref = `sms:&body=${encodeURIComponent(smsBody)}`;
    if (typeof window !== "undefined") {
      window.location.href = smsHref;
    }
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
