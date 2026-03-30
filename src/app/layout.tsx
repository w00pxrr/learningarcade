import "./globals.css";
import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { ThemeRoot } from "../components/ThemeRoot";
import { Footer } from "../components/Footer";
import { AntiInspect } from "../components/AntiInspect";
import RouteAnalytics from "./route-analytics";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
  preload: false,
});

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
      {
        url: "/img/Learning Arcade Background Removed.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "/img/Learning Arcade Background Removed.png",
        sizes: "16x16",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/img/Learning Arcade Background Removed.png",
        sizes: "180x180",
        type: "image/png",
      },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
    <html
      lang="en"
      suppressHydrationWarning
      className={poppins.variable}
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Resource hints for faster loading */}
        <link rel="preconnect" href="https://cloud.umami.is" />
        <link rel="preconnect" href="https://api-gateway.umami.dev" />
        <link rel="dns-prefetch" href="https://cloud.umami.is" />
        <link rel="dns-prefetch" href="https://api-gateway.umami.dev" />

        {/* Preconnect to external game hosts for faster iframe loading (esp. Chromebooks) */}
        <link rel="preconnect" href="https://w00pxrr.github.io" />
        <link rel="dns-prefetch" href="https://w00pxrr.github.io" />
        <link rel="preconnect" href="https://guitheengineer.github.io" />
        <link rel="dns-prefetch" href="https://guitheengineer.github.io" />
        <link rel="preconnect" href="https://krunker.io" />
        <link rel="dns-prefetch" href="https://krunker.io" />
        <link rel="preconnect" href="https://proxy-iota-black.vercel.app" />
        <link rel="dns-prefetch" href="https://proxy-iota-black.vercel.app" />

        {/* Prefetch popular external game pages for instant loading */}
        <link rel="prefetch" href="https://w00pxrr.github.io/funkinverc/" as="document" />

        {/* Preload critical FontAwesome font */}
        <link
          rel="preload"
          href="/vendor/fontawesome-6/fontawesome-free/webfonts/fa-solid-900.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* FontAwesome icons */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/vendor/fontawesome-6/fontawesome-free/css/all.min.css" />
        {/* Override FontAwesome font-display for better performance */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face{font-family:"Font Awesome 7 Free";font-style:normal;font-weight:900;font-display:swap;src:url("/vendor/fontawesome-6/fontawesome-free/webfonts/fa-solid-900.woff2") format("woff2")}
              @font-face{font-family:"Font Awesome 7 Free";font-style:normal;font-weight:400;font-display:swap;src:url("/vendor/fontawesome-6/fontawesome-free/webfonts/fa-regular-400.woff2") format("woff2")}
              @font-face{font-family:"Font Awesome 7 Brands";font-style:normal;font-weight:400;font-display:swap;src:url("/vendor/fontawesome-6/fontawesome-free/webfonts/fa-brands-400.woff2") format("woff2")}
            `,
          }}
        />

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
        {/* Register service worker for caching */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />

        {/* Anti-inspect: early-bird protections */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                document.addEventListener('contextmenu',function(e){e.preventDefault()});
                document.addEventListener('keydown',function(e){
                  var k=e.key.toLowerCase();
                  var mc=navigator.platform.toUpperCase().indexOf('MAC')>=0?e.metaKey:e.ctrlKey;
                  if(e.key==='F12'){e.preventDefault();return}
                  if(mc&&e.shiftKey&&(k==='i'||k==='j'||k==='c'||k==='k')){e.preventDefault();return}
                  if(mc&&k==='u'){e.preventDefault();return}
                  if(mc&&k==='s'){e.preventDefault();return}
                });
                console.clear();
                console.log('%cSTOP','color:red;font-size:60px;font-weight:bold');
                console.log('%cThis is a browser feature intended for developers. Do not paste any code here.', 'font-size:16px;color:#333');
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeRoot>
          <AntiInspect />
          {children}
          <Footer />
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
