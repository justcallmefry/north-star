"use client";

import Image from "next/image";
import { useMemo } from "react";

export const TODAY_IMAGE_PATHS = [
  "/today-images/1.jpg",
  "/today-images/2.jpg",
  "/today-images/3.jpg",
  "/today-images/4.jpg",
  "/today-images/5.jpg",
  "/today-images/6.png",
  "/today-images/7.jpg",
  "/today-images/8.jpg",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Shuffle array and return first n elements (no duplicates). */
export function pickDistinctRandom(paths: string[], n: number): string[] {
  const copy = [...paths];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

type Props = {
  src?: string;
  className?: string;
  sizes?: string;
};

/** Renders an image from public/today-images. Use src when provided (e.g. from pickDistinctRandom); otherwise picks one random. */
export function TodayRandomImage({ src: srcProp, className = "", sizes = "128px" }: Props) {
  const randomSrc = useMemo(() => pickRandom(TODAY_IMAGE_PATHS), []);
  const src = srcProp ?? randomSrc;

  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-2xl bg-slate-100 ${className}`} aria-hidden>
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        sizes={sizes}
      />
    </span>
  );
}
