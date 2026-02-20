import { redirect } from "next/navigation";
import { isBuildTime } from "@/lib/build";

export const dynamic = "force-dynamic";

/**
 * Root URL: always send to welcome. No auth or DB call so the site always loads.
 * Welcome page will redirect logged-in users to /app on the client.
 */
export default async function HomePage() {
  if (isBuildTime()) return null;
  redirect("/welcome");
}
