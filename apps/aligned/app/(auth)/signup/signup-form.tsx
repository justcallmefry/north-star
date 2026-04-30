"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { createAccount } from "./actions";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function SignupForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = isValidEmail(email);
  const passwordValid = password.length >= 8;
  const nameValid = firstName.trim().length >= 1 && firstName.trim().length <= 50;
  const canSubmitStep1 = emailValid && passwordValid;
  const canSubmitStep2 = nameValid;

  const handleStep1Submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmitStep1) return;
      setStep(2);
    },
    [canSubmitStep1]
  );

  const handleStep2Submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmitStep2 || loading) return;
      setError(null);
      setLoading(true);
      try {
        const result = await createAccount(email.trim(), password, firstName.trim());
        if (!result.ok) {
          setError(result.error);
          setLoading(false);
          return;
        }
        const res = await signIn("credentials", {
          email: email.trim(),
          password,
          callbackUrl: "/app/welcome",
          redirect: false,
        });
        if (res?.error) {
          setError(res.error === "CredentialsSignin" ? "Invalid email or password." : "Something went wrong.");
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
    },
    [canSubmitStep2, loading, email, password, firstName]
  );

  if (step === 2) {
    return (
      <form onSubmit={handleStep2Submit} className="flex flex-col flex-1">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-2">
          What should we call you?
        </h1>
        <p className="text-slate-600 mb-8">
          Your first name is all we need.
        </p>

        <div className="space-y-5">
          <div>
            <label htmlFor="signup-first-name" className="sr-only">
              First name
            </label>
            <input
              id="signup-first-name"
              type="text"
              autoComplete="given-name"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200/60 transition"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-auto pt-10 pb-2">
          <button
            type="submit"
            disabled={!canSubmitStep2 || loading}
            className="ns-btn-primary block w-full py-3.5 text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-loading-spin" />
                Next…
              </span>
            ) : (
              "Next"
            )}
          </button>
          <p className="mt-4 text-center text-xs text-slate-500 leading-relaxed">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-slate-700">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-slate-700">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </form>
    );
  }

  const showApple = process.env.NEXT_PUBLIC_APPLE_SIGNIN_ENABLED === "true";

  return (
    <form onSubmit={handleStep1Submit} className="flex flex-col flex-1">
      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-8">
        Create your account
      </h1>

      {showApple && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => signIn("apple", { callbackUrl: "/app/welcome" })}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3.5 text-base font-medium text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13 1.86 1.12 2.57 1.81 4.39 1.73 1.77-.07 2.88-.67 3.99-1.36 1.2-.84 2.35-1.8 3.57-2.88.24-.21.46-.44.68-.67.02-.02.04-.03.05-.05v.02c-.01 0-.01.01 0 .02-.02.02-.04.04-.06.06-.22.23-.44.46-.68.67-1.22 1.08-2.37 2.04-3.57 2.88-1.11.69-2.22 1.29-3.99 1.36-1.82.08-2.53-.61-4.39-1.73-2.86-1.15-3.6-5.26-.48-7.13zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Sign in with Apple
          </button>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-slate-500">or use email</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label htmlFor="signup-email" className="sr-only">
            Your email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200/60 transition"
          />
        </div>
        <div className="relative">
          <label htmlFor="signup-password" className="sr-only">
            Your password
          </label>
          <input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200/60 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" strokeWidth={1.8} />
            ) : (
              <Eye className="h-5 w-5" strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>

      <div className="mt-auto pt-10 pb-2">
        <button
          type="submit"
          disabled={!canSubmitStep1}
          className="ns-btn-primary block w-full py-3.5 text-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
        <p className="mt-4 text-center text-xs text-slate-500 leading-relaxed">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-slate-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-slate-700">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
