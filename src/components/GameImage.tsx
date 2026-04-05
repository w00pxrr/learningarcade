"use client";

import React, { useState } from "react";
import Image from "next/image";

type GameImageProps = {
  sources?: string[];
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
  priority?: boolean;
};

const shimmerSvg =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3QgZmlsbD0iIzJkMmQ0YSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIi8+PC9zdmc+";

export function GameImage({
  sources = [],
  alt,
  className,
  loading = "lazy",
  priority = false,
}: GameImageProps) {
  const sourceKey = sources.join("|");
  const sourceList = sources.filter((value) => typeof value === "string" && value.length > 0);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [prevSourceKey, setPrevSourceKey] = useState(sourceKey);

  if (sourceKey !== prevSourceKey) {
    setPrevSourceKey(sourceKey);
    setIndex(0);
    setFailed(false);
    setLoaded(false);
  }

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
    <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      {!loaded && (
        <img
          src={shimmerSvg}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(8px)",
          }}
        />
      )}
      <Image
        key={activeSource}
        src={activeSource}
        alt={alt}
        fill
        sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, (max-width: 1200px) 25vw, 280px"
        loading={priority ? "eager" : loading}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (index + 1 < sourceList.length) {
            setIndex(index + 1);
          } else {
            setFailed(true);
          }
        }}
        style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.2s ease-in" }}
      />
    </div>
  );
}
