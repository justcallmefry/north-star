import Link from "next/link";
import Image from "next/image";
import {
  Compass,
  Sparkles,
  Heart,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Minus,
  EyeOff,
  Shield,
} from "lucide-react";
import { BetaForm } from "@/components/marketing/beta-form";

const CONTAINER = "mx-auto max-w-5xl px-6 sm:px-10";

export default function MarketingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#020617] via-[#020617] to-[#020617] text-slate-100">
      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-[-120px] h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.25),_transparent_60%)] blur-3xl sm:-left-10 sm:top-[-160px]" />
        <div className="absolute right-[-120px] top-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,140,248,0.25),_transparent_60%)] blur-3xl sm:right-[-40px]" />
      </div>

      {/* Hero */}
      <header className="relative">
        <div className={`${CONTAINER} pt-10 pb-12 sm:pt-14 sm:pb-16`}>
          <div className="flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div className="space-y-4 md:max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200 backdrop-blur-md animate-fade-in-up">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-emerald-400/10 text-emerald-300">
                  <Sparkles className="h-3 w-3" />
                </span>
                <span>Private daily ritual for couples</span>
              </div>
              <div className="flex items-center justify-center md:justify-start animate-fade-in-up animate-delay-1">
                <Image
                  src="/north-star-logo.png"
                  alt="North Star"
                  width={112}
                  height={112}
                  className="h-20 w-20 object-contain sm:h-24 sm:w-24"
                  priority
                />
              </div>
              <h1 className="animate-fade-in-up animate-delay-1 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl md:text-6xl">
                Reconnect. Every single day.
              </h1>
              <p className="animate-fade-in-up animate-delay-2 text-base leading-relaxed text-slate-200 sm:text-lg">
                The private daily ritual for couples who want to stay close without the noise.
              </p>
              <p className="animate-fade-in-up animate-delay-3 text-sm leading-relaxed text-slate-400 sm:text-base">
                One shared question, answered in your own words, then revealed together when you’re
                both ready.
              </p>
              <div className="mt-5 flex w-full flex-col gap-3 sm:mt-7 sm:w-auto sm:flex-row sm:gap-4 animate-fade-in-up animate-delay-3">
                <Link
                  href="#beta"
                  className="inline-flex h-11 min-h-[2.75rem] items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-emerald-950 shadow-md shadow-emerald-500/30 transition hover:bg-emerald-400 sm:text-base"
                >
                  Request a Beta Invite
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex h-11 min-h-[2.75rem] items-center justify-center rounded-lg border border-white/10 bg-white/5 px-5 text-sm font-semibold text-slate-100 shadow-sm backdrop-blur-md transition hover:bg-white/10 sm:text-base"
                >
                  How it works
                </Link>
              </div>
            </div>

            <div className="mt-10 w-full max-w-sm md:mt-0 animate-fade-in-up animate-delay-2">
              <div className="relative mx-auto h-72 w-full max-w-xs sm:h-80">
                {/* Back phone */}
                <div className="absolute right-2 top-0 h-full w-40 rotate-6 rounded-3xl border border-white/10 bg-white/5 p-3 shadow-ns-card backdrop-blur-xl sm:w-44">
                  <div className="h-2 w-16 rounded-full bg-slate-700/60" />
                  <div className="mt-3 space-y-2 text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Today’s prompt
                    </p>
                    <p className="text-sm leading-relaxed text-slate-50">
                      “What’s one small thing you appreciated about your partner this week?”
                    </p>
                  </div>
                </div>
                {/* Front phone */}
                <div className="absolute left-0 bottom-0 h-full w-40 -rotate-3 rounded-3xl border border-white/10 bg-white/5 p-3 shadow-ns-card backdrop-blur-xl sm:w-44">
                  <div className="h-2 w-14 rounded-full bg-slate-700/60" />
                  <div className="mt-3 space-y-3 text-left">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      Connection moment
                    </p>
                    <div className="space-y-1 rounded-2xl bg-slate-900/70 p-3">
                      <p className="text-[11px] text-slate-400">You</p>
                      <p className="text-sm leading-relaxed text-slate-50">
                        “When you brought me coffee before my meeting. It made me feel really
                        supported.”
                      </p>
                    </div>
                    <div className="space-y-1 rounded-2xl bg-slate-900/40 p-3">
                      <p className="text-[11px] text-slate-400">Partner</p>
                      <p className="text-sm leading-relaxed text-slate-50">
                        “When we took a walk after dinner instead of watching TV.”
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={`${CONTAINER} space-y-6 pb-40 sm:space-y-8 sm:pb-32`}>
        {/* Mobile sticky CTA */}
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-4 pt-2 sm:px-6 md:hidden pointer-events-none">
          <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-white/10 bg-black/70 px-4 py-3 shadow-ns-card backdrop-blur-xl">
            <Link
              href="#beta"
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-emerald-950 shadow-md shadow-emerald-500/30 transition hover:bg-emerald-400"
            >
              Request a Beta Invite
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Wall of Love / Testimonials */}
        <section className="space-y-4 pt-2 sm:space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 sm:text-sm">
              Choose Love
            </p>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
              Wall of Love
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Real couples using North Star to stay close—without turning their relationship into
              another project.
            </p>
          </div>

          {/* Mobile: horizontal scroll-snap carousel */}
          <div className="mt-2 flex gap-4 overflow-x-auto pb-2 sm:pb-3 md:hidden snap-x snap-mandatory">
            {[
              {
                quote:
                  "I’ll be honest, I didn’t want to do this at first. I thought it was just another chore. But I realized how important it was to my wife, so I gave it a shot. After a couple of times, I realized it was actually super easy—took 30 seconds—and now I look forward to it every day.",
                author: "— Mark T., married 7 years",
              },
              {
                quote:
                  "We tried counseling, we tried date nights, but this is the only thing that has actually kept us consistent. It’s low pressure but high impact.",
                author: "— Sarah J.",
              },
              {
                quote:
                  "I love that I don’t have to come up with conversation starters anymore. The daily prompt does the heavy lifting for us.",
                author: "— David P.",
              },
            ].map(({ quote, author }) => (
              <figure
                key={author}
                className="min-w-[82%] snap-start rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-ns-card backdrop-blur-xl"
              >
                <p className="text-sm leading-relaxed text-slate-100">{quote}</p>
                <figcaption className="mt-3 text-xs font-medium text-slate-400">
                  {author}
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Desktop: masonry-style grid */}
          <div className="mt-4 hidden gap-4 md:grid md:grid-cols-3 lg:gap-6">
            <figure className="col-span-2 row-span-2 rounded-2xl border border-white/10 bg-white/5 p-5 text-left shadow-ns-card backdrop-blur-xl">
              <p className="text-sm leading-relaxed text-slate-100 md:text-base">
                I’ll be honest, I didn’t want to do this at first. I thought it was just another
                chore. But I realized how important it was to my wife, so I gave it a shot. After a
                couple of times, I realized it was actually super easy—took 30 seconds—and now I
                look forward to it every day.
              </p>
              <figcaption className="mt-4 text-xs font-medium text-slate-400 md:text-sm">
                — Mark T., married 7 years
              </figcaption>
            </figure>
            <figure className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left shadow-ns-card backdrop-blur-xl">
              <p className="text-sm leading-relaxed text-slate-100 md:text-base">
                We tried counseling, we tried date nights, but this is the only thing that has
                actually kept us consistent. It’s low pressure but high impact.
              </p>
              <figcaption className="mt-4 text-xs font-medium text-slate-400 md:text-sm">
                — Sarah J.
              </figcaption>
            </figure>
            <figure className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left shadow-ns-card backdrop-blur-xl">
              <p className="text-sm leading-relaxed text-slate-100 md:text-base">
                I love that I don’t have to come up with conversation starters anymore. The daily
                prompt does the heavy lifting for us.
              </p>
              <figcaption className="mt-4 text-xs font-medium text-slate-400 md:text-sm">
                — David P.
              </figcaption>
            </figure>
          </div>
        </section>

        {/* Two-column: Why North Star + Built on trust (desktop) */}
        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          {/* Why North Star */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-ns-card backdrop-blur-xl sm:p-6 md:p-7">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
              Why North Star
            </h2>
            <p className="mt-2.5 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              North Star is built for couples who want a simple, intentional way to stay close. No
              algorithms, no gamification—just you and your partner, one prompt at a time.
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "No quizzes or personality tests",
                "No streak pressure or guilt",
                "No public sharing—your answers stay between you two",
              ].map((line) => (
                <li key={line} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" strokeWidth={2} />
                  <span className="text-sm leading-7 text-slate-100 sm:text-base">{line}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Built on trust */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-ns-card backdrop-blur-xl sm:p-6 md:p-7">
            <div className="flex items-center gap-2">
              <Lock className="h-6 w-6 text-sky-300" strokeWidth={1.5} />
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
                Built on trust
              </h2>
            </div>
            <ul className="mt-3 space-y-2">
              {[
                { icon: EyeOff, text: "Answers stay private until you both choose to reveal.", color: "text-sky-300" },
                { icon: ShieldCheck, text: "Leave or delete your data anytime.", color: "text-emerald-400" },
                { icon: Shield, text: "No ads, no selling your data.", color: "text-slate-200" },
              ].map(({ icon: Icon, text, color }) => (
                <li key={text} className="flex items-start gap-3">
                  <Icon className={`mt-0.5 h-7 w-7 shrink-0 ${color}`} strokeWidth={1.5} />
                  <span className="text-sm leading-7 text-slate-100 sm:text-base">{text}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* How it works */}
        <section
          id="how-it-works"
          className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-ns-card backdrop-blur-xl sm:p-6 md:p-7"
        >
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
            How it works
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {[
              {
                step: "1",
                title: "Get one daily question",
                body: "Each day you and your partner get the same short prompt—thoughtful, not overwhelming.",
                icon: Sparkles,
                bg: "bg-amber-100 text-amber-700",
              },
              {
                step: "2",
                title: "Answer privately",
                body: "You each write your answer without seeing the other's. No one can peek until you're both done.",
                icon: Heart,
                bg: "bg-rose-100 text-rose-600",
              },
              {
                step: "3",
                title: "Reveal together",
                body: "When you've both responded, unlock the moment and read each other's answers side by side.",
                icon: Compass,
                bg: "bg-blue-100 text-blue-600",
              },
            ].map(({ step, title, body, icon: Icon, bg }) => (
              <div
                key={step}
                className="rounded-xl border border-white/10 bg-white/5 p-4 text-center shadow-sm backdrop-blur-lg sm:text-left sm:flex sm:flex-col sm:items-start"
              >
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl sm:mx-0 sm:h-16 sm:w-16 ${bg}`}
                >
                  <Icon className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={1.5} />
                </div>
                <p className="mt-3 text-base font-medium text-slate-50 sm:text-lg">{title}</p>
                <p className="mt-1 text-sm leading-7 text-slate-200 sm:text-base">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-ns-card backdrop-blur-xl sm:p-6 md:p-7">
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
            Who it’s for
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm leading-7 text-slate-100 sm:text-base">
            {[
              "Couples who want a low-pressure daily ritual",
              "Partners who value privacy",
              "Anyone tired of social apps and gamification",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Heart className="h-5 w-5 shrink-0 text-rose-400" strokeWidth={2} />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Private beta + email capture */}
        <section id="beta" className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-ns-card backdrop-blur-xl sm:p-6 md:p-7">
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-white sm:text-2xl">
              Private beta
            </h2>
            <p className="mt-1.5 text-sm leading-7 text-slate-200 sm:text-base">
              We’re letting in a small group of couples first. Leave your email and we’ll
              send you an invite when a spot opens.
            </p>
            <BetaForm />
        </section>
      </main>
    </div>
  );
}
