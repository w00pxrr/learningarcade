import { useCallback, useEffect, useMemo } from "react";
import { applyDisguise, getBroadcastDisguise } from "../utils/disguise";

export function useDisguise(baseTitle: string, baseIcon: string) {
  const channel = useMemo(() => getBroadcastDisguise(), []);

  const apply = useCallback(() => applyDisguise(baseTitle, baseIcon), [baseTitle, baseIcon]);

  useEffect(() => {
    apply();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "gams") apply();
    };
    const handleFocus = () => apply();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") apply();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    if (channel) channel.onmessage = () => apply();

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (channel) channel.close();
    };
  }, [apply, channel]);

  const broadcast = useCallback(() => {
    if (channel) channel.postMessage("update");
  }, [channel]);

  return { broadcast, apply };
}
