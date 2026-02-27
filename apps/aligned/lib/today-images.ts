/**
 * Today-images paths and deterministic pick for SSR. Used so server and client
 * render the same image URLs and avoid hydration mismatch (no Math.random in the tree).
 */

export const TODAY_IMAGE_PATHS = [
  "/today-images/1.jpg",
  "/today-images/2.jpg",
  "/today-images/3.jpg",
  "/today-images/4.jpg",
  "/today-images/5.jpg",
  "/today-images/6.jpg",
  "/today-images/7.jpg",
  "/today-images/8.jpg",
];

/** Simple seeded RNG so shuffle is deterministic for a given seed (e.g. date string). */
function seededRng(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return function next() {
    h = Math.imul(1664525, h) + 1013904223;
    return (h >>> 0) / 4294967296;
  };
}

/** Deterministic: shuffle with seed and return first n (no duplicates). Same seed → same result. */
export function pickDistinctSeeded(paths: string[], n: number, seed: string): string[] {
  const copy = [...paths];
  const rng = seededRng(seed);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}
