import { Montserrat } from "next/font/google";
import { SiteNav } from "@/components/marketing/site-nav";
import { SiteFooter } from "@/components/marketing/site-footer";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${montserrat.variable} min-h-screen font-montserrat antialiased`}>
      <SiteNav />
      {children}
      <SiteFooter />
    </div>
  );
}
