import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { isBuildTime } from "@/lib/build";

export const dynamic = "force-dynamic";

/** First screen: redirect to welcome (carousel) or app (logged in). */
export default async function HomePage() {
  if (isBuildTime()) return null;
  const session = await getServerAuthSession();
  if (session?.user) redirect("/app");
  redirect("/welcome");
}
