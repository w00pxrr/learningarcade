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
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFailed(false);
  }, [sourceKey]);

  // Pick the best source: prefer avif, then webp, then others
  const activeSource = sourceList[index] ?? sourceList[0] ?? "";

  if (!activeSource || failed) {
    return (
      <div
        className={className}
        style={{
          position: "absolute",
          inset: 0,
          background: "var(--cg-bg-card-hover, #2d2d4a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <i
          className="fa-solid fa-gamepad"
          style={{ fontSize: "2rem", color: "var(--cg-text-muted, #8888a0)" }}
        />
      </div>
    );
  }

  return (
    <Image
      key={activeSource}
      className={className}
      src={activeSource}
      alt={alt}
      fill
      sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, (max-width: 1200px) 25vw, 280px"
      loading={priority ? "eager" : loading}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      onError={() => {
        if (index + 1 < sourceList.length) {
          setIndex(index + 1);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
