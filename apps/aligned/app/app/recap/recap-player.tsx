"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RotateCcw, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import type { WeeklyRecap } from "@/lib/weekly-recap";
import {
  DURATION,
  H,
  W,
  drawRecapFrame,
  drawRecapPoster,
  recapCues,
  type SceneFonts,
} from "./recap-scene";

type Phase = "playing" | "done" | "recording" | "ready";

/** Read the real (next/font hashed) family names off the page. */
function resolveFonts(): SceneFonts {
  const probe = (cls: string) => {
    const el = document.createElement("span");
    el.className = cls;
    el.style.position = "absolute";
    el.style.visibility = "hidden";
    document.body.appendChild(el);
    const fam = getComputedStyle(el).fontFamily;
    el.remove();
    return fam || "Georgia, serif";
  };
  return { display: probe("font-prompt"), sans: probe("font-sans") };
}

/** The first video format this browser can record that a phone can play. */
function pickVideoType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const types = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? null;
}

async function shareOrDownload(file: File, title: string) {
  if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title });
    return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast.success("Saved to your downloads.");
}

export function RecapPlayer({ recap }: { recap: WeeklyRecap }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fontsRef = useRef<SceneFonts | null>(null);
  const rafRef = useRef<number | null>(null);
  /** Resolves the current playback; false when it was cut short. */
  const finishRef = useRef<((completed: boolean) => void) | null>(null);
  const [phase, setPhase] = useState<Phase>("playing");
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [reduced, setReduced] = useState(false);
  const cues = useMemo(() => recapCues(recap), [recap]);

  const stop = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    finishRef.current?.(false);
    finishRef.current = null;
  };

  /** Play from the start; resolves true once the last frame is drawn, false if stopped. */
  const play = useCallback(
    (withHaptics: boolean) =>
      new Promise<boolean>((resolve) => {
        const ctx = canvasRef.current?.getContext("2d");
        const fonts = fontsRef.current;
        if (!ctx || !fonts) return resolve(false);
        stop();
        finishRef.current = resolve;
        let fired = 0;
        const start = performance.now();
        const frame = (now: number) => {
          const t = Math.min((now - start) / 1000, DURATION);
          drawRecapFrame(ctx, t, recap, fonts);
          setProgress(t / DURATION);
          while (withHaptics && fired < cues.length && cues[fired]!.t <= t) {
            void haptic(cues[fired]!.kind);
            fired++;
          }
          if (t < DURATION) rafRef.current = requestAnimationFrame(frame);
          else {
            rafRef.current = null;
            finishRef.current = null;
            resolve(true);
          }
        };
        rafRef.current = requestAnimationFrame(frame);
      }),
    [recap, cues]
  );

  useEffect(() => {
    let cancelled = false;
    const isReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(isReduced);
    void document.fonts.ready.then(() => {
      if (cancelled) return;
      fontsRef.current = resolveFonts();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      if (isReduced) {
        drawRecapPoster(ctx, recap, fontsRef.current);
        setPhase("done");
        return;
      }
      void play(true).then((done) => done && !cancelled && setPhase("done"));
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [recap, play]);

  function replay() {
    if (phase === "recording" || reduced) return;
    setPhase("playing");
    void play(true).then((done) => done && setPhase((p) => (p === "playing" ? "done" : p)));
  }

  /**
   * Record the scene as it plays. Sharing needs a fresh tap afterwards:
   * iOS only opens the share sheet straight from a tap, and recording
   * takes the full 15 seconds.
   */
  async function makeVideo() {
    const canvas = canvasRef.current;
    const type = pickVideoType();
    if (!canvas || !fontsRef.current) return;
    if (!type || typeof canvas.captureStream !== "function" || reduced) {
      return makeImage();
    }
    // Leaving the app pauses drawing, which would leave a frozen, gappy
    // video. Cancel cleanly instead and let them try again.
    let interrupted = false;
    const onHide = () => {
      if (!document.hidden) return;
      interrupted = true;
      stop();
    };
    document.addEventListener("visibilitychange", onHide);
    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
      setPhase("recording");
      recorder.start(250);
      const completed = await play(false);
      if (completed) await new Promise((r) => setTimeout(r, 300)); // hold the end card a beat
      recorder.stop();
      await stopped;
      stream.getTracks().forEach((tr) => tr.stop());
      if (!completed || interrupted) {
        drawRecapFrame(canvas.getContext("2d")!, DURATION, recap, fontsRef.current);
        setPhase("done");
        toast("Keep Aligned open while your video is made, then try again.");
        return;
      }
      const ext = type.startsWith("video/mp4") ? "mp4" : "webm";
      const blob = new Blob(chunks, { type: type.split(";")[0] });
      if (blob.size === 0) throw new Error("empty recording");
      setFile(new File([blob], `our-week.${ext}`, { type: blob.type }));
      setPhase("ready");
      void haptic("success");
    } catch {
      // Recording isn't available here; a still is better than nothing.
      await makeImage();
    } finally {
      document.removeEventListener("visibilitychange", onHide);
    }
  }

  async function makeImage() {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !fontsRef.current) return;
    stop();
    drawRecapPoster(ctx, recap, fontsRef.current);
    const blob = await new Promise<Blob | null>((r) => canvasRef.current!.toBlob(r, "image/png"));
    if (!blob) {
      toast.error("Couldn't make your recap. Try again?");
      setPhase("done");
      return;
    }
    setFile(new File([blob], "our-week.png", { type: "image/png" }));
    setPhase("ready");
  }

  async function share() {
    if (!file) return;
    try {
      await shareOrDownload(file, "Our week on Aligned");
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Couldn't open sharing. Try again?");
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#060D16] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex w-full max-w-sm items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Your week together</p>
        <Link href="/app" aria-label="Close" className="rounded-full p-2 text-white/70 hover:bg-white/10">
          <X className="h-5 w-5" />
        </Link>
      </div>

      <button
        type="button"
        onClick={replay}
        aria-label={`Our week: ${recap.daysTogether} of 7 days together${
          recap.sharedWords[0] ? `, our word was ${recap.sharedWords[0]}` : ""
        }. Tap to replay.`}
        className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-white/10"
        // Height-led so the 9:16 frame never stretches: as tall as fits in
        // 70% of the screen, or as wide as the column allows, whichever is smaller.
        style={{
          aspectRatio: `${W} / ${H}`,
          height: "min(70vh, calc(min(100vw - 2rem, 24rem) * 16 / 9))",
        }}
      >
        <canvas ref={canvasRef} width={W} height={H} className="h-full w-full" />
        {(phase === "playing" || phase === "recording") && (
          <span className="absolute inset-x-4 top-3 h-1 overflow-hidden rounded-full bg-white/15" aria-hidden>
            <span className="block h-full bg-white/80" style={{ width: `${progress * 100}%` }} />
          </span>
        )}
        {phase === "done" && !reduced && (
          <span className="absolute bottom-3 right-3 rounded-full bg-black/40 p-2 text-white/80" aria-hidden>
            <RotateCcw className="h-4 w-4" />
          </span>
        )}
      </button>

      <div className="w-full max-w-sm space-y-2">
        {phase === "ready" ? (
          <button type="button" onClick={share} className="ns-btn-primary flex w-full items-center justify-center gap-2 py-3.5">
            <Share2 className="h-4 w-4" />
            {file?.type.startsWith("video") ? "Share video" : "Share image"}
          </button>
        ) : (
          <button
            type="button"
            onClick={makeVideo}
            disabled={phase === "recording"}
            className="ns-btn-primary flex w-full items-center justify-center gap-2 py-3.5 disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" />
            {phase === "recording" ? "Making your video…" : "Make a video to share"}
          </button>
        )}
        <p className="text-center text-xs text-white/45">
          Only numbers and the words you both used. Never your answers.
        </p>
      </div>
    </div>
  );
}
