// apps/aligned/app/app/loading-dots.tsx
export function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-loading-dot" style={{ animationDelay: "0ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-loading-dot" style={{ animationDelay: "150ms" }} />
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 animate-loading-dot" style={{ animationDelay: "300ms" }} />
    </span>
  );
}
