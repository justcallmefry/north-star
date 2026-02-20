import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { isBuildTime } from "@/lib/build";

export const dynamic = "force-dynamic";

/** First screen: redirect to welcome (carousel) or app (logged in). */
export default async function HomePage() {
  if (isBuildTime()) return null;
  try {
    const session = await getServerAuthSession();
    if (session?.user) redirect("/app");
  } catch {
    // If auth/DB fails, send to welcome so the site isn't broken
  }
  redirect("/welcome");
}
