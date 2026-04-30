"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { NotifyPartnerButton } from "../../notify-partner-button";

const POLL_MS = 30_000;

type Props = {
  sessionId: string;
  relationshipId: string;
  partnerName: string | null;
  partnerImage: string | null;
  totalMembers: number;
};

export function WaitingForPartner({
  sessionId,
  relationshipId,
  partnerName,
  partnerImage,
  totalMembers,
}: Props) {
  const router = useRouter();

  // Poll for partner-answer state. Cheap — just refreshes the server component.
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [router]);

  const subjectName = partnerName?.trim() || (totalMembers === 2 ? "Your partner" : "Everyone else");
  const isPartnerAvatar =
    typeof partnerImage === "string" && partnerImage.trim().startsWith("http");
  const fallbackGlyph = "💜";

  return (
    <div
      className="flex flex-col items-center gap-5 rounded-2xl border border-brand-100/80 bg-white p-6 text-center sm:p-7"
      aria-live="polite"
    >
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span
          className="absolute inset-0 rounded-full bg-brand-300 animate-thinking-pulse"
          aria-hidden
        />
        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 ring-2 ring-white shadow-sm">
          {isPartnerAvatar ? (
            <img
              src={partnerImage!.trim()}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              width={64}
              height={64}
            />
          ) : (
            <span className="text-3xl" aria-hidden>{fallbackGlyph}</span>
          )}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-lg font-semibold text-slate-900 sm:text-xl">
          <span>{subjectName}</span>{" "}
          <span className="text-brand-700 animate-thinking-breath">is thinking…</span>
        </p>
        <p className="text-sm text-slate-600 sm:text-base">
          Your answer stays private until {totalMembers === 2 ? "they" : "everyone"} answers.
        </p>
      </div>

      <NotifyPartnerButton
        sessionId={sessionId}
        relationshipId={relationshipId}
        className="w-full py-3.5"
      />
    </div>
  );
}
