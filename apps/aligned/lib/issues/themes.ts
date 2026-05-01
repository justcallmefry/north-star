import { tokenize } from "./stopwords";

/**
 * Extract the top-N most frequent meaningful words across the supplied texts.
 * Ties are broken by first-occurrence (insertion-stable).
 *
 * Returns up to N words. May return fewer if the texts have insufficient
 * unique meaningful tokens — callers should handle the empty/short case.
 */
export function topWords(texts: string[], n = 3): string[] {
  const counts = new Map<string, number>();
  for (const t of texts) {
    for (const w of tokenize(t)) {
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1]) // Map iteration is insertion-ordered, so equal counts stay stable
    .slice(0, n)
    .map(([w]) => w);
}
