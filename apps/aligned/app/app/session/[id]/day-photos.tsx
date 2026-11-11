"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";

export type DayPhoto = { url: string; isMe: boolean; name: string | null };

/** Photos on a day: one each. Shown on the day and on its star in the sky. */
export function DayPhotos({ sessionId, photos }: { sessionId: string; photos: DayPhoto[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const mine = photos.find((p) => p.isMe);

  async function upload(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.set("sessionId", sessionId);
    fd.set("file", file);
    try {
      const res = await fetch("/api/day-photo", { method: "POST", body: fd });
      if (!res.ok) {
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          error === "too_large" ? "That photo is over 5 MB." : error === "bad_type" ? "Use a JPG, PNG or WebP." : "Couldn't add the photo."
        );
      }
      void haptic("success");
      toast.success("Added to this day.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add the photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {photos.length > 0 && (
        <div className={`grid gap-2 ${photos.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
          {photos.map((p) => (
            <figure key={p.url} className="overflow-hidden rounded-xl bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={`${p.isMe ? "Your" : `${p.name ?? "Their"}'s`} photo of this day`} className="aspect-[4/5] w-full object-cover" />
              <figcaption className="px-2.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {p.isMe ? "You" : p.name ?? "Them"}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:border-dusk-300 hover:text-dusk-700 disabled:opacity-50"
      >
        <Camera className="h-4 w-4" aria-hidden />
        {busy ? "Adding…" : mine ? "Replace your photo of today" : "Add a photo to this day"}
      </button>
    </div>
  );
}
