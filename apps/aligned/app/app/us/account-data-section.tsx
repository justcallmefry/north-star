"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { AlertCircle, Download, Trash2 } from "lucide-react";
import { LoadingSpinner } from "@/components/loading-spinner";

const REQUIRED_PHRASE = "DELETE";

export function AccountDataSection() {
  const [busy, setBusy] = useState<null | "export" | "delete">(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  async function handleExport() {
    setBusy("export");
    try {
      const res = await fetch("/api/account/export", { method: "GET" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aligned-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Your data has been downloaded.");
    } catch {
      toast.error("Couldn't download your data. Try again in a moment.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    setBusy("delete");
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Account deleted.");
      await signOut({ callbackUrl: "/" });
    } catch {
      toast.error("Couldn't delete your account. Please contact support.");
      setBusy(null);
    }
  }

  return (
    <div className="ns-card mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 sm:text-xs">
        Account & data
      </h2>
      <p className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">
        Your data, your call
      </p>
      <p className="mt-1 text-sm text-slate-600 sm:text-base">
        Download a copy of your responses, reactions, and Our Week notes any
        time. Or delete your account — we&apos;ll anonymize your account and
        leave shared content with your partner intact.
      </p>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={busy != null}
          className="ns-btn-secondary inline-flex w-full items-center justify-center gap-2 py-3"
        >
          {busy === "export" ? (
            <LoadingSpinner size="sm" />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          {busy === "export" ? "Preparing your data…" : "Download my data (JSON)"}
        </button>

        {!showConfirm ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={busy != null}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete my account
          </button>
        ) : (
          <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/70 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
              <div className="text-sm text-red-900 sm:text-base">
                <p className="font-semibold">This is permanent.</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5 text-red-800">
                  <li>Your name, email, and photo are removed from this account.</li>
                  <li>You&apos;re signed out and can&apos;t sign back in.</li>
                  <li>Your devices stop receiving push notifications.</li>
                  <li>Active subscriptions are canceled.</li>
                  <li>
                    Shared answers and reactions stay with your partner&apos;s
                    history (without your name attached).
                  </li>
                </ul>
                <p className="mt-2">
                  If you might want a copy of your responses, download your data
                  first.
                </p>
              </div>
            </div>
            <div>
              <label
                htmlFor="delete-confirm"
                className="block text-sm font-medium text-red-900"
              >
                Type <span className="font-mono font-bold">{REQUIRED_PHRASE}</span> to confirm:
              </label>
              <input
                id="delete-confirm"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
                className="mt-1.5 w-full rounded-lg border border-red-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-400"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText("");
                }}
                disabled={busy != null}
                className="ns-btn-secondary w-full sm:flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={busy != null || confirmText.trim() !== REQUIRED_PHRASE}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 sm:flex-1"
              >
                {busy === "delete" ? <LoadingSpinner size="sm" /> : <Trash2 className="h-4 w-4" />}
                {busy === "delete" ? "Deleting…" : "Delete forever"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
