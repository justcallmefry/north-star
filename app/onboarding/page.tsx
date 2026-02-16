import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { CreateRelationshipForm } from "./create-form";

export default async function OnboardingPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  if (relationships.length > 0) redirect("/app"); // already in a relationship

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome to North Star</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Start as a couple or go solo.
          </p>
        </div>

        <div className="space-y-4">
          <CreateRelationshipForm />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">or</span>
            </div>
          </div>
          <Link
            href="/app"
            className="block w-full py-2 px-4 text-center border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Go solo (skip for now)
          </Link>
        </div>
      </div>
    </main>
  );
}
