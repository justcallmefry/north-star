import { STOPWORDS } from "@/lib/issues/stopwords";

/**
 * Relaxed tokenizer for guess matching. Same stopword list as the shared
 * `tokenize()`, but keeps short meaningful words ("dog", "sun", "ski") —
 * a guessed word should never silently fail just because it's short.
 */
function tokenizeLoose(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

/**
 * "Called it" detection for the daily-question word guess.
 * Returns the meaningful words from the user's guess that also appear in
 * the partner's revealed answer. Empty array = no match — render gently,
 * never as failure.
 */
export function detectCalledIt(guess: string, partnerText: string): string[] {
  if (!guess || !partnerText) return [];
  const partnerWords = new Set(tokenizeLoose(partnerText));
  const guessWords = [...new Set(tokenizeLoose(guess))];
  return guessWords.filter((w) => partnerWords.has(w));
}
