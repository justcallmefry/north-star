"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";

const PRODUCTION_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

function LoginForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailParam) setEmail(decodeURIComponent(emailParam));
  }, [emailParam]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("nodemailer", {
        email,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        const msg = typeof res.error === "string" ? res.error : "Something went wrong.";
        // Show a friendly message instead of low-level Auth.js errors
        console.error("[login] magic link error:", msg);
        setError("We couldn’t send the magic link. Please try again in a moment.");
        return;
      }
      if (res?.status !== 200) {
        setError("Sign-in request failed. Check that email is configured (RESEND_API_KEY or EMAIL_SERVER).");
        return;
      }
      setSent(true);
    } catch (err) {
      console.error("[login] magic link request failed:", err);
      setError("Something went wrong sending the link. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-950/90 px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.9)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/80 ring-1 ring-slate-700/80">
              <Image
                src="/north-star-logo.png"
                alt="North Star"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                priority
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Magic link sent
              </p>
              <p className="text-sm text-slate-200">
                Check your inbox on this device.
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-100 sm:text-base">
            We sent a sign-in link to <strong>{email}</strong>. Click the link to sign in.
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-left">
              <strong>Development:</strong> No email was sent. Open the terminal where <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">npm run dev</code> is running and look for a line like <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded break-all">[Magic link] … -&gt; https://…</code>. Copy that URL into your browser to sign in.
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-slate-800 bg-slate-950/90 px-5 py-6 shadow-[0_24px_80px_rgba(15,23,42,0.9)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/80 ring-1 ring-slate-700/80">
            <Image
              src="/north-star-logo.png"
              alt="North Star"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Sign in
            </p>
            <p className="text-sm text-slate-200">
              Get a one-time magic link by email.
            </p>
          </div>
        </div>
        {PRODUCTION_APP_URL && (
          <p className="mb-4 text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-3">
            For a stable sign-in, use the main site:{" "}
            <a href={`${PRODUCTION_APP_URL}/login`} className="font-medium underline">
              Sign in on main site
            </a>
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              placeholder="you@example.com"
            />
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow-sm shadow-emerald-500/30 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Sending link…" : "Send magic link"}
          </button>
        </form>
      </div>
    </main>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Sign in to North Star</h1>
        <div className="animate-pulse rounded-md h-10 bg-gray-200 dark:bg-gray-700 mb-4" />
        <div className="animate-pulse rounded-md h-10 bg-gray-200 dark:bg-gray-700" />
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
