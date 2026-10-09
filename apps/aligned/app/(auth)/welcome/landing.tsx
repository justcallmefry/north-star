import Link from "next/link";
import Image from "next/image";
import { LandingDemo } from "./landing-demo";

/**
 * The public landing page at alignedconnectingcouples.com.
 *
 * Replaces a sign-in form that explained the product in four bullet points.
 * Three jobs, in order: demonstrate the mechanic (the demo does the arguing),
 * show what the ritual leaves behind, and state the price plainly — the
 * category's most common review complaint is being surprised by a paywall.
 *
 * Deliberately no database call, matching the previous page: this URL is the
 * App Store support URL and every marketing link, so it must never fail to
 * render.
 */

const HOW = [
  {
    n: "01",
    title: "A question arrives each evening",
    body: "One. Not a feed, not a course. Three minutes, then you're done.",
  },
  {
    n: "02",
    title: "You both answer privately",
    body: "Neither of you can see the other's answer. That's what makes people honest.",
  },
  {
    n: "03",
    title: "It opens for both of you at once",
    body: "Shared words light up. Some nights you find you said the same thing.",
  },
] as const;

const KEEPS = [
  {
    title: "A sky that grows",
    body: "Every day you both show up places a star. Miss a week and it stays exactly where it was — it measures showing up, not perfection.",
  },
  {
    title: "A magazine, every Sunday",
    body: "Written from your own week: the answers worth keeping, the moments you saved, one question to sit with.",
  },
  {
    title: "A book you can print",
    body: "Every day you've both answered, set like a real book. Some couples give it as an anniversary present.",
  },
] as const;

