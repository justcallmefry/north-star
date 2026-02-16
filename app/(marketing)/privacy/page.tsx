import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Back
      </Link>
      <h1 className="mt-6 text-xl font-semibold text-slate-900">Privacy</h1>
      <p className="mt-3 text-base leading-7 text-slate-600">
        Privacy policy placeholder. We respect your data and will never sell it.
      </p>
    </main>
  );
}
