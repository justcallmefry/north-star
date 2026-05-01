import type { IssueSection } from "./types";

/**
 * The closing reflection prompt for the week ahead (§ VII).
 *
 * Phase 1: deterministic pick from a curated pool, hashed by relationshipId
 * + weekKey so each issue gets a different one but the same one is shown
 * to both partners.
 */
const POOL = [
  "What's something I've done this week that you almost said thank you for, but didn't?",
  "What's one small thing I've done lately that's actually a big thing to you?",
  "If you could replay one moment from this week and stay in it longer, which one?",
  "What's a question you'd want to be asked more often?",
  "When this week did you feel most like yourself?",
  "Is there anything I should know that you haven't said out loud yet?",
  "What's the smallest version of love you noticed this week?",
  "If we could trade one ritual for a better one, what would it be?",
];

export function pickQuestionToSitWith(
  relationshipId: string,
  weekKey: string
): Extract<IssueSection, { kind: "questionToSitWith" }> {
  let h = 0;
  const s = relationshipId + ":" + weekKey;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return { kind: "questionToSitWith", text: POOL[h % POOL.length]! };
}
