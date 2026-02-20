"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";

const PRODUCTION_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

function LoginFormInner() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app";
  const sentParam = searchParams.get("sent") === "1";
  const errorParam = searchParams.get("error") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const [sent, setSent] = useState(sentParam);
  const [error, setError] = useState<string | null>(
    errorParam ? "We couldn't send the sign-in link. Try again below." : null
  );

  useEffect(() => {
    if (emailParam) setEmail(decodeURIComponent(emailParam));
  }, [emailParam]);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        callbackUrl,
        redirect: false,
      });
      if (res?.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }
      if (res?.ok && res?.url) {
        window.location.href = res.url;
        return;
      }
      setLoading(false);
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  async function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMagicLoading(true);
    try {
      const res = await signIn("nodemailer", {
        email,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        const msg = typeof res.error === "string" ? res.error : "Something went wrong.";
        console.error("[login] magic link error:", msg);
        if (msg.includes("RESEND_DOMAIN_REQUIRED") || msg.includes("verify a domain")) {
          setError(
            "We can't send sign-in links to this email yet. The app needs a verified domain in Resend. Ask the person who set up the app to verify a domain at resend.com/domains and set EMAIL_FROM."
          );
        } else {
          setError("We couldn't send the magic link. Please try again in a moment.");
        }
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
      setMagicLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-pink-100 bg-white px-5 py-6 shadow-lg shadow-pink-100/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-100 ring-1 ring-pink-200">
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-500">
              Magic link sent
            </p>
            <p className="text-sm text-slate-600">
              Check your inbox on this device.
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-700 sm:text-base">
          We sent a sign-in link to <strong>{email}</strong>. Click the link to sign in.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 text-left">
            <strong>Development:</strong> No email was sent. Open the terminal where npm run dev is running and look for a line like [Magic link]. Copy that URL into your browser to sign in.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Log in
        </h1>
        <p className="mt-2 text-slate-600">
          Use your email and password, or get a one-time link.
        </p>
      </div>

      {PRODUCTION_APP_URL && (
        <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3">
          For a stable sign-in, use the main site:{" "}
          <a href={`${PRODUCTION_APP_URL}/login`} className="font-medium underline">
            Sign in on main site
          </a>
        </p>
      )}

      <form onSubmit={handleCredentialsSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200/60"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1">
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200/60"
            placeholder="Your password"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !email.trim() || !password}
          className="ns-btn-primary block w-full py-3.5 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-slate-500">or</span>
        </div>
      </div>

      <form onSubmit={handleMagicSubmit} className="space-y-2">
        <p className="text-sm text-slate-600">
          Get a one-time sign-in link by email (no password).
        </p>
        <button
          type="submit"
          disabled={magicLoading}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {magicLoading ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-pink-600 hover:text-pink-700 underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
        <div className="h-12 animate-pulse rounded-xl bg-slate-200" />
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginFormInner />
    </Suspense>
  );
}
