import Link from "next/link";

const CONTAINER = "mx-auto max-w-5xl px-5 sm:px-8";

const loginHref =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/login`
    : "/login";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white py-6">
      <div className={`${CONTAINER} flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:gap-4`}>
        <p className="text-center text-xs text-slate-400 sm:text-left">
          © {new Date().getFullYear()} Parent & Young Adult
        </p>
        <nav className="flex items-center gap-4 text-xs text-slate-400">
          <a href={loginHref} className="hover:text-slate-600">
            Sign in
          </a>
          <Link href="/privacy" className="hover:text-slate-600">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-slate-600">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
