"use client";

type Variant = "quiz" | "agreement";

const MESSAGES: Record<Variant, string> = {
  quiz: "I just finished the daily quiz — your turn! Think you can beat my score?",
  agreement: "I just finished our alignment check-in — your turn! Curious how we'll match up.",
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
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  const path = PATHS[variant];
  const url = baseUrl ? `${baseUrl}${path}` : path;
  const text = `${MESSAGES[variant]} ${url}`.trim();

  async function handleClick(e: any) {
    e.preventDefault();

    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({
          text,
          url: url || undefined,
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
