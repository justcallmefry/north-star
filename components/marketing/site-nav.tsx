import Link from "next/link";
import Image from "next/image";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2 text-slate-900">
          <Image
            src="/aligned-icon.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="font-semibold tracking-tight">Aligned</span>
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
