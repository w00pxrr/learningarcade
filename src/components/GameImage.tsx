"use client";

import React, { useEffect, useMemo, useState } from "react";

type GameImageProps = {
  sources?: string[];
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  priority?: boolean;
};

export function GameImage({
  sources = [],
  alt,
  className,
  loading = "lazy",
  priority = false,
}: GameImageProps) {
  const sourceKey = sources.join("|");
  const sourceList = useMemo(
    () => sources.filter((value) => typeof value === "string" && value.length > 0),
    [sourceKey],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [sourceKey]);

  const activeSource = sourceList[index] ?? sourceList[0] ?? "";

  return (
    <img
      className={className}
      src={activeSource}
      alt={alt}
      loading={priority ? "eager" : loading}
      // Use async decoding to prevent main thread blocking on Chromebooks
      decoding="async"
      // Reduce quality for faster loading on slower devices
      fetchPriority={priority ? "high" : "auto"}
      onError={() => {
        if (index < sourceList.length - 1) {
          setIndex(index + 1);
        }
      }}
    />
  );
}
