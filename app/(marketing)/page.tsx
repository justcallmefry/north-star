import Link from "next/link";
import Image from "next/image";
import {
  Compass,
  Sparkles,
  Heart,
  Lock,
  CheckCircle2,
  ArrowRight,
  Minus,
} from "lucide-react";
import { BetaForm } from "@/components/marketing/beta-form";

export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
          <div className="flex justify-center">
            <Image
              src="/north-star-logo.png"
              alt="North Star"
              width={280}
              height={280}
              className="h-44 w-44 object-contain sm:h-52 sm:w-52"
              priority
            />
          </div>
          <h1 className="mt-6 text-center font-montserrat text-5xl font-semibold tracking-tight text-slate-900 sm:text-6xl">
            North Star
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-center text-2xl text-slate-600 sm:text-3xl">
            A daily connection ritual for couples.
          </p>
          <p className="mx-auto mt-3 max-w-lg text-center text-lg text-slate-500 sm:text-xl">
            One question a day. Answer together. Reveal when you&apos;re both ready—no pressure, no
            quizzes, no feed.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-3">
            <Link
              href="#beta"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-8 py-4 text-base font-medium text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 sm:px-6 sm:py-3 sm:text-sm"
            >
              Request a Beta Invite
              <ArrowRight className="h-5 w-5 sm:h-4 sm:w-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="text-base font-medium text-blue-700 underline decoration-blue-300 underline-offset-4 hover:text-blue-900 sm:text-sm"
            >
              How it works
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pb-14 sm:px-6 sm:pb-16">
        {/* Why North Star */}
        <section className="py-10 sm:py-12">
          <h2 className="font-montserrat text-3xl font-semibold text-slate-900 sm:text-4xl">
            Why North Star
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-slate-600 sm:text-base">
            North Star is built for couples who want a simple, intentional way to stay close. No
            algorithms, no gamification—just you and your partner, one prompt at a time.
          </p>
          <ul className="mt-5 space-y-3">
            {[
              "No quizzes or personality tests",
              "No streak pressure or guilt",
              "No public sharing—your answers stay between you two",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
                <span className="text-base text-slate-600 sm:text-sm">{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-10 sm:py-12">
          <h2 className="font-montserrat text-3xl font-semibold text-slate-900 sm:text-4xl">
            How it works
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3 sm:gap-5">
            {[
              {
                step: "1",
                title: "Get one daily question",
                body: "Each day you and your partner get the same short prompt—thoughtful, not overwhelming.",
                icon: Sparkles,
                color: "bg-amber-100 text-amber-700",
              },
              {
                step: "2",
                title: "Answer privately",
                body: "You each write your answer without seeing the other’s. No one can peek until you’re both done.",
                icon: Heart,
                color: "bg-rose-100 text-rose-600",
              },
              {
                step: "3",
                title: "Reveal together",
                body: "When you’ve both responded, unlock the moment and read each other’s answers side by side.",
                icon: Compass,
                color: "bg-blue-100 text-blue-700",
              },
            ].map(({ step, title, body, icon: Icon, color }) => (
              <div
                key={step}
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-4"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full sm:h-9 sm:w-9 ${color}`}>
                  <Icon className="h-5 w-5 sm:h-4 sm:w-4" strokeWidth={1.5} />
                </div>
                <p className="mt-4 font-medium text-slate-900 sm:mt-3 sm:text-base">{title}</p>
                <p className="mt-2 text-base text-slate-600 sm:mt-1 sm:text-sm">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Built on trust */}
        <section className="py-10 sm:py-12">
          <h2 className="font-montserrat text-3xl font-semibold text-slate-900 sm:text-4xl">
            Built on trust
          </h2>
          <div className="mt-5 flex items-start gap-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-5 shadow-sm sm:mt-4 sm:gap-3 sm:p-4">
            <Lock className="h-6 w-6 shrink-0 text-blue-600 sm:h-5 sm:w-5" strokeWidth={1.5} />
            <ul className="space-y-2 text-base text-slate-600 sm:space-y-1.5 sm:text-sm">
              <li>Answers stay private until you both choose to reveal.</li>
              <li>Leave or delete your data anytime.</li>
              <li>No ads, no selling your data.</li>
            </ul>
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-10 sm:py-12">
          <h2 className="font-montserrat text-3xl font-semibold text-slate-900 sm:text-4xl">
            Who it&apos;s for
          </h2>
          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-base text-slate-600 sm:mt-4 sm:gap-y-1 sm:text-sm">
            {[
              "Couples who want a low-pressure daily ritual",
              "Partners who value privacy",
              "Anyone tired of social apps and gamification",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Minus className="h-5 w-5 shrink-0 text-amber-500 sm:h-4 sm:w-4" strokeWidth={2} />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Private beta + email capture */}
        <section id="beta" className="py-10 sm:py-12">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-6 shadow-sm sm:p-6">
            <h2 className="font-montserrat text-2xl font-semibold text-slate-900 sm:text-2xl">
              Private beta
            </h2>
            <p className="mt-3 text-base text-slate-600 sm:mt-2 sm:text-sm">
              We&apos;re letting in a small group of couples first. Leave your email and we&apos;ll
              send you an invite when a spot opens.
            </p>
            <BetaForm />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6">
        <div className="mx-auto max-w-4xl px-5 flex flex-col items-center gap-2 sm:px-6 sm:gap-1">
          <p className="text-center text-base text-slate-500 sm:text-sm">
            © {new Date().getFullYear()} North Star. All rights reserved.
          </p>
          <Link href="/login" className="text-base text-slate-500 underline hover:text-slate-700 sm:text-sm">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
