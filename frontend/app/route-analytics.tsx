"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { enableAnalyticsFromConsent, trackPageView } from "../utils/umami";

export default function RouteAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    enableAnalyticsFromConsent();
  }, []);

  useEffect(() => {
    const nextUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    if (lastUrl.current !== nextUrl) {
      lastUrl.current = nextUrl;
      trackPageView();
    }
  }, [pathname, searchParams]);

  return null;
}
