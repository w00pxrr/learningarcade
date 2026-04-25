"use client";

import { Suspense } from "react";
import GameEmbedPage from "../../views/GameEmbed";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GameEmbedPage />
    </Suspense>
  );
}
