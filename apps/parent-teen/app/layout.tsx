import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
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

const appUrl =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
    : undefined;

export const metadata: Metadata = {
  title: "Parent & Young Adult",
  description: "One question a day. You and your young adult.",
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  manifest: "/manifest.json",
  icons: {
    icon: "/aligned-icon.png",
    apple: "/aligned-icon.png",
  },
  openGraph: {
    title: "Parent & Young Adult",
    description: "One question a day. You and your young adult.",
    ...(appUrl && {
      url: appUrl,
      siteName: "Parent & Young Adult",
      images: [{ url: "/aligned-icon.png", width: 512, height: 512, alt: "Parent & Young Adult" }],
    }),
  },
  twitter: {
    card: "summary",
    title: "Parent & Young Adult",
    description: "One question a day. You and your young adult.",
  },
};

export const viewport: Viewport = {
  themeColor: "#9333ea",
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-white text-slate-900 overflow-x-hidden max-w-[100vw]`} suppressHydrationWarning>
        <ApplePwaMeta />
        <Providers session={session}>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
