import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen font-sans antialiased bg-white text-slate-900">
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  );
}
