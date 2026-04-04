import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { isBuildTime } from "@/lib/build";
import { AppGate } from "../app-gate";
import { PairContent } from "./pair-content";

export const dynamic = "force-dynamic";

export default async function PairPage() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    if (isBuildTime()) return null;
    return <AppGate callbackUrl="/app/pair" />;
  }

  const relationships = await getMyActiveRelationships();
  if (relationships.length > 0 && !isBuildTime()) {
    redirect("/app");
  }

  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between gap-4 pb-4">
        <div className="relative h-9 w-9 shrink-0" aria-hidden>
          <Image
            src="/aligned-icon.png"
            alt=""
            width={36}
            height={36}
            className="object-contain"
          />
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Pair with your partner
          </h1>
          <p className="mt-2 text-slate-600">
            Share your invite code or enter your partner&apos;s code—then you&apos;ll get the same daily question, with
            answers that unlock together.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            <Link href="/app" className="font-medium text-brand-700 underline-offset-2 hover:underline">
              Skip for now
            </Link>{" "}
            if you want to look around—today&apos;s shared question stays locked until you pair.
          </p>
        </div>

        <PairContent />
      </div>
    </div>
  );
}
