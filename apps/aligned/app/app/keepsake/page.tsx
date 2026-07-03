import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getMyActiveRelationships } from "@/lib/relationships";
import { getKeepsake } from "@/lib/keepsake";
import { PrintKeepsakeButton } from "./print-keepsake-button";

export const dynamic = "force-dynamic";

function formatLong(dateStr: string): string {
  return new Date(dateStr + "T12:00:00.000Z").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function KeepsakePage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/login");

  const relationships = await getMyActiveRelationships();
  const primary = relationships[0] ?? null;
  if (!primary) redirect("/app/pair");

  const book = await getKeepsake(primary.id);
  const title = book.names.length >= 2 ? book.names.join(" & ") : "Us";

  return (
    <div className="keepsake">
      {/* Screen-only chrome */}
      <div className="keepsake-chrome space-y-3">
        <Link
          href="/app/memories"
          className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          ← Memories
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
              Your book
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Every question you&apos;ve answered together, laid out to keep. Print it,
              save it as a PDF, tuck it away for an anniversary.
            </p>
          </div>
          {book.totals.days > 0 && <PrintKeepsakeButton />}
        </div>
      </div>

      {book.totals.days === 0 ? (
        <section className="keepsake-chrome ns-card mt-6 py-10 text-center">
          <p className="text-lg font-semibold text-slate-900">The first page is unwritten.</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
            Answer today&apos;s question together and your book begins.
          </p>
          <Link href="/app" className="ns-btn-primary mt-5 inline-block px-6 py-3">
            Answer today&apos;s question
          </Link>
        </section>
      ) : (
        <div className="keepsake-book mt-6">
          {/* Title page */}
          <section className="keepsake-cover">
            <p className="keepsake-eyebrow">Aligned · Our Story</p>
            <h2 className="keepsake-title">{title}</h2>
            <p className="keepsake-subtitle">
              {book.totals.days} day{book.totals.days === 1 ? "" : "s"} of showing up for
              each other
              {book.firstDate && book.lastDate && (
                <>
                  <br />
                  {formatLong(book.firstDate)} — {formatLong(book.lastDate)}
                </>
              )}
            </p>
          </section>

          {/* Entries */}
          {book.entries.map((entry) => (
            <article key={entry.sessionId} className="keepsake-entry">
              <p className="keepsake-date">
                {formatLong(entry.date)}
                {entry.kept && <span className="keepsake-kept"> · kept</span>}
              </p>
              <h3 className="keepsake-question">{entry.promptText}</h3>
              {entry.answers.map((a, i) => (
                <div key={i} className="keepsake-answer">
                  <p className="keepsake-name">{a.name ?? (i === 0 ? "One of us" : "The other")}</p>
                  <p className="keepsake-text">{a.content}</p>
                </div>
              ))}
            </article>
          ))}

          {/* Colophon */}
          <section className="keepsake-colophon">
            <p>✦</p>
            <p>Written one day at a time, together.</p>
          </section>
        </div>
      )}
    </div>
  );
}
