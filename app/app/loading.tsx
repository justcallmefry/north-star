export default function AppLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4" aria-live="polite">
      <div
        className="h-10 w-10 rounded-full border-2 border-pink-100 border-t-pink-400 animate-loading-spin"
        aria-hidden
      />
      <p className="mt-4 text-sm text-slate-500">Loading…</p>
    </div>
  );
}
