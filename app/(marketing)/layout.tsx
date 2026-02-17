import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen font-sans antialiased bg-ns-bg text-slate-100">
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  );
}
