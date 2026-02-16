"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("nodemailer", {
        email,
        redirect: false,
        callbackUrl: "/app",
      });
      if (res?.error) {
        const msg = typeof res.error === "string" ? res.error : "Something went wrong.";
        setError(msg === "Configuration" ? "Email is not configured. Set RESEND_API_KEY or EMAIL_SERVER in your deployment." : msg);
        return;
      }
      if (res?.status !== 200) {
        setError("Sign-in request failed. Check that email is configured (RESEND_API_KEY or EMAIL_SERVER).");
        return;
      }
      setSent(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed. Check the database and email configuration.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-gray-600 dark:text-gray-400">
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
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Sign in to North Star</h1>
        {process.env.NODE_ENV === "development" && (
          <p className="mb-4 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md p-3">
            <strong>Dev:</strong> Click &quot;Send magic link&quot; then look in the <strong>terminal</strong> where <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">npm run dev</code> is running for a line starting with <code className="break-all">[Magic link]</code>. Copy that full URL into your browser. (No email is sent until you set up SMTP or Resend.)
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
              placeholder="you@example.com"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending link…" : "Send magic link"}
          </button>
        </form>
      </div>
    </main>
  );
}
