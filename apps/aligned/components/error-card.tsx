"use client";

import Link from "next/link";

/** Shared body for the root and in-app error boundaries. */
export function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="max-w-sm text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-peach-600">
        Something went wrong
      </p>
      <h1 className="mt-3 font-prompt text-[28px] font-semibold leading-tight">
        That didn&rsquo;t load.
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[#5b5348]">
        Nothing you wrote has been lost. Try again, and if it keeps happening, head back to today.
      </p>
      <div className="mt-7 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="w-full max-w-[16rem] rounded-full bg-dusk-500 px-7 py-3.5 text-[15px] font-semibold text-cream-50 transition active:scale-[0.98] hover:bg-dusk-600"
        >
          Try again
        </button>
        <Link href="/app" className="text-[14px] font-medium text-peach-600 underline underline-offset-4">
          Back to today
        </Link>
      </div>
    </div>
  );
}
