import { redirect } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getQuizForToday } from "@/lib/quiz";
import { QuizClient } from "./quiz-client";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const relationshipId = relationships[0]?.id ?? null;
  if (!relationshipId) redirect("/app");

  const quiz = await getQuizForToday(relationshipId);
  if (!quiz) redirect("/app");

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200/80 ring-2 ring-white ring-offset-2">
          <HelpCircle className="h-8 w-8" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
          Daily quiz
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base max-w-md">
          Answer for yourself, then guess what your partner picked. See how well you know each other.
        </p>
      </div>
      <QuizClient
        relationshipId={relationshipId}
        initialData={quiz}
        sessionUserName={session.user.name ?? null}
        sessionUserImage={(session.user as { image?: string | null }).image ?? null}
        partnerImage={quiz.partnerImage ?? null}
      />
    </div>
  );
}
