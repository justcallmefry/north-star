import Image from "next/image";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

/** Log in: email + password or magic link. */
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900 flex flex-col">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="relative h-9 w-9 shrink-0" aria-hidden>
          <Image
            src="/aligned-icon.png"
            alt=""
            width={36}
            height={36}
            className="object-contain"
          />
        </div>
        <Link
          href="/"
          className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-200 rounded-lg py-2 -ml-2"
          aria-label="Back to welcome"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
          Back
        </Link>
      </header>

      <section
        className="flex-1 flex flex-col px-4 pb-8 sm:px-6 max-w-md"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom) + 1rem)" }}
      >
        <LoginForm />
      </section>
    </main>
  );
}
