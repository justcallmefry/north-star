"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";
import { deleteMyAccount } from "@/lib/delete-account";

type Props = {
  userEmail: string;
  hasPassword: boolean;
};

export function DeleteAccountForm({ userEmail, hasPassword }: Props) {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await deleteMyAccount(confirmEmail, hasPassword ? password : null);
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 border-t border-red-100 pt-4">
      <p className="text-sm text-slate-600 sm:text-base">
        Deletes your account, answers, and profile from this app. If you&apos;re paired, your partner keeps the
        space; you&apos;ll need a new account and invite to come back.
      </p>
      <div>
        <label
          htmlFor="delete-confirm-email"
          className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1"
        >
          Type your email to confirm
        </label>
        <input
          id="delete-confirm-email"
          type="email"
          autoComplete="email"
          value={confirmEmail}
          onChange={(ev) => setConfirmEmail(ev.target.value)}
          placeholder={userEmail}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-200"
        />
      </div>
      {hasPassword && (
        <div>
          <label
            htmlFor="delete-password"
            className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1"
          >
            Current password
          </label>
          <div className="relative">
            <input
              id="delete-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-base text-slate-900 focus:border-red-400 focus:outline-none focus:ring-1 focus:ring-red-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={
          loading || confirmEmail.trim().toLowerCase() !== userEmail.trim().toLowerCase() || (hasPassword && !password)
        }
        className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50"
      >
        {loading ? "Deleting…" : "Delete my account permanently"}
      </button>
    </form>
  );
}
