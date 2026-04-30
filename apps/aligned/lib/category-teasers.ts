/**
 * Short, vague-but-evocative phrases for the "tomorrow tease" push.
 * The whole point is to spark anticipation without spoiling the prompt —
 * say what kind of thing tomorrow's question is about, never the question itself.
 */
const TEASERS: Record<string, string> = {
  gratitude: "gratitude",
  communication: "something we don't always say",
  reflection: "something that's been on your mind",
  fun: "something playful",
  growth: "growing",
};

const FALLBACK = "something for the two of you";

export function teaserForCategory(category: string | null | undefined): string {
  if (!category) return FALLBACK;
  return TEASERS[category] ?? FALLBACK;
}
