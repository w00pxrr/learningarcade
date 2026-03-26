import "./globals.css";
import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { ThemeRoot } from "../components/ThemeRoot";
import RouteAnalytics from "./route-analytics";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://learningarcade.vercel.app"),
  title: {
    default: "LearningArcade | Free Online Games for School",
    template: "%s | LearningArcade",
  },
  description:
    "Play free online games on LearningArcade. Safe, school-friendly unblocked games including action, puzzle, racing, sports, and more. Works on any device - no downloads required.",
  keywords: [
    "online games",
    "free games",
    "unblocked games",
    "school games",
    "browser games",
    "HTML5 games",
    "educational games",
    "action games",
    "puzzle games",
    "racing games",
    "sports games",
    "strategy games",
    "simulation games",
    "platformer games",
    "arcade games",
    "flash games",
    "retro games",
    "games for school",
    "games for kids",
    "safe games",
  ],
  openGraph: {
    type: "website",
    url: "https://learningarcade.vercel.app/",
    title: "LearningArcade | Free Online Games for School",
    description:
      "Play free online games on LearningArcade. Safe, school-friendly unblocked games including action, puzzle, racing, sports, and more. Works on any device.",
    siteName: "LearningArcade",
    locale: "en_US",
    images: [
      {
        url: "/img/Learning Arcade Background Removed.png",
        width: 1200,
        height: 630,
        alt: "LearningArcade - Free Online Games",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LearningArcade | Free Online Games for School",
    description:
      "Play free online games on LearningArcade. Safe, school-friendly unblocked games including action, puzzle, racing, sports, and more.",
    images: ["/img/Learning Arcade Background Removed.png"],
    creator: "@learningarcade",
    site: "@learningarcade",
  },
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
  icons: {
    icon: [
      { url: "/img/Learning Arcade Background Removed.png", sizes: "32x32", type: "image/png" },
      { url: "/img/Learning Arcade Background Removed.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/img/Learning Arcade Background Removed.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/img/Learning Arcade Background Removed.png",
      },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://learningarcade.vercel.app",
  },
  other: {
    "theme-color": "#0f172a",
    "msapplication-TileColor": "#0f172a",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "LearningArcade",
    "application-name": "LearningArcade",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Structured data for the website
  const websiteStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LearningArcade",
    url: "https://learningarcade.vercel.app",
    description:
      "Play free online games on LearningArcade. Safe, school-friendly unblocked games including action, puzzle, racing, sports, and more.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://learningarcade.vercel.app/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LearningArcade",
    url: "https://learningarcade.vercel.app",
    logo: "https://learningarcade.vercel.app/img/Learning Arcade Background Removed.png",
    sameAs: [],
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external origins for faster connections on Chromebooks */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* DNS prefetch for game resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteStructuredData),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationStructuredData),
          }}
        />
      </head>
      <body>
        <ThemeRoot>
          {children}
          <Suspense fallback={null}>
            <RouteAnalytics />
          </Suspense>
        </ThemeRoot>
        {/* Load analytics after page is interactive to reduce impact on Chromebooks */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
