import { redirect } from "next/navigation";
import { RedirectIfAuthenticated } from "../redirect-if-authenticated";
import { Landing } from "./landing";

export const dynamic = "force-dynamic";

const loginHref =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/login`
    : "/login";

const signupHref =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/signup`
    : "/signup";

/**
 * Welcome (landing) content. Rendered at / (main page). /welcome redirects to /.
 * No server-side auth or DB call — always returns HTML so the page loads reliably on Vercel.
 * Logged-in users redirect to /app on the client.
 */
export function WelcomeContent() {
  return (
    <RedirectIfAuthenticated>
      <Landing loginHref={loginHref} signupHref={signupHref} />
    </RedirectIfAuthenticated>
  );
}

export default function WelcomePage() {
  redirect("/");
}
