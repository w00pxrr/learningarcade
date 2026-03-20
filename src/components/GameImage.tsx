"use client";

import React, { useEffect, useMemo, useState } from "react";

type GameImageProps = {
  sources?: string[];
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
};

export function GameImage({
  sources = [],
  alt,
  className,
  loading = "lazy",
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
      loading={loading}
      onError={() => {
        if (index < sourceList.length - 1) {
          setIndex(index + 1);
        }
      }}
    />
  );
}
