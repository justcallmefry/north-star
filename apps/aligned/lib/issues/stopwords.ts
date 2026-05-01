/**
 * Shared stopword list and tokenizer used by both the legacy Sunday Recap
 * and the new Magazine themes extractor. Lower-cased, length>3, alpha+digit only.
 */
export const STOPWORDS = new Set<string>([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","is","are",
  "was","were","be","been","have","has","had","do","does","did","will","would","could","should",
  "i","you","we","they","he","she","it","my","your","our","their","this","that","just","so",
  "not","no","if","as","me","him","us","them","very","really","get","got","go","some","any",
  "out","all","can","one","two","more","what","when","where","how","why","also","then","like",
]);

/**
 * Tokenize free text into word tokens suitable for theme extraction.
 * Lowercases, strips non-alphanumeric, drops short words and stopwords.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}
