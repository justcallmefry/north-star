import Link from "next/link";

/**
 * Anything that isn't a page. Shown instead of Next's default black-on-white
 * 404, which inside the iOS app read as a crash.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-cream-50 px-6 text-[#2b2620]">
      <div className="max-w-sm text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-peach-600">Not found</p>
        <h1 className="mt-3 font-prompt text-[28px] font-semibold leading-tight">
          This page wandered off.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#5b5348]">
          The link may be old, or the page may have moved. Tonight&rsquo;s question is right where
          you left it.
        </p>
        <Link
          href="/app"
          className="mt-7 inline-block rounded-full bg-dusk-500 px-7 py-3.5 text-[15px] font-semibold text-cream-50 transition active:scale-[0.98] hover:bg-dusk-600"
        >
          Back to today
        </Link>
      </div>
    </main>
  );
}
