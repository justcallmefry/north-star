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
          callbackUrl: "/app/pair",
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
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200/60 transition"
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
            className="ns-btn-primary block w-full py-3.5 text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-pink-500"
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

  return (
    <form onSubmit={handleStep1Submit} className="flex flex-col flex-1">
      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight mb-8">
        Create your account
      </h1>

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
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200/60 transition"
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
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 pr-12 text-base text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-200/60 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-200"
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
          className="ns-btn-primary block w-full py-3.5 text-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-pink-500"
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
