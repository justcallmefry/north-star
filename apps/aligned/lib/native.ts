import { headers } from "next/headers";

/**
 * Marker appended to the WKWebView user agent by capacitor.config.ts.
 * Keep the two in sync.
 */
export const NATIVE_UA_MARKER = "AlignedNativeIOS";

/**
 * True when this request came from the native iOS app rather than the
 * website.
 *
 * Used to hide the web Stripe purchase path inside the app: App Store
 * Guideline 3.1.1 requires digital subscriptions to go through in-app
 * purchase, and offering an external checkout is a rejection. The website
 * keeps Stripe; the app will get IAP (RevenueCat) before it charges.
 */
export async function isNativeRequest(): Promise<boolean> {
  const requestHeaders = await headers();
  return (requestHeaders.get("user-agent") ?? "").includes(NATIVE_UA_MARKER);
}
