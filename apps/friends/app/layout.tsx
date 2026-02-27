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
  title: "Friends",
  description: "One question a day. Stay close with a friend.",
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  manifest: "/manifest.json",
  icons: {
    icon: "/aligned-icon.png",
    apple: "/aligned-icon.png",
  },
  openGraph: {
    title: "Friends",
    description: "One question a day. Stay close with a friend.",
    ...(appUrl && {
      url: appUrl,
      siteName: "Friends",
      images: [{ url: "/aligned-icon.png", width: 512, height: 512, alt: "Friends" }],
    }),
  },
  twitter: {
    card: "summary",
    title: "Friends",
    description: "One question a day. Stay close with a friend.",
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
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-white text-slate-900 overflow-x-hidden max-w-[100vw]`}>
        <ApplePwaMeta />
        <Providers session={session}>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
