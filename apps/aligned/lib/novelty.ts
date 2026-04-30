// apps/aligned/lib/novelty.ts
// Pure word-set diff used to flag a partner's answer as containing
// content words they've never used in any past session for this couple.
// No AI, no DB. Server callers pass past texts directly.

const STOP_WORDS = new Set<string>([
  "the","a","an","and","or","but","if","then","else","when","while","of","in","on",
  "at","to","for","with","without","by","from","as","is","are","was","were","be",
  "been","being","do","does","did","doing","have","has","had","having","not","no",
  "yes","i","you","he","she","it","we","they","me","him","her","us","them","my",
  "your","his","its","our","their","this","that","these","those","there","here",
  "what","which","who","whom","whose","why","how","so","too","very","just","only",
  "really","quite","much","many","more","most","some","any","all","each","every",
  "few","both","other","another","such","same","also","into","about","like",
  "than","up","down","out","over","under","again","because","while","one","two",
  "three","four","five","six","seven","eight","nine","ten",
  "feel","felt","feels","feeling","think","thinks","thought","thinking",
  "want","wants","wanted","wanting","know","knows","knew","knowing",
  "love","loves","loved","loving",
  "say","said","says","saying","get","gets","got","getting","make","makes","made",
  "making","go","goes","went","going","come","comes","came","coming","take","takes",
  "took","taken","taking","see","sees","saw","seen","seeing","look","looks","looked",
  "looking","day","days","time","times","thing","things","way","ways","year","years",
]);

const MIN_WORD_LENGTH = 4;
const MIN_COMBINED_WORDCOUNT = 15;

function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function contentWords(tokens: string[]): string[] {
  return tokens.filter(
    (t) => t.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(t)
  );
}

/**
 * Returns up to 3 content words from `currentText` that do not appear in
 * any of `pastTexts`. Empty array means no novel words (or guard tripped).
 *
 * @param currentText      Partner's just-revealed answer
 * @param pastTexts        Partner's past answers (any historical responses)
 * @param userText         Current user's answer for the same session
 *                         (used only to bump combined wordcount guard)
 */
export function findNovelTags(
  currentText: string | null | undefined,
  pastTexts: (string | null | undefined)[],
  userText: string | null | undefined = null
): string[] {
  const currentTokens = tokenize(currentText);
  const userTokens = tokenize(userText);
  if (currentTokens.length + userTokens.length < MIN_COMBINED_WORDCOUNT) return [];

  const currentWords = contentWords(currentTokens);
  if (currentWords.length === 0) return [];

  const past = new Set<string>();
  for (const t of pastTexts) {
    for (const w of contentWords(tokenize(t))) past.add(w);
  }

  const seen = new Set<string>();
  const novel: string[] = [];
  for (const w of currentWords) {
    if (past.has(w)) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    novel.push(w);
    if (novel.length >= 3) break;
  }
  return novel;
}
