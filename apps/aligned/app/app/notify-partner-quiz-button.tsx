"use client";

type Variant = "quiz" | "agreement";

const MESSAGES: Record<Variant, string> = {
  quiz: "I just finished the daily quiz — your turn! Think you can beat my score?",
  agreement: "I just finished the daily agreement — your turn! Curious how we'll match up.",
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
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "";
  const path = PATHS[variant];
  const url = baseUrl ? `${baseUrl}${path}` : path;
  const text = `${MESSAGES[variant]} ${url}`.trim();
  const href = `sms:&body=${encodeURIComponent(text)}`;

  const className =
    size === "sm"
      ? "ns-btn-primary inline-flex !px-3 !py-1.5 text-sm"
      : "ns-btn-primary inline-flex";

  return (
    <a href={href} className={className}>
      {LABELS[variant]}
    </a>
  );
}
