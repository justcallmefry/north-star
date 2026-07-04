import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Fraunces } from "next/font/google";
import "./globals.css";
import { getServerAuthSession } from "@/lib/auth";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import { ApplePwaMeta } from "./apple-pwa-meta";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

/**
 * Fraunces is reserved for the couple's own words — the daily prompt and
 * the revealed answers — never for the app's own chrome. Playfair stays
 * the app's editorial voice (section headers, the Magazine); Fraunces is
 * the couple's voice. Variable "soft" optical size + light weight reads
 * warm and handwritten-adjacent without sacrificing legibility.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-prompt",
  display: "swap",
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
});

const appUrl =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
    : undefined;

export const metadata: Metadata = {
  title: "Aligned",
  description: "One question a day. Answer together with your partner.",
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  manifest: "/manifest.json",
  icons: {
    icon: "/aligned-icon.png",
    apple: "/aligned-icon.png",
  },
  openGraph: {
    title: "Aligned",
    description: "One question a day. Answer together with your partner.",
    ...(appUrl && {
      url: appUrl,
      siteName: "Aligned",
      images: [{ url: "/aligned-icon.png", width: 512, height: 512, alt: "Aligned" }],
    }),
  },
  twitter: {
    card: "summary",
    title: "Aligned",
    description: "One question a day. Answer together with your partner.",
  },
};

export const viewport: Viewport = {
  themeColor: "#2b8cbe",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "overlays-content",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerAuthSession();
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${fraunces.variable} font-sans antialiased bg-white text-slate-900 overflow-x-hidden max-w-[100vw]`}>
        <ApplePwaMeta />
        <Providers session={session}>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
