/** True when running during next build (e.g. "Collecting page data"). Avoid redirect() in pages then. */
export function isBuildTime(): boolean {
  const phase =
    process.env.NEXT_PUBLIC_BUILD_PHASE ?? process.env.NEXT_PHASE ?? "";
  return phase === "phase-production-build";
}
