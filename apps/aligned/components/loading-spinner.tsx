"use client";

import { Loader2 } from "lucide-react";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-5 w-5",
  md: "h-8 w-8",
  lg: "h-10 w-10",
};

/** Spinning Loader2 icon — fits the "Aligned" vibe (progress, connection) better than a plain circle. */
export function LoadingSpinner({ size = "md", className = "" }: Props) {
  return (
    <Loader2
      className={`${sizeClasses[size]} animate-loading-spin text-brand-500 motion-reduce:animate-none ${className}`}
      strokeWidth={2.5}
      aria-hidden
    />
  );
}