export function Landing({
  loginHref,
  signupHref,
}: {
  loginHref: string;
  signupHref: string;
}) {
  return (
    <main className="min-h-screen bg-cream-50 text-[#2b2620]">
      {/* ── Nav ───────────────────────────────────────────────── */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
        <div className="relative h-9 w-32 sm:h-10 sm:w-36">
          <Image
            src="/aligned-connecting-couples-logo.png"
            alt="Aligned"
            fill
            className="object-contain object-left"
            sizes="9rem"
            priority
          />
        </div>
        <a
          href={loginHref}
          className="rounded-full border border-cream-200 bg-white/70 px-4 py-2 text-sm font-medium text-[#5b5348] transition hover:border-cream-300 hover:text-[#2b2620]"
        >
          Sign in
        </a>
      </header>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden px-5 pb-16 pt-6 sm:pt-10"
        style={{
          background:
            "radial-gradient(1100px 620px at 88% -8%, #F6EBDB 0%, rgba(246,235,219,0) 58%), radial-gradient(900px 540px at -10% 104%, #F0EDE2 0%, rgba(240,237,226,0) 52%)",
        }}
      >
        <div className="mx-auto grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="inline-flex items-center rounded-full bg-peach-300/40 px-3 py-1 text-[11.5px] font-bold uppercase tracking-[0.14em] text-peach-600 ring-1 ring-peach-300/60">
              Free to start · 3 min a night
            </p>
            <h1 className="mt-5 text-balance font-prompt text-[38px] font-semibold leading-[1.08] tracking-tight sm:text-[52px]">
              One question a night.
              <br />
              Answered in secret.
              <br />
              Revealed together.
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-[#5b5348]">
              You and your partner answer the same question without seeing each
              other&rsquo;s reply. When you&rsquo;ve both written, it opens at
              the same moment. Most couples learn something new in the first week.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={signupHref}
                className="rounded-full bg-dusk-500 px-7 py-4 text-center text-[15.5px] font-semibold text-cream-50 shadow-sm transition active:scale-[0.98] hover:bg-dusk-600"
              >
                Start tonight&rsquo;s question
              </a>
              <span className="text-center text-[13.5px] text-slate-500 sm:text-left">
                No credit card. Works with a skeptical partner.
              </span>
            </div>
          </div>

          {/* The demo argues better than any paragraph can. */}
          <div className="flex justify-center lg:justify-end">
            <LandingDemo />
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────── */}
      <section className="border-t border-cream-200 px-5 py-16">
        <div className="mx-auto w-full max-w-5xl">
          <h2 className="font-prompt text-[27px] font-semibold sm:text-[31px]">
            How the night goes
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {HOW.map((step) => (
              <div key={step.n}>
                <p className="font-prompt text-[15px] font-semibold text-peach-600">
                  {step.n}
                </p>
                <h3 className="mt-2 text-[17px] font-semibold">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#5b5348]">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What it becomes ───────────────────────────────────── */}
      <section className="px-5 pb-16">
        <div
          className="mx-auto w-full max-w-5xl rounded-[32px] px-6 py-14 text-cream-50 sm:px-12"
          style={{
            background:
              "radial-gradient(820px 820px at 76% 6%, #25567C 0%, rgba(37,86,124,0) 62%), linear-gradient(180deg, #143452 0%, #0F2740 100%)",
          }}
        >
          <h2 className="max-w-xl text-balance font-prompt text-[27px] font-semibold leading-tight sm:text-[34px]">
            Three minutes a night that turn into something you keep.
          </h2>
          <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-[#B9CFE0]">
            Most apps take your time and give nothing back. This one keeps a
            record of the two of you, in your own words.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {KEEPS.map((item) => (
              <div key={item.title}>
                <h3 className="font-prompt text-[19px] font-semibold text-peach-300">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-[14.5px] leading-relaxed text-[#B9CFE0]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Price + privacy ───────────────────────────────────── */}
      <section className="border-t border-cream-200 px-5 py-16">
        <div className="mx-auto grid w-full max-w-5xl gap-10 sm:grid-cols-2">
          <div>
            <h2 className="font-prompt text-[25px] font-semibold sm:text-[29px]">
              What it costs
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[#5b5348]">
              <strong className="font-semibold text-[#2b2620]">Nothing.</strong>{" "}
              Everything in Aligned is free for both of you: the daily question,
              the reveal, your streak, the Sunday magazine and your book. No
              card, no trial.
            </p>
            <p className="mt-3 text-[14.5px] text-slate-500">
              If we ever add a paid tier, the daily question and the reveal stay
              free, and we&rsquo;ll tell you before anything changes.
            </p>
          </div>
          <div>
            <h2 className="font-prompt text-[25px] font-semibold sm:text-[29px]">
              Who can read it
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[#5b5348]">
              Only the two of you. There is no feed, no ads, and nothing you
              write is sold or used to advertise to you. Notifications are only
              ever about your own partner.
            </p>
            <p className="mt-3 text-[14.5px] text-slate-500">
              You can delete your account, and everything in it, from inside the app.
            </p>
          </div>
        </div>
      </section>

      {/* ── Close ─────────────────────────────────────────────── */}
      <section className="border-t border-cream-200 px-5 py-16 text-center">
        <h2 className="mx-auto max-w-lg text-balance font-prompt text-[28px] font-semibold leading-tight sm:text-[34px]">
          Ask them something real tonight.
        </h2>
        <a
          href={signupHref}
          className="mt-7 inline-block rounded-full bg-dusk-500 px-8 py-4 text-[15.5px] font-semibold text-cream-50 shadow-sm transition active:scale-[0.98] hover:bg-dusk-600"
        >
          Start tonight&rsquo;s question
        </a>
        <p className="mt-4 text-[13.5px] text-slate-500">
          Already have an account?{" "}
          <a href={loginHref} className="font-medium text-peach-600 underline underline-offset-4">
            Sign in
          </a>
        </p>
      </section>

      <footer className="border-t border-cream-200 px-5 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-3 text-[13px] text-slate-500 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Aligned</p>
          <nav className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-[#2b2620]">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#2b2620]">
              Terms
            </Link>
            <a href="mailto:support@alignedconnectingcouples.com" className="hover:text-[#2b2620]">
              Support
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
