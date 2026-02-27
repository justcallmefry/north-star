import { WelcomeContent } from "@/app/(auth)/welcome/page";

export const dynamic = "force-dynamic";

/**
 * Main page at alignedconnectingcouples.com. Renders the welcome experience
 * (logo, Sign in / Sign up, benefits). Logged-in users redirect to /app on the client.
 */
export default function HomePage() {
  return <WelcomeContent />;
}
