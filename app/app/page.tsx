import { getServerAuthSession } from "@/lib/auth";
import { getActiveRelationshipsForUser } from "@/lib/relationships";
import { AppPageClient } from "./app-page-client";
import { RedirectToLogin } from "./redirect-to-login";

export const dynamic = "force-dynamic";

/**
 * App home: session and data from the same request that has the cookie.
 * We never use server redirect() here so a refetch/RSC revalidation always gets 200
 * and can’t send the user to login; only the client redirects when there’s no session.
 */
export default async function AppPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    return <RedirectToLogin callbackUrl="/app" />;
  }
  const relationships = await getActiveRelationshipsForUser(session.user.id);
  const initialData = {
    session: { user: session.user },
    relationships: relationships.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
    })),
  };
  return <AppPageClient initialData={initialData} />;
}
