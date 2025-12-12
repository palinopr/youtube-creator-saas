import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ConditionalAIChatPopup from "@/components/ConditionalAIChatPopup";
import { ToastProvider } from "@/components/providers/ErrorProvider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { OrganizationJsonLd, SoftwareApplicationJsonLd } from "@/components/seo";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.tubegrow.io";
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TubeGrow | AI-Powered YouTube Analytics & Growth Tools",
    template: "%s | TubeGrow",
  },
  description:
    "Grow your YouTube channel with AI-powered analytics, SEO optimization, and viral clip generation. Get actionable insights to maximize views, subscribers, and engagement.",
  keywords: [
    "YouTube analytics",
    "YouTube growth",
    "YouTube SEO",
    "viral clips generator",
    "YouTube optimization",
    "AI YouTube tools",
    "YouTube channel analytics",
    "grow YouTube channel",
    "YouTube Shorts clips",
    "video performance analytics",
    "content ideas for YouTube",
  ],
  authors: [{ name: "TubeGrow" }],
  creator: "TubeGrow",
  publisher: "TubeGrow",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "TubeGrow",
    title: "TubeGrow | AI-Powered YouTube Analytics & Growth Tools",
    description:
      "Grow your YouTube channel with AI-powered analytics, SEO optimization, and viral clip generation. Get actionable insights to maximize views, subscribers, and engagement.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TubeGrow - AI-Powered YouTube Analytics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TubeGrow | AI-Powered YouTube Analytics & Growth Tools",
    description:
      "Grow your YouTube channel with AI-powered analytics, SEO optimization, and viral clip generation.",
    images: ["/og-image.png"],
    creator: "@tubegrow",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
        <OrganizationJsonLd />
        <SoftwareApplicationJsonLd />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased min-h-screen`}>
        <ToastProvider>
          {children}
          <ConditionalAIChatPopup />
        </ToastProvider>
      </body>
    </html>
  );
}
