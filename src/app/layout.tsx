import "./globals.css";
import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { ThemeRoot } from "../components/ThemeRoot";
import { Footer } from "../components/Footer";
import { AntiInspect } from "../components/AntiInspect";
import RouteAnalytics from "./route-analytics";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://learningarcade.qzz.io"),
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
    url: "https://learningarcade.qzz.io/",
    title: "Educational Games 67 | Free Online Games for School",
    description:
      "Play free online games on Educational Games 67. Safe, school-friendly unblocked games including action, puzzle, racing, sports, and more. Works on any device.",
    siteName: "LearningArcade",
    locale: "en_US",
    images: [
      {
        url: "/icons/apple-touch-icon.png",
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
    images: ["/icons/apple-touch-icon.png"],
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
        url: "/icons/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
      {
        url: "/icons/favicon.ico",
        sizes: "16x16",
        type: "image/x-icon",
      },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png" },
      { url: "/icons/apple-touch-icon-57x57.png", sizes: "57x57" },
      { url: "/icons/apple-touch-icon-72x72.png", sizes: "72x72" },
      { url: "/icons/apple-touch-icon-76x76.png", sizes: "76x76" },
      { url: "/icons/apple-touch-icon-114x114.png", sizes: "114x114" },
      { url: "/icons/apple-touch-icon-120x120.png", sizes: "120x120" },
      { url: "/icons/apple-touch-icon-144x144.png", sizes: "144x144" },
      { url: "/icons/apple-touch-icon-152x152.png", sizes: "152x152" },
      { url: "/icons/apple-touch-icon-180x180.png", sizes: "180x180" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/icons/favicon.ico",
      },
    ],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://learningarcade.qzz.io",
  },
  other: {
    "theme-color": "#000000",
    "msapplication-TileColor": "#000000",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "LearningArcade",
    "application-name": "LearningArcade",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
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
    url: "https://learningarcade.qzz.io",
    description:
      "Play free online games on LearningArcade. Safe, school-friendly unblocked games including action, puzzle, racing, sports, and more.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://learningarcade.qzz.io/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LearningArcade",
    url: "https://learningarcade.qzz.io",
    logo: "https://learningarcade.qzz.io/icons/apple-touch-icon.png",
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

        {/* Preload critical FontAwesome font */}
        <link
          rel="preload"
          href="/vendor/fontawesome-7/webfonts/fa-solid-900.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* FontAwesome icons */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/vendor/fontawesome-7/css/all.min.css" />
        {/* Override FontAwesome font-display for better performance */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @font-face{font-family:"Font Awesome 7 Free";font-style:normal;font-weight:900;font-display:swap;src:url("/vendor/fontawesome-7/webfonts/fa-solid-900.woff2") format("woff2")}
              @font-face{font-family:"Font Awesome 7 Free";font-style:normal;font-weight:400;font-display:swap;src:url("/vendor/fontawesome-7/webfonts/fa-regular-400.woff2") format("woff2")}
              @font-face{font-family:"Font Awesome 7 Brands";font-style:normal;font-weight:400;font-display:swap;src:url("/vendor/fontawesome-7/webfonts/fa-brands-400.woff2") format("woff2")}
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
        {/* Defer analytics after FCP to improve Lighthouse score - optimized for Chromebooks */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function loadDeferred() {
                  if (window.__deferredAnalyticsLoaded) return;
                  window.__deferredAnalyticsLoaded = true;
                  var ana = document.createElement('script');
                  ana.src = 'https://cdn.vercel.com/analytics/2.0.0/vanilla.js';
                  ana.async = true;
                  ana.setAttribute('data-website-id', 'xPrP4O');
                  ana.setAttribute('auto', 'true');
                  (document.head || document.documentElement).appendChild(ana);
                  var spd = document.createElement('script');
                  spd.src = 'https://vercel.com/speed-insights@1/script.js';
                  spd.setAttribute('data-dns', 'https://vitals.vercel.com');
                  spd.async = true;
                  (document.head || document.documentElement).appendChild(spd);
                }
                if ('requestIdleCallback' in window) {
                  requestIdleCallback(loadDeferred, { timeout: 4000 });
                } else {
                  setTimeout(loadDeferred, 2500);
                }
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
