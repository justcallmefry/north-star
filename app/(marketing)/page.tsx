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
    <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-white to-blue-50/50">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
          <div className="flex justify-center">
            <Image
              src="/north-star-logo.png"
              alt="North Star"
              width={220}
              height={220}
              className="h-32 w-32 object-contain sm:h-40 sm:w-40"
              priority
            />
          </div>
          <h1 className="mt-4 text-center font-montserrat text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            North Star
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-xl text-slate-600 sm:text-2xl">
            A daily connection ritual for couples.
          </p>
          <p className="mx-auto mt-2 max-w-lg text-center text-slate-500">
            One question a day. Answer together. Reveal when you&apos;re both ready—no pressure, no
            quizzes, no feed.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="#beta"
              className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
            >
              Request a Beta Invite
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-blue-700 underline decoration-blue-300 underline-offset-4 hover:text-blue-900"
            >
              How it works
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 pb-12">
        {/* Why North Star */}
        <section className="py-8 sm:py-10">
          <h2 className="font-montserrat text-2xl font-semibold text-slate-900 sm:text-3xl">
            Why North Star
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            North Star is built for couples who want a simple, intentional way to stay close. No
            algorithms, no gamification—just you and your partner, one prompt at a time.
          </p>
          <ul className="mt-4 space-y-2">
            {[
              "No quizzes or personality tests",
              "No streak pressure or guilt",
              "No public sharing—your answers stay between you two",
            ].map((line) => (
              <li key={line} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                <span className="text-slate-600">{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-8 sm:py-10">
          <h2 className="font-montserrat text-2xl font-semibold text-slate-900 sm:text-3xl">
            How it works
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
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
                className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-full ${color}`}>
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                </div>
                <p className="mt-3 font-medium text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Built on trust */}
        <section className="py-8 sm:py-10">
          <h2 className="font-montserrat text-2xl font-semibold text-slate-900 sm:text-3xl">
            Built on trust
          </h2>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 shadow-sm">
            <Lock className="h-5 w-5 shrink-0 text-blue-600" strokeWidth={1.5} />
            <ul className="space-y-1.5 text-slate-600">
              <li>Answers stay private until you both choose to reveal.</li>
              <li>Leave or delete your data anytime.</li>
              <li>No ads, no selling your data.</li>
            </ul>
          </div>
        </section>

        {/* Who it's for */}
        <section className="py-8 sm:py-10">
          <h2 className="font-montserrat text-2xl font-semibold text-slate-900 sm:text-3xl">
            Who it&apos;s for
          </h2>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
            {[
              "Couples who want a low-pressure daily ritual",
              "Partners who value privacy",
              "Anyone tired of social apps and gamification",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-amber-500" strokeWidth={2} />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Private beta + email capture */}
        <section id="beta" className="py-8 sm:py-10">
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-5 shadow-sm sm:p-6">
            <h2 className="font-montserrat text-xl font-semibold text-slate-900 sm:text-2xl">
              Private beta
            </h2>
            <p className="mt-2 text-slate-600">
              We&apos;re letting in a small group of couples first. Leave your email and we&apos;ll
              send you an invite when a spot opens.
            </p>
            <BetaForm />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-5">
        <div className="mx-auto max-w-4xl px-6 flex flex-col items-center gap-1">
          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} North Star. All rights reserved.
          </p>
          <Link href="/login" className="text-sm text-slate-500 underline hover:text-slate-700">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
