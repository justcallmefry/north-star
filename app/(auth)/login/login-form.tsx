"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCsrfToken, signIn, useSession } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";

const PRODUCTION_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const emailParam = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app";
  const sentParam = searchParams.get("sent") === "1";
  const errorParam = searchParams.get("error") === "1";
  const authError = searchParams.get("error"); // NextAuth error (e.g. CredentialsSignin)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [csrfToken, setCsrfToken] = useState<string>("");
  const [magicLoading, setMagicLoading] = useState(false);
  const [sent, setSent] = useState(sentParam);
  const [error, setError] = useState<string | null>(() => {
    if (errorParam) return "We couldn't send the sign-in link. Try again below.";
    if (authError) return "Invalid email or password.";
    return null;
  });

  // If we landed on login but the client has a session (e.g. after a race with prefetch), send them to the app.
  useEffect(() => {
    if (status !== "authenticated") return;
    const target =
      callbackUrl.startsWith("http") ? callbackUrl : `${window.location.origin}${callbackUrl.startsWith("/") ? "" : "/"}${callbackUrl}`;
    router.replace(target);
  }, [status, callbackUrl, router]);

  useEffect(() => {
    if (emailParam) setEmail(decodeURIComponent(emailParam));
  }, [emailParam]);

  useEffect(() => {
    getCsrfToken().then((token) => setCsrfToken(token ?? ""));
  }, []);

  const credentialsReady = csrfToken !== "";

  // Let form do a full-page POST so the browser gets Set-Cookie and then does a full-page GET /app (via meta refresh).
  // That way the cookie is sent with GET /app. (Server-action redirect was doing client-side nav, so cookie wasn’t sent.)
  function handleCredentialsSubmit(e: React.FormEvent<HTMLFormElement>) {
    setError(null);
    if (!email.trim() || !password) {
      e.preventDefault();
      return;
    }
    if (!credentialsReady) {
      e.preventDefault();
      setError("Loading…");
      return;
    }
  }

  if (status === "authenticated") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-600">
        <p className="text-sm">Taking you to the app…</p>
      </div>
    );
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
              src="/north-star-app-logo.png"
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

      <form
        action="/api/auth/callback/credentials"
        method="post"
        onSubmit={handleCredentialsSubmit}
        className="space-y-4"
      >
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
            required
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
          disabled={!credentialsReady || !email.trim() || !password}
          className="ns-btn-primary block w-full py-3.5 disabled:opacity-50"
        >
          {credentialsReady ? "Sign in" : "Loading…"}
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
