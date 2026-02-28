import { LoadingSpinner } from "@/components/loading-spinner";

export default function AppLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4" aria-live="polite">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-slate-500">Loading…</p>
    </div>
  );
}
