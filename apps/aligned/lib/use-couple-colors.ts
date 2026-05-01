"use client";

import { useMemo } from "react";
import { getCouplePalette, type CouplePalette } from "./couple-colors";

export function useCoupleColors(
  relationshipId: string | null | undefined
): CouplePalette {
  return useMemo(() => getCouplePalette(relationshipId), [relationshipId]);
}
