/**
 * Headline generator for Phase 1: deterministic template selection from a
 * small pool, with slot fill from the week's extracted data. AI-generated
 * headlines are Phase 2 (out of scope here).
 */

type HeadlineInput = {
  relationshipId: string;
  weekKey: string;
  topWords: string[];          // 0..3 entries
  bestMatchText: string | null;
};

type Template = {
  /** Returns null if this template can't render with the given input. */
  render: (i: HeadlineInput) => string | null;
};

const TEMPLATES: Template[] = [
  {
    render: (i) =>
      i.topWords[0] && i.topWords[1]
        ? `A week of ${i.topWords[0]} and ${i.topWords[1]}.`
        : null,
  },
  {
    render: (i) => (i.topWords[0] ? `${capitalize(i.topWords[0])}, mostly.` : null),
  },
  {
    render: (i) =>
      i.topWords[0]
        ? `You both kept coming back to ${i.topWords[0]}.`
        : null,
  },
  {
    render: (i) => (i.bestMatchText ? `The week of "${i.bestMatchText}".` : null),
  },
  {
    render: () => "Some weeks are quiet. This was one of them.",
  },
];

export function pickHeadline(input: HeadlineInput): string {
  let h = 0;
  const s = input.relationshipId + ":" + input.weekKey;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const startIdx = h % TEMPLATES.length;

  for (let offset = 0; offset < TEMPLATES.length; offset++) {
    const idx = (startIdx + offset) % TEMPLATES.length;
    const out = TEMPLATES[idx]!.render(input);
    if (out) return out;
  }
  return "A week together.";
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}
