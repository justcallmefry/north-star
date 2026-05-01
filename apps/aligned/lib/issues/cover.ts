import { getCouplePalette } from "@/lib/couple-colors";
import type { CoverGradient } from "./types";

/**
 * Decides the cover treatment for an Issue. If the saved-moment for this
 * window is a photo, that photo doubles as the cover. Otherwise, we fall
 * back to a gradient using the couple's deterministic color pair.
 */
export function chooseCover(
  relationshipId: string,
  candidatePhotoUrl: string | null
): { kind: "photo"; url: string } | { kind: "gradient"; gradient: CoverGradient } {
  if (candidatePhotoUrl) return { kind: "photo", url: candidatePhotoUrl };
  const palette = getCouplePalette(relationshipId);
  return {
    kind: "gradient",
    gradient: { primary: palette.primary, secondary: palette.secondary },
  };
}
