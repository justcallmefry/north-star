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

const CONTAINER = "mx-auto max-w-5xl px-5 sm:px-8";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white font-montserrat antialiased">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* Subtle background: soft radial glow + gradient */}
        <div
          className="absolute inset-0 -z-10"
          aria-hidden
        >
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-white" />
          <div className="absolute left-1/2 top-1/4 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-100/40 blur-3xl sm:left-1/3 sm:top-1/3" />
        </div>
        <div className={`${CONTAINER} py-12 sm:py-16 md:py-20`}>
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <div className="flex justify-center md:justify-start">
              <Image
                src="/north-star-logo.png"
                alt="North Star"
                width={320}
                height={320}
                className="h-48 w-48 object-contain sm:h-52 sm:w-52"
                priority
              />
            </div>
            <h1 className="mt-4 text-5xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              North Star
            </h1>
            <p className="mt-3 max-w-xl text-xl leading-relaxed text-slate-600 sm:text-xl">
              A daily connection ritual for couples.
            </p>
            <p className="mt-1.5 text-base leading-relaxed text-slate-500 sm:text-base">
              Private by default. Reveal only when both respond.
            </p>
            <p className="mt-3 max-w-lg text-lg leading-7 text-slate-500 sm:mt-2 sm:text-base">
              One question a day. Answer together. Reveal when you&apos;re both ready—no pressure, no
              quizzes, no feed.
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <Link
                href="#beta"
                className="inline-flex h-12 min-h-[3rem] items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 font-semibold text-white shadow-md shadow-slate-900/10 transition hover:bg-slate-700 hover:shadow-lg hover:shadow-slate-900/15 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                Request a Beta Invite
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex h-12 min-h-[3rem] items-center justify-center rounded-lg border border-slate-300 bg-white px-5 font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                How it works
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className={`${CONTAINER} space-y-5 pb-12 sm:space-y-6 sm:pb-16`}>
        {/* Two-column: Why North Star + Built on trust (desktop) */}
        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          {/* Why North Star */}
          <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm shadow-slate-200/50 sm:p-6 md:p-8">
            <h2 className="text-xl font-semibold text-slate-900">
              Why North Star
            </h2>
            <p className="mt-2.5 max-w-2xl text-base leading-7 text-slate-600">
              North Star is built for couples who want a simple, intentional way to stay close. No
              algorithms, no gamification—just you and your partner, one prompt at a time.
            </p>
            <ul className="mt-3 space-y-2">
              {[
                "No quizzes or personality tests",
                "No streak pressure or guilt",
                "No public sharing—your answers stay between you two",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" strokeWidth={2} />
                  <span className="text-base leading-7 text-slate-600">{line}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Built on trust */}
          <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm shadow-slate-200/50 sm:p-6 md:p-8">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-600" strokeWidth={1.5} />
              <h2 className="text-xl font-semibold text-slate-900">
                Built on trust
              </h2>
            </div>
            <ul className="mt-3 space-y-2">
              {[
                { icon: EyeOff, text: "Answers stay private until you both choose to reveal.", color: "text-blue-500" },
                { icon: ShieldCheck, text: "Leave or delete your data anytime.", color: "text-emerald-500" },
                { icon: Shield, text: "No ads, no selling your data.", color: "text-slate-600" },
              ].map(({ icon: Icon, text, color }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} strokeWidth={1.5} />
                  <span className="text-base leading-7 text-slate-600">{text}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* How it works */}
        <section
          id="how-it-works"
          className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm shadow-slate-200/50 sm:p-6 md:p-8"
        >
          <h2 className="text-xl font-semibold text-slate-900">
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
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <p className="mt-3 font-medium text-slate-900">{title}</p>
                <p className="mt-1 text-base leading-7 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm shadow-slate-200/50 sm:p-6 md:p-8">
          <h2 className="text-xl font-semibold text-slate-900">
            Who it&apos;s for
          </h2>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-base leading-7 text-slate-600">
            {[
              "Couples who want a low-pressure daily ritual",
              "Partners who value privacy",
              "Anyone tired of social apps and gamification",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Minus className="h-4 w-4 shrink-0 text-amber-500" strokeWidth={2} />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Private beta + email capture */}
        <section id="beta" className="rounded-2xl border border-slate-200/90 bg-white/90 p-5 shadow-sm shadow-slate-200/50 sm:p-6 md:p-8">
            <h2 className="text-xl font-semibold text-slate-900">
              Private beta
            </h2>
            <p className="mt-1.5 text-base leading-7 text-slate-600">
              We&apos;re letting in a small group of couples first. Leave your email and we&apos;ll
              send you an invite when a spot opens.
            </p>
            <BetaForm />
        </section>
      </main>
    </div>
  );
}
