import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ApplePwaMeta } from "./apple-pwa-meta";

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
  title: "North Star",
  description: "One question a day. Answer together with your partner.",
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  manifest: "/manifest.json",
  icons: {
    icon: "/north-star-app-logo-512.png",
    apple: "/north-star-app-logo-512.png",
  },
  openGraph: {
    title: "North Star",
    description: "One question a day. Answer together with your partner.",
    ...(appUrl && {
      url: appUrl,
      siteName: "North Star",
      images: [{ url: "/north-star-app-logo-512.png", width: 512, height: 512, alt: "North Star" }],
    }),
  },
  twitter: {
    card: "summary",
    title: "North Star",
    description: "One question a day. Answer together with your partner.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased bg-white text-slate-900 overflow-x-hidden max-w-[100vw]`}>
        <ApplePwaMeta />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
