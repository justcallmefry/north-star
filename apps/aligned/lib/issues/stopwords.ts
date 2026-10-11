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
  // Filler that passes the length check but means nothing as "your word
  // this week" (the magazine once headlined "still"), nor as a sign two
  // answers aligned.
  "without","still","always","never","maybe","thing","things","something","anything",
  "everything","nothing","because","every","being","doing","going","getting","little",
  "other","there","these","those","which","while","after","before","through","again",
  "though","pretty","around","today","think","feel","felt","know","make","made","want",
  "good","time","about","even","much","most","many","only","over","into","than","back",
  "well","said","says","yeah","sure","kind","sort","lot","lots",
]);

/**
 * Tokenize free text into word tokens suitable for theme extraction.
 * Lowercases, strips non-alphanumeric, drops short words and stopwords.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\s+/)
    // Contractions ("that's", "don't", "we're") are filler. Stripping the
    // apostrophe used to turn them into fake words: the magazine once told
    // a couple they kept coming back to "thats".
    .filter((w) => !/['’]/.test(w))
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
}
