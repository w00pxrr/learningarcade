"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";

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
    () =>
      sources.filter((value) => typeof value === "string" && value.length > 0),
    [sourceKey],
  );
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [sourceKey]);

  const activeSource = sourceList[index] ?? sourceList[0] ?? "";

  return (
    <Image
      className={className}
      src={activeSource}
      alt={alt}
      fill
      sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, (max-width: 1200px) 25vw, 280px"
      loading={priority ? "eager" : loading}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => {
        if (index < sourceList.length - 1) {
          setIndex(index + 1);
        }
      }}
    />
  );
}
