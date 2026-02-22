/** Shared helper: true if the value is a custom profile image URL (not an emoji). */
export function isProfileImageUrl(value: string | null | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  return value.startsWith("http://") || value.startsWith("https://");
}
