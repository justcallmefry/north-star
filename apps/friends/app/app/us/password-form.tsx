"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { setOrChangePassword } from "./actions";

type Props = { hasPassword: boolean };

export function PasswordForm({ hasPassword }: Props) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const result = await setOrChangePassword(
        hasPassword ? currentPassword : null,
        newPassword
      );
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setSuccess(false), 3000);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      {hasPassword && (
        <div>
          <label
            htmlFor="current-password"
            className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1"
          >
            Current password
          </label>
          <div className="relative">
            <input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-base text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="new-password"
          className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1"
        >
          {hasPassword ? "New password" : "Password"}
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showNew ? "text" : "password"}
            autoComplete={hasPassword ? "new-password" : "off"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-10 text-base text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            aria-label={showNew ? "Hide password" : "Show password"}
          >
            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 mb-1"
        >
          Confirm {hasPassword ? "new password" : "password"}
        </label>
        <input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-600">
          Password saved. You can use it to sign in next time.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="ns-btn-primary disabled:opacity-50"
      >
        {loading ? "Saving…" : hasPassword ? "Change password" : "Set password"}
      </button>
    </form>
  );
}
