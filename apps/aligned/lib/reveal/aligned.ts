import { tokenize } from "@/lib/issues/stopwords";

export type AlignedLevel = "none" | "aligned" | "deeplyAligned";

/**
 * Detects how many meaningful words two answer texts share.
 * "aligned"       = 2–3 shared words
 * "deeplyAligned" = 4+ shared words
 */
export function detectAligned(myText: string, partnerText: string): AlignedLevel {
  if (!myText || !partnerText) return "none";
  const myWords = new Set(tokenize(myText));
  const partnerWords = new Set(tokenize(partnerText));
  const shared = [...myWords].filter((w) => partnerWords.has(w));
  if (shared.length >= 4) return "deeplyAligned";
  if (shared.length >= 2) return "aligned";
  return "none";
}
