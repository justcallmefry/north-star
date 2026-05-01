"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import type { CoverGradient, IssueSection } from "@/lib/issues/types";
import { toggleIssueSaved } from "@/lib/issues/actions";
import { CoverSection } from "./sections/cover";
import { NumbersSection } from "./sections/numbers";
import { ThemesSection } from "./sections/themes";
import { AnswerOfWeekSection } from "./sections/answer-of-week";
import { AlignedOnSection } from "./sections/aligned-on";
import { SavedMomentSection } from "./sections/saved-moment";
import { NextDareSection } from "./sections/next-dare";
import { QuestionToSitWithSection } from "./sections/question-to-sit-with";
import { ColophonSection } from "./sections/colophon";

type Props = {
  issue: {
    id: string;
    issueNumber: number;
    volumeNumber: number;
    windowStart: Date;
    windowEnd: Date;
    publishedAt: Date;
    headline: string;
    coverPhotoUrl: string | null;
    coverGradient: CoverGradient | null;
    sections: IssueSection[];
    initialSaved: boolean;
  };
  partnerNames: { a: string; b: string };
};

export function IssueReader({ issue, partnerNames }: Props) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Scroll-reveal: add .is-visible to .mag-reveal elements as they intersect viewport.
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>(".mag-reveal"));
    if (typeof IntersectionObserver === "undefined") {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.18 }
    );
    items.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="magazine-frame" style={{ minHeight: "100vh" }}>
      <button
        type="button"
        onClick={() => router.push("/app/issues")}
        aria-label="Close issue"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          margin: 12,
          background: "rgba(250,247,242,0.9)",
          backdropFilter: "blur(6px)",
          border: "1px solid #e8e2d6",
          borderRadius: 999,
          padding: "8px 14px",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "'Helvetica Neue', sans-serif",
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#2d2d2d",
          cursor: "pointer",
        }}
      >
        <ChevronLeft size={14} strokeWidth={2} />
        Issues
      </button>

      <CoverSection
        headline={issue.headline}
        issueNumber={issue.issueNumber}
        volumeNumber={issue.volumeNumber}
        windowStart={issue.windowStart}
        windowEnd={issue.windowEnd}
        coverPhotoUrl={issue.coverPhotoUrl}
        coverGradient={issue.coverGradient}
        partnerNames={partnerNames}
      />

      {issue.sections.map((s, i) => {
        switch (s.kind) {
          case "numbers":
            return <NumbersSection key={i} {...s} />;
          case "themes":
            return <ThemesSection key={i} words={s.words} />;
          case "answerOfWeek":
            return (
              <AnswerOfWeekSection
                key={i}
                quote={s.quote}
                attributedTo={s.attributedTo}
                promptText={s.promptText}
                partnerNames={partnerNames}
              />
            );
          case "alignedOn":
            return <AlignedOnSection key={i} {...s} />;
          case "savedMoment":
          case "savedMomentFallback":
            return <SavedMomentSection key={i} {...s} />;
          case "nextDare":
            return <NextDareSection key={i} {...s} />;
          case "questionToSitWith":
            return <QuestionToSitWithSection key={i} text={s.text} />;
          default:
            return null;
        }
      })}

      <ColophonSection
        issueId={issue.id}
        initialSaved={issue.initialSaved}
        issueNumber={issue.issueNumber}
        volumeNumber={issue.volumeNumber}
        publishedAt={issue.publishedAt}
        onSaveToggle={toggleIssueSaved}
      />
    </div>
  );
}
