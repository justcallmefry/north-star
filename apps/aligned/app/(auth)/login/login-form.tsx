"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getCsrfToken, signIn, useSession } from "next-auth/react";
import { Suspense, useEffect, useState } from "react";

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
    if (authError === "CredentialsSignin") return "Invalid email or password.";
    if (authError) return "Sign-in didn’t complete. Try again or use another method.";
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
      <div
        className="ns-auth-card flex flex-col items-center justify-center py-10 text-slate-600"
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-medium text-slate-700">Taking you to the app…</p>
      </div>
    );
  }

  async function handleMagicSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email?.trim();
    if (!trimmedEmail) {
      setError("Please enter your email address in the field above to receive the sign-in link.");
      return;
    }
    setMagicLoading(true);
    try {
      const res = await signIn("nodemailer", {
        email: trimmedEmail,
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
      <div
        className="ns-auth-card px-5 py-6"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 ring-1 ring-brand-200">
            <Image
              src="/aligned-icon.png"
              alt="Aligned"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-500">
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
          <p className="mt-4 text-sm text-brand-700 bg-brand-50 border border-brand-200 rounded-md p-3 text-left">
            <strong>Development:</strong> No email was sent. Open the terminal where npm run dev is running and look for a line like [Magic link]. Copy that URL into your browser to sign in.
          </p>
        )}
      </div>
    );
  }

  const showApple = process.env.NEXT_PUBLIC_APPLE_SIGNIN_ENABLED === "true";

  return (
    <div className="ns-auth-card space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Log in
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Use your email and password, or get a one-time link.
        </p>
      </div>

      {showApple && (
        <>
          <button
            type="button"
            onClick={() => signIn("apple", { callbackUrl })}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3.5 text-base font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13 1.86 1.12 2.57 1.81 4.39 1.73 1.77-.07 2.88-.67 3.99-1.36 1.2-.84 2.35-1.8 3.57-2.88.24-.21.46-.44.68-.67.02-.02.04-.03.05-.05v.02c-.01 0-.01.01 0 .02-.02.02-.04.04-.06.06-.22.23-.44.46-.68.67-1.22 1.08-2.37 2.04-3.57 2.88-1.11.69-2.22 1.29-3.99 1.36-1.82.08-2.53-.61-4.39-1.73-2.86-1.15-3.6-5.26-.48-7.13zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Sign in with Apple
          </button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-emerald-800/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="ns-auth-divider-label rounded-md text-sm">or</span>
            </div>
          </div>
        </>
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
          <label htmlFor="login-email" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
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
            className="ns-input"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
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
            className="ns-input"
            placeholder="Your password"
          />
        </div>
        <div aria-live="polite">
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
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
          <span className="w-full border-t border-emerald-800/10" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="ns-auth-divider-label rounded-md text-sm">or</span>
        </div>
      </div>

      <form onSubmit={handleMagicSubmit} className="space-y-2">
        <p className="text-sm text-slate-600">
          Get a one-time sign-in link by email (no password). Enter your email above, then click below.
        </p>
        <button
          type="submit"
          disabled={magicLoading || !email.trim()}
          className="ns-btn-secondary block w-full !normal-case py-3 text-sm font-semibold tracking-normal disabled:opacity-50"
        >
          {magicLoading ? "Sending…" : "Email me a sign-in link"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-brand-600 underline hover:text-brand-700">
          Sign up
        </Link>
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="ns-auth-card space-y-6" role="status" aria-label="Loading sign-in" aria-live="polite">
      <div className="h-8 w-48 motion-safe:animate-pulse rounded bg-slate-200/80" />
      <div className="space-y-4">
        <div className="h-12 motion-safe:animate-pulse rounded-xl bg-slate-200/80" />
        <div className="h-12 motion-safe:animate-pulse rounded-xl bg-slate-200/80" />
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
