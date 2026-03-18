import "./globals.css";
import React, { Suspense } from "react";
import type { Metadata } from "next";
import { ThemeRoot } from "../components/ThemeRoot";
import RouteAnalytics from "./route-analytics";
import { Analytics } from "@vercel/analytics/next";

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
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRoot>
          {children}
          <Suspense fallback={null}>
            <RouteAnalytics />
          </Suspense>
        </ThemeRoot>
        <Analytics />
      </body>
    </html>
  );
}
