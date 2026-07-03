"use client";

import { useState } from "react";
import type { RefObject } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  /** The on-screen sky <svg> — cloned and rasterized, so the card always matches what they see. */
  svgRef: RefObject<SVGSVGElement | null>;
  starCount: number;
  alignedCount: number;
  paletteLabel: string;
};

const CARD_W = 1080;
const CARD_H = 1350; // 4:5 — plays nice with feeds

/** Rasterize the live sky SVG into a framed share card. */
async function renderCard(
  svg: SVGSVGElement,
  { starCount, alignedCount, paletteLabel }: Omit<Props, "svgRef">
): Promise<Blob> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const skySize = 920;
  clone.setAttribute("width", String(skySize));
  clone.setAttribute("height", String(skySize));

  const svgUrl = URL.createObjectURL(
    new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" })
  );
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Couldn't render the sky."));
      img.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable.");

    // Night-sky backdrop matching the in-app gradient
    const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
    bg.addColorStop(0, "#0F2740");
    bg.addColorStop(0.6, "#0A1828");
    bg.addColorStop(1, "#060D16");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // Header
    ctx.textAlign = "center";
    ctx.fillStyle = "#F5EFE3";
    ctx.font = "600 64px Georgia, 'Times New Roman', serif";
    ctx.fillText("Our sky", CARD_W / 2, 128);
    ctx.fillStyle = "rgba(232, 237, 244, 0.75)";
    ctx.font = "400 34px Georgia, 'Times New Roman', serif";
    ctx.fillText(
      `${starCount} star${starCount === 1 ? "" : "s"} · ${alignedCount} aligned · ${paletteLabel}`,
      CARD_W / 2,
      186
    );

    // The sky itself
    ctx.drawImage(img, (CARD_W - skySize) / 2, 230, skySize, skySize);

    // Footer
    ctx.fillStyle = "rgba(232, 237, 244, 0.55)";
    ctx.font = "500 30px Georgia, 'Times New Roman', serif";
    ctx.fillText("Every star is a day we showed up for each other.", CARD_W / 2, CARD_H - 96);
    ctx.font = "600 30px Georgia, 'Times New Roman', serif";
    ctx.fillStyle = "rgba(232, 237, 244, 0.8)";
    ctx.fillText("ALIGNED", CARD_W / 2, CARD_H - 44);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Couldn't create the image."))),
        "image/png"
      );
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function ShareSkyButton({ svgRef, starCount, alignedCount, paletteLabel }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    const svg = svgRef.current;
    if (!svg || busy) return;
    setBusy(true);
    try {
      const blob = await renderCard(svg, { starCount, alignedCount, paletteLabel });
      const file = new File([blob], "our-sky.png", { type: "image/png" });

      if (typeof navigator.share === "function" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Our sky" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "our-sky.png";
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Sky saved as an image.");
      }
    } catch (err) {
      // User closing the share sheet isn't an error worth surfacing.
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("Couldn't share your sky. Try again?");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      disabled={busy}
      className="ns-btn-secondary inline-flex w-full items-center justify-center gap-2 !py-2.5 text-sm transition active:scale-[0.98] disabled:opacity-60"
    >
      <Share2 className="h-4 w-4" aria-hidden />
      {busy ? "Making your card…" : "Share your sky"}
    </button>
  );
}
