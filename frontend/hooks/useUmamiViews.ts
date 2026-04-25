import { useEffect, useState } from "react";

type UmamiViewCounts = {
  counts: Record<string, number>;
  updatedAt: number | null;
  loading: boolean;
  error: string | null;
};

const OBFUSCATED_SHARE_ID = "TN14I08WbLiddUPc";
const UMAMI_REGION = "us";
const UMAMI_BASE = `https://cloud.umami.is/analytics/${UMAMI_REGION}/api`;

function decodeShareId(value: string): string {
  try {
    const decoded = atob(value);
    if (/^[A-Za-z0-9_-]{8,}$/.test(decoded)) return decoded;
    return value;
  } catch {
    return value;
  }
}

export function useUmamiViews(): UmamiViewCounts {
  const [state, setState] = useState<UmamiViewCounts>({
    counts: {},
    updatedAt: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    const shareId = decodeShareId(OBFUSCATED_SHARE_ID);
    if (!shareId) return;

    let active = true;
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    const load = async () => {
      try {
        const shareRes = await fetch(`${UMAMI_BASE}/share/${shareId}`, {
          signal: controller.signal,
        });
        if (!shareRes.ok) throw new Error(`Umami share error: ${shareRes.status}`);
        const sharePayload = (await shareRes.json()) as {
          websiteId?: string;
          token?: string;
        };
        if (!sharePayload.websiteId || !sharePayload.token) {
          throw new Error("Invalid Umami share response");
        }

        const now = Date.now();
        const statsUrl = new URL(
          `${UMAMI_BASE}/websites/${sharePayload.websiteId}/event-data/values`,
        );
        statsUrl.searchParams.set("startAt", "0");
        statsUrl.searchParams.set("endAt", `${now}`);
        statsUrl.searchParams.set("event", "game_view");
        statsUrl.searchParams.set("propertyName", "gameId");

        const statsRes = await fetch(statsUrl.toString(), {
          headers: {
            "x-umami-share-token": sharePayload.token,
            Accept: "application/json",
          },
          signal: controller.signal,
        });
        if (!statsRes.ok) throw new Error(`Umami stats error: ${statsRes.status}`);
        const data = (await statsRes.json()) as Array<{ value: string; total: number }>;
        const counts: Record<string, number> = {};
        for (const entry of data) {
          if (entry.value) counts[entry.value] = entry.total ?? 0;
        }
        if (!active) return;
        setState({ counts, updatedAt: now, loading: false, error: null });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: (err as Error).message,
        }));
      }
    };

    load();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return state;
}
