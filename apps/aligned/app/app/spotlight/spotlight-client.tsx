"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { sendSpotlight } from "@/lib/spotlight";
import type { SpotlightStatus } from "@/lib/spotlight";
import { haptic } from "@/lib/haptics";

type Props = { relationshipId: string; status: SpotlightStatus };

export function SpotlightClient({ relationshipId, status }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(["", "", ""]);
  const [loading, setLoading] = useState(false);

  function updateItem(i: number, val: string) {
    setItems((prev) => prev.map((v, idx) => (idx === i ? val : v)));
  }

  async function handleSend() {
    const filled = items.filter((s) => s.trim());
    if (!filled.length) return;
    setLoading(true);
    try {
      await sendSpotlight(relationshipId, filled);
      void haptic("success");
      toast.success("Sent.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  if (status.type === "received") {
    return (
      <div className="animate-calm-fade-in space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
            {status.fromName ?? "Your partner"} wrote this for you
          </p>
          <p className="text-sm text-slate-500">Read slowly.</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white px-6 py-6 space-y-4 shadow-sm">
          {status.fromImage && (
            <img
              src={status.fromImage}
              alt=""
              className="mx-auto h-12 w-12 rounded-full object-cover"
            />
          )}
          {status.items.map((item, i) => (
            <div key={i} className="rounded-xl border border-brand-100 bg-white/70 px-4 py-3.5 flex gap-3 items-start">
              <span className="text-xl shrink-0">{["💗", "✨", "🌟"][i] ?? "•"}</span>
              <p className="text-base leading-relaxed text-slate-900 sm:text-lg">{item}</p>
            </div>
          ))}
          {status.fromName && (
            <p className="text-center text-sm font-medium text-brand-700 pt-2">
              — {status.fromName}
            </p>
          )}
        </div>
        <p className="text-center text-sm text-slate-500 leading-relaxed">
          Tell them you saw this. Words like these deserve a real response.
        </p>
      </div>
    );
  }

  if (status.type === "sent") {
    return (
      <div className="animate-calm-fade-in space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">Sent</p>
          <p className="text-sm text-slate-500">You wrote this for {status.toName ?? "them"}.</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white px-6 py-6 space-y-4 shadow-sm">
          {status.items.map((item, i) => (
            <div key={i} className="flex gap-3">
              <span className="mt-0.5 text-xl">{["💗", "✨", "🌟"][i] ?? "•"}</span>
              <p className="text-lg leading-relaxed text-slate-800">{item}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-slate-500">New spotlight available next month.</p>
      </div>
    );
  }

  if (status.type === "none") {
    return (
      <p className="text-center text-slate-500">Pair with a partner to send a spotlight.</p>
    );
  }

  const partnerName = status.partnerName ?? "your partner";

  return (
    <div className="animate-calm-fade-in space-y-6">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
          Partner Spotlight
        </p>
        <h1 className="text-2xl font-bold text-slate-900">
          3 things you love about {partnerName}.
        </h1>
        <p className="text-sm text-slate-500">
          Be specific. The little things land hardest.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-3.5 text-lg shrink-0">{["💗", "✨", "🌟"][i]}</span>
            <textarea
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder={
                i === 0
                  ? "Something specific they did recently…"
                  : i === 1
                    ? "A quality you never want to take for granted…"
                    : "Something small they do that means a lot…"
              }
              rows={2}
              maxLength={300}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-base leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-300 resize-none"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSend}
        disabled={loading || items.every((s) => !s.trim())}
        className="ns-btn-primary w-full py-3.5 text-lg disabled:opacity-50"
      >
        {loading ? "Sending…" : `Send to ${partnerName}`}
      </button>

      <p className="text-center text-xs text-slate-400">
        Once a month. They&apos;ll see it when they open this screen.
      </p>
    </div>
  );
}
