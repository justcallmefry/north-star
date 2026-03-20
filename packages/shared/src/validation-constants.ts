/** Allowed emoji reactions (exact set). Max 2 per response per viewer. */
export const VALIDATION_ALLOWED_EMOJIS = ["❤️", "🫶", "😌", "🥺", "😂"] as const;

export const VALIDATION_ACK_MAX_LENGTH = 100;

export type ResponseValidationData = {
  reactions: string | null;
  acknowledgment: string | null;
};

const ALLOWED_REACTION_SET = new Set<string>(VALIDATION_ALLOWED_EMOJIS);

/** Longest-first for prefix parsing (handles multi-codepoint emojis like ❤️). */
const EMOJIS_LONGEST_FIRST = [...VALIDATION_ALLOWED_EMOJIS].sort(
  (a, b) => b.length - a.length || [...b].length - [...a].length
);

type IntlWithSegmenter = typeof Intl & {
  Segmenter: new (locales?: string | string[], options?: { granularity: string }) => {
    segment(input: string): Iterable<{ segment: string }>;
  };
};

/**
 * Parse stored reaction string (concatenated emojis, no separator) into up to 2 allowed emojis.
 * Prefer longest-prefix matching first (matches how we save `emojiList.join("")`); some runtimes'
 * Intl.Segmenter splits codepoints in ways that no longer match our allowlist exactly, which
 * previously hid reactions in the UI.
 */
export function parseValidationReactions(s: string | null): string[] {
  if (!s) return [];

  const result: string[] = [];
  let rest = s.trim();
  while (rest.length > 0 && result.length < 2) {
    const found = EMOJIS_LONGEST_FIRST.find((e) => rest.startsWith(e));
    if (!found) break;
    result.push(found);
    rest = rest.slice(found.length);
  }
  if (result.length > 0) return result;

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    try {
      const { Segmenter } = Intl as IntlWithSegmenter;
      const seg = new Segmenter(undefined, { granularity: "grapheme" });
      const out: string[] = [];
      for (const { segment } of seg.segment(s)) {
        const g = segment.trim();
        if (!g) continue;
        if (ALLOWED_REACTION_SET.has(g)) {
          out.push(g);
          if (out.length >= 2) return out;
        }
      }
      if (out.length > 0) return out;
    } catch {
      // ignore
    }
  }

  return [];
}
