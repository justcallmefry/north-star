"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle, Clock, Flame, X } from "lucide-react";
import { toast } from "sonner";
import { acceptDare, completeDare } from "@/lib/dare";
import type { DareForWeekResult } from "@/lib/dare";
import { haptic } from "@/lib/haptics";

type Props = { dare: DareForWeekResult };

async function uploadDarePhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/dare-photo", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const code = err?.error ?? "upload_failed";
    const msg =
      code === "too_large" ? "Photo is too large (5MB max)."
      : code === "bad_type" ? "Photo must be jpg, png, or webp."
      : code === "blob_not_configured" ? "Photo upload isn't configured."
      : "Couldn't upload photo. Try again.";
    throw new Error(msg);
  }
  const data = await res.json();
  return data.url as string;
}

export function DareClient({ dare: initial }: Props) {
  const router = useRouter();
  const [dare, setDare] = useState(initial);
  const [loading, setLoading] = useState<"accept" | "complete" | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function clearPhoto() {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
  }

  async function handleAccept() {
    setLoading("accept");
    try {
      await acceptDare(dare.dareId);
      void haptic("tap");
      setDare((d) => ({ ...d, accepted: true }));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  async function handleComplete() {
    setLoading("complete");
    try {
      let url: string | undefined;
      if (photoFile) {
        url = await uploadDarePhoto(photoFile);
      }
      await completeDare(dare.dareId, url);
      void haptic("success");
      setDare((d) => ({ ...d, accepted: true, completed: true, photoUrl: url ?? d.photoUrl }));
      clearPhoto();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="animate-calm-fade-in space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-dusk-600">
          This Week&apos;s Dare
        </p>
        <p className="text-sm text-slate-500">A real-world challenge for both of you.</p>
      </div>

      <div className={`rounded-2xl border p-6 space-y-4 shadow-sm ${
        dare.completed
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
          : dare.accepted
            ? "border-brand-200 bg-gradient-to-br from-brand-50/80 to-white"
            : "border-slate-200 bg-white"
      }`}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">
            {dare.dare.title}
          </h2>
          {dare.completed && (
            <CheckCircle className="h-6 w-6 shrink-0 text-emerald-600 mt-0.5" strokeWidth={2} />
          )}
        </div>

        <p className="text-base leading-relaxed text-slate-600">{dare.dare.description}</p>

        <div className="flex items-center gap-1.5 text-sm text-slate-400">
          <Clock className="h-4 w-4" strokeWidth={2} />
          <span>{dare.dare.duration}</span>
        </div>
      </div>

      {dare.completed ? (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 px-5 py-6 text-center space-y-3 shadow-sm">
          {dare.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dare.photoUrl}
              alt=""
              className="mx-auto w-full max-h-64 rounded-xl object-cover"
            />
          )}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-6 w-6" strokeWidth={2} />
          </div>
          <p className="text-base font-semibold text-emerald-700">You did it.</p>
          <p className="text-sm text-slate-500">New dare next Monday.</p>
        </div>
      ) : dare.accepted ? (
        <div className="space-y-3">
          <p className="text-center text-sm text-brand-700 font-medium">
            You&apos;re committed. Come back and mark it done when you finish.
          </p>
          {photoPreview ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="" className="w-full max-h-64 rounded-xl object-cover" />
              <button
                type="button"
                onClick={clearPhoto}
                aria-label="Remove photo"
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
                Remove
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 hover:border-brand-400 hover:text-brand-700 transition">
              <Camera className="h-4 w-4" strokeWidth={2} />
              Add a photo (optional)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={pickPhoto}
              />
            </label>
          )}
          <button
            type="button"
            onClick={handleComplete}
            disabled={!!loading}
            className="ns-btn-primary w-full py-3.5 flex items-center justify-center gap-2"
          >
            <CheckCircle className="h-5 w-5" strokeWidth={2} />
            {loading === "complete" ? "Saving…" : "We did it"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={!!loading}
            className="ns-btn-primary w-full py-3.5 flex items-center justify-center gap-2"
          >
            <Flame className="h-5 w-5" strokeWidth={2} />
            {loading === "accept" ? "Saving…" : "We're in — let's do it"}
          </button>
          <p className="text-center text-xs text-slate-400">
            New dare every Monday. You can still mark it done anytime this week.
          </p>
        </div>
      )}
    </div>
  );
}
