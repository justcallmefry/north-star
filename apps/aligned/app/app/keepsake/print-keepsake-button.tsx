"use client";

import { Printer } from "lucide-react";

/** Browser print → paper or "Save as PDF". The page's print CSS does the rest. */
export function PrintKeepsakeButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="ns-btn-primary inline-flex items-center gap-2 !px-4 !py-2.5 text-sm transition active:scale-[0.98]"
    >
      <Printer className="h-4 w-4" aria-hidden />
      Print or save as PDF
    </button>
  );
}
