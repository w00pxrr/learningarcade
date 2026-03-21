import "./globals.css";
import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { ThemeRoot } from "../components/ThemeRoot";
import RouteAnalytics from "./route-analytics";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL("https://learningarcade.vercel.app"),
  title: "LearningArcade | Unblocked Educational Games for School",
  description:
    "LearningArcade offers safe, school-friendly unblocked games with educational and skill-building titles. Play fast, lightweight browser games on any device.",
  openGraph: {
    type: "website",
    url: "https://learningarcade.vercel.app/",
    title: "LearningArcade | Unblocked Educational Games for School",
    description:
      "Safe, school-friendly unblocked games with educational and skill-building titles. Play fast, lightweight browser games on any device.",
    siteName: "LearningArcade",
    locale: "en_US",
    images: ["/img/gams.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "LearningArcade | Unblocked Educational Games for School",
    description:
      "Safe, school-friendly unblocked games with educational and skill-building titles. Play fast, lightweight browser games on any device.",
    images: ["/img/gams.png"],
  },
  robots: "index, follow",
  icons: {
    icon: "/img/gams-g.png",
  },
  other: {
    'theme-color': '#0f172a',
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external origins for faster connections on Chromebooks */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for game resources */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
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
