/**
 * Deterministic color pair per relationship.
 * Same relationshipId always produces the same two colors.
 * Pairs are pre-curated and accessible (≥4.5:1 against white background
 * for both colors used as text or border accents).
 *
 * The pool is small (~16 pairs) — couples get the feeling of "ours" without
 * us having to validate dynamic-HSL combinations for accessibility every time.
 */

export type CouplePalette = {
  /** First partner's accent — a hex string like "#1F4E73". */
  primary: string;
  /** Second partner's accent — also a hex string. */
  secondary: string;
  /** Human label for sharing/debugging. */
  label: string;
};

const PAIRS: ReadonlyArray<CouplePalette> = [
  { label: "Dusk & Peach",    primary: "#1F4E73", secondary: "#E07A5F" },
  { label: "Olive & Rose",    primary: "#5C7C4A", secondary: "#C9748A" },
  { label: "Plum & Mustard",  primary: "#5D3A66", secondary: "#C8A028" },
  { label: "Indigo & Coral",  primary: "#3D4A8A", secondary: "#E27D60" },
  { label: "Forest & Honey",  primary: "#345249", secondary: "#D4A24C" },
  { label: "Wine & Sage",     primary: "#7A2E3F", secondary: "#7A8C72" },
  { label: "Cobalt & Clay",   primary: "#1E468A", secondary: "#B86A4D" },
  { label: "Slate & Apricot", primary: "#3F4A57", secondary: "#E08E59" },
  { label: "Teal & Ember",    primary: "#1F605F", secondary: "#C9521E" },
  { label: "Mauve & Moss",    primary: "#7A4F6E", secondary: "#5F7A4E" },
  { label: "Navy & Saffron",  primary: "#0F2F5A", secondary: "#C68E2C" },
  { label: "Burgundy & Mint", primary: "#6E2731", secondary: "#5E8A7A" },
  { label: "Pine & Rust",     primary: "#1F4A3D", secondary: "#A85530" },
  { label: "Slate & Mauve",   primary: "#475569", secondary: "#A37087" },
  { label: "Forest & Sand",   primary: "#2C4D3A", secondary: "#B5905D" },
  { label: "Ink & Persimmon", primary: "#2A3A55", secondary: "#D46A3F" },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getCouplePalette(
  relationshipId: string | null | undefined
): CouplePalette {
  if (!relationshipId) return PAIRS[0]!;
  const idx = hashString(relationshipId) % PAIRS.length;
  return PAIRS[idx]!;
}
