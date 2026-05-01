/**
 * Discriminated union of every section kind that can appear in an Issue.
 * The `sections` JSON column on the Issue table is `IssueSection[]`.
 *
 * Phase 1 ships only weekly issues, so kinds prefixed with `month*`/`year*`
 * are declared but unused until Phase 2/3.
 */
export type IssueSection =
  | { kind: "numbers"; daysAnswered: number; totalDays: number; streak: number; matches: number }
  | { kind: "themes"; words: string[] }
  | { kind: "answerOfWeek"; quote: string; attributedTo: "a" | "b"; promptText: string }
  | { kind: "alignedOn"; source: "wyr" | "quiz"; chosen: string; day: string; totalMatches: number }
  | { kind: "savedMoment"; photoUrl: string; caption: string; source: "dare" | "memory" }
  | { kind: "savedMomentFallback"; quote: string; attribution: string }
  | { kind: "nextDare"; title: string; description: string; duration: string }
  | { kind: "questionToSitWith"; text: string }
  | { kind: "monthInPictures"; photoUrls: string[] }
  | { kind: "mostAskedAbout"; category: string; count: number }
  | { kind: "yearInNumbers"; totalQuestions: number; totalMemories: number; totalMatches: number; longestStreak: number }
  | { kind: "twelvePhotos"; photosByMonth: Array<{ month: number; photoUrl: string | null }> }
  | { kind: "fiveBestAnswers"; quotes: Array<{ quote: string; attributedTo: "a" | "b"; promptText: string }> }
  | { kind: "howYouChanged"; earlyCategory: string; recentCategory: string; depthDelta: number };

/** Stored on Issue.coverGradient when no photo is available. */
export type CoverGradient = { primary: string; secondary: string };

/** Cadence values mirror the Prisma enum for use in TypeScript-only code. */
export type IssueCadence = "weekly" | "monthly" | "yearly" | "milestone";
