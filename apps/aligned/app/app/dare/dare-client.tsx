"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle, Flame } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/loading-spinner";
import { haptic } from "@/lib/haptics";
import { completeDare } from "@/lib/dare";
import type { DareForWeekResult } from "@/lib/dare";

type Props = {
  initialDare: DareForWeekResult | null;
};

export function DareClient({ initialDare }: Props) {
  const router = useRouter();
  const [dare, setDare] = useState(initialDare);
  const [loading, setLoading] = useState<"complete" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  if (!dare) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center text-center py-12">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg">
          <Flame className="h-8 w-8" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900">Date Night Dares</h1>
        <p className="mt-2 max-w-xs text-sm text-slate-500">
          No dare is scheduled yet this week. Check back Monday!
        </p>
      </div>
    );
  }

  const { accepted, completed, photoUrl } = dare;

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Client-side size check (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be 5 MB or smaller.");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/dare-photo", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error ?? "upload_failed");
    }
    const data = (await res.json()) as { url: string };
    return data.url;
  }

  async function handleComplete() {
    if (!dare) return;
    setLoading("complete");
    setUploading(false);
    try {
      let url: string | undefined;
      if (photoFile) {
        setUploading(true);
        url = await uploadPhoto(photoFile);
        setUploading(false);
      }
      const result = await completeDare(dare.dareId, url);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      void haptic("success");
      setDare((d) => (d ? { ...d, accepted: true, completed: true, photoUrl: url ?? null } : d));
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
      setUploading(false);
    }
  }

  // ── Celebration card ──────────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="space-y-6">
        <DarePageHeader />
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 px-5 py-6 text-center space-y-3 shadow-sm">
          {photoUrl && (
            <img
              src={photoUrl}
              alt=""
              className="mx-auto w-full max-h-64 rounded-xl object-cover"
            />
          )}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle className="h-8 w-8" strokeWidth={2} />
          </div>
          <p className="text-xl font-bold text-emerald-800">You did it together.</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            That&apos;s what makes it count — doing it as a team. New dare arrives Monday.
          </p>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 px-5 py-4 shadow-sm space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            This week&apos;s dare
          </p>
          <p className="text-lg font-bold text-slate-900">{dare.title}</p>
          <p className="text-sm text-slate-600">{dare.description}</p>
        </div>
      </div>
    );
  }

  // ── Active dare ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <DarePageHeader />

      <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-rose-50 border border-orange-200 px-5 py-6 space-y-2 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">
          This week&apos;s dare
        </p>
        <p className="text-2xl font-bold leading-snug text-slate-900">{dare.title}</p>
        <p className="text-base text-slate-700 leading-relaxed">{dare.description}</p>
      </div>

      <div className="space-y-3">
        {/* Optional photo picker */}
        <div className="space-y-2">
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt=""
                className="w-full rounded-xl object-cover max-h-64"
              />
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className="absolute right-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-white"
              >
                Remove photo
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 hover:border-orange-400 hover:text-orange-700 transition">
              <Camera className="h-4 w-4" strokeWidth={2} />
              Add a photo (optional)
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={onPickPhoto}
              />
            </label>
          )}
        </div>

        {/* Complete button */}
        <button
          type="button"
          disabled={loading !== null}
          onClick={handleComplete}
          className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 py-4 text-lg font-semibold text-white shadow-md shadow-orange-200/60 hover:from-orange-600 hover:to-rose-600 disabled:opacity-60 transition-all"
        >
          {loading !== null ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              {uploading ? "Uploading photo…" : "Marking complete…"}
            </span>
          ) : (
            "We did it! 🎉"
          )}
        </button>
      </div>
    </div>
  );
}

function DarePageHeader() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 text-white shadow-lg shadow-orange-200/80 ring-2 ring-white ring-offset-2">
        <Flame className="h-8 w-8" strokeWidth={2} />
      </div>
      <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Date Night Dares</h1>
      <p className="mt-1 max-w-md text-sm text-slate-600 sm:text-base">
        Real-world challenges to do together. New dare every Monday.
      </p>
    </div>
  );
}
